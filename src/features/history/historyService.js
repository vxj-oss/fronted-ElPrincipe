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

function getAuthHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function fetchEventosCompletos({ accion, modulo, rango, busqueda } = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const params = new URLSearchParams();

  if (modulo) params.append('modulo', modulo);
  params.append('skip', '0');
  params.append('limit', '500');

  const response = await fetch(`${baseUrl}/history/?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al cargar el historial de auditoría desde el servidor');
  }

  const rawItems = await response.json();

  let lista = rawItems.map((item) => ({
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
  }));

  if (accion) lista = lista.filter((e) => e.accion === accion);
  if (busqueda) {
    const q = busqueda.toLowerCase();
    lista = lista.filter(
      (e) =>
        e.descripcion.toLowerCase().includes(q) ||
        e.modulo.toLowerCase().includes(q) ||
        e.usuario.toLowerCase().includes(q)
    );
  }

  if (rango === 'hoy') {
    const hoySt = new Date().toISOString().split('T')[0];
    lista = lista.filter((e) => e.fecha?.startsWith(hoySt));
  } else if (rango === 'semana') {
    const d7 = new Date(Date.now() - 7 * 86400000);
    lista = lista.filter((e) => new Date(e.fecha) >= d7);
  } else if (rango === 'mes') {
    const dm = new Date(Date.now() - 30 * 86400000);
    lista = lista.filter((e) => new Date(e.fecha) >= dm);
  }

  return lista;
}

export async function fetchEventos({
  accion,
  modulo,
  rango,
  busqueda,
  pagina = 1,
  porPagina = 20,
} = {}) {
  const lista = await fetchEventosCompletos({ accion, modulo, rango, busqueda });

  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;

  return {
    items: lista.slice(inicio, inicio + porPagina),
    total,
    pagina,
    porPagina,
    totalPaginas,
  };
}

export async function fetchEvento(id) {
  const lista = await fetchEventosCompletos({});
  const evento = lista.find((x) => x.id === id);
  if (!evento) throw new Error(`Evento #${id} no encontrado.`);
  return evento;
}

export async function fetchEstadisticas() {
  const items = await fetchEventosCompletos({});
  const hoySt = new Date().toISOString().split('T')[0];

  const hoy = items.filter((e) => e.fecha?.startsWith(hoySt));
  const conError = items.filter((e) => !e.exitoso);

  const conteoModulos = {};
  items.forEach((e) => {
    conteoModulos[e.modulo] = (conteoModulos[e.modulo] || 0) + 1;
  });
  const moduloActivo =
    Object.entries(conteoModulos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    eventosHoy: hoy.length,
    eventosMes: items.length,
    conError: conError.length,
    moduloActivo,
  };
}