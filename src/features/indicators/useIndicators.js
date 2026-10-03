import { useState, useEffect, useCallback } from 'react';
import {
  fetchResumenIndicadores,
  fetchSerieActividadComercial,
  descargarSerieDiariaExcel,
  descargarTPDPorPedidoExcel,
  evaluarUmbral,
  generarInterpretacion,
  generarConclusion,
  INDICADORES_DEF,
  formatearMinutos,
} from './indicatorsService';

const CAMPO_SERIE = {
  NCCA: 'solicitudes',
  NPP: 'pedidos',
  TPTD: 'tiempo_promedio_decision_minutos',
};

function formatearConteo(valor, singular, plural) {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

function mapearSerie(sigla, puntos) {
  const campo = CAMPO_SERIE[sigla];
  return {
    labels: (puntos || []).map((p) => p.label),
    valores: (puntos || []).map((p) => {
      const v = p[campo];
      return v === null || v === undefined ? 0 : parseFloat(v);
    }),
  };
}

export function useIndicadorDetalle(sigla) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sigla) return;
    setCargando(true);
    Promise.all([
      fetchResumenIndicadores(),
      fetchSerieActividadComercial(),
    ])
      .then(([resumen, serie]) => {
        const ind = resumen[sigla];
        if (ind) {
          const serieMapeada = mapearSerie(sigla, serie);
          const n = serieMapeada.valores.length;
          let acumulado = 0;
          const serieAcumulada = serieMapeada.valores.map((v) => (acumulado += v));
          setDatos({
            ...ind.datos,
            valorCalculado: ind.valor,
            serieLabels: serieMapeada.labels,
            serieValores: serieMapeada.valores,
            serieAcumulada,
            sumaAcumulada: acumulado,
            comparativoLabels: n >= 2
              ? [serieMapeada.labels[n - 2], serieMapeada.labels[n - 1]]
              : serieMapeada.labels,
            comparativoValores: n >= 2
              ? [serieMapeada.valores[n - 2], serieMapeada.valores[n - 1]]
              : serieMapeada.valores,
          });
        }
      })
      .catch(() => setError('No se pudo cargar el detalle del indicador.'))
      .finally(() => setCargando(false));
  }, [sigla]);

  const def = INDICADORES_DEF[sigla];
  const valor = datos ? datos.valorCalculado : 0;
  const umbral = def ? evaluarUmbral(valor, def.umbrales) : null;
  const interpretacion = datos && def && umbral ? generarInterpretacion(sigla, valor, datos, umbral) : '';
  const conclusion = datos && def && umbral ? generarConclusion(sigla, valor, datos, umbral) : '';

  const [exportando, setExportando] = useState(false);

  const handleExportar = useCallback(() => {
    window.print();
  }, []);

  const handleExportarExcel = useCallback(async () => {
    if (!sigla) return;
    setExportando(true);
    try {
      if (sigla === 'TPTD') {
        await descargarTPDPorPedidoExcel();
      } else {
        await descargarSerieDiariaExcel(sigla);
      }
    } catch {
      setError('No se pudo descargar el reporte en Excel.');
    } finally {
      setExportando(false);
    }
  }, [sigla]);

  return {
    datos,
    cargando,
    error,
    def,
    valor,
    umbral,
    interpretacion,
    conclusion,
    handleExportar,
    handleExportarExcel,
    exportando,
  };
}

