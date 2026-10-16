const PATRON_EDICION =
  /\b(quita|quitar|quitale|elimina|eliminar|saca|sacar|borra|borrar|retira|agrega|agregar|agregale|anade|anadir|suma|sumar|sumale|incluye|incluir|ponle|pon|poner|cambia|cambiar|cambiale|deja|dejalo|ajusta|modifica|actualiza|sube|subele|baja|bajale|aumenta|reduce|disminuye)\b/;

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function parecedEdicion(texto) {
  return PATRON_EDICION.test(normalizar(texto));
}

export function borradorActivo(registro) {
  const entradas = Array.from(registro.values());
  const ultima = entradas[entradas.length - 1];
  return ultima ? ultima.obtener() : null;
}

export function construirContextoEdicion(texto, registro) {
  if (!parecedEdicion(texto)) return null;
  const borrador = borradorActivo(registro);
  return borrador ? { borrador } : null;
}

export function aplicarEdicion(datos, registro) {
  if (!datos?.aplicado) return;
  const entrada = registro.get(String(datos.mensaje_id));
  if (entrada) entrada.aplicar(datos);
}
