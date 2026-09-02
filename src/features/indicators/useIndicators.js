import { useState, useEffect, useCallback } from 'react';
import {
  fetchResumenIndicadores,
  fetchIndicatorHistory,
  fetchIndicatorDaily,
  fetchIndicatorWeekly,
  fetchIndicatorMonthly,
  calculateIndicators,
  evaluarUmbral,
  generarInterpretacion,
  generarConclusion,
  INDICADORES_DEF,
} from './indicatorsService';

const CAMPO_VALOR = {
  NEPP: 'valor_nepp',
  PFCC: 'valor_pfcc',
  NTDC: 'valor_ntdc',
};

function mapearSeriePeriodo(sigla, puntos) {
  const campo = CAMPO_VALOR[sigla];
  return {
    labels: (puntos || []).map((p) => p.label),
    valores: (puntos || []).map((p) => parseFloat(p[campo] || 0)),
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
      fetchIndicatorDaily(),
      fetchIndicatorWeekly(),
      fetchIndicatorMonthly(),
    ])
      .then(([resumen, diario, semanal, mensual]) => {
        const ind = resumen[sigla];
        if (ind) {
          const serieDiaria = mapearSeriePeriodo(sigla, diario);
          const serieSemanal = mapearSeriePeriodo(sigla, semanal);
          const serieMensual = mapearSeriePeriodo(sigla, mensual);
          setDatos({
            ...ind.datos,
            valorCalculado: ind.valor,
            labelsDiario: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            historicoDiario: serieDiaria.valores,
            labelsSemanal: serieSemanal.labels,
            historicoSemanal: serieSemanal.valores,
            labelsMensual: serieMensual.labels,
            historicoMensual: serieMensual.valores,
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

  const handleExportar = useCallback(() => {
    window.print();
  }, []);

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
  };
}

export function useIndicators() {
  const [cargando, setCargando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState('NEPP');
  const [datosReales, setDatosReales] = useState(null);
  const [historico, setHistorico] = useState(null);

  const [pasosAbiertos, setPasosAbiertos] = useState({
    NEPP: { 0: true, 1: true, 2: true },
    PFCC: { 0: true, 1: true, 2: true },
    NTDC: { 0: true, 1: true, 2: true },
  });

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [resumen, histLogs] = await Promise.all([
        fetchResumenIndicadores(),
        fetchIndicatorHistory(7),
      ]);

      setDatosReales(resumen);

      const logsOrdenados = [...histLogs].reverse();
      const labels = logsOrdenados.length > 0
        ? logsOrdenados.map((l) => new Date(l.fecha_calculo).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }))
        : ['Actual'];

      const histData = {
        NEPP: labels.map((dia, i) => ({
          dia,
          valor: logsOrdenados[i] ? parseFloat(logsOrdenados[i].valor_nepp || 0) : resumen.NEPP.valor,
        })),
        PFCC: labels.map((dia, i) => ({
          dia,
          valor: logsOrdenados[i] ? parseFloat(logsOrdenados[i].valor_pfcc || 0) : resumen.PFCC.valor,
        })),
        NTDC: labels.map((dia, i) => ({
          dia,
          valor: logsOrdenados[i] ? parseFloat(logsOrdenados[i].valor_ntdc || 0) : resumen.NTDC.valor,
        })),
      };

      setHistorico(histData);
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
      await calculateIndicators('Recálculo manual desde panel');
      await cargarDatos();
    } catch {
      setError('No se pudo ejecutar el recálculo.');
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

    if (sigla === 'NEPP') {
      return [
        {
          titulo: 'Paso 1: Identificación de variables',
          tabla: [
            { dato: 'Ítems con error (TEPP)', valor: datos.TEPP, fuente: 'detalles_pedido.tiene_error' },
            { dato: 'Total de ítems pedidos (TPP)', valor: datos.TPP, fuente: 'detalles_pedido.count' },
          ],
        },
        {
          titulo: 'Paso 2: Aplicación de la fórmula',
          calculo: [
            `NEPP = TEPP ÷ TPP`,
            `NEPP = ${datos.TEPP} ÷ ${datos.TPP}`,
            `NEPP = ${(valor * 100).toFixed(2)}% (${valor.toFixed(4)})`,
          ],
        },
        {
          titulo: 'Paso 3: Evaluación y diagnóstico',
          interpretacion: umbral,
          resultado: valor,
          rangoLabel: umbral.rango,
          texto: generarInterpretacion(sigla, valor, datos, umbral),
          tablaDetalle: {
            titulo: 'Distribución de errores en pedidos',
            columnas: ['Concepto', 'Cantidad', 'Participación'],
            filas: [
              {
                col1: 'Ítems con error detectado',
                col2: `${datos.TEPP} unid.`,
                col3: datos.TPP > 0 ? `${((datos.TEPP / datos.TPP) * 100).toFixed(1)}%` : '0%',
              },
            ],
          },
        },
      ];
    }

    if (sigla === 'PFCC') {
      return [
        {
          titulo: 'Paso 1: Identificación de variables',
          tabla: [
            { dato: 'Condiciones fallidas (TCCF)', valor: datos.TCCF, fuente: 'condiciones_comerciales.tiene_falla' },
            { dato: 'Total condiciones pactadas (TCCD)', valor: datos.TCCD, fuente: 'condiciones_comerciales.count' },
          ],
        },
        {
          titulo: 'Paso 2: Aplicación de la fórmula',
          calculo: [
            `PFCC = (TCCF ÷ TCCD) × 100`,
            `PFCC = (${datos.TCCF} ÷ ${datos.TCCD}) × 100`,
            `PFCC = ${valor.toFixed(2)}%`,
          ],
        },
        {
          titulo: 'Paso 3: Evaluación y diagnóstico',
          interpretacion: umbral,
          resultado: valor,
          rangoLabel: umbral.rango,
          texto: generarInterpretacion(sigla, valor, datos, umbral),
          tablaDetalle: {
            titulo: 'Distribución de fallas en condiciones',
            columnas: ['Concepto', 'Cantidad', 'Participación'],
            filas: [
              {
                col1: 'Condiciones con falla',
                col2: `${datos.TCCF} cond.`,
                col3: datos.TCCD > 0 ? `${((datos.TCCF / datos.TCCD) * 100).toFixed(1)}%` : '0%',
              },
            ],
          },
        },
      ];
    }

    return [
      {
        titulo: 'Paso 1: Identificación de variables',
        tabla: [
          { dato: 'Decisiones efectivas (TDCE)', valor: datos.TDCE, fuente: 'decisiones_comerciales.es_efectiva' },
          { dato: 'Total decisiones evaluadas (TDCT)', valor: datos.TDCT, fuente: 'decisiones_comerciales.count' },
        ],
      },
      {
        titulo: 'Paso 2: Aplicación de la fórmula',
        calculo: [
          `NTDC = (TDCE ÷ TDCT) × 100`,
          `NTDC = (${datos.TDCE} ÷ ${datos.TDCT}) × 100`,
          `NTDC = ${valor.toFixed(2)}%`,
        ],
      },
      {
        titulo: 'Paso 3: Evaluación y diagnóstico',
        interpretacion: umbral,
        resultado: valor,
        rangoLabel: umbral.rango,
        texto: generarInterpretacion(sigla, valor, datos, umbral),
        tablaDetalle: {
          titulo: 'Distribución de efectividad en decisiones',
          columnas: ['Concepto', 'Cantidad', 'Participación'],
          filas: [
            {
              col1: 'Decisiones efectivas',
              col2: `${datos.TDCE} dec.`,
              col3: datos.TDCT > 0 ? `${((datos.TDCE / datos.TDCT) * 100).toFixed(1)}%` : '0%',
            },
          ],
        },
      },
    ];
  };

  const resultados = datosReales
    ? {
      NEPP: {
        valor: datosReales.NEPP.valor,
        valorFormateado: datosReales.NEPP.valor.toFixed(3),
        interpretacion: evaluarUmbral(datosReales.NEPP.valor, INDICADORES_DEF.NEPP.umbrales),
        pasos: construirPasos('NEPP', datosReales.NEPP.datos, datosReales.NEPP.valor),
      },
      PFCC: {
        valor: datosReales.PFCC.valor,
        valorFormateado: `${datosReales.PFCC.valor.toFixed(1)}%`,
        interpretacion: evaluarUmbral(datosReales.PFCC.valor, INDICADORES_DEF.PFCC.umbrales),
        pasos: construirPasos('PFCC', datosReales.PFCC.datos, datosReales.PFCC.valor),
      },
      NTDC: {
        valor: datosReales.NTDC.valor,
        valorFormateado: `${datosReales.NTDC.valor.toFixed(1)}%`,
        interpretacion: evaluarUmbral(datosReales.NTDC.valor, INDICADORES_DEF.NTDC.umbrales),
        pasos: construirPasos('NTDC', datosReales.NTDC.datos, datosReales.NTDC.valor),
      },
    }
    : null;

  return {
    resultados,
    historico,
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