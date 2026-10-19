import { useState, useRef, useCallback, useEffect } from 'react';

const IDIOMA = 'es-PE';

function obtenerReconocimiento() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const MENSAJES_ERROR = {
  'not-allowed': 'Permite el acceso al micrófono para dictar.',
  'service-not-allowed': 'Permite el acceso al micrófono para dictar.',
  'no-speech': 'No se escuchó nada. Intenta de nuevo.',
  'audio-capture': 'No se encontró un micrófono.',
  network: 'Sin conexión para el dictado por voz.',
};

const normalizarPalabra = (palabra) => palabra.toLowerCase().replace(/[.,;:!?¿¡]/g, '');

function unirFragmentos(fragmentos) {
  let palabras = [];
  fragmentos.forEach((fragmento) => {
    const nuevas = fragmento.trim().split(/\s+/).filter(Boolean);
    if (!nuevas.length) return;
    if (!palabras.length) {
      palabras = nuevas;
      return;
    }
    const previas = palabras.map(normalizarPalabra);
    const claves = nuevas.map(normalizarPalabra);
    const textoPrevio = ` ${previas.join(' ')} `;
    if (textoPrevio.includes(` ${claves.join(' ')} `)) return;
    let solape = 0;
    for (let k = Math.min(previas.length, claves.length); k > 0; k -= 1) {
      if (previas.slice(-k).join(' ') === claves.slice(0, k).join(' ')) {
        solape = k;
        break;
      }
    }
    palabras = [...palabras.slice(0, palabras.length - solape), ...nuevas];
  });
  return palabras.join(' ');
}

export function useDictado(onTexto) {
  const [escuchando, setEscuchando] = useState(false);
  const [errorDictado, setErrorDictado] = useState(null);
  const reconocimientoRef = useRef(null);
  const baseRef = useRef('');
  const ignorarRef = useRef(false);
  const onTextoRef = useRef(onTexto);
  const soportado = Boolean(obtenerReconocimiento());

  useEffect(() => {
    onTextoRef.current = onTexto;
  }, [onTexto]);

  useEffect(() => () => reconocimientoRef.current?.abort(), []);

  const detener = useCallback(() => {
    reconocimientoRef.current?.stop();
  }, []);

  const cancelar = useCallback(() => {
    ignorarRef.current = true;
    reconocimientoRef.current?.abort();
    setEscuchando(false);
    setErrorDictado(null);
  }, []);

  const iniciar = useCallback((textoBase = '') => {
    const Reconocimiento = obtenerReconocimiento();
    if (!Reconocimiento) return;
    ignorarRef.current = false;

    const reconocimiento = new Reconocimiento();
    reconocimiento.lang = IDIOMA;
    reconocimiento.continuous = true;
    reconocimiento.interimResults = true;

    const base = textoBase.trim();
    baseRef.current = base ? `${base} ` : '';

    reconocimiento.onresult = (evento) => {
      if (ignorarRef.current) return;
      const fragmentos = [];
      for (let i = 0; i < evento.results.length; i += 1) {
        fragmentos.push(evento.results[i][0].transcript);
      }
      onTextoRef.current(`${baseRef.current}${unirFragmentos(fragmentos)}`);
    };
    reconocimiento.onerror = (evento) => {
      if (ignorarRef.current || evento.error === 'aborted') {
        setEscuchando(false);
        return;
      }
      setErrorDictado(MENSAJES_ERROR[evento.error] || 'No se pudo usar el dictado por voz.');
      setEscuchando(false);
    };
    reconocimiento.onend = () => setEscuchando(false);

    setErrorDictado(null);
    reconocimientoRef.current = reconocimiento;
    try {
      reconocimiento.start();
      setEscuchando(true);
    } catch {
      setEscuchando(false);
    }
  }, []);

  const alternar = useCallback(
    (textoBase = '') => {
      if (escuchando) detener();
      else iniciar(textoBase);
    },
    [escuchando, iniciar, detener]
  );

  return { soportado, escuchando, errorDictado, alternar, detener, cancelar };
}
