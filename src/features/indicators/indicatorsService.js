import { apiRequest } from '../../utils/api';
import { INDICADORES_DEF, INDICADORES_META } from '../../constants/appConstants';

export { INDICADORES_DEF, INDICADORES_META };

export function formatearMinutos(valor) {
  const n = parseFloat(valor);
  return n.toFixed(2);
}

export function evaluarUmbral(valor, umbrales) {
  return umbrales.find((u) => {
    const bajoMin = u.min === null || valor >= u.min;
    const bajoMax = u.max === null || (u.maxIncl ? valor <= u.max : valor < u.max);
    return bajoMin && bajoMax;
  }) ?? umbrales[umbrales.length - 1];
}

export function generarInterpretacion(sigla, valor, datos, umbral) {
  if (sigla === 'NSC') {
    if (umbral.nivel === 'bueno') {
      return `Se registraron <strong>${valor} solicitudes</strong> de clientes en el día actual (${datos.diaActual}). La demanda comercial alcanza la meta mínima diaria (NSC ≥ 15).`;
    }
    if (umbral.nivel === 'regular') {
      return `Se registraron <strong>${valor} solicitudes</strong> de clientes en el día actual (${datos.diaActual}). La demanda comercial es moderada, por debajo de la meta diaria (NSC ≥ 15).`;
    }
    return `Se registraron <strong>${valor} solicitudes</strong> de clientes en el día actual (${datos.diaActual}). La demanda comercial está por debajo de lo esperado, lo cual requiere atención.`;
  }

  if (sigla === 'NPP') {
    if (umbral.nivel === 'bueno') {
      return `Se registraron <strong>${valor} pedidos</strong> procesados en el día actual (${datos.diaActual}). La conversión comercial alcanza la meta mínima diaria (NPP ≥ 15).`;
    }
    if (umbral.nivel === 'regular') {
      return `Se registraron <strong>${valor} pedidos</strong> procesados en el día actual (${datos.diaActual}). La conversión comercial es moderada, por debajo de la meta diaria (NPP ≥ 15).`;
    }
    return `Se registraron <strong>${valor} pedidos</strong> procesados en el día actual (${datos.diaActual}). La conversión comercial está por debajo de lo esperado, lo cual requiere atención.`;
  }

  if (sigla === 'TPD') {
    if (datos.sinDatos) {
      return 'Aún no se registran pedidos aprobados vinculados a una solicitud, por lo que no es posible calcular el tiempo promedio de decisión.';
    }
    const minutos = formatearMinutos(valor);
    if (umbral.nivel === 'bueno') {
      return `El asesor comercial demora en promedio <strong>${minutos} minutos</strong> en aprobar el pedido derivado de una solicitud. El tiempo de respuesta es óptimo (TPD ≤ 240 min).`;
    }
    if (umbral.nivel === 'regular') {
      return `El asesor comercial demora en promedio <strong>${minutos} minutos</strong> en aprobar el pedido derivado de una solicitud. El tiempo de respuesta se ubica en un rango moderado (240 min – 720 min).`;
    }
    return `El asesor comercial demora en promedio <strong>${minutos} minutos</strong> en aprobar el pedido derivado de una solicitud. El tiempo de respuesta es crítico (&gt; 720 min) y afecta la experiencia del cliente.`;
  }

  return '';
}

export function generarConclusion(sigla, valor, datos, umbral) {
  if (sigla === 'NSC') {
    return `El NSC de <strong>${valor} solicitudes</strong> califica como <strong>${umbral.label}</strong> en captación de solicitudes. Día actual (${datos.diaActual}): ${datos.SA} solicitud(es); día anterior (${datos.diaAnterior}): ${datos.SP} solicitud(es).`;
  }
  if (sigla === 'NPP') {
    return `El NPP de <strong>${valor} pedidos</strong> califica como <strong>${umbral.label}</strong> en conversión de pedidos. Día actual (${datos.diaActual}): ${datos.PA} pedido(s); día anterior (${datos.diaAnterior}): ${datos.PP} pedido(s).`;
  }
  if (sigla === 'TPD') {
    if (datos.sinDatos) {
      return 'No hay pedidos vinculados a solicitudes registrados aún, por lo que el indicador TPD no cuenta con datos suficientes para una conclusión.';
    }
    return `El TPD de <strong>${formatearMinutos(valor)} minutos</strong> indica un tiempo de decisión <strong>${umbral.label}</strong> por parte del asesor comercial.`;
  }
  return '';
}

export async function fetchActividadComercial() {
  const data = await apiRequest('/indicators/actividad-comercial');
  return data;
}

export async function fetchSerieActividadComercial(dias = 15) {
  const data = await apiRequest(`/indicators/actividad-comercial/serie?dias=${dias}`);
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

export async function descargarSerieDiariaExcel(sigla, dias = 15) {
  await descargarArchivo(
    `/reports/indicators/actividad/excel?indicador=${sigla}&dias=${dias}`,
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

  const tpdActual = data.tiempo_promedio_decision_minutos ?? null;
  const tpdGeneral = data.tiempo_promedio_decision_minutos_general ?? null;
  const tpdDisponible = tpdActual !== null ? tpdActual : tpdGeneral;
  const tpdSinDatos = tpdDisponible === null;
  const tpdVal = tpdSinDatos ? 0 : parseFloat(tpdDisponible);

  return {
    raw: data,
    NSC: {
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
    TPD: {
      valor: tpdVal,
      datos: {
        tpdActual,
        tpdGeneral,
        sinDatos: tpdSinDatos,
        usaHistorico: tpdActual === null && tpdGeneral !== null,
        diaActual,
        diaAnterior,
      },
    },
  };
}
