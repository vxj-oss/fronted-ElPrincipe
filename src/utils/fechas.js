const LIMA_TZ = 'America/Lima';

const FORMATO_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function fechaHoyLima() {
  return FORMATO_YMD.format(new Date());
}

export function mesActualLima() {
  return fechaHoyLima().slice(0, 7);
}

export function fechaLimaDeISO(iso) {
  if (!iso) return fechaHoyLima();
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.split('T')[0];
  return FORMATO_YMD.format(d);
}
