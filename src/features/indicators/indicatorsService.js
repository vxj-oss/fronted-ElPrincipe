import { apiRequest } from '../../utils/api';
import { fetchPedidos } from '../orders/ordersService';
import { fetchProductos } from '../products/productsService';
import { INDICADORES_DEF, INDICADORES_META } from '../../constants/appConstants';

export { INDICADORES_DEF, INDICADORES_META };

function formatearFechaLima(fechaISO) {
  if (!fechaISO) return '—';
  const fechaObj = new Date(fechaISO.includes('T') ? fechaISO : `${fechaISO}T12:00:00Z`);
  return fechaObj.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatearHoraLima(fechaISO) {
  if (!fechaISO) return '00:00';
  const fechaObj = new Date(fechaISO);
  return fechaObj.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function evaluarUmbral(valor, umbrales) {
  return umbrales.find((u) => {
    const bajoMin = u.min === null || valor >= u.min;
    const bajoMax = u.max === null || valor < u.max;
    return bajoMin && bajoMax;
  }) ?? umbrales[umbrales.length - 1];
}

export function generarInterpretacion(sigla, valor, datos, umbral) {
  if (sigla === 'NEPP') {
    const erroresCada100 = (valor * 100).toFixed(1);
    const sinError = Math.max(0, datos.TPP - datos.TEPP);
    if (umbral.nivel === 'bueno') {
      return `Por cada 100 productos pedidos, se detectan aproximadamente <strong>${erroresCada100} errores</strong>. El proceso de registro de pedidos opera dentro del umbral óptimo (NEPP &lt; 0.05). Se procesaron ${sinError} ítems sin incidencias.`;
    }
    if (umbral.nivel === 'regular') {
      return `Por cada 100 productos pedidos, se detectan aproximadamente <strong>${erroresCada100} errores</strong>. Esto indica que el registro de pedidos requiere atención operativa, manteniéndose en zona de advertencia.`;
    }
    return `Por cada 100 productos pedidos, se detectan aproximadamente <strong>${erroresCada100} errores</strong>. El indicador supera el umbral crítico (NEPP &gt; 0.10), requiriendo auditoría inmediata.`;
  }

  if (sigla === 'PFCC') {
    const pct = valor.toFixed(1);
    const correctas = Math.max(0, datos.TCCD - datos.TCCF);
    if (umbral.nivel === 'bueno') {
      return `El <strong>${pct}%</strong> de las condiciones comerciales presentaron inconsistencias. Nivel óptimo (&lt;10%). ${correctas} condiciones fueron ejecutadas correctamente.`;
    }
    if (umbral.nivel === 'regular') {
      return `El <strong>${pct}%</strong> de las condiciones comerciales presentaron fallas. El indicador se ubica en zona de riesgo (10%–25%).`;
    }
    return `El <strong>${pct}%</strong> de las condiciones comerciales tuvieron fallas críticas (&gt;25%). Se requiere revisión de políticas de precios y créditos.`;
  }

  if (sigla === 'NTDC') {
    const pct = valor.toFixed(1);
    const noEfectivas = Math.max(0, datos.TDCT - datos.TDCE);
    if (umbral.nivel === 'bueno') {
      return `El <strong>${pct}%</strong> de las decisiones comerciales tomadas resultaron efectivas (≥75%). Solo ${noEfectivas} decisiones requirieron ajustes posteriores.`;
    }
    if (umbral.nivel === 'regular') {
      return `El <strong>${pct}%</strong> de las decisiones comerciales fueron efectivas. El indicador se ubica en rango regular (50%–74%).`;
    }
    return `Solo el <strong>${pct}%</strong> de las decisiones comerciales resultaron efectivas (&lt;50%). Se recomienda soporte con el Agente Comercial IA.`;
  }

  return '';
}

export function generarConclusion(sigla, valor, datos, umbral) {
  if (sigla === 'NEPP') {
    return `El índice NEPP de <strong>${valor.toFixed(3)}</strong> califica como <strong>${umbral.label}</strong> en control de pedidos. Total de ítems evaluados: ${datos.TPP} con ${datos.TEPP} error(es) registrados.`;
  }
  if (sigla === 'PFCC') {
    return `El PFCC de <strong>${valor.toFixed(2)}%</strong> refleja un estado <strong>${umbral.label}</strong> en negociación comercial. Total evaluado: ${datos.TCCD} condiciones con ${datos.TCCF} falla(s).`;
  }
  if (sigla === 'NTDC') {
    return `El NTDC de <strong>${valor.toFixed(2)}%</strong> indica una efectividad <strong>${umbral.label}</strong> en toma de decisiones. Decisiones efectivas: ${datos.TDCE} de un total de ${datos.TDCT}.`;
  }
  return '';
}

export async function fetchLatestIndicators() {
  const data = await apiRequest('/indicators/latest');
  return data;
}

export async function fetchIndicatorHistory(limit = 7) {
  const data = await apiRequest(`/indicators/history?limit=${limit}`);
  return data;
}

export async function fetchIndicatorDaily() {
  const data = await apiRequest('/indicators/daily');
  return data;
}

export async function fetchIndicatorWeekly() {
  const data = await apiRequest('/indicators/weekly');
  return data;
}

export async function fetchIndicatorMonthly() {
  const data = await apiRequest('/indicators/monthly');
  return data;
}

export async function calculateIndicators(resumen = 'Cálculo ejecutado desde el panel web') {
  const data = await apiRequest('/indicators/calculate', {
    method: 'POST',
    body: JSON.stringify({ resumen }),
  });
  return data;
}

export async function fetchDecisiones(limit = 100) {
  const data = await apiRequest(`/decisions/?limit=${limit}`);
  return data;
}

export async function fetchResumenIndicadores() {
  const [latestData, pedidosData, productosData, decisionesData] = await Promise.all([
    fetchLatestIndicators().catch(() => null),
    fetchPedidos().catch(() => []),
    fetchProductos().catch(() => []),
    fetchDecisiones().catch(() => []),
  ]);

  let latest = latestData;
  if (!latest) {
    try {
      latest = await calculateIndicators('Cálculo inicial automático');
    } catch {
      latest = {};
    }
  }

  const mapaProductos = {};
  productosData.forEach((p) => {
    mapaProductos[p.id] = p.nombre;
  });

  const pedidosConError = pedidosData.filter((p) => p.tieneError);

  const tablaErroresNEPP = [];
  const conteoTiposNEPP = {};

  pedidosConError.forEach((p) => {
    const errTipo = (p.errores && p.errores[0]) || 'Error_No_Especificado';
    conteoTiposNEPP[errTipo] = (conteoTiposNEPP[errTipo] || 0) + 1;

    (p.items || []).forEach((item) => {
      const nombreRealProducto = mapaProductos[item.producto_id] || item.producto || `Producto #${item.producto_id}`;

      tablaErroresNEPP.push({
        numero: p.numero,
        cliente: p.cliente,
        producto: nombreRealProducto,
        error: errTipo,
        fecha: formatearFechaLima(p.fecha || p.creadoEn),
        vendedor: 'Victor Nontol',
      });
    });
  });

  const desgloseTEPP = Object.entries(conteoTiposNEPP).map(([tipo, cantidad]) => ({
    tipo,
    cantidad,
  }));

  if (desgloseTEPP.length === 0 && (latest?.total_errores_productos || 0) > 0) {
    desgloseTEPP.push({
      tipo: 'Incidencias registradas',
      cantidad: latest.total_errores_productos,
    });
  }

  const decisionesNoEfectivas = (decisionesData || []).filter((d) => d.es_efectiva === false);
  const tablaErroresNTDC = decisionesNoEfectivas.map((d) => ({
    numero: d.pedido_codigo || `#${d.id}`,
    cliente: d.cliente_nombre || '—',
    decision: d.decision_tomada || d.tipo_decision,
    resultado: 'No efectiva',
    fecha: formatearFechaLima(d.fecha_decision),
    vendedor: d.usuario_nombre || '—',
  }));

  const neppVal = parseFloat(latest.valor_nepp || 0);
  const pfccVal = parseFloat(latest.valor_pfcc || 0);
  const ntdcVal = parseFloat(latest.valor_ntdc || 0);

  const fechaCalcLima = latest.fecha_calculo ? formatearFechaLima(latest.fecha_calculo) : formatearFechaLima(new Date().toISOString());
  const horaCalcLima = latest.fecha_calculo ? formatearHoraLima(latest.fecha_calculo) : '00:00';

  return {
    raw: latest,
    NEPP: {
      valor: neppVal,
      datos: {
        TEPP: latest.total_errores_productos || 0,
        TPP: latest.total_items_pedidos || 0,
        totalPedidos: latest.total_pedidos_evaluados || 0,
        desgloseTEPP,
        desgloseTPP: [
          { label: 'Ítems procesados', valor: latest.total_items_pedidos || 0, unidad: 'unid.' },
        ],
        tablaErrores: tablaErroresNEPP,
        periodoCalculo: fechaCalcLima,
        horaActualizacion: horaCalcLima,
      },
    },
    PFCC: {
      valor: pfccVal,
      datos: {
        TCCF: latest.total_fallas_condiciones || 0,
        TCCD: latest.total_condiciones_pactadas || 0,
        desgloseTCCF: [
          { tipo: 'Fallas en condiciones comerciales', cantidad: latest.total_fallas_condiciones || 0 },
        ],
        desgloseTCCD: [
          { label: 'Condiciones registradas', valor: latest.total_condiciones_pactadas || 0, unidad: 'cond.' },
        ],
        tablaErrores: [],
        periodoCalculo: fechaCalcLima,
        horaActualizacion: horaCalcLima,
      },
    },
    NTDC: {
      valor: ntdcVal,
      datos: {
        TDCE: latest.total_decisiones_efectivas || 0,
        TDCT: latest.total_decisiones_evaluadas || 0,
        desgloseTDCE: [
          { tipo: 'Decisiones efectivas tomadas', cantidad: latest.total_decisiones_efectivas || 0 },
        ],
        desgloseTDCT: [
          { label: 'Decisiones evaluadas', valor: latest.total_decisiones_evaluadas || 0, unidad: 'dec.' },
        ],
        tablaErrores: tablaErroresNTDC,
        periodoCalculo: fechaCalcLima,
        horaActualizacion: horaCalcLima,
      },
    },
  };
}