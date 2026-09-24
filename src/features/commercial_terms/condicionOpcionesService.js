import { apiRequest } from '../../utils/api';
import { OPCIONES_CONDICION_FALLBACK } from '../../constants/appConstants';

function normalizeOpcion(o) {
  return {
    id: o.id,
    tipo: o.tipo_condicion,
    valor: o.valor,
    label: o.etiqueta,
    orden: o.orden,
    activo: o.activo,
  };
}

export async function fetchOpcionesCondicion({ soloActivas = true } = {}) {
  const params = new URLSearchParams();
  if (soloActivas) params.append('solo_activas', 'true');
  const data = await apiRequest(`/condicion-opciones/?${params.toString()}`);
  return data.map(normalizeOpcion);
}

export function agruparOpcionesPorTipo(opciones) {
  const grupos = { Credito: [], Descuento: [], Forma_Pago: [] };
  for (const o of opciones) {
    if (!grupos[o.tipo]) grupos[o.tipo] = [];
    grupos[o.tipo].push({ valor: o.valor, label: o.label });
  }
  return grupos;
}

export async function fetchOpcionesCondicionAgrupadas() {
  try {
    const opciones = await fetchOpcionesCondicion({ soloActivas: true });
    const grupos = agruparOpcionesPorTipo(opciones);
    return { Credito: [], Descuento: [], Forma_Pago: [], ...OPCIONES_CONDICION_FALLBACK, ...grupos };
  } catch {
    return { ...OPCIONES_CONDICION_FALLBACK };
  }
}

export async function crearOpcionCondicion({ tipo, valor, etiqueta, orden = 0 }) {
  const payload = { tipo_condicion: tipo, valor, etiqueta, orden };
  const data = await apiRequest('/condicion-opciones/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeOpcion(data);
}

export async function actualizarOpcionCondicion(id, cambios) {
  const payload = {};
  if (cambios.valor !== undefined) payload.valor = cambios.valor;
  if (cambios.etiqueta !== undefined) payload.etiqueta = cambios.etiqueta;
  if (cambios.orden !== undefined) payload.orden = cambios.orden;
  if (cambios.activo !== undefined) payload.activo = cambios.activo;
  const data = await apiRequest(`/condicion-opciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeOpcion(data);
}

export async function eliminarOpcionCondicion(id) {
  return apiRequest(`/condicion-opciones/${id}`, { method: 'DELETE' });
}
