import { apiRequest } from '../../utils/api';
import { INDICADORES_DEF, INDICADORES_META } from '../../constants/appConstants';

export { INDICADORES_DEF, INDICADORES_META };

export function formatearSegundos(valor) {
  return String(Math.round(parseFloat(valor)));
}

export function evaluarUmbral(valor, umbrales) {
  return umbrales.find((u) => {
    const bajoMin = u.min === null || (u.minExcl ? valor > u.min : valor >= u.min);
    const bajoMax = u.max === null || (u.maxIncl ? valor <= u.max : valor < u.max);
    return bajoMin && bajoMax;
  }) ?? umbrales[umbrales.length - 1];
}

export function generarInterpretacion(sigla, valor, datos, umbral) {
  if (sigla === 'NCCA') {
    if (umbral.nivel === 'bueno') {
      return `Se registraron <strong>${valor} ${valor === 1 ? 'cotización' : 'cotizaciones'}</strong> de clientes en el día actual (${datos.diaActual}). La demanda comercial alcanza la meta diaria (NCCA ≥ 12).`;
    }
    if (umbral.nivel === 'regular') {
      return `Se registraron <strong>${valor} ${valor === 1 ? 'cotización' : 'cotizaciones'}</strong> de clientes en el día actual (${datos.diaActual}). La cantidad se ubica entre 7 y 11, por debajo de la meta diaria (NCCA ≥ 12).`;
    }
    return `Se registraron <strong>${valor} ${valor === 1 ? 'cotización' : 'cotizaciones'}</strong> de clientes en el día actual (${datos.diaActual}). La cantidad es menor a 7, muy por debajo de la meta diaria (NCCA ≥ 12).`;
  }

  if (sigla === 'NPP') {
    if (umbral.nivel === 'bueno') {
      return `Se registraron <strong>${valor} ${valor === 1 ? 'pedido' : 'pedidos'}</strong> procesados en el día actual (${datos.diaActual}). La conversión comercial alcanza la meta diaria (NPP ≥ 11).`;
    }
    if (umbral.nivel === 'regular') {
      return `Se registraron <strong>${valor} ${valor === 1 ? 'pedido' : 'pedidos'}</strong> procesados en el día actual (${datos.diaActual}). La cantidad se ubica entre 7 y 10, por debajo de la meta diaria (NPP ≥ 11).`;
    }
    return `Se registraron <strong>${valor} ${valor === 1 ? 'pedido' : 'pedidos'}</strong> procesados en el día actual (${datos.diaActual}). La cantidad es menor a 7, muy por debajo de la meta diaria (NPP ≥ 11).`;
  }

  if (sigla === 'TPTD') {
    if (datos.sinDatos) {
      return 'Aún no se registran pedidos aprobados vinculados a una cotización en el día actual, por lo que no es posible calcular el tiempo promedio de toma de decisión.';
    }
    const segundos = formatearSegundos(valor);
    if (umbral.nivel === 'bueno') {
      return `El asesor comercial demora en promedio <strong>${segundos} segundos</strong> en aprobar el pedido derivado de una cotización. El tiempo de respuesta está dentro de la meta (TPTD &lt; 180 s).`;
    }
    if (umbral.nivel === 'regular') {
      return `El asesor comercial demora en promedio <strong>${segundos} segundos</strong> en aprobar el pedido derivado de una cotización. El tiempo de respuesta se ubica entre 180 y 360 s, por encima de la meta (TPTD &lt; 180 s).`;
    }
    return `El asesor comercial demora en promedio <strong>${segundos} segundos</strong> en aprobar el pedido derivado de una cotización. El tiempo de respuesta supera los 360 s y afecta la experiencia del cliente.`;
  }

  return '';
}

