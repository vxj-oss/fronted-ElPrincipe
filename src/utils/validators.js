export function esEmailValido(valor) {
  if (!valor) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export function esRucODniValido(valor) {
  if (!valor) return false;
  const limpio = valor.trim();
  return /^\d{8}$/.test(limpio) || /^\d{11}$/.test(limpio);
}

export function esDniValido(valor) {
  return /^\d{8}$/.test((valor || '').trim());
}

export function esRucValido(valor) {
  return /^\d{11}$/.test((valor || '').trim());
}

export function esTelefonoValido(valor) {
  if (!valor) return true;
  return /^\d{6,9}$/.test(valor.trim());
}

export function validarPassword(valor, { minLength = 6 } = {}) {
  if (!valor) return 'La contraseña es requerida.';
  if (valor.length < minLength) return `Mínimo ${minLength} caracteres.`;
  return null;
}

export function validarConfirmacion(valor, referencia, mensaje = 'Los valores no coinciden.') {
  return valor === referencia ? null : mensaje;
}

export function validarRequerido(valor, mensaje = 'Este campo es requerido.') {
  if (typeof valor === 'string') return valor.trim() ? null : mensaje;
  return valor === undefined || valor === null || valor === '' ? mensaje : null;
}

export function validarCampos(datos, reglas) {
  const errores = {};
  for (const campo of Object.keys(reglas)) {
    const error = reglas[campo](datos[campo], datos);
    if (error) errores[campo] = error;
  }
  return errores;
}
