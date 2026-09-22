import { apiRequest } from '../../utils/api';
import { TIPOS_CONDICION_COMERCIAL, FORMAS_PAGO } from '../../constants/appConstants';
import { fechaHoyLima, fechaLimaDeISO } from '../../utils/fechas';

export const TIPOS_CONDICION = TIPOS_CONDICION_COMERCIAL;
export const PLAZOS_PAGO = FORMAS_PAGO;

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const [y, m, d] = fechaLimaDeISO(fechaISO).split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

export function aplicarDescuento(precio, descuentoPct) {
  return precio * (1 - (parseFloat(descuentoPct) || 0) / 100);
}

function normalizeTerm(t) {
  const clienteNombre = t.cliente?.razon_social || t.cliente?.nombre || `Cliente #${t.cliente_id || ''}`;

  return {
    id: t.id,
    cliente_id: t.cliente_id,
    cliente: clienteNombre,
    tipo: t.tipo_condicion,
    plazo: t.dias_plazo_pactados ? `Crédito ${t.dias_plazo_pactados}d` : 'Contado',
    diasPlazo: t.dias_plazo_pactados || 0,
    descuento: parseFloat(t.porcentaje_descuento || 0),
    limiteCredito: parseFloat(t.limite_credito_asignado || 0),
    fechaRegistro: t.fecha_registro ? fechaLimaDeISO(t.fecha_registro) : fechaHoyLima(),
  };
}

export async function fetchCondiciones() {
  const termsData = await apiRequest('/commercial-terms/');
  return termsData.map(normalizeTerm);
}

export async function fetchCondicionesPorCliente(clienteId) {
  const data = await apiRequest(`/commercial-terms/client/${clienteId}`);
  return data.map(normalizeTerm);
}

export async function crearCondicion(data) {
  const payload = {
    cliente_id: parseInt(data.cliente_id, 10),
    tipo_condicion: data.tipo,
    dias_plazo_pactados: parseInt(data.diasPlazo, 10),
    porcentaje_descuento: data.descuento ? parseFloat(data.descuento) : 0,
    limite_credito_asignado: data.limiteCredito ? parseFloat(data.limiteCredito) : 0,
  };

  const response = await apiRequest('/commercial-terms/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeTerm(response);
}

export async function actualizarCondicion(id, data) {
  const payload = {
    tipo_condicion: data.tipo || undefined,
    dias_plazo_pactados: data.diasPlazo !== undefined ? parseInt(data.diasPlazo, 10) : undefined,
    porcentaje_descuento: data.descuento !== undefined ? parseFloat(data.descuento) : undefined,
    limite_credito_asignado: data.limiteCredito !== undefined ? parseFloat(data.limiteCredito) : undefined,
  };

  const response = await apiRequest(`/commercial-terms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return normalizeTerm(response);
}

export async function eliminarCondicion(id) {
  return apiRequest(`/commercial-terms/${id}`, { method: 'DELETE' });
}