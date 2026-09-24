import { useState, useEffect, useCallback } from 'react';
import {
  fetchEventos,
  fetchEstadisticas,
  eliminarEventosPorRango,
  ACCIONES,
  MODULOS,
  CONFIG_ACCION,
} from './historyService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useAuth } from '../../context/AuthContext';

const RANGOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
];

const POR_PAGINA = 7;
const POR_PAGINA_MOVIL = 2;

export function useHistory() {
  const { user: usuarioActual } = useAuth();
  const esMovilVertical = useMediaQuery('(max-width: 768px)');
  const porPagina = esMovilVertical ? POR_PAGINA_MOVIL : POR_PAGINA;
  const [eventos, setEventos] = useState([]);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDet, setCargandoDet] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [modalPurgaAbierto, setModalPurgaAbierto] = useState(false);
  const [purgaDesde, setPurgaDesde] = useState('');
  const [purgaHasta, setPurgaHasta] = useState('');
  const [purgaError, setPurgaError] = useState(null);
  const [purgando, setPurgando] = useState(false);

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
  const [recargaTick, setRecargaTick] = useState(0);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    fetchEstadisticas()
      .then(setStats)
      .catch(() => {});
  }, [recargaTick]);

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
  }, [busquedaDebounced, filtroAccion, filtroModulo, filtroRango, pagina, porPagina, recargaTick]);

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

  const abrirPurga = useCallback(() => {
    setPurgaDesde('');
    setPurgaHasta('');
    setPurgaError(null);
    setModalPurgaAbierto(true);
  }, []);

  const cerrarPurga = useCallback(() => {
    if (purgando) return;
    setModalPurgaAbierto(false);
  }, [purgando]);

  const confirmarPurga = useCallback(async () => {
    if (!purgaDesde || !purgaHasta) {
      setPurgaError('Selecciona ambas fechas del rango a eliminar.');
      return;
    }
    if (purgaDesde > purgaHasta) {
      setPurgaError("La fecha 'desde' no puede ser posterior a 'hasta'.");
      return;
    }
    setPurgando(true);
    setPurgaError(null);
    try {
      const res = await eliminarEventosPorRango(purgaDesde, purgaHasta);
      setToastMsg({ tipo: 'success', texto: res?.message || 'Historial eliminado.' });
      setModalPurgaAbierto(false);
      setPagina(1);
      setRecargaTick((t) => t + 1);
    } catch (err) {
      setPurgaError(err.message || 'No se pudo eliminar el historial en ese rango.');
    } finally {
      setPurgando(false);
    }
  }, [purgaDesde, purgaHasta]);

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
    toastMsg,
    esAdmin: !!usuarioActual?.esAdmin,
    modalPurgaAbierto,
    purgaDesde,
    purgaHasta,
    purgaError,
    purgando,
    setPurgaDesde,
    setPurgaHasta,
    abrirPurga,
    cerrarPurga,
    confirmarPurga,
  };
}