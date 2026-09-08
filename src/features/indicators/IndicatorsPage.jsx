import { useState } from 'react';
import { AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useIndicators } from './useIndicators';
import { INDICADORES_META } from '../../constants/appConstants';
import NEPPIndicator from './NEPPIndicator';
import PFCCIndicator from './PFCCIndicator';
import NTDCIndicator from './NTDCIndicator';
import styles from './indicators.module.css';

function KPIResumenCard({ sigla, resultado, meta, onVerDetalle }) {
  if (!resultado) return null;
  const { valor, valorFormateado, interpretacion } = resultado;

  let porcentajeBarra = 0;
  if (meta.tipo === 'porcentaje_exito') {
    porcentajeBarra = Math.min(100, Math.max(0, valor));
  } else {
    porcentajeBarra = Math.max(0, 100 - (valor / meta.maxEscala) * 100);
  }

  return (
    <div
      className={styles.kpiCard}
      style={{ borderTop: `3px solid ${meta.color}` }}
    >
      <div className={styles.kpiHeaderRow}>
        <span className={styles.kpiSigla} style={{ color: meta.color }}>{sigla}</span>
        <span
          className={styles.kpiBadgeEstado}
          style={{ color: interpretacion.color, background: interpretacion.bg, border: `1px solid ${interpretacion.border}` }}
        >
          {interpretacion.label}
        </span>
      </div>

      <p className={styles.kpiValor} style={{ color: interpretacion.color }}>
        {valorFormateado}
      </p>

      <p className={styles.kpiNombre}>{meta.nombre}</p>

      <div className={styles.kpiBarBg}>
        <div
          className={styles.kpiBarFill}
          style={{ width: `${porcentajeBarra}%`, background: interpretacion.color }}
          role="progressbar"
          aria-valuenow={Math.round(porcentajeBarra)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className={styles.kpiFooterRow}>
        <span className={styles.kpiMetaText}>
          {meta.metaTexto}
        </span>
        <button
          type="button"
          onClick={() => onVerDetalle(sigla)}
          className={styles.btnVerDetalle}
          style={{ color: meta.color }}
        >
          Ver informe <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function IndicatorPage() {
  const [indicadorActivo, setIndicadorActivo] = useState(null);

  const {
    resultados,
    cargando,
    recalculando,
    error,
    ejecutarRecalculo,
  } = useIndicators();

  if (indicadorActivo === 'NEPP') {
    return <NEPPIndicator onVolver={() => setIndicadorActivo(null)} />;
  }

  if (indicadorActivo === 'PFCC') {
    return <PFCCIndicator onVolver={() => setIndicadorActivo(null)} />;
  }

  if (indicadorActivo === 'NTDC') {
    return <NTDCIndicator onVolver={() => setIndicadorActivo(null)} />;
  }

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando indicadores..." />
        <p className={styles.estadoTexto}>Cargando indicadores comerciales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.estadoCentro}>
        <AlertCircle size={32} className={styles.errorIcon} aria-hidden="true" />
        <p className={styles.estadoTexto}>{error}</p>
      </div>
    );
  }

  const siglas = ['NEPP', 'PFCC', 'NTDC'];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Indicadores comerciales</h1>
          <p className={styles.pageSub}>NEPP · PFCC · NTDC — Panel de control de calidad y efectividad comercial</p>
        </div>
        <button
          onClick={ejecutarRecalculo}
          disabled={recalculando}
          className={styles.btnPrimary}
        >
          <RefreshCw size={14} className={recalculando ? 'animate-spin' : ''} aria-hidden="true" />
          {recalculando ? 'Recalculando...' : 'Recalcular ahora'}
        </button>
      </header>

      <section className={styles.kpiGrid} aria-label="Resumen de indicadores">
        {siglas.map((s) => (
          <KPIResumenCard
            key={s}
            sigla={s}
            resultado={resultados?.[s]}
            meta={INDICADORES_META[s]}
            onVerDetalle={setIndicadorActivo}
          />
        ))}
      </section>

      <section className={styles.tablaResumenSection}>
        <div className={styles.tablaHeader}>
          <h2 className={styles.seccionTitulo}>Consolidado de Indicadores</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={`${styles.datosTabla} responsive-table`}>
            <thead>
              <tr>
                <th>Sigla</th>
                <th>Nombre del Indicador</th>
                <th>Fórmula</th>
                <th>Resultado Actual</th>
                <th>Umbral Meta</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {siglas.map((s) => {
                const res = resultados?.[s];
                const meta = INDICADORES_META[s];
                return (
                  <tr key={s}>
                    <td data-label="Sigla" data-primary><strong style={{ color: meta.color }}>{s}</strong></td>
                    <td data-label="Nombre del Indicador">{meta.nombre}</td>
                    <td data-label="Fórmula"><code>{s === 'NEPP' ? 'TEPP ÷ TPP' : s === 'PFCC' ? '(TCCF ÷ TCCD) × 100' : '(TDCE ÷ TDCT) × 100'}</code></td>
                    <td data-label="Resultado Actual"><strong style={{ color: res?.interpretacion?.color }}>{res ? res.valorFormateado : '—'}</strong></td>
                    <td data-label="Umbral Meta"><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{meta.metaTexto}</span></td>
                    <td data-label="Estado">
                      {res && (
                        <span
                          className={styles.estadoBadge}
                          style={{ color: res.interpretacion.color, background: res.interpretacion.bg, border: `1px solid ${res.interpretacion.border}` }}
                        >
                          {res.interpretacion.label}
                        </span>
                      )}
                    </td>
                    <td data-label="Acción">
                      <button
                        onClick={() => setIndicadorActivo(s)}
                        className={styles.btnSecundarioSmall}
                      >
                        Abrir informe
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}