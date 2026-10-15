import { useState } from 'react';
import { BellRing, Check, ChevronDown, Copy, MessageCircle } from 'lucide-react';
import { EMPRESA } from '../../constants/appConstants';
import { formatearFecha } from './customerRequestsService';
import styles from './customerRequests.module.css';

const CLAVE_HECHOS = 'seguimiento_cotizaciones_hechas';
const MAX_VISIBLES = 8;

function leerHechos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HECHOS) || '[]');
  } catch {
    return [];
  }
}

function guardarHechos(ids) {
  try {
    localStorage.setItem(CLAVE_HECHOS, JSON.stringify(ids));
  } catch {
    return;
  }
}

function antiguedad(fechaISO) {
  const horas = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 3600000);
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} días`;
}

function mensajeSeguimiento(s) {
  const resumen = s.detalles
    .slice(0, 3)
    .map((d) => `${d.cant} ${d.nombre}`)
    .join(', ');
  const extra = s.detalles.length > 3 ? ` y ${s.detalles.length - 3} más` : '';
  return (
    `Hola ${s.cliente}, te escribo de ${EMPRESA.NOMBRE} para saber si pudiste revisar la cotización ` +
    `${s.codigo} del ${formatearFecha(s.fecha)} (${resumen}${extra}). Quedo atento a tu confirmación.`
  );
}

function enlaceWhatsApp(telefono, texto) {
  const digitos = (telefono || '').replace(/\D/g, '');
  const numero = digitos.length === 9 ? `51${digitos}` : digitos.length === 11 && digitos.startsWith('51') ? digitos : null;
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null;
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export default function SeguimientoPanel({ solicitudes }) {
  const [hechos, setHechos] = useState(leerHechos);
  const [abierto, setAbierto] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);

  const pendientes = solicitudes.filter((s) => !hechos.includes(s.id));
  if (pendientes.length === 0) return null;

  const marcarHecho = (id) => {
    const nuevos = [...hechos, id];
    setHechos(nuevos);
    guardarHechos(nuevos);
  };

  const copiarMensaje = async (s) => {
    if (await copiar(mensajeSeguimiento(s))) {
      setCopiadoId(s.id);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  return (
    <section className={styles.seguimiento} aria-label="Cotizaciones por dar seguimiento">
      <button type="button" className={styles.seguimientoCabecera} onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        <span className={styles.seguimientoTitulo}>
          <BellRing size={15} aria-hidden="true" /> Por dar seguimiento
          <span className={styles.seguimientoContador}>{pendientes.length}</span>
        </span>
        <ChevronDown size={16} className={abierto ? styles.chevronAbierto : ''} aria-hidden="true" />
      </button>

      {abierto && (
        <ul className={styles.seguimientoLista}>
          {pendientes.slice(0, MAX_VISIBLES).map((s) => {
            const enlace = enlaceWhatsApp(s.telefono, mensajeSeguimiento(s));
            return (
              <li key={s.id} className={styles.seguimientoItem}>
                <div className={styles.seguimientoInfo}>
                  <strong>{s.cliente}</strong>
                  <span>{s.codigo} · {s.detalles.length} {s.detalles.length === 1 ? 'ítem' : 'ítems'} · {antiguedad(s.fecha)}</span>
                </div>
                <div className={styles.seguimientoAcciones}>
                  {enlace && (
                    <a href={enlace} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsApp}>
                      <MessageCircle size={13} aria-hidden="true" /> WhatsApp
                    </a>
                  )}
                  <button type="button" className={styles.btnSeguimiento} onClick={() => copiarMensaje(s)}>
                    {copiadoId === s.id ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                    {copiadoId === s.id ? 'Copiado' : 'Copiar mensaje'}
                  </button>
                  <button type="button" className={styles.btnSeguimiento} onClick={() => marcarHecho(s.id)} title="Marcar como contactado">
                    <Check size={13} aria-hidden="true" /> Hecho
                  </button>
                </div>
              </li>
            );
          })}
          {pendientes.length > MAX_VISIBLES && (
            <li className={styles.seguimientoMas}>
              y {pendientes.length - MAX_VISIBLES} más; filtra por estado Pendiente para verlas todas.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
