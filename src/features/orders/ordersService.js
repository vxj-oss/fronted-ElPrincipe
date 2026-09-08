import { apiRequest } from '../../utils/api';
import { ESTADOS_PEDIDO, FORMAS_PAGO, TIPOS_ERROR } from '../../constants/appConstants';
import { fechaHoyLima, fechaLimaDeISO } from '../../utils/fechas';

export { ESTADOS_PEDIDO, FORMAS_PAGO as CONDICIONES_PAGO, TIPOS_ERROR };

export function getFechaActualLima() {
  return fechaHoyLima();
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const soloFecha = fechaLimaDeISO(fechaISO);
  const [y, m, d] = soloFecha.split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

export function formatearHora(fechaISO) {
  if (!fechaISO) return '—';
  const fechaObj = new Date(fechaISO);
  return fechaObj.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calcularTotal(items = []) {
  return items.reduce((acc, i) => acc + (parseFloat(i.cant) || 0) * (parseFloat(i.precio) || 0), 0);
}

function normalizeOrderFromBackend(o) {
  const lineas = o.detalles || o.items || [];
  const primerError = lineas.find((it) => it.tiene_error || (it.tipo_error && it.tipo_error !== 'Ninguno'));

  const fechaLimpia = fechaLimaDeISO(o.fecha_pedido || o.creado_en);
  const audit = o.auditoria_condicion || null;
  const condPolitica = audit?.condicion_comercial || null;

  return {
    id: o.id,
    numero: o.codigo_pedido || `PED-${o.id}`,
    solicitud_id: o.solicitud_id || null,
    cliente_id: o.cliente_id,
    cliente: o.cliente?.razon_social || o.cliente?.nombre || 'Cliente sin asignar',
    fecha: fechaLimpia,
    estado: o.estado || 'Pendiente',
    pago: o.forma_pago || 'Contado',
    direccion: o.cliente?.direccion || '',
    observaciones: o.observaciones || '',
    tieneError: Boolean(primerError),
    errores: primerError ? [primerError.tipo_error] : [],
    errDesc: primerError?.descripcion_error || '',
    condicionComercial: audit ? {
      id: audit.id,
      condicion_id: audit.condicion_comercial_id,
      tipo: condPolitica?.tipo_condicion || 'Plazo_Credito',
      diasPlazo: condPolitica?.dias_plazo_pactados || 0,
      descuento: parseFloat(condPolitica?.porcentaje_descuento || 0),
      limiteCredito: parseFloat(condPolitica?.limite_credito_asignado || 0),
      tieneFalla: Boolean(audit.tiene_falla),
      motivoFalla: audit.motivo_falla || '',
    } : null,
    tieneFallaCondicion: Boolean(audit?.tiene_falla),
    motivoFallaCondicion: audit?.motivo_falla || '',
    items: lineas.map((i) => ({
      id: i.id,
      producto_id: i.producto_id,
      producto: i.producto?.nombre || `Producto #${i.producto_id}`,
      cant: i.cantidad || 1,
      precio: parseFloat(i.precio_unitario || 0),
      tiene_error: Boolean(i.tiene_error),
      tipo_error: i.tipo_error || 'Ninguno',
      descripcion_error: i.descripcion_error || '',
    })),
    stockDescontado: Boolean(o.stock_descontado),
    alertasStock: (o.alertas_stock || []).map((a) => ({
      productoId: a.producto_id,
      nombre: a.nombre,
      stock: a.stock_actual,
      minimo: a.stock_minimo,
      agotado: Boolean(a.agotado),
    })),
    creadoEn: o.creado_en || o.created_at || new Date().toISOString(),
  };
}

function transformOrderToBackend(data) {
  const fechaSeleccionada = data.fecha || getFechaActualLima();

  return {
    cliente_id: parseInt(data.cliente_id, 10),
    solicitud_id: data.solicitud_id ? parseInt(data.solicitud_id, 10) : null,
    condicion_comercial_id: data.condicion_comercial_id ? parseInt(data.condicion_comercial_id, 10) : null,
    codigo_pedido: data.numero || null,
    fecha_pedido: `${fechaSeleccionada}T12:00:00`,
    forma_pago: data.pago || 'Contado',
    estado: data.estado || 'Pendiente',
    observaciones: data.observaciones || null,
    items: (data.items || []).map((it) => ({
      producto_id: parseInt(it.producto_id, 10),
      cantidad: parseInt(it.cant, 10),
      precio_unitario: parseFloat(it.precio),
      tiene_error: Boolean(it.tiene_error),
      tipo_error: it.tipo_error || 'Ninguno',
      descripcion_error: it.descripcion_error || null,
    })),
  };
}

export async function fetchPedidos() {
  const data = await apiRequest('/orders/');
  return data.map(normalizeOrderFromBackend);
}

export async function fetchPedido(id) {
  const data = await apiRequest(`/orders/${id}`);
  return normalizeOrderFromBackend(data);
}

export async function crearPedido(data) {
  const payload = transformOrderToBackend(data);
  const response = await apiRequest('/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeOrderFromBackend(response);
}

export async function actualizarPedido(id, data) {
  const payload = {};

  if (data.cliente_id !== undefined) payload.cliente_id = parseInt(data.cliente_id, 10);
  if (data.solicitud_id !== undefined) payload.solicitud_id = data.solicitud_id ? parseInt(data.solicitud_id, 10) : null;
  if (data.condicion_comercial_id !== undefined) payload.condicion_comercial_id = data.condicion_comercial_id ? parseInt(data.condicion_comercial_id, 10) : null;
  if (data.fecha !== undefined) payload.fecha_pedido = `${data.fecha}T12:00:00`;
  if (data.pago !== undefined) payload.forma_pago = data.pago;
  if (data.estado !== undefined) payload.estado = data.estado;
  if (data.observaciones !== undefined) payload.observaciones = data.observaciones || null;

  if (data.items !== undefined && Array.isArray(data.items)) {
    payload.items = data.items.map((it) => ({
      producto_id: parseInt(it.producto_id, 10),
      cantidad: parseInt(it.cant, 10),
      precio_unitario: parseFloat(it.precio),
      tiene_error: Boolean(it.tiene_error),
      tipo_error: it.tipo_error || 'Ninguno',
      descripcion_error: it.descripcion_error || null,
    }));
  }

  const response = await apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeOrderFromBackend(response);
}

export async function eliminarPedido(id) {
  return await apiRequest(`/orders/${id}`, {
    method: 'DELETE',
  });
}

export async function cambiarEstadoPedido(id, estado) {
  const response = await apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
  return normalizeOrderFromBackend(response);
}

export async function registrarErrorPedido(id, { errores = [], errDesc = '' }) {
  const tipoError = errores.length > 0 ? errores[0] : 'Error_No_Especificado';
  const response = await apiRequest(`/orders/${id}/error`, {
    method: 'PATCH',
    body: JSON.stringify({
      tipo_error: tipoError,
      descripcion: errDesc,
    }),
  });
  return normalizeOrderFromBackend(response);
}

export async function limpiarErrorPedido(id) {
  const response = await apiRequest(`/orders/${id}/limpiar-error`, {
    method: 'PATCH',
  });
  return normalizeOrderFromBackend(response);
}

export async function validarPedidoConIA({ solicitud_id, cliente_id, forma_pago, items = [] }) {
  const payload = {
    solicitud_id: solicitud_id ? parseInt(solicitud_id, 10) : null,
    cliente_id: parseInt(cliente_id, 10),
    forma_pago: forma_pago || 'Contado',
    items_pedido: items.map((it) => ({
      producto_id: parseInt(it.producto_id, 10),
      sku: it.sku || null,
      nombre: it.producto || it.nombre || 'Item',
      cantidad: parseInt(it.cant || it.cantidad, 10),
      precio_unitario: parseFloat(it.precio || it.precio_unitario),
    })),
  };

  return await apiRequest('/customer-requests/validate-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}