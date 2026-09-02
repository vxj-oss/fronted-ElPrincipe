const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders() {
  return { 'Content-Type': 'application/json' };
}

export const ACCIONES = [
  {
    id: 'exportData',
    label: 'Exportar mis datos',
    desc: 'Descarga un archivo con tu perfil y las preferencias guardadas en el servidor.',
    btnLabel: 'Exportar datos',
  },
  {
    id: 'clearCache',
    label: 'Limpiar caché local',
    desc: 'Elimina los datos almacenados en caché por el navegador en este equipo.',
    btnLabel: 'Limpiar caché',
  },
  {
    id: 'resetPrefs',
    label: 'Restablecer preferencias',
    desc: 'Elimina las preferencias guardadas en el servidor asociadas a tu cuenta.',
    btnLabel: 'Restablecer',
  },
];

export async function restablecerSettings() {
  const res = await fetch(`${BASE_URL}/users/me/settings`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('No se pudo restablecer la configuración.');
  return {};
}

export async function limpiarCache() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  return { ok: true };
}

export async function exportarDatosUsuario() {
  const [perfilRes, settingsRes] = await Promise.all([
    fetch(`${BASE_URL}/users/me`, { headers: getAuthHeaders(), credentials: 'include' }),
    fetch(`${BASE_URL}/users/me/settings`, { headers: getAuthHeaders(), credentials: 'include' }),
  ]);
  if (!perfilRes.ok) throw new Error('No se pudo obtener el perfil.');

  const perfil = await perfilRes.json();
  const preferencias = settingsRes.ok ? await settingsRes.json() : {};

  const datos = {
    usuario: perfil.nombre_completo,
    correo: perfil.correo,
    rol: perfil.rol,
    exportadoEn: new Date().toISOString(),
    preferencias,
  };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mis-datos-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { ok: true };
}