export function useIndicators() {
  const [cargando, setCargando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState('NCCA');
  const [datosReales, setDatosReales] = useState(null);

  const [pasosAbiertos, setPasosAbiertos] = useState({
    NCCA: { 0: true, 1: true, 2: true },
    NPP: { 0: true, 1: true, 2: true },
    TPTD: { 0: true, 1: true, 2: true },
  });

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const resumen = await fetchResumenIndicadores();
      setDatosReales(resumen);
    } catch {
      setError('Error al sincronizar los indicadores comerciales.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const ejecutarRecalculo = useCallback(async () => {
    try {
      setRecalculando(true);
      await cargarDatos();
    } catch {
      setError('No se pudo actualizar los indicadores.');
    } finally {
      setRecalculando(false);
    }
  }, [cargarDatos]);

  const togglePaso = (sigla, idx) => {
    setPasosAbiertos((prev) => ({
      ...prev,
      [sigla]: {
        ...prev[sigla],
        [idx]: !prev[sigla]?.[idx],
      },
    }));
  };

  const construirPasos = (sigla, datos, valor) => {
    const def = INDICADORES_DEF[sigla];
    const umbral = evaluarUmbral(valor, def.umbrales);

    if (sigla === 'NCCA') {
      return [
        {
          titulo: 'Paso 1: Identificación de variables',
          tabla: [
            { dato: 'Cotizaciones día actual (CA)', valor: datos.SA, fuente: `solicitudes_cliente — ${datos.diaActual}` },
            { dato: 'Cotizaciones día anterior (CP)', valor: datos.SP, fuente: `solicitudes_cliente — ${datos.diaAnterior}` },
          ],
        },
        {
          titulo: 'Paso 2: Aplicación de la fórmula',
          calculo: [
            'NCCA = Σ Cotizaciones Atendidas',
            `NCCA (${datos.diaActual}) = ${datos.SA} cotizacion(es)`,
            `Referencia: día anterior (${datos.diaAnterior}) = ${datos.SP} cotizacion(es), variación ${datos.variacionPct > 0 ? '+' : ''}${datos.variacionPct?.toFixed(1) ?? '0.0'}%`,
          ],
        },
        {
          titulo: 'Paso 3: Evaluación y diagnóstico',
          interpretacion: umbral,
          resultado: valor,
          rangoLabel: umbral.rango,
          texto: generarInterpretacion(sigla, valor, datos, umbral),
          tablaDetalle: {
            titulo: 'Comparativo de cotizaciones por día',
            columnas: ['Concepto', 'Cantidad', 'Día'],
            filas: [
              { col1: 'Cotizaciones día actual', col2: `${datos.SA} unid.`, col3: datos.diaActual },
              { col1: 'Cotizaciones día anterior', col2: `${datos.SP} unid.`, col3: datos.diaAnterior },
            ],
          },
        },
      ];
    }

    if (sigla === 'NPP') {
      return [
        {
          titulo: 'Paso 1: Identificación de variables',
          tabla: [
            { dato: 'Pedidos día actual (PA)', valor: datos.PA, fuente: `pedidos — ${datos.diaActual}` },
            { dato: 'Pedidos día anterior (PP)', valor: datos.PP, fuente: `pedidos — ${datos.diaAnterior}` },
          ],
        },
        {
          titulo: 'Paso 2: Aplicación de la fórmula',
          calculo: [
            'NPP = Σ Pedidos Procesados',
            `NPP (${datos.diaActual}) = ${datos.PA} pedido(s)`,
            `Referencia: día anterior (${datos.diaAnterior}) = ${datos.PP} pedido(s), variación ${datos.variacionPct > 0 ? '+' : ''}${datos.variacionPct?.toFixed(1) ?? '0.0'}%`,
          ],
        },
        {
          titulo: 'Paso 3: Evaluación y diagnóstico',
          interpretacion: umbral,
          resultado: valor,
          rangoLabel: umbral.rango,
          texto: generarInterpretacion(sigla, valor, datos, umbral),
          tablaDetalle: {
            titulo: 'Comparativo de pedidos por día',
            columnas: ['Concepto', 'Cantidad', 'Día'],
            filas: [
              { col1: 'Pedidos día actual', col2: `${datos.PA} unid.`, col3: datos.diaActual },
              { col1: 'Pedidos día anterior', col2: `${datos.PP} unid.`, col3: datos.diaAnterior },
            ],
          },
        },
      ];
    }

    return [
      {
        titulo: 'Paso 1: Identificación de variables',
        tabla: [
          { dato: 'Fecha de aprobación del pedido (FP)', valor: '—', fuente: 'pedidos.fecha_aprobacion' },
          { dato: 'Hora de apertura del registro de cotización (FS)', valor: '—', fuente: 'solicitudes_cliente.hora_apertura_modal' },
          { dato: 'Número de pedidos (N)', valor: '—', fuente: 'pedidos aprobados el día actual con cotización vinculada' },
        ],
      },
      {
        titulo: 'Paso 2: Aplicación de la fórmula',
        calculo: datos.sinDatos
          ? ['TPTD = Σ(FP − FS) ÷ N', 'Sin pedidos vinculados a una cotización en el historial disponible']
          : ['TPTD = Σ(FP − FS) ÷ N', `TPTD (${datos.diaActual}) = ${formatearMinutos(valor)} minutos`],
      },
      {
        titulo: 'Paso 3: Evaluación y diagnóstico',
        interpretacion: umbral,
        resultado: valor,
        rangoLabel: umbral.rango,
        texto: generarInterpretacion(sigla, valor, datos, umbral),
        tablaDetalle: {
          titulo: 'Referencia de tiempos de decisión',
          columnas: ['Concepto', 'Valor', 'Día'],
          filas: [
            {
              col1: 'Tiempo promedio (día actual)',
              col2: datos.tpdActual !== null ? `${formatearMinutos(datos.tpdActual)} min` : '—',
              col3: datos.diaActual,
            },
            {
              col1: 'Promedio histórico general',
              col2: datos.tpdGeneral !== null ? `${formatearMinutos(datos.tpdGeneral)} min` : '—',
              col3: 'Histórico',
            },
          ],
        },
      },
    ];
  };

  const resultados = datosReales
    ? {
      NCCA: {
        valor: datosReales.NCCA.valor,
        valorFormateado: formatearConteo(datosReales.NCCA.valor, 'cotización', 'cotizaciones'),
        interpretacion: evaluarUmbral(datosReales.NCCA.valor, INDICADORES_DEF.NCCA.umbrales),
        pasos: construirPasos('NCCA', datosReales.NCCA.datos, datosReales.NCCA.valor),
      },
      NPP: {
        valor: datosReales.NPP.valor,
        valorFormateado: formatearConteo(datosReales.NPP.valor, 'pedido', 'pedidos'),
        interpretacion: evaluarUmbral(datosReales.NPP.valor, INDICADORES_DEF.NPP.umbrales),
        pasos: construirPasos('NPP', datosReales.NPP.datos, datosReales.NPP.valor),
      },
      TPTD: {
        valor: datosReales.TPTD.valor,
        valorFormateado: datosReales.TPTD.datos.sinDatos ? '—' : `${formatearMinutos(datosReales.TPTD.valor)} min`,
        sinDatos: datosReales.TPTD.datos.sinDatos,
        interpretacion: evaluarUmbral(datosReales.TPTD.valor, INDICADORES_DEF.TPTD.umbrales),
        pasos: construirPasos('TPTD', datosReales.TPTD.datos, datosReales.TPTD.valor),
      },
    }
    : null;

  return {
    resultados,
    cargando,
    recalculando,
    error,
    tabActivo,
    setTabActivo,
    pasosAbiertos,
    togglePaso,
    ejecutarRecalculo,
  };
}

export default useIndicators;
