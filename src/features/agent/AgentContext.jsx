import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAgent } from './useAgent';
import { fetchAvisos, sugerenciasPantalla, sugerenciasEntidad } from './agentService';
import { INTERVALO_AVISOS_MS } from '../../constants/appConstants';
import { EVENTO_PASO_COMPLETADO } from './resueltos';

const AgentContext = createContext(null);

const CLAVE_VISTOS = 'agente_avisos_vistos';
const CLAVE_DESCARTADOS = 'agente_avisos_descartados';

const firmaDe = (aviso) => `${aviso.id}:${aviso.titulo}`;

function leerLista(almacen, clave) {
  try {
    const crudo = JSON.parse(almacen.getItem(clave) || '[]');
    return Array.isArray(crudo) ? crudo : [];
  } catch {
    return [];
  }
}

function guardarLista(almacen, clave, lista) {
  try {
    almacen.setItem(clave, JSON.stringify(lista.slice(-60)));
  } catch {
    return;
  }
}

export function AgentProvider({ children }) {
  const agente = useAgent();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navegacionesHechas = useRef(new Set());
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [vistos, setVistos] = useState(() => leerLista(localStorage, CLAVE_VISTOS));
  const [descartados, setDescartados] = useState(() => leerLista(sessionStorage, CLAVE_DESCARTADOS));
  const [globoOculto, setGloboOculto] = useState(false);
  const [planActivo, setPlanActivo] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = () => {
      fetchAvisos()
        .then((lista) => {
          if (!cancelado) setAvisos(lista);
        })
        .catch(() => {});
    };
    cargar();
    const intervalo = setInterval(() => {
      if (!document.hidden) cargar();
    }, INTERVALO_AVISOS_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  const avisosNuevos = avisos.filter((a) => !vistos.includes(firmaDe(a)));
  const avisosVisibles = avisos.filter((a) => !descartados.includes(firmaDe(a)));

  useEffect(() => {
    setGloboOculto(false);
    if (avisosNuevos.length === 0) return undefined;
    const temporizador = setTimeout(() => setGloboOculto(true), 12000);
    return () => clearTimeout(temporizador);
  }, [avisosNuevos.length]);

  const marcarVistos = useCallback(() => {
    setVistos((prev) => {
      const siguiente = Array.from(new Set([...prev, ...avisos.map(firmaDe)]));
      guardarLista(localStorage, CLAVE_VISTOS, siguiente);
      return siguiente;
    });
  }, [avisos]);

  const descartarAviso = useCallback((aviso) => {
    setDescartados((prev) => {
      const siguiente = [...prev, firmaDe(aviso)];
      guardarLista(sessionStorage, CLAVE_DESCARTADOS, siguiente);
      return siguiente;
    });
  }, []);

  const abrirPanel = useCallback(() => {
    setPanelAbierto(true);
    marcarVistos();
  }, [marcarVistos]);
  const cerrarPanel = useCallback(() => setPanelAbierto(false), []);
  const alternarPanel = useCallback(() => setPanelAbierto((v) => !v), []);

  const ultimoMensaje = agente.mensajes[agente.mensajes.length - 1];

  useEffect(() => {
    if (!ultimoMensaje?.fresca || navegacionesHechas.current.has(ultimoMensaje.id)) return;
    const datos = ultimoMensaje.datos_estructurados;
    if (datos?.tipo !== 'navegacion' || !datos.auto) return;
    navegacionesHechas.current.add(ultimoMensaje.id);
    navigate(datos.ruta);
    if (window.matchMedia('(max-width: 768px)').matches) setPanelAbierto(false);
  }, [ultimoMensaje, navigate]);

  useEffect(() => {
    if (!ultimoMensaje?.fresca || ultimoMensaje.rol === 'user') return;
    const datos = ultimoMensaje.datos_estructurados;
    if (datos?.plan?.pendientes?.length) {
      setPlanActivo({ tarjetaId: ultimoMensaje.id, pendientes: datos.plan.pendientes, esperandoTarjeta: false });
      return;
    }
    setPlanActivo((actual) => {
      if (!actual?.esperandoTarjeta) return actual;
      const esTarjeta = ['borrador_pedido', 'borrador_cotizacion'].includes(datos?.tipo);
      if (!esTarjeta) return null;
      return { ...actual, tarjetaId: ultimoMensaje.id, esperandoTarjeta: false };
    });
  }, [ultimoMensaje]);

  const planRef = useRef(null);
  planRef.current = planActivo;

  useEffect(() => {
    const alCompletar = (evento) => {
      const plan = planRef.current;
      const detalle = evento.detail || {};
      if (!plan || plan.esperandoTarjeta || detalle.mensajeId !== plan.tarjetaId) return;
      const siguiente = plan.pendientes[0];
      if (!siguiente || siguiente.espera !== detalle.tipo) return;
      const restantes = plan.pendientes.slice(1);
      setPlanActivo(restantes.length ? { pendientes: restantes, tarjetaId: null, esperandoTarjeta: true } : null);
      agente.usarSeguimiento(siguiente.texto.replace('{codigo}', detalle.codigo || ''));
    };
    window.addEventListener(EVENTO_PASO_COMPLETADO, alCompletar);
    return () => window.removeEventListener(EVENTO_PASO_COMPLETADO, alCompletar);
  }, [agente.usarSeguimiento]);

  useEffect(() => {
    if (agente.mensajes.length === 0) setPlanActivo(null);
  }, [agente.mensajes.length]);

  const hayConsulta = agente.mensajes.some((m) => m.rol === 'user');
  const sugerenciasDeEntidad =
    agente.usarPantalla && agente.entidadPantalla ? sugerenciasEntidad(agente.entidadPantalla.tipo) : null;
  const preguntasSugeridas = hayConsulta
    ? agente.preguntasSugeridas
    : sugerenciasDeEntidad || sugerenciasPantalla(pathname) || agente.preguntasSugeridas;

  const valor = {
    ...agente,
    preguntasSugeridas,
    hayConsulta,
    pathname,
    panelAbierto,
    abrirPanel,
    cerrarPanel,
    alternarPanel,
    avisosVisibles,
    avisosNuevos,
    globoOculto,
    ocultarGlobo: () => setGloboOculto(true),
    descartarAviso,
    marcarVistos,
    planActivo,
  };

  return <AgentContext.Provider value={valor}>{children}</AgentContext.Provider>;
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentContext debe usarse dentro de <AgentProvider>');
  return ctx;
}
