import { apiRequest } from '../../utils/api';
import { fetchProductos } from '../products/productsService';
import { fetchPedidos, calcularTotal } from '../orders/ordersService';
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
      nepp: kpisIndicadores.nepp || 0,
      pfcc: kpisIndicadores.pfcc || 0,
      ntdc: kpisIndicadores.ntdc || 0,
    },
    stockAlertas: stockCriticoList.slice(0, 5),
    alertas,
    pedidos: pedidosData,
  };
}

export function procesarGraficaDesdePedidos(pedidos = [], periodo = 'hoy') {
  const hoyStr = new Date().toISOString().split('T')[0];
  const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'cancelado');

  if (periodo === 'hoy') {
    const pedidosHoy = pedidosValidos.filter(p => p.fecha === hoyStr);
    const labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm'];
    const valores = new Array(labels.length).fill(0);

    pedidosHoy.forEach(p => {
      const fechaObj = new Date(p.creadoEn || p.fecha);
      const hora = fechaObj.getHours();
      const total = calcularTotal(p.items);

      if (hora < 10) valores[0] += total;
      else if (hora < 12) valores[1] += total;
      else if (hora < 14) valores[2] += total;
      else if (hora < 16) valores[3] += total;
      else if (hora < 18) valores[4] += total;
      else valores[5] += total;
    });

    return {
      labels,
      valores,
      subtitulo: `${EMPRESA.MONEDA_SIMBOLO} acumulados hoy en ${EMPRESA.NOMBRE}`,
    };
  }

  if (periodo === 'semana') {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const valores = new Array(7).fill(0);

    pedidosValidos.forEach(p => {
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
    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const valores = [0, 0, 0, 0];

    pedidosValidos.forEach(p => {
      const diaDelMes = parseInt(p.fecha.split('-')[2], 10) || 1;
      const total = calcularTotal(p.items);

      if (diaDelMes <= 7) valores[0] += total;
      else if (diaDelMes <= 14) valores[1] += total;
      else if (diaDelMes <= 21) valores[2] += total;
      else valores[3] += total;
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