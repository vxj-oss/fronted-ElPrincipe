import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchConversaciones,
  fetchMensajes,
  enviarMensaje,
  PREGUNTAS_SUGERIDAS,
} from './agentService';
import { EMPRESA } from '../../constants/appConstants';

const MENSAJE_BIENVENIDA = {
  id: 'welcome',
  rol: 'agent',
  timestamp: new Date().toISOString(),
  tipo: 'texto',
  texto: `Hola. Soy tu asistente comercial de ${EMPRESA.NOMBRE}. Puedo consultarte información de ventas, stock, clientes y pedidos en tiempo real. ¿En qué te ayudo hoy?`,
};

export function useAgent() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchConversaciones()
      .then((data) => {
        setConversaciones(data);
        if (data.length > 0) {
          seleccionarConversacion(data[0].id);
        }
      })
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [mensajes, enviando]);

  const seleccionarConversacion = useCallback(async (id) => {
    setConversacionActiva(id);
    setCargando(true);
    try {
      const msgs = await fetchMensajes(id);
      setMensajes(msgs.length > 0 ? msgs : [MENSAJE_BIENVENIDA]);
    } catch {
      setError('Error al cargar los mensajes.');
    } finally {
      setCargando(false);
    }
  }, []);

  const nuevaConversacion = useCallback(() => {
    setConversacionActiva(null);
    setMensajes([MENSAJE_BIENVENIDA]);
    setInput('');
    inputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const usarPreguntaSugerida = useCallback((pregunta) => {
    setInput(pregunta);
    inputRef.current?.focus();
  }, []);

  const handleEnviar = useCallback(async () => {
    const texto = input.trim();
    if (!texto || enviando) return;

    const msgUsuario = {
      id: `u-${Date.now()}`,
      rol: 'user',
      timestamp: new Date().toISOString(),
      tipo: 'texto',
      texto,
    };

    setMensajes((prev) => [...prev, msgUsuario]);
    setInput('');
    setEnviando(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const respuesta = await enviarMensaje({
        sesionId: conversacionActiva,
        contenido: texto,
      });

      setMensajes((prev) => [...prev, respuesta]);

      if (!conversacionActiva && respuesta.sesion_id) {
        setConversacionActiva(respuesta.sesion_id);
        const listaActualizada = await fetchConversaciones();
        setConversaciones(listaActualizada);
      }
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          rol: 'agent',
          timestamp: new Date().toISOString(),
          tipo: 'error',
          texto: 'Ocurrió un error al procesar tu consulta. Verifica que el servicio de IA esté en línea.',
        },
      ]);
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  }, [input, enviando, conversacionActiva]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleEnviar();
      }
    },
    [handleEnviar]
  );

  const limpiarError = useCallback(() => setError(null), []);

  return {
    conversaciones,
    conversacionActiva,
    mensajes,
    input,
    enviando,
    cargando,
    error,
    preguntasSugeridas: PREGUNTAS_SUGERIDAS,
    chatBodyRef,
    inputRef,
    seleccionarConversacion,
    nuevaConversacion,
    handleInputChange,
    handleEnviar,
    handleKeyDown,
    usarPreguntaSugerida,
    limpiarError,
  };
}