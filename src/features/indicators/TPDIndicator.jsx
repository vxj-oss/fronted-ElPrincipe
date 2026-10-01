import { ChevronLeft, Download, FileSpreadsheet } from 'lucide-react';
import { useIndicadorDetalle } from './useIndicators';
import { formatearMinutos } from './indicatorsService';
import {
  CargandoView,
  ErrorView,
  SeccionCard,
  DatoCard,
  GraficoLinea,
  GraficoBarras,
} from './NSCIndicator';
import styles from './indicators.module.css';

export default function TPDIndicator({ onVolver }) {
  const {
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
  } = useIndicadorDetalle('TPTD');

  if (cargando) return <CargandoView />;
  if (error || !datos || !umbral) return <ErrorView mensaje={error} />;

  const sinDatos = datos.sinDatos;

  return (
    <div className={styles.detalleWrapper}>
      <button onClick={onVolver} className={styles.backBtn}>
        <ChevronLeft size={14} aria-hidden="true" /> Volver a Indicadores
      </button>

      <div className={styles.detalleMeta}>
        <div>
          <div className={styles.detalleMetaRow}>
            <span className={styles.indNumBadge}>Indicador {def.numero}</span>
            {sinDatos ? (
              <span
                className={styles.estadoBadge}
                style={{ color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
              >
                Sin datos
              </span>
            ) : (
              <span
                className={styles.estadoBadge}
                style={{ color: umbral.color, background: umbral.bg, border: `1px solid ${umbral.border}` }}
              >
                {umbral.label}
              </span>
            )}
          </div>
          <h1 className={styles.detalleTitle}>{def.nombre}</h1>
          <p className={styles.detalleSub}>
            Día actual: {datos.diaActual} · Día anterior: {datos.diaAnterior}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportarExcel} className={styles.exportBtn} disabled={exportando}>
            <FileSpreadsheet size={14} aria-hidden="true" /> {exportando ? 'Generando...' : 'Descargar por pedido (Excel)'}
          </button>
          <button onClick={handleExportar} className={styles.exportBtn}>
            <Download size={14} aria-hidden="true" /> Exportar informe
          </button>
        </div>
      </div>

      <SeccionCard numero="1" titulo="Sección 1: Datos utilizados">
        <div className={styles.datosGrid}>
          <DatoCard
            sigla="TPTD actual"
            nombre="Tiempo promedio de toma de decisión (día actual)"
            valor={datos.tpdActual !== null ? `${formatearMinutos(datos.tpdActual)} min` : '—'}
            desc="Promedio de minutos entre la apertura del registro de cotización y la aprobación del pedido en el día actual"
            desglose={[{ label: datos.diaActual, valor: datos.tpdActual !== null ? `${formatearMinutos(datos.tpdActual)} min` : '—' }]}
          />
          <DatoCard
            sigla="TPTD general"
            nombre="Promedio histórico general"
            valor={datos.tpdGeneral !== null ? `${formatearMinutos(datos.tpdGeneral)} min` : '—'}
            desc="Promedio de respaldo usado cuando no hay pedidos aprobados vinculados a una cotización en el día actual"
            desglose={[{ label: 'Histórico', valor: datos.tpdGeneral !== null ? `${formatearMinutos(datos.tpdGeneral)} min` : '—' }]}
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 12, lineHeight: 1.5 }}>
          Nota: la auditoría del agente de IA agrega unos segundos de espera al guardar la cotización y el pedido. 
        </p>
      </SeccionCard>

      <SeccionCard numero="2" titulo="Sección 2: Resultado del indicador">
        <div className={styles.resultadoGrid}>
          <div
            className={styles.resultadoCard}
            style={{ background: sinDatos ? '#f1f5f9' : umbral.bg, border: `1px solid ${sinDatos ? '#e2e8f0' : umbral.border}` }}
          >
            <p className={styles.resLabel}>Resultado</p>
            <p className={styles.resValor} style={{ color: sinDatos ? '#64748b' : umbral.color }}>
              {sinDatos ? '—' : `${formatearMinutos(valor)} min`}
            </p>
            <p className={styles.resUnidad}>minutos promedio entre la apertura del registro de cotización y la aprobación del pedido{datos.usaHistorico ? ' (sin aprobaciones hoy: se muestra el promedio histórico)' : ''}</p>
          </div>

          <div className={styles.interpCard}>
            <p className={styles.resLabel}>Interpretación</p>
            <p
              className={styles.interpTexto}
              dangerouslySetInnerHTML={{ __html: interpretacion }}
            />
          </div>

          <div className={styles.estadoCard}>
            <p className={styles.resLabel}>Estado del indicador</p>
            <div className={styles.estadoBadgeCenter}>
              {sinDatos ? (
                <span
                  className={styles.estadoBadge}
                  style={{ color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                >
                  Sin datos
                </span>
              ) : (
                <span
                  className={styles.estadoBadge}
                  style={{ color: umbral.color, background: umbral.bg, border: `1px solid ${umbral.border}` }}
                >
                  {umbral.label}
                </span>
              )}
            </div>
            <div className={styles.umbralList}>
              {def.umbrales.map((u) => (
                <div key={u.nivel} className={styles.umbralRow}>
                  <span className={styles.umbralNombre}>
                    <span className={styles.umbralDot} style={{ background: u.color }} />
                    {u.label}{!sinDatos && u.nivel === umbral.nivel ? ' —' : ''}
                  </span>
                  <span className={styles.umbralRango}>{u.rango}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SeccionCard>

      <SeccionCard numero="3" titulo="Sección 3: Dashboard del indicador">
        <div className={styles.dashGrid}>
          <GraficoLinea
            titulo="Evolución del tiempo de toma de decisión por día (histórico)"
            labels={datos.serieLabels}
            data={datos.serieValores}
            color="#085041"
          />
          <GraficoBarras
            titulo="Día actual vs. día anterior"
            labels={datos.comparativoLabels}
            data={datos.comparativoValores}
            color="#085041"
          />
          <DatoCard
            sigla="Comparativo"
            nombre="Tiempo de decisión (día actual vs. general)"
            valor={sinDatos ? '—' : `${formatearMinutos(valor)} min`}
            desc="Referencia entre el promedio del día actual y el promedio histórico"
            desglose={[
              { label: 'Día actual', valor: datos.tpdActual !== null ? `${formatearMinutos(datos.tpdActual)} min` : '—' },
              { label: 'Histórico general', valor: datos.tpdGeneral !== null ? `${formatearMinutos(datos.tpdGeneral)} min` : '—' },
            ]}
          />
        </div>

        <div className={styles.bottomGrid} style={{ gridTemplateColumns: '1fr' }}>
          <div
            className={styles.conclusionCard}
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <p className={styles.conclusionTitulo} style={{ color: '#15803d' }}>Conclusión automática</p>
            <p
              className={styles.conclusionTexto}
              style={{ color: '#166534' }}
              dangerouslySetInnerHTML={{ __html: conclusion }}
            />
          </div>
        </div>
      </SeccionCard>
    </div>
  );
}
