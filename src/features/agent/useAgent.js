import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  fetchConversaciones,
  fetchMensajes,
  crearConversacion,
  eliminarConversacion,
  eliminarTodasConversaciones,
  fetchResumenDia,
  enviarMensaje,
  enviarMensajeStream,
  sugerirSeguimiento,
  filtrarComandos,
  expandirComando,
} from './agentService';
import { EMPRESA } from '../../constants/appConstants';
import { useDictado } from '../../hooks/useDictado';
import { useVozSalida } from '../../hooks/useVozSalida';
import { aplicarEdicion, construirContextoEdicion } from './edicionBorrador';

const CLAVE_VOZ_AUTO = 'agente_voz_auto';

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
  const voz = useVozSalida();
  const registroBorradores = useRef(new Map());
  const [entidadPantalla, setEntidadPantalla] = useState(null);
  const [usarPantalla, setUsarPantalla] = useState(true);
  const pantallaRef = useRef(null);

  useEffect(() => {
    pantallaRef.current =
      usarPantalla && entidadPantalla
        ? { ruta: window.location.pathname, entidad: entidadPantalla }
        : null;
  }, [entidadPantalla, usarPantalla]);

  const registrarEntidad = useCallback((entidad) => setEntidadPantalla(entidad), []);
  const [leerAuto, setLeerAutoEstado] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_VOZ_AUTO) === '1';
    } catch {
      return false;
    }
  });
  const leerAutoRef = useRef(leerAuto);

  useEffect(() => {
    leerAutoRef.current = leerAuto;
  }, [leerAuto]);

  const setLeerAuto = useCallback(
    (valor) => {
      setLeerAutoEstado(valor);
      try {
        localStorage.setItem(CLAVE_VOZ_AUTO, valor ? '1' : '0');
      } catch {
        return;
      }
      if (!valor) voz.detener();
    },
    [voz]
  );

  const registrarBorrador = useCallback((id, entrada) => {
    registroBorradores.current.set(String(id), entrada);
  }, []);

  const desregistrarBorrador = useCallback((id) => {
    registroBorradores.current.delete(String(id));
  }, []);

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

  const nuevaConversacion = useCallback(async () => {
    const vacia = !mensajes.some((m) => m.rol === 'user');
    setInput('');
    voz.detener();
    fetchResumenDia()
      .then(setResumenDia)
      .catch(() => {});
    setMensajes([crearBienvenida(resumenDia)]);
    inputRef.current?.focus();
    if (vacia && conversacionActiva) return;
    try {
      const nueva = await crearConversacion();
      setConversacionActiva(nueva.id);
      setConversaciones((prev) => [nueva, ...prev]);
    } catch {
      setConversacionActiva(null);
    }
  }, [resumenDia, mensajes, conversacionActiva, voz]);

  const eliminarUna = useCallback(
    async (id) => {
      try {
        await eliminarConversacion(id);
      } catch {
        setError('No se pudo eliminar la conversación.');
        return;
      }
      setConversaciones((prev) => prev.filter((c) => c.id !== id));
      if (id === conversacionActiva) {
        setConversacionActiva(null);
        setMensajes([crearBienvenida(resumenDia)]);
      }
    },
    [conversacionActiva, resumenDia]
  );

  const eliminarTodas = useCallback(async () => {
    try {
      await eliminarTodasConversaciones();
    } catch {
      setError('No se pudo eliminar el historial.');
      return;
    }
    setConversaciones([]);
    setConversacionActiva(null);
    setMensajes([crearBienvenida(resumenDia)]);
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
    dictado.cancelar();
    voz.detener();

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

    const idStream = `s-${Date.now()}`;
    const esPrimera = !mensajes.some((m) => m.rol === 'user');
    let hayStream = false;
    const edicion = construirContextoEdicion(texto, registroBorradores.current);
    const pantalla = pantallaRef.current;
    const contextoAdicional =
      edicion || pantalla ? { ...(edicion || {}), ...(pantalla ? { pantalla } : {}) } : null;

    const alRecibir = (fragmento) => {
      if (fragmento === null) {
        hayStream = false;
        setMensajes((prev) => prev.filter((m) => m.id !== idStream));
        return;
      }
      if (!hayStream) {
        hayStream = true;
        setMensajes((prev) => [
          ...prev,
          {
            id: idStream,
            rol: 'agent',
            timestamp: new Date().toISOString(),
            tipo: 'texto',
            texto: fragmento,
            transmitiendo: true,
          },
        ]);
        return;
      }
      setMensajes((prev) => prev.map((m) => (m.id === idStream ? { ...m, texto: m.texto + fragmento } : m)));
    };

    try {
      let respuesta;
      try {
        respuesta = await enviarMensajeStream({
          sesionId: conversacionActiva,
          contenido: texto,
          contextoAdicional,
          onDelta: alRecibir,
        });
      } catch (errorStream) {
        if (hayStream) throw errorStream;
        respuesta = await enviarMensaje({
          sesionId: conversacionActiva,
          contenido: texto,
          contextoAdicional,
        });
      }

      const final = { ...respuesta, animar: !hayStream, fresca: true };
      setMensajes((prev) =>
        hayStream ? prev.map((m) => (m.id === idStream ? final : m)) : [...prev, final]
      );

      if (respuesta.datos_estructurados?.tipo === 'edicion_borrador') {
        aplicarEdicion(respuesta.datos_estructurados, registroBorradores.current);
      }
      if (leerAutoRef.current && respuesta.texto) voz.hablar(respuesta.id, respuesta.texto);

      if (!conversacionActiva && respuesta.sesion_id) {
        setConversacionActiva(respuesta.sesion_id);
      }
      if (esPrimera || !conversacionActiva) {
        const listaActualizada = await fetchConversaciones();
        setConversaciones(listaActualizada);
      }
    } catch {
      setMensajes((prev) => [
        ...prev.filter((m) => m.id !== idStream),
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
  }, [enviando, conversacionActiva, mensajes, dictado, voz]);

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
    eliminarUna,
    eliminarTodas,
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
    voz,
    leerAuto,
    setLeerAuto,
    registrarBorrador,
    desregistrarBorrador,
    entidadPantalla,
    registrarEntidad,
    usarPantalla,
    setUsarPantalla,
  };
}