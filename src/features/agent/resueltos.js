const CLAVE_RESUELTOS = 'agente_borradores_resueltos';

export function leerResueltos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESUELTOS) || '{}');
  } catch {
    return {};
  }
}

export function guardarResuelto(id, valor) {
  try {
    localStorage.setItem(CLAVE_RESUELTOS, JSON.stringify({ ...leerResueltos(), [id]: valor }));
  } catch {
    return;
  }
}

export const EVENTO_DATOS_ACTUALIZADOS = 'datos-comerciales-actualizados';

export const EVENTO_PASO_COMPLETADO = 'agente-paso-completado';

export function avisarPasoCompletado(detalle) {
  window.dispatchEvent(new CustomEvent(EVENTO_PASO_COMPLETADO, { detail: detalle }));
}

export function avisarDatosActualizados() {
  window.dispatchEvent(new CustomEvent(EVENTO_DATOS_ACTUALIZADOS));
}
