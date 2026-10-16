import { useState, useRef, useCallback, useEffect } from 'react';

const PREFERENCIAS_IDIOMA = ['es-PE', 'es-MX', 'es-US', 'es-419', 'es-ES', 'es'];

function sintesis() {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis && window.SpeechSynthesisUtterance ? window.speechSynthesis : null;
}

function elegirVoz() {
  const motor = sintesis();
  if (!motor) return null;
  const voces = motor.getVoices();
  for (const idioma of PREFERENCIAS_IDIOMA) {
    const voz = voces.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(idioma.toLowerCase()));
    if (voz) return voz;
  }
  return null;
}

export function textoParaVoz(texto) {
  return (texto || '')
    .replace(/S\/\s*([\d.,]+)/g, (_, monto) => `${monto.replace(/,/g, '')} soles`)
    .replace(/(\d)\s*%/g, '$1 por ciento')
    .replace(/[•·]/g, ', ')
    .replace(/[«»"]/g, '')
    .replace(/\s[—–]\s/g, ', ')
    .replace(/→/g, ' a ')
    .replace(/[×]/g, ' por ')
    .replace(/\n+/g, '. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function useVozSalida() {
  const soportada = Boolean(sintesis());
  const [hablandoId, setHablandoId] = useState(null);
  const idRef = useRef(null);

  const detener = useCallback(() => {
    const motor = sintesis();
    if (!motor) return;
    idRef.current = null;
    motor.cancel();
    setHablandoId(null);
  }, []);

  const hablar = useCallback((id, texto) => {
    const motor = sintesis();
    const limpio = textoParaVoz(texto);
    if (!motor || !limpio) return;

    motor.cancel();
    const frase = new window.SpeechSynthesisUtterance(limpio);
    const voz = elegirVoz();
    if (voz) {
      frase.voice = voz;
      frase.lang = voz.lang;
    } else {
      frase.lang = 'es-PE';
    }
    frase.rate = 1.05;
    frase.onend = () => {
      if (idRef.current === id) {
        idRef.current = null;
        setHablandoId(null);
      }
    };
    frase.onerror = frase.onend;
    idRef.current = id;
    setHablandoId(id);
    motor.speak(frase);
  }, []);

  const alternar = useCallback(
    (id, texto) => {
      if (idRef.current === id) {
        detener();
        return;
      }
      hablar(id, texto);
    },
    [hablar, detener]
  );

  useEffect(() => {
    const motor = sintesis();
    if (!motor) return undefined;
    const precargar = () => motor.getVoices();
    precargar();
    motor.addEventListener?.('voiceschanged', precargar);
    return () => {
      motor.removeEventListener?.('voiceschanged', precargar);
      motor.cancel();
    };
  }, []);

  return { soportada, hablandoId, hablar, alternar, detener };
}
