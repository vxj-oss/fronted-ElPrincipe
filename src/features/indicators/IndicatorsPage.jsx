import { useState } from 'react';
import { AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useIndicators } from './useIndicators';
import { INDICADORES_META } from '../../constants/appConstants';
import NSCIndicator from './NSCIndicator';
import NPIndicator from './NPIndicator';
import TPDIndicator from './TPDIndicator';
import styles from './indicators.module.css';

function KPIResumenCard({ sigla, resultado, meta, onVerDetalle }) {
  if (!resultado) return null;
  const { valor, valorFormateado, interpretacion, sinDatos } = resultado;

  let porcentajeBarra = 0;
  if (sinDatos) {
    porcentajeBarra = 0;
  } else if (meta.tipo === 'porcentaje_exito') {
    porcentajeBarra = Math.min(100, Math.max(0, valor));
  } else if (meta.tipo === 'conteo') {
    porcentajeBarra = Math.min(100, Math.max(0, (valor / meta.maxEscala) * 100));
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
        {sinDatos ? (
          <span
            className={styles.kpiBadgeEstado}
            style={{ color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
          >
            Sin datos
          </span>
        ) : (
          <span
            className={styles.kpiBadgeEstado}
            style={{ color: interpretacion.color, background: interpretacion.bg, border: `1px solid ${interpretacion.border}` }}
          >
            {interpretacion.label}
          </span>
        )}
      </div>

      <p className={styles.kpiValor} style={{ color: sinDatos ? '#64748b' : interpretacion.color }}>
        {valorFormateado}
      </p>

      <p className={styles.kpiNombre}>{meta.nombre}</p>

      <div className={styles.kpiBarBg}>
        <div
          className={styles.kpiBarFill}
          style={{ width: `${porcentajeBarra}%`, background: sinDatos ? '#94a3b8' : interpretacion.color }}
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

  if (indicadorActivo === 'NSC') {
    return <NSCIndicator onVolver={() => setIndicadorActivo(null)} />;
  }

  if (indicadorActivo === 'NPP') {
    return <NPIndicator onVolver={() => setIndicadorActivo(null)} />;
  }

  if (indicadorActivo === 'TPD') {
    return <TPDIndicator onVolver={() => setIndicadorActivo(null)} />;
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

  const siglas = ['NSC', 'NPP', 'TPD'];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Indicadores comerciales</h1>
          <p className={styles.pageSub}>NSC · NPP · TPD — Panel de actividad comercial por día</p>
        </div>
        <button
          onClick={ejecutarRecalculo}
          disabled={recalculando}
          className={styles.btnPrimary}
        >
          <RefreshCw size={14} className={recalculando ? 'animate-spin' : ''} aria-hidden="true" />
          {recalculando ? 'Actualizando...' : 'Recalcular ahora'}
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
                    <td data-label="Fórmula"><code>{s === 'NSC' ? 'Σ Solicitudes Atendidas' : s === 'NPP' ? 'Σ Pedidos Procesados' : 'Σ(FP − FS) ÷ N'}</code></td>
                    <td data-label="Resultado Actual"><strong style={{ color: res?.sinDatos ? '#64748b' : res?.interpretacion?.color }}>{res ? res.valorFormateado : '—'}</strong></td>
                    <td data-label="Umbral Meta"><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{meta.metaTexto}</span></td>
                    <td data-label="Estado">
                      {res && (
                        <span
                          className={styles.estadoBadge}
                          style={res.sinDatos
                            ? { color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0' }
                            : { color: res.interpretacion.color, background: res.interpretacion.bg, border: `1px solid ${res.interpretacion.border}` }}
                        >
                          {res.sinDatos ? 'Sin datos' : res.interpretacion.label}
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