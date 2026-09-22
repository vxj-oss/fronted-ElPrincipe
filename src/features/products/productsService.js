import { apiRequest } from '../../utils/api';
import {
  UNIDADES_MEDIDA as UNIDADES,
  NIVELES_ROTACION,
} from '../../constants/appConstants';

export { UNIDADES, NIVELES_ROTACION };

function normalizeProductFromBackend(prod) {
  return {
    id: prod.id,
    codigo: prod.sku,
    nombre: prod.nombre,
    categoria_id: prod.categoria_id,
    categoria: prod.categoria?.nombre || 'General',
    precio: parseFloat(prod.precio_unitario) || 0,
    costo: parseFloat(prod.precio_costo) || 0,
    stock: prod.stock_actual,
    minimo: prod.stock_minimo,
    unidad: prod.unidad_medida,
    rotacion: prod.nivel_rotacion,
    descripcion: prod.descripcion || '',
    activo: prod.activo !== false,
  };
}

function transformProductToBackend(data) {
  return {
    categoria_id: parseInt(data.categoria_id, 10),
    sku: data.codigo || data.sku,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    unidad_medida: data.unidad || 'Unidad',
    precio_unitario: parseFloat(data.precio || data.precio_unitario || 0),
    precio_costo: parseFloat(data.costo || data.precio_costo || 0),
    stock_actual: parseInt(data.stock || data.stock_actual || 0, 10),
    stock_minimo: parseInt(data.minimo || data.stock_minimo || 5, 10),
    nivel_rotacion: data.rotacion || data.nivel_rotacion || 'Media',
  };
}

export async function fetchProductos(categoryId = null, incluirInactivos = false) {
  const params = new URLSearchParams();
  if (categoryId) params.append('category_id', categoryId);
  if (incluirInactivos) params.append('incluir_inactivos', 'true');
  params.append('limit', '1000');
  const data = await apiRequest(`/products/?${params.toString()}`);
  return data.map(normalizeProductFromBackend);
}

export async function fetchProducto(id) {
  const data = await apiRequest(`/products/${id}`);
  return normalizeProductFromBackend(data);
}

export async function crearProducto(data) {
  const payload = transformProductToBackend(data);
  const response = await apiRequest('/products/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeProductFromBackend(response);
}

export async function actualizarProducto(id, data) {
  const payload = transformProductToBackend(data);
  const response = await apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeProductFromBackend(response);
}

export async function eliminarProducto(id) {
  return await apiRequest(`/products/${id}`, {
    method: 'DELETE',
  });
}

export async function reactivarProducto(id) {
  const response = await apiRequest(`/products/${id}/reactivar`, {
    method: 'PATCH',
  });
  return normalizeProductFromBackend(response);
}

export async function fetchCategorias() {
  return await apiRequest('/categories/');
}

export async function crearCategoria({ nombre, descripcion }) {
  return await apiRequest('/categories/', {
    method: 'POST',
    body: JSON.stringify({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    }),
  });
}

export async function actualizarCategoria(id, { nombre, descripcion }) {
  return await apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    }),
  });
}

export async function eliminarCategoria(id) {
  return await apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchMovimientosStock(productId, limit = 50) {
  const data = await apiRequest(`/products/${productId}/movimientos?limit=${limit}`);
  return (data || []).map((m) => ({
    id: m.id,
    pedidoId: m.pedido_id,
    tipo: m.tipo,
    cantidad: m.cantidad,
    stockAnterior: m.stock_anterior,
    stockNuevo: m.stock_nuevo,
    motivo: m.motivo || '',
    fecha: m.creado_en,
  }));
}