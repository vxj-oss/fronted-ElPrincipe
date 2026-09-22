import { apiRequest } from '../../utils/api';

export const CANALES_RECEPCION = ['WhatsApp', 'Llamada', 'Presencial', 'Correo'];
export const ESTADOS_SOLICITUD = ['Pendiente', 'Atendida', 'Cancelada'];

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const soloFecha = fechaISO.includes('T') ? fechaISO.split('T')[0] : fechaISO;
  const [y, m, d] = soloFecha.split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

function normalizeRequest(r) {
  return {
    id: r.id,
    codigo: r.codigo_solicitud,
    cliente_id: r.cliente_id,
    cliente: r.cliente?.razon_social || r.cliente?.nombre || `Cliente #${r.cliente_id}`,
    fecha: r.fecha_solicitud,
    canal: r.canal_recepcion || 'WhatsApp',
    estado: r.estado || 'Pendiente',
    observaciones: r.observaciones || '',
    detalles: (r.detalles || []).map((d) => ({
      id: d.id,
      producto_id: d.producto_id,
      nombre: d.nombre_producto_solicitado,
      cant: d.cantidad_solicitada,
      precioEsperado: parseFloat(d.precio_esperado || 0),
    })),
  };
}

export async function fetchSolicitudes() {
  const data = await apiRequest('/customer-requests/');
  return data.map(normalizeRequest);
}

export async function fetchSolicitud(id) {
  const data = await apiRequest(`/customer-requests/${id}`);
  return normalizeRequest(data);
}

export async function crearSolicitud(payload) {
  const body = {
    cliente_id: parseInt(payload.cliente_id, 10),
    canal_recepcion: payload.canal || 'WhatsApp',
    observaciones: payload.observaciones || null,
    detalles: payload.detalles.map((d) => ({
      producto_id: d.producto_id ? parseInt(d.producto_id, 10) : null,
      nombre_producto_solicitado: d.nombre.trim(),
      cantidad_solicitada: parseInt(d.cant, 10),
      precio_esperado: d.precioEsperado ? parseFloat(d.precioEsperado) : null,
    })),
  };

  const data = await apiRequest('/customer-requests/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeRequest(data);
}

export async function eliminarSolicitud(id) {
  return apiRequest(`/customer-requests/${id}`, { method: 'DELETE' });
}