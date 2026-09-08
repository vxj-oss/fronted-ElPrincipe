import { useState, useEffect, useCallback } from 'react';
import {
  fetchEventos,
  fetchEstadisticas,
  ACCIONES,
  MODULOS,
  CONFIG_ACCION,
} from './historyService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const RANGOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
];

const POR_PAGINA = 7;
const POR_PAGINA_MOVIL = 2;

export function useHistory() {
  const esMovilVertical = useMediaQuery('(max-width: 768px)');
  const porPagina = esMovilVertical ? POR_PAGINA_MOVIL : POR_PAGINA;
  const [eventos, setEventos] = useState([]);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDet, setCargandoDet] = useState(false);
  const [error, setError] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroRango, setFiltroRango] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const [eventoDetalle, setEventoDetalle] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    fetchEstadisticas()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);

    fetchEventos({
      accion: filtroAccion,
      modulo: filtroModulo,
      rango: filtroRango,
      busqueda: busquedaDebounced,
      pagina,
      porPagina,
    })
      .then((res) => {
        if (!cancelled) {
          setEventos(res.items);
          setTotalItems(res.total);
          setTotalPaginas(res.totalPaginas);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el historial desde el servidor.');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });

    return () => {
      cancelled = true;
    };
  }, [busquedaDebounced, filtroAccion, filtroModulo, filtroRango, pagina, porPagina]);

  const resetPagina = useCallback(() => setPagina(1), []);

  const handleBusqueda = useCallback((v) => {
    setBusqueda(v);
  }, []);

  const handleFiltroAccion = useCallback((v) => {
    setFiltroAccion(v);
    resetPagina();
  }, [resetPagina]);

  const handleFiltroModulo = useCallback((v) => {
    setFiltroModulo(v);
    resetPagina();
  }, [resetPagina]);

  const handleFiltroRango = useCallback((v) => {
    setFiltroRango(v);
    resetPagina();
  }, [resetPagina]);

  const verDetalle = useCallback((evento) => {
    setCargandoDet(false);
    setModalAbierto(true);
    setEventoDetalle(evento || null);
  }, []);

  const cerrarDetalle = useCallback(() => {
    setModalAbierto(false);
    setEventoDetalle(null);
  }, []);

  const irAPagina = useCallback((p) => setPagina(p), []);
  const paginaAnterior = useCallback(() => setPagina((p) => Math.max(1, p - 1)), []);
  const paginaSiguiente = useCallback(
    () => setPagina((p) => Math.min(totalPaginas, p + 1)),
    [totalPaginas]
  );

  const calcularDiff = useCallback((detalle) => {
    if (!detalle || typeof detalle !== 'object') return [];

    const { antes, despues, ...resto } = detalle;

    if (antes !== undefined || despues !== undefined) {
      const keys = [
        ...new Set([
          ...Object.keys(antes ?? {}),
          ...Object.keys(despues ?? {}),
        ]),
      ];

      return keys.map((k) => {
        const a = antes?.[k];
        const b = despues?.[k];
        if (a !== undefined && b !== undefined && a !== b)
          return { tipo: 'cambio', campo: k, antes: String(a), despues: String(b) };
        if (a === undefined)
          return { tipo: 'añadido', campo: k, valor: String(b) };
        if (b === undefined)
          return { tipo: 'eliminado', campo: k, valor: String(a) };
        return { tipo: 'igual', campo: k, valor: String(a) };
      });
    }

    // Filtrar campos redundantes si no hay diff antes/despues
    const camposOmitir = ['entidad', 'descripcion', 'mensaje'];
    return Object.entries(resto)
      .filter(([k]) => !camposOmitir.includes(k))
      .map(([k, v]) => ({
        tipo: 'info',
        campo: k,
        valor: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
  }, []);

  return {
    eventos,
    stats,
    cargando,
    cargandoDet,
    error,
    pagina,
    totalItems,
    totalPaginas,
    POR_PAGINA: porPagina,
    busqueda,
    filtroAccion,
    filtroModulo,
    filtroRango,
    modalAbierto,
    eventoDetalle,
    ACCIONES,
    MODULOS,
    CONFIG_ACCION,
    RANGOS,
    handleBusqueda,
    handleFiltroAccion,
    handleFiltroModulo,
    handleFiltroRango,
    verDetalle,
    cerrarDetalle,
    calcularDiff,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  };
}