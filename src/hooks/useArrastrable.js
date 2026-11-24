import { useCallback, useEffect, useRef, useState } from 'react';

const CLAVE = 'agente-fab-pos';
const MARGEN = 8;
const UMBRAL = 5;

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && Number.isFinite(guardado.x) && Number.isFinite(guardado.y)) return guardado;
  } catch {
    return null;
  }
  return null;
}

function guardar(pos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(pos));
  } catch {
    return;
  }
}

function acotar(pos, ancho, alto) {
  return {
    x: Math.min(Math.max(pos.x, MARGEN), Math.max(MARGEN, window.innerWidth - ancho - MARGEN)),
    y: Math.min(Math.max(pos.y, MARGEN), Math.max(MARGEN, window.innerHeight - alto - MARGEN)),
  };
}

export function useArrastrable(ancho = 58, alto = 58) {
  const [pos, setPos] = useState(() => {
    const guardada = leer();
    return guardada ? acotar(guardada, ancho, alto) : null;
  });
  const arrastre = useRef(null);
  const seMovio = useRef(false);

  useEffect(() => {
    const alRedimensionar = () => setPos((p) => (p ? acotar(p, ancho, alto) : p));
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
  }, [ancho, alto]);

  const alPresionar = useCallback(
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      arrastre.current = {
        id: e.pointerId,
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
        inicioX: e.clientX,
        inicioY: e.clientY,
      };
      seMovio.current = false;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    []
  );

  const alMover = useCallback(
    (e) => {
      const a = arrastre.current;
      if (!a || a.id !== e.pointerId) return;
      if (!seMovio.current && Math.hypot(e.clientX - a.inicioX, e.clientY - a.inicioY) < UMBRAL) return;
      seMovio.current = true;
      setPos(acotar({ x: e.clientX - a.dx, y: e.clientY - a.dy }, ancho, alto));
    },
    [ancho, alto]
  );

  const alSoltar = useCallback(
    (e) => {
      const a = arrastre.current;
      if (!a || a.id !== e.pointerId) return;
      arrastre.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      if (seMovio.current) {
        setPos((p) => {
          if (p) guardar(p);
          return p;
        });
      }
    },
    []
  );

  const alClic = useCallback((accion) => (e) => {
    if (seMovio.current) {
      seMovio.current = false;
      e.preventDefault();
      return;
    }
    accion(e);
  }, []);

  return {
    pos,
    arrastrando: () => Boolean(arrastre.current && seMovio.current),
    props: { onPointerDown: alPresionar, onPointerMove: alMover, onPointerUp: alSoltar, onPointerCancel: alSoltar },
    alClic,
  };
}
