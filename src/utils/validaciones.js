const PREFIJOS_RUC = ['10', '15', '16', '17', '20'];
const FACTORES_RUC = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

export const limpiarTelefono = (valor) => String(valor ?? '').replace(/[^0-9+\-()/ ]/g, '');

export function telefonoValido(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return true;
  return /^[0-9+\-()/ ]+$/.test(texto) && soloDigitos(texto).length >= 6;
}

export function rucValido(ruc) {
  if (!/^\d{11}$/.test(ruc) || !PREFIJOS_RUC.includes(ruc.slice(0, 2))) return false;
  const suma = FACTORES_RUC.reduce((acc, f, i) => acc + Number(ruc[i]) * f, 0);
  let verificador = 11 - (suma % 11);
  if (verificador >= 10) verificador -= 10;
  return verificador === Number(ruc[10]);
}

export function documentoValido(valor) {
  const texto = String(valor ?? '').trim();
  if (/^\d{8}$/.test(texto)) return true;
  return rucValido(texto);
}

export const enteroEnRango = (valor, min, max) => {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max;
};
