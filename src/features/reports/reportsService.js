import { REPORTES_DISPONIBLES } from '../../constants/appConstants';

export const REPORTES_CATALOGO = REPORTES_DISPONIBLES;

const STORAGE_KEY = 'reportes_historial_descargas';

export function getHistorialLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistorialLocal(historial) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
  } catch {}
}

export async function descargarReporteDesdeBackend({ reporteId, formato = 'Excel' }, onProgress) {
  const reporte = REPORTES_CATALOGO.find((r) => r.id === reporteId);
  if (!reporte) throw new Error('Reporte no encontrado');

  const esPdf = formato === 'PDF';
  const endpoint = esPdf ? reporte.endpointPdf : reporte.endpointExcel;
  const extension = esPdf ? 'pdf' : 'xlsx';
  const nombreDescarga = `${reporte.archivoBase}.${extension}`;

  onProgress?.(20, `Solicitando reporte ${formato} al backend...`);
  onProgress?.(50, `FastAPI procesando reporte en ${formato}...`);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Error al generar el reporte ${formato} en el servidor`);
  }

  onProgress?.(80, `Descargando archivo ${extension.toUpperCase()}...`);
  const blob = await response.blob();

  descargarBlob(blob, nombreDescarga);
  onProgress?.(100, 'Descarga completada');

  const entrada = {
    id: Date.now(),
    reporteId,
    nombre: reporte.nombre,
    formato,
    fecha: new Date().toISOString(),
    size: blob.size > 1048576 ? `${(blob.size / 1048576).toFixed(1)} MB` : `${Math.round(blob.size / 1024)} KB`,
  };

  const historial = [entrada, ...getHistorialLocal()];
  saveHistorialLocal(historial);

  return entrada;
}

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatearFechaHistorial(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffH < 1) return 'Hace un momento';
  if (diffH < 24) return `Hace ${diffH} hora${diffH > 1 ? 's' : ''}`;
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `Hace ${diffD} días`;
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}