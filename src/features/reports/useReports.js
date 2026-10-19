import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getHistorialLocal,
  descargarReporteDesdeBackend,
  REPORTES_CATALOGO,
  fetchClientesParaReporte,
} from './reportsService';
import { mesActualLima } from '../../utils/fechas';

export function useReports() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(REPORTES_CATALOGO[0]);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState('Excel');
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensajeGen, setMensajeGen] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    setHistorial(getHistorialLocal());
    setCargando(false);
  }, []);

  useEffect(() => {
    if (!reporteSeleccionado?.requiereCliente || clientes.length > 0) return;
    fetchClientesParaReporte()
      .then(setClientes)
      .catch(() => setToastMsg({ tipo: 'error', texto: 'No se pudo cargar la lista de clientes.' }));
  }, [reporteSeleccionado, clientes.length]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const kpis = useMemo(() => {
    const mesActual = mesActualLima();
    const delMes = historial.filter((h) => h.fecha.startsWith(mesActual));
    const ultimo = historial[0] ?? null;
    return {
      totalMes: delMes.length,
      ultimoReporte: ultimo,
      modulosActivos: REPORTES_CATALOGO.length,
    };
  }, [historial]);

  const handleGenerar = useCallback(async (id = reporteSeleccionado?.id, formato = formatoSeleccionado, clienteIndicado = null) => {
    if (!id) return;

    const rep = REPORTES_CATALOGO.find((r) => r.id === id);
    if (rep) {
      setReporteSeleccionado(rep);
    }
    setFormatoSeleccionado(formato);

    const cliente = clienteIndicado || clienteSeleccionado;
    if (rep?.requiereCliente && !cliente) {
      setToastMsg({ tipo: 'error', texto: 'Elige primero un cliente para descargar su historial.' });
      return;
    }

    setGenerando(true);
    setProgreso(0);
    setMensajeGen('Iniciando...');

    try {
      const entrada = await descargarReporteDesdeBackend(
        { reporteId: id, formato, cliente: rep?.requiereCliente ? cliente : null },
        (pct, msg) => {
          setProgreso(pct);
          setMensajeGen(msg);
        }
      );

      setHistorial((prev) => [entrada, ...prev]);
      setToastMsg({
        tipo: 'success',
        texto: `${entrada.nombre} (${formato}) descargado correctamente.`,
      });
    } catch (err) {
      setToastMsg({
        tipo: 'error',
        texto: err.message || 'Error al descargar el reporte.',
      });
    } finally {
      setTimeout(() => {
        setGenerando(false);
        setProgreso(0);
        setMensajeGen('');
      }, 800);
    }
  }, [reporteSeleccionado, formatoSeleccionado, clienteSeleccionado]);

  return {
    historial,
    kpis,
    cargando,
    toastMsg,
    reporteSeleccionado,
    formatoSeleccionado,
    setFormatoSeleccionado,
    generando,
    progreso,
    mensajeGen,
    REPORTES_CATALOGO,
    setReporteSeleccionado,
    handleGenerar,
    clientes,
    clienteSeleccionado,
    setClienteSeleccionado,
  };
}