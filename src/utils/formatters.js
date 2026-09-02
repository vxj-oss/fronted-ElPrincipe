import { EMPRESA } from '../constants/appConstants';

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const soloFecha = fechaISO.includes('T') ? fechaISO.split('T')[0] : fechaISO;
  const [y, m, d] = soloFecha.split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

export function formatearFechaHora(fechaISO) {
  if (!fechaISO) return { fecha: '—', hora: '—' };
  const fecha = new Date(fechaISO);
  return {
    fecha: fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatearRelativo(fechaISO) {
  if (!fechaISO) return '—';
  const diffMs = Date.now() - new Date(fechaISO);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD === 1) return 'Ayer';
  return `Hace ${diffD} días`;
}

export function formatearMoneda(valor, { decimales = 2 } = {}) {
  const numero = Number(valor) || 0;
  return `${EMPRESA.MONEDA_SIMBOLO} ${numero.toLocaleString('es-PE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

export function formatearNumero(valor) {
  return Number(valor || 0).toLocaleString('es-PE');
}

export function truncarTexto(texto, maxLen = 60) {
  if (!texto) return '';
  return texto.length > maxLen ? `${texto.slice(0, maxLen).trimEnd()}…` : texto;
}

export function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export function iniciales(nombre) {
  if (!nombre) return '';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}
