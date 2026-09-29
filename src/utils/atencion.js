const CLAVE = 'inicioAtencionCliente';
export const VENTANA_ATENCION_MIN = 60;

let aperturaClienteEnCurso = null;

function leer() {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function escribir(valor) {
  try {
    if (valor) sessionStorage.setItem(CLAVE, JSON.stringify(valor));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    return;
  }
}

export function marcarAperturaModalCliente() {
  aperturaClienteEnCurso = new Date();
}

export function registrarClienteInscrito(clienteId) {
  if (!aperturaClienteEnCurso || !clienteId) return;
  escribir({
    clienteId: String(clienteId),
    inicio: aperturaClienteEnCurso.toISOString(),
    inscritoEn: new Date().toISOString(),
  });
  aperturaClienteEnCurso = null;
}

export function obtenerInicioAtencion(clienteId) {
  const guardado = leer();
  if (!guardado || String(clienteId) !== guardado.clienteId) return null;
  const minutos = (Date.now() - new Date(guardado.inscritoEn).getTime()) / 60000;
  if (minutos > VENTANA_ATENCION_MIN) return null;
  return new Date(guardado.inicio);
}

export function limpiarInicioAtencion() {
  aperturaClienteEnCurso = null;
  escribir(null);
}
