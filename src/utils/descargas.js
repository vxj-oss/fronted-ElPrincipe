async function obtenerBlob(endpoint) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const respuesta = await fetch(`${baseUrl}${endpoint}`, { credentials: 'include' });
  if (!respuesta.ok) throw new Error('No se pudo generar el archivo.');
  return respuesta.blob();
}

function guardarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export async function descargarArchivoPost(endpoint, cuerpo, nombreArchivo) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const respuesta = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) throw new Error('No se pudo generar el archivo.');
  guardarBlob(await respuesta.blob(), nombreArchivo);
}

export async function descargarArchivo(endpoint, nombreArchivo) {
  guardarBlob(await obtenerBlob(endpoint), nombreArchivo);
}

export function puedeCompartirArchivos() {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

export async function compartirArchivo(endpoint, nombreArchivo, titulo) {
  const blob = await obtenerBlob(endpoint);
  const archivo = new File([blob], nombreArchivo, { type: blob.type || 'application/pdf' });
  if (puedeCompartirArchivos() && navigator.canShare({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
    } catch (error) {
      if (error?.name !== 'AbortError') throw error;
    }
    return;
  }
  guardarBlob(blob, nombreArchivo);
}