export function generarConclusion(sigla, valor, datos, umbral) {
  if (sigla === 'NCCA') {
    return `El NCCA de <strong>${valor} ${valor === 1 ? 'cotización' : 'cotizaciones'}</strong> corresponde al día actual. Día actual (${datos.diaActual}): ${datos.SA} cotizacion(es); día anterior (${datos.diaAnterior}): ${datos.SP} cotizacion(es).`;
  }
  if (sigla === 'NPP') {
    return `El NPP de <strong>${valor} ${valor === 1 ? 'pedido' : 'pedidos'}</strong> corresponde al día actual. Día actual (${datos.diaActual}): ${datos.PA} pedido(s); día anterior (${datos.diaAnterior}): ${datos.PP} pedido(s).`;
  }
  if (sigla === 'TPTD') {
    if (datos.sinDatos) {
      return 'No hay pedidos aprobados vinculados a cotizaciones en el día actual, por lo que el indicador TPTD no cuenta con datos suficientes para una conclusión.';
    }
    return `El TPTD de <strong>${formatearSegundos(valor)} segundos</strong> es el tiempo promedio de toma de decisión del asesor comercial en el día actual.`;
  }
  return '';
}

export async function fetchActividadComercial() {
  const data = await apiRequest('/indicators/actividad-comercial');
  return data;
}

export async function fetchSerieActividadComercial(dias) {
  const query = dias ? `?dias=${dias}` : '';
  const data = await apiRequest(`/indicators/actividad-comercial/serie${query}`);
  return data;
}

async function descargarArchivo(endpoint, nombreArchivo) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET', credentials: 'include' });

  if (!response.ok) {
    throw new Error('Error al generar el reporte');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function descargarSerieDiariaExcel(sigla, dias) {
  const query = dias ? `&dias=${dias}` : '';
  await descargarArchivo(
    `/reports/indicators/actividad/excel?indicador=${sigla}${query}`,
    `${sigla.toLowerCase()}_por_dia.xlsx`
  );
}

export async function descargarTPDPorPedidoExcel() {
  await descargarArchivo('/reports/indicators/tpd/por-pedido/excel', 'tpd_por_pedido.xlsx');
}

export async function fetchResumenIndicadores() {
  const data = await fetchActividadComercial().catch(() => ({}));

  const diaActual = data.dia_actual || '—';
  const diaAnterior = data.dia_anterior || '—';

  const solicitudesActual = data.solicitudes_dia_actual || 0;
  const solicitudesAnterior = data.solicitudes_dia_anterior || 0;
  const nscVal = solicitudesActual;
  const nscVariacionPct = parseFloat(data.variacion_solicitudes_pct || 0);

  const pedidosActual = data.pedidos_dia_actual || 0;
  const pedidosAnterior = data.pedidos_dia_anterior || 0;
  const npVal = pedidosActual;
  const npVariacionPct = parseFloat(data.variacion_pedidos_pct || 0);

  const tpdActual = data.tiempo_promedio_decision_segundos ?? null;
  const tpdGeneral = data.tiempo_promedio_decision_segundos_general ?? null;
  const tpdSinDatos = tpdActual === null;
  const tpdVal = tpdSinDatos ? 0 : parseFloat(tpdActual);

  return {
    raw: data,
    NCCA: {
      valor: nscVal,
      datos: {
        SA: solicitudesActual,
        conformes: data.solicitudes_conformes_dia_actual || 0,
        conObservaciones: data.solicitudes_con_observaciones_dia_actual || 0,
        SP: solicitudesAnterior,
        variacionPct: nscVariacionPct,
        diaActual,
        diaAnterior,
      },
    },
    NPP: {
      valor: npVal,
      datos: {
        PA: pedidosActual,
        conformes: data.pedidos_conformes_dia_actual || 0,
        conObservaciones: data.pedidos_con_observaciones_dia_actual || 0,
        PP: pedidosAnterior,
        variacionPct: npVariacionPct,
        diaActual,
        diaAnterior,
      },
    },
    TPTD: {
      valor: tpdVal,
      datos: {
        tpdActual,
        tpdGeneral,
        pedidosN: data.pedidos_con_decision_dia_actual || 0,
        sinDatos: tpdSinDatos,
        diaActual,
        diaAnterior,
      },
    },
  };
}
