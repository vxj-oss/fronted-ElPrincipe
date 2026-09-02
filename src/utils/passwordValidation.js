export function validarPasswordComplejidad(password) {
  if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/[a-z]/.test(password)) return 'Debe incluir al menos una letra minúscula.';
  if (!/\d/.test(password)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Debe incluir al menos un símbolo (ej: !@#$%^&*).';
  return null;
}
