import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboardSummary,
  procesarGraficaDesdePedidos,
} from './dashboardService';
import { METAS_COMERCIALES, PERIODOS_GRAFICA_DASHBOARD } from '../../constants/appConstants';

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
          setGraficaData(procesarGraficaDesdePedidos(summary.pedidos, 'hoy'));
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

  const cambiarPeriodo = useCallback((nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    setGraficaData(procesarGraficaDesdePedidos(pedidosRaw, nuevoPeriodo));
  }, [pedidosRaw]);

  const metaDiaria = METAS_COMERCIALES.META_DIARIA_VENTAS;
  const porcentajeMeta = kpis ? Math.round(((kpis.ventasTotales % metaDiaria) / metaDiaria) * 100) : 0;

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