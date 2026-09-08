import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboardSummary,
  procesarGraficaDesdePedidos,
} from './dashboardService';
import { PERIODOS_GRAFICA_DASHBOARD } from '../../constants/appConstants';

export function useDashboard() {
  const [kpis, setKpis] = useState(null);
  const [pedidosRaw, setPedidosRaw] = useState([]);
  const [graficaData, setGraficaData] = useState(null);
  const [stock, setStock] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [periodo, setPeriodo] = useState('hoy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function cargarDatos() {
      setLoading(true);
      setError(null);
      try {
        const summary = await fetchDashboardSummary();
        if (!cancelled) {
          setKpis(summary.kpis);
          setStock(summary.stockAlertas);
          setAlertas(summary.alertas);
          setPedidosRaw(summary.pedidos);
        }
      } catch (err) {
        if (!cancelled) setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargarDatos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setGraficaData(procesarGraficaDesdePedidos(pedidosRaw, periodo));
  }, [pedidosRaw, periodo]);

  const cambiarPeriodo = useCallback((nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
  }, []);

  const metaDiaria = kpis?.metaDiaria || 6000;
  const porcentajeMeta = kpis
    ? Math.min(100, Math.round((kpis.ventasTotales / metaDiaria) * 100))
    : 0;

  function porcentajeStock(item) {
    if (!item.minimo) return 100;
    return Math.min(100, Math.round((item.stock / item.minimo) * 100));
  }

  return {
    kpis,
    graficaData,
    stock,
    alertas,
    periodo,
    periodos: PERIODOS_GRAFICA_DASHBOARD,
    metaDiaria,
    porcentajeMeta,
    porcentajeStock,
    loading,
    error,
    cambiarPeriodo,
  };
}