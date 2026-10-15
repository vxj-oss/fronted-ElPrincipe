import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  fetchConversaciones,
  fetchMensajes,
  fetchResumenDia,
  enviarMensaje,
  sugerirSeguimiento,
  filtrarComandos,
  expandirComando,
} from './agentService';
import { EMPRESA } from '../../constants/appConstants';
import { useDictado } from '../../hooks/useDictado';

const TEXTO_BIENVENIDA = `Hola. Soy tu asistente comercial de ${EMPRESA.NOMBRE}. Puedo consultarte información de ventas, stock, clientes y pedidos en tiempo real. ¿En qué te ayudo hoy?`;

const crearBienvenida = (resumen) => ({
  id: 'welcome',
  rol: 'agent',
  timestamp: new Date().toISOString(),
  tipo: 'texto',
  texto: resumen || TEXTO_BIENVENIDA,
});

export function useAgent() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState(() => [crearBienvenida(null)]);
  const [resumenDia, setResumenDia] = useState(null);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const dictado = useDictado((texto) => setInput(texto));

  useEffect(() => {
    fetchConversaciones()
      .then((data) => {
        setConversaciones(data);
      })
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    fetchResumenDia()
      .then(setResumenDia)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!resumenDia || conversacionActiva) return;
    setMensajes((prev) =>
      prev.length === 1 && prev[0].id === 'welcome' ? [crearBienvenida(resumenDia)] : prev
    );
  }, [resumenDia, conversacionActiva]);

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
      setMensajes(msgs.length > 0 ? msgs : [crearBienvenida(resumenDia)]);
    } catch {
      setError('Error al cargar los mensajes.');
    } finally {
      setCargando(false);
    }
  }, [resumenDia]);

  const nuevaConversacion = useCallback(() => {
    setConversacionActiva(null);
    setMensajes([crearBienvenida(resumenDia)]);
    setInput('');
    inputRef.current?.focus();
    fetchResumenDia()
      .then(setResumenDia)
      .catch(() => {});
  }, [resumenDia]);

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

  const enviarTexto = useCallback(async (textoCrudo) => {
    const texto = expandirComando((textoCrudo || '').trim());
    if (!texto || enviando) return;
    dictado.detener();

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
  }, [enviando, conversacionActiva, dictado]);

  const handleEnviar = useCallback(() => enviarTexto(input), [enviarTexto, input]);

  const usarSeguimiento = useCallback(
    (sugerencia) => {
      if (sugerencia.includes('…')) {
        setInput(sugerencia.replace(/\s*…\s*/, ' ').trimStart());
        inputRef.current?.focus();
        return;
      }
      enviarTexto(sugerencia);
    },
    [enviarTexto]
  );

  const [comandoActivo, setComandoActivo] = useState(0);

  const comandosVisibles = useMemo(
    () => (input.startsWith('/') && !/\s/.test(input) ? filtrarComandos(input) : []),
    [input]
  );

  useEffect(() => {
    setComandoActivo(0);
  }, [input]);

  const seleccionarComando = useCallback(
    (comando) => {
      if (!comando) return;
      if (comando.texto) {
        setInput('');
        enviarTexto(comando.texto);
        return;
      }
      setInput(comando.plantilla);
      inputRef.current?.focus();
    },
    [enviarTexto]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (comandosVisibles.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setComandoActivo((i) => Math.min(comandosVisibles.length - 1, i + 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setComandoActivo((i) => Math.max(0, i - 1));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          seleccionarComando(comandosVisibles[comandoActivo]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setInput('');
          return;
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleEnviar();
      }
    },
    [comandosVisibles, comandoActivo, seleccionarComando, handleEnviar]
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
    preguntasSugeridas: sugerirSeguimiento(mensajes),
    chatBodyRef,
    inputRef,
    seleccionarConversacion,
    nuevaConversacion,
    handleInputChange,
    handleEnviar,
    handleKeyDown,
    usarPreguntaSugerida,
    usarSeguimiento,
    comandosVisibles,
    comandoActivo,
    setComandoActivo,
    seleccionarComando,
    limpiarError,
    dictado,
  };
}