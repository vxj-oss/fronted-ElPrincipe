import { apiRequest } from '../../utils/api';
import { fetchProductos } from '../products/productsService';
import { fetchPedidos, calcularTotal, getFechaActualLima } from '../orders/ordersService';
import { EMPRESA } from '../../constants/appConstants';

export async function fetchDashboardSummary() {
  const [summaryData, productosData, pedidosData] = await Promise.all([
    apiRequest('/dashboard/summary'),
    fetchProductos(),
    fetchPedidos(),
  ]);

  const metricas = summaryData.metricas || {};
  const pedidosEstado = summaryData.pedidos_por_estado || {};
  const kpisIndicadores = summaryData.indicadores_kpi || {};

  const stockCriticoList = productosData
    .filter((p) => p.stock <= p.minimo)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      stock: p.stock,
      minimo: p.minimo,
      estado: p.stock === 0 ? 'critico' : 'bajo',
    }));

  const alertas = [];
  if (stockCriticoList.length > 0) {
    alertas.push({
      id: 'alt-stock',
      tipo: 'danger',
      titulo: 'Stock bajo mínimo',
      cuerpo: `Hay ${stockCriticoList.length} producto(s) por debajo del stock mínimo. Se recomienda emitir órdenes de reposición.`,
      icono: 'alert-circle',
    });
  }

  if (pedidosEstado.pendientes > 0) {
    alertas.push({
      id: 'alt-pedidos',
      tipo: 'warning',
      titulo: 'Pedidos pendientes',
      cuerpo: `Tienes ${pedidosEstado.pendientes} pedido(s) pendientes de confirmación en ${EMPRESA.NOMBRE}.`,
      icono: 'clock',
    });
  }

  if (pedidosEstado.aprobados > 0) {
    alertas.push({
      id: 'alt-aprobados',
      tipo: 'success',
      titulo: 'Pedidos aprobados',
      cuerpo: `${pedidosEstado.aprobados} pedido(s) aprobados listos para despacho en ${EMPRESA.CIUDAD}.`,
      icono: 'trending-up',
    });
  }

  return {
    kpis: {
      ventasTotales: metricas.ventas_totales || 0,
      totalPedidos: metricas.total_pedidos || 0,
      totalClientes: metricas.total_clientes || 0,
      totalProductos: metricas.total_productos || 0,
      stockCriticoCount: stockCriticoList.length,
      metaDiaria: metricas.meta_diaria_ventas || 6000,
      nepp: kpisIndicadores.nepp || 0,
      pfcc: kpisIndicadores.pfcc || 0,
      ntdc: kpisIndicadores.ntdc || 0,
    },
    stockAlertas: stockCriticoList.slice(0, 5),
    alertas,
    pedidos: pedidosData,
  };
}


function aFechaStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const HORA_APERTURA = 8;
const HORA_CIERRE = 20;

const horaDePedido = (p) => new Date(p.creadoEn || `${p.fecha}T12:00:00`).getHours();

const ESTADOS_CONFIRMADOS = ['Aprobado', 'Entregado'];

export function procesarGraficaDesdePedidos(pedidos = [], periodo = 'hoy') {
  const pedidosValidos = pedidos.filter(p => ESTADOS_CONFIRMADOS.includes(p.estado));
  const hoy = new Date(getFechaActualLima() + 'T00:00:00');

  if (periodo === 'hoy') {
    const diaStr = aFechaStr(hoy);

    const pedidosDia = pedidosValidos.filter(p => p.fecha === diaStr);
    const horas = pedidosDia.map(horaDePedido);
    const apertura = Math.min(HORA_APERTURA, ...(horas.length ? horas : [HORA_APERTURA]));
    const cierre = Math.max(HORA_CIERRE, ...(horas.length ? horas.map(h => h + 1) : [HORA_CIERRE]));

    const labels = [];
    for (let h = apertura; h < cierre; h++) {
      labels.push(`${h}:00`);
    }
    const valores = new Array(labels.length).fill(0);

    pedidosDia.forEach(p => {
      const idx = Math.min(labels.length - 1, Math.max(0, horaDePedido(p) - apertura));
      valores[idx] += calcularTotal(p.items);
    });

    return {
      labels,
      valores,
      subtitulo: `${EMPRESA.MONEDA_SIMBOLO} acumulados hoy por hora en ${EMPRESA.NOMBRE}`,
    };
  }

  if (periodo === 'semana') {
    const offsetLunes = (hoy.getDay() + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - offsetLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const lunesStr = aFechaStr(lunes);
    const domingoStr = aFechaStr(domingo);

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const valores = new Array(7).fill(0);

    pedidosValidos
      .filter(p => p.fecha >= lunesStr && p.fecha <= domingoStr)
      .forEach(p => {
        const fechaObj = new Date(p.fecha + 'T00:00:00');
        const diaIndex = (fechaObj.getDay() + 6) % 7;
        valores[diaIndex] += calcularTotal(p.items);
      });

    return {
      labels: diasSemana,
      valores,
      subtitulo: `Ventas de la semana actual (${EMPRESA.MONEDA_SIMBOLO})`,
    };
  }

  if (periodo === 'mes') {
    const anioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
    const valores = new Array(labels.length).fill(0);

    pedidosValidos
      .filter(p => p.fecha.startsWith(anioMes))
      .forEach(p => {
        const diaDelMes = parseInt(p.fecha.split('-')[2], 10) || 1;
        const idx = Math.min(4, Math.floor((diaDelMes - 1) / 7));
        valores[idx] += calcularTotal(p.items);
      });

    return {
      labels,
      valores,
      subtitulo: `Ventas del mes en curso (${EMPRESA.MONEDA_SIMBOLO})`,
    };
  }

  return {
    labels: [],
    valores: [],
    subtitulo: '',
  };
}