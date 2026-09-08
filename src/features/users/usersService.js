import { apiRequest } from '../../utils/api';

export const ROLES = [
  { value: 'asesor_comercial', label: 'Asesor comercial' },
  { value: 'administrador', label: 'Administrador' },
];

export function etiquetaRol(rol) {
  return ROLES.find((r) => r.value === rol)?.label || rol;
}

function normalizar(u) {
  return {
    id: u.id,
    nombreCompleto: u.nombre_completo,
    usuario: u.nombre_usuario,
    correo: u.correo,
    rol: u.rol,
    activo: u.esta_activo !== false,
    creadoEn: u.creado_en,
  };
}

export async function fetchUsuarios() {
  const data = await apiRequest('/users/');
  return (data || []).map(normalizar);
}

export async function actualizarUsuario(id, campos) {
  const payload = {};
  if (campos.nombreCompleto !== undefined) payload.nombre_completo = campos.nombreCompleto.trim();
  if (campos.correo !== undefined) payload.correo = campos.correo.trim();
  if (campos.rol !== undefined) payload.rol = campos.rol;
  if (campos.activo !== undefined) payload.esta_activo = campos.activo;

  const data = await apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizar(data);
}

export async function eliminarUsuario(id) {
  return await apiRequest(`/users/${id}`, { method: 'DELETE' });
}
