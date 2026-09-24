import { apiRequest } from '../../utils/api';
import { TIPOS_CONDICION_COMERCIAL, LABELS_TIPO_CONDICION } from '../../constants/appConstants';
import { fechaHoyLima, fechaLimaDeISO } from '../../utils/fechas';

export const TIPOS_CONDICION = TIPOS_CONDICION_COMERCIAL;
export { LABELS_TIPO_CONDICION };

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const [y, m, d] = fechaLimaDeISO(fechaISO).split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

export function aplicarDescuento(precio, descuentoPct) {
  return precio * (1 - (parseFloat(descuentoPct) || 0) / 100);
}

function valorDeCondicion(t) {
  if (t.tipo_condicion === 'Credito') return String(t.dias_plazo_pactados ?? '');
  if (t.tipo_condicion === 'Descuento') return String(parseInt(t.porcentaje_descuento ?? 0, 10));
  if (t.tipo_condicion === 'Forma_Pago') return t.forma_pago_pactada || '';
  return '';
}

function etiquetaDeCondicion(t) {
  if (t.tipo_condicion === 'Credito') return t.dias_plazo_pactados != null ? `Crédito ${t.dias_plazo_pactados}d` : '—';
  if (t.tipo_condicion === 'Descuento') return t.porcentaje_descuento != null ? `Descuento ${parseInt(t.porcentaje_descuento, 10)}%` : '—';
  if (t.tipo_condicion === 'Forma_Pago') return t.forma_pago_pactada || '—';
  return '—';
}

function normalizeTerm(t) {
  const clienteNombre = t.cliente?.razon_social || t.cliente?.nombre || `Cliente #${t.cliente_id || ''}`;

  return {
    id: t.id,
    cliente_id: t.cliente_id,
    cliente: clienteNombre,
    tipo: t.tipo_condicion,
    valor: valorDeCondicion(t),
    valorLabel: etiquetaDeCondicion(t),
    diasPlazo: t.dias_plazo_pactados || 0,
    descuento: parseFloat(t.porcentaje_descuento || 0),
    formaPago: t.forma_pago_pactada || '',
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

function payloadDesdeForm(data) {
  const payload = {
    tipo_condicion: data.tipo,
    dias_plazo_pactados: null,
    porcentaje_descuento: null,
    forma_pago_pactada: null,
  };
  if (data.tipo === 'Credito') payload.dias_plazo_pactados = parseInt(data.valor, 10);
  else if (data.tipo === 'Descuento') payload.porcentaje_descuento = parseFloat(data.valor);
  else if (data.tipo === 'Forma_Pago') payload.forma_pago_pactada = data.valor;
  return payload;
}

export async function crearCondicion(data) {
  const payload = {
    cliente_id: parseInt(data.cliente_id, 10),
    ...payloadDesdeForm(data),
  };

  const response = await apiRequest('/commercial-terms/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeTerm(response);
}

export async function actualizarCondicion(id, data) {
  const payload = payloadDesdeForm(data);

  const response = await apiRequest(`/commercial-terms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return normalizeTerm(response);
}

export async function eliminarCondicion(id) {
  return apiRequest(`/commercial-terms/${id}`, { method: 'DELETE' });
}
