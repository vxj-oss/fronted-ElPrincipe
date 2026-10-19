import { useEffect, useRef } from 'react';
import { SprayCan, Droplets, Package, ShoppingBag, Sparkles, Receipt, FileSpreadsheet } from 'lucide-react';
import styles from './fondoLogin.module.css';

const FLOTANTES = [
  { Icono: FileSpreadsheet, etiqueta: 'Cotizaciones', x: '7%', y: '16%', profundidad: 1.1, retraso: '0s', giro: -5 },
  { Icono: ShoppingBag, etiqueta: 'Pedidos', x: '78%', y: '12%', profundidad: 0.8, retraso: '-2s', giro: 4 },
  { Icono: SprayCan, etiqueta: 'Limpieza', x: '84%', y: '58%', profundidad: 1.3, retraso: '-4s', giro: -3 },
  { Icono: Package, etiqueta: 'Stock', x: '9%', y: '66%', profundidad: 0.9, retraso: '-1s', giro: 6 },
  { Icono: Receipt, etiqueta: 'Ventas', x: '60%', y: '84%', profundidad: 1.2, retraso: '-3s', giro: -6 },
  { Icono: Droplets, etiqueta: 'Productos', x: '30%', y: '6%', profundidad: 0.7, retraso: '-5s', giro: 3 },
  { Icono: Sparkles, etiqueta: 'Agente IA', x: '38%', y: '90%', profundidad: 0.6, retraso: '-6s', giro: -4 },
];

export default function FondoLogin({ cargando = false }) {
  const raizRef = useRef(null);

  useEffect(() => {
    const panel = raizRef.current?.parentElement;
    if (!panel) return undefined;
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tactil = window.matchMedia('(pointer: coarse)').matches;
    if (sinMovimiento || tactil) return undefined;

    let cuadro = 0;
    let objetivo = { x: 0, y: 0 };
    const actual = { x: 0, y: 0 };

    const animar = () => {
      actual.x += (objetivo.x - actual.x) * 0.08;
      actual.y += (objetivo.y - actual.y) * 0.08;
      panel.style.setProperty('--mx', actual.x.toFixed(3));
      panel.style.setProperty('--my', actual.y.toFixed(3));
      if (Math.abs(objetivo.x - actual.x) > 0.002 || Math.abs(objetivo.y - actual.y) > 0.002) {
        cuadro = requestAnimationFrame(animar);
      } else {
        cuadro = 0;
      }
    };

    const alMover = (evento) => {
      const caja = panel.getBoundingClientRect();
      objetivo = {
        x: ((evento.clientX - caja.left) / caja.width - 0.5) * 2,
        y: ((evento.clientY - caja.top) / caja.height - 0.5) * 2,
      };
      if (!cuadro) cuadro = requestAnimationFrame(animar);
    };

    const alSalir = () => {
      objetivo = { x: 0, y: 0 };
      if (!cuadro) cuadro = requestAnimationFrame(animar);
    };

    panel.addEventListener('mousemove', alMover);
    panel.addEventListener('mouseleave', alSalir);
    return () => {
      panel.removeEventListener('mousemove', alMover);
      panel.removeEventListener('mouseleave', alSalir);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <div ref={raizRef} className={styles.fondo} data-cargando={cargando ? 'si' : 'no'} aria-hidden="true">
      <span className={`${styles.capa} ${styles.capaOrbe1}`}>
        <span className={`${styles.orbe} ${styles.orbe1}`} />
      </span>
      <span className={`${styles.capa} ${styles.capaOrbe2}`}>
        <span className={`${styles.orbe} ${styles.orbe2}`} />
      </span>
      <span className={`${styles.capa} ${styles.capaOrbe3}`}>
        <span className={`${styles.orbe} ${styles.orbe3}`} />
      </span>
      <span className={styles.puntos} />
      {FLOTANTES.map(({ Icono, etiqueta, x, y, profundidad, retraso, giro }) => (
        <span key={etiqueta} className={styles.capaTarjeta} style={{ left: x, top: y, '--p': profundidad }}>
          <span className={styles.tarjeta} style={{ animationDelay: retraso, '--giro': `${giro}deg` }}>
            <span className={styles.tarjetaIcono}>
              <Icono size={16} />
            </span>
            <span className={styles.tarjetaTexto}>{etiqueta}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
