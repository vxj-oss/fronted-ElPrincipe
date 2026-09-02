import { EMPRESA, METAS_COMERCIALES } from '../../constants/appConstants';
import { validarPasswordComplejidad } from '../../utils/passwordValidation';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders() {
  return { 'Content-Type': 'application/json' };
}

export function formatearDesde(fechaISO) {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  });F
}

export function formatearUltimoAcceso(fechaISO) {
  if (!fechaISO) return 'Hoy';
  const fecha = new Date(fechaISO);
  const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const esHoy = new Date(fecha).toDateString() === new Date().toDateString();
  return esHoy ? `Hoy, ${horaStr}` : `Ayer, ${horaStr}`;
}

export function formatearActividad(fechaISO) {
  if (!fechaISO) return '—';
  const diffMs = Date.now() - new Date(fechaISO);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH}h ${diffMin % 60}min`;
  return `Hace ${Math.floor(diffH / 24)} días`;
}

export function calcularPorcentajeMeta(ventas, meta) {
  if (!meta || meta <= 0) return 0;
  return Math.min(100, Math.round((ventas / meta) * 100));
}

export function validarPerfil(datos) {
  const errs = {};
  if (!datos.nombre_completo?.trim()) errs.nombre_completo = 'El nombre completo es requerido.';
  if (!datos.correo?.trim()) {
    errs.correo = 'El correo es requerido.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
    errs.correo = 'Ingresa un correo válido.';
  }
  return errs;
}

export function validarPassword(datos) {
  const errs = {};
  if (!datos.nueva) {
    errs.nueva = 'La nueva contraseña es requerida.';
  } else {
    const passErr = validarPasswordComplejidad(datos.nueva);
    if (passErr) errs.nueva = passErr;
  }
  if (datos.nueva !== datos.confirmar) {
    errs.confirmar = 'Las contraseñas no coinciden.';
  }
  return errs;
}

export async function fetchPerfil() {
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('No se pudo obtener el perfil.');
  const data = await res.json();

  const partes = (data.nombre_completo || '').trim().split(' ');
  const nombre = partes[0] || '';
  const apellido = partes.slice(1).join(' ') || '';
  const iniciales = `${nombre[0] || ''}${apellido[0] || (nombre[1] || '')}`.toUpperCase() || 'EP';

  return {
    id: data.id,
    nombre_usuario: data.nombre_usuario,
    nombreCompleto: data.nombre_completo,
    nombre,
    apellido,
    correo: data.correo,
    email: data.correo,
    telefono: '+51 987 654 321',
    cargo: data.rol === 'administrador' ? 'Administrador General' : 'Asesor Comercial',
    rol: data.rol,
    sede: EMPRESA.CIUDAD,
    empresa: `${EMPRESA.NOMBRE} — ${EMPRESA.SUBTITULO}`,
    desdeISO: data.creado_en,
    ultimoAccesoISO: new Date().toISOString(),
    iniciales,
  };
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/orders/?limit=200`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    return {
      pedidosHoy: 0,
      ventasHoy: 0,
      metaDiaria: METAS_COMERCIALES.META_DIARIA_VENTAS || 6000,
      clientesHoy: 0,
      ventasMes: 0,
    };
  }

  const orders = await res.json();
  const ahora = new Date();
  const hoyAnio = ahora.getFullYear();
  const hoyMes = ahora.getMonth();
  const hoyDia = ahora.getDate();

  const pedidosHoy = orders.filter((o) => {
    const fStr = o.fecha_pedido || o.creado_en;
    if (!fStr) return false;
    const f = new Date(fStr);
    return (
      f.getFullYear() === hoyAnio &&
      f.getMonth() === hoyMes &&
      f.getDate() === hoyDia
    );
  });

  const pedidosMes = orders.filter((o) => {
    const fStr = o.fecha_pedido || o.creado_en;
    if (!fStr) return false;
    const f = new Date(fStr);
    return f.getFullYear() === hoyAnio && f.getMonth() === hoyMes;
  });

  const ventasHoy = pedidosHoy.reduce((acc, o) => acc + Number(o.monto_total || 0), 0);
  const ventasMes = pedidosMes.reduce((acc, o) => acc + Number(o.monto_total || 0), 0);
  
  const clientesHoy = new Set(pedidosHoy.map((o) => o.cliente_id)).size;
  const clientesTotal = new Set(orders.map((o) => o.cliente_id)).size;

  return {
    pedidosHoy: pedidosHoy.length,
    ventasHoy,
    metaDiaria: METAS_COMERCIALES.META_DIARIA_VENTAS || 6000,
    clientesHoy: clientesHoy > 0 ? clientesHoy : clientesTotal,
    ventasMes,
  };
}

export async function fetchActividad(usuarioId) {
  const url = usuarioId
    ? `${BASE_URL}/history/?usuario_id=${usuarioId}&limit=5`
    : `${BASE_URL}/history/?limit=5`;

  const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) return [];

  const raw = await res.json();
  return raw.map((item) => {
    let icono = 'clipboard-list';
    let colorBg = '#eff6ff';
    let colorIc = '#1d4ed8';

    if (item.modulo_afectado === 'Productos') {
      icono = 'edit';
      colorBg = '#f0fdf4';
      colorIc = '#15803d';
    } else if (item.modulo_afectado === 'Clientes') {
      icono = 'user-plus';
      colorBg = '#f0fdf4';
      colorIc = '#15803d';
    } else if (item.accion === 'ELIMINAR' || item.accion === 'ERROR') {
      icono = 'alert-triangle';
      colorBg = '#fef2f2';
      colorIc = '#b91c1c';
    }

    return {
      id: item.id,
      accion: item.accion,
      icono,
      colorBg,
      colorIc,
      texto: item.detalle_cambio?.descripcion || `${item.accion} en ${item.modulo_afectado}`,
      modulo: item.modulo_afectado,
      fechaISO: item.fecha_hora,
    };
  });
}

export async function actualizarPerfil(datos) {
  const payload = {
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`.trim(),
    correo: datos.email.trim(),
  };

  const res = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al actualizar perfil');
  }

  return await fetchPerfil();
}

export async function cambiarPassword(datos) {
  const payload = {
    password: datos.nueva,
  };

  const res = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al cambiar la contraseña');
  }

  return { ok: true };
}