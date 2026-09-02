const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    localStorage.removeItem('user');
    const onAuthPage =
      window.location.pathname === '/login' || window.location.pathname === '/registro';
    if (!onAuthPage) {
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada o no autorizada');
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMsg = 'Error en la solicitud al servidor';
    if (data?.error?.mensaje) {
      errorMsg = data.error.mensaje;
    } else if (typeof data?.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      errorMsg = data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
    } else if (typeof data?.message === 'string') {
      errorMsg = data.message;
    } else if (typeof data?.mensaje === 'string') {
      errorMsg = data.mensaje;
    } else if (text && text.trim()) {
      errorMsg = text;
    }

    throw new Error(errorMsg);
  }

  if (response.status === 204 || !data) {
    return null;
  }

  return data;
}