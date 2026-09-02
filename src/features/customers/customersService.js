import { apiRequest } from '../../utils/api';
import { fetchPedidos, calcularTotal } from '../orders/ordersService';
import {
  DISTRITOS_TRUJILLO,
  TIPOS_CLIENTE,
  CLASIFICACIONES_CLIENTE as CLASIFICACIONES,
} from '../../constants/appConstants';

export { DISTRITOS_TRUJILLO, TIPOS_CLIENTE, CLASIFICACIONES };

function normalizeCustomerFromBackend(c, comprasPorCliente = {}) {
  const totalComprasAcumulado =
    comprasPorCliente[c.id] || parseFloat(c.total_compras || c.compras_totales || 0);

  return {
    id: c.id,
    nombre: c.razon_social || '',
    ruc: c.ruc_dni || '',
    tipo: c.tipo_cliente || 'Mayorista',
    distrito: c.distrito || 'Trujillo',
    telefono: c.telefono || '',
    email: c.correo || '',
    direccion: c.direccion || '',
    clasificacion: c.clasificacion || 'Regular',
    comprasTotal: totalComprasAcumulado,
    activo: c.estado === 'Activo',
    creadoEn: c.creado_en || new Date().toISOString(),
  };
}

function transformCustomerToBackend(data) {
  const payload = {};

  if (data.nombre !== undefined) payload.razon_social = data.nombre.trim();
  if (data.ruc !== undefined) payload.ruc_dni = data.ruc.trim();
  if (data.tipo !== undefined) payload.tipo_cliente = data.tipo;
  if (data.distrito !== undefined) payload.distrito = data.distrito;
  if (data.telefono !== undefined) payload.telefono = data.telefono?.trim() || null;
  if (data.email !== undefined) payload.correo = data.email?.trim() ? data.email.trim() : null;
  if (data.direccion !== undefined) payload.direccion = data.direccion?.trim() || null;
  if (data.clasificacion !== undefined) payload.clasificacion = data.clasificacion;
  if (data.activo !== undefined) payload.estado = data.activo ? 'Activo' : 'Inactivo';

  return payload;
}

export async function fetchClientes(search = null) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const [customersData, pedidosData] = await Promise.all([
    apiRequest(`/customers/${query}`),
    fetchPedidos().catch(() => []),
  ]);

  const comprasPorCliente = {};
  pedidosData.forEach((p) => {
    if (p.cliente_id && p.estado !== 'Cancelado') {
      const montoPedido = calcularTotal(p.items);
      comprasPorCliente[p.cliente_id] = (comprasPorCliente[p.cliente_id] || 0) + montoPedido;
    }
  });

  return customersData.map((c) => normalizeCustomerFromBackend(c, comprasPorCliente));
}

export async function fetchCliente(id) {
  const [customerData, pedidosData] = await Promise.all([
    apiRequest(`/customers/${id}`),
    fetchPedidos().catch(() => []),
  ]);

  const comprasPorCliente = {};
  pedidosData.forEach((p) => {
    if (p.cliente_id && p.estado !== 'Cancelado') {
      const montoPedido = calcularTotal(p.items);
      comprasPorCliente[p.cliente_id] = (comprasPorCliente[p.cliente_id] || 0) + montoPedido;
    }
  });

  return normalizeCustomerFromBackend(customerData, comprasPorCliente);
}

export async function crearCliente(data) {
  const payload = transformCustomerToBackend(data);
  const response = await apiRequest('/customers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeCustomerFromBackend(response);
}

export async function actualizarCliente(id, data) {
  const payload = transformCustomerToBackend(data);
  const response = await apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeCustomerFromBackend(response);
}

export async function eliminarCliente(id) {
  return await apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleActivoCliente(id, estadoActualBooleano) {
  const payload = {
    estado: estadoActualBooleano ? 'Inactivo' : 'Activo',
  };
  const response = await apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeCustomerFromBackend(response);
}