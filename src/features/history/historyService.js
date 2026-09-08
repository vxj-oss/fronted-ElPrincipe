import { apiRequest } from '../../utils/api';
import {
  ACCIONES_AUDITORIA,
  MODULOS_SISTEMA,
  CONFIG_ACCION_AUDITORIA,
} from '../../constants/appConstants';

export const ACCIONES = ACCIONES_AUDITORIA;
export const MODULOS = MODULOS_SISTEMA;
export const CONFIG_ACCION = CONFIG_ACCION_AUDITORIA;

export function formatearFechaEvento(fechaISO) {
  if (!fechaISO) return { fecha: '—', hora: '—', relativa: '—' };
  const fecha = new Date(fechaISO);
  return {
    fecha: fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    hora: fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    relativa: formatearRelativa(fecha),
  };
}

function formatearRelativa(fecha) {
  const diffMs = new Date() - fecha;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD === 1) return 'Ayer';
  return `Hace ${diffD} días`;
}

function normalizarEvento(item) {
  return {
    id: item.id,
    fecha: item.fecha_hora,
    usuarioId: item.usuario_id,
    usuario: item.usuario_nombre || 'Sistema / Asesor',
    iniciales: item.usuario_iniciales || 'EP',
    accion: item.accion,
    modulo: item.modulo_afectado,
    descripcion:
      item.detalle_cambio?.descripcion ||
      item.detalle_cambio?.mensaje ||
      `${item.accion} en ${item.modulo_afectado}`,
    exitoso: item.accion !== 'ERROR',
    detalle: item.detalle_cambio || {},
  };
}

export async function fetchEventos({
  accion,
  modulo,
  rango,
  busqueda,
  pagina = 1,
  porPagina = 20,
} = {}) {
  const params = new URLSearchParams();
  if (accion) params.append('accion', accion);
  if (modulo) params.append('modulo', modulo);
  if (rango) params.append('rango', rango);
  if (busqueda) params.append('busqueda', busqueda);
  params.append('pagina', String(pagina));
  params.append('por_pagina', String(porPagina));

  const data = await apiRequest(`/history/?${params.toString()}`);
  return {
    items: (data.items || []).map(normalizarEvento),
    total: data.total || 0,
    pagina: data.pagina || pagina,
    porPagina: data.por_pagina || porPagina,
    totalPaginas: data.total_paginas || 1,
  };
}

export async function fetchEstadisticas() {
  const data = await apiRequest('/history/stats');
  return {
    eventosHoy: data.eventos_hoy || 0,
    eventosMes: data.eventos_mes || 0,
    conError: data.con_error || 0,
    moduloActivo: data.modulo_activo || '—',
  };
}
