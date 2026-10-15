import { useState, useRef, useCallback, useEffect } from 'react';

export const RETARDO_DESHACER_MS = 8000;

export function useEliminacionDiferida(retardoMs = RETARDO_DESHACER_MS) {
  const [pendiente, setPendiente] = useState(null);
  const referencia = useRef(null);

  const ejecutarPendiente = useCallback(async () => {
    const actual = referencia.current;
    if (!actual) return;
    clearTimeout(actual.temporizador);
    referencia.current = null;
    setPendiente(null);
    try {
      await actual.ejecutar();
    } catch (error) {
      actual.restaurar();
      actual.alFallar?.(error);
    }
  }, []);

  const programar = useCallback(
    ({ etiqueta, ejecutar, restaurar, alFallar }) => {
      if (referencia.current) ejecutarPendiente();
      const temporizador = setTimeout(ejecutarPendiente, retardoMs);
      referencia.current = { temporizador, ejecutar, restaurar, alFallar };
      setPendiente({ etiqueta, clave: Date.now() });
    },
    [ejecutarPendiente, retardoMs]
  );

  const deshacer = useCallback(() => {
    const actual = referencia.current;
    if (!actual) return;
    clearTimeout(actual.temporizador);
    referencia.current = null;
    setPendiente(null);
    actual.restaurar();
  }, []);

  useEffect(
    () => () => {
      const actual = referencia.current;
      if (!actual) return;
      clearTimeout(actual.temporizador);
      referencia.current = null;
      actual.ejecutar().catch(() => {});
    },
    []
  );

  return { pendiente, programar, deshacer, retardoMs };
}
