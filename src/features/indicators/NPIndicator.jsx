import { ChevronLeft, Download, FileSpreadsheet } from 'lucide-react';
import { useIndicadorDetalle } from './useIndicators';
import {
  CargandoView,
  ErrorView,
  SeccionCard,
  DatoCard,
  GraficoLinea,
  GraficoBarras,
} from './NSCIndicator';
import styles from './indicators.module.css';

export default function NPIndicator({ onVolver }) {
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
  } = useIndicadorDetalle('NPP');

  if (cargando) return <CargandoView />;
  if (error || !datos || !umbral) return <ErrorView mensaje={error} />;

  return (
    <div className={styles.detalleWrapper}>
      <button onClick={onVolver} className={styles.backBtn}>
        <ChevronLeft size={14} aria-hidden="true" /> Volver a Indicadores
      </button>

      <div className={styles.detalleMeta}>
        <div>
          <div className={styles.detalleMetaRow}>
            <span className={styles.indNumBadge}>Indicador {def.numero}</span>
            <span
              className={styles.estadoBadge}
              style={{ color: umbral.color, background: umbral.bg, border: `1px solid ${umbral.border}` }}
            >
              {umbral.label}
            </span>
          </div>
          <h1 className={styles.detalleTitle}>{def.nombre}</h1>
          <p className={styles.detalleSub}>
            Día actual: {datos.diaActual} · Día anterior: {datos.diaAnterior}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportarExcel} className={styles.exportBtn} disabled={exportando}>
            <FileSpreadsheet size={14} aria-hidden="true" /> {exportando ? 'Generando...' : 'Descargar por día (Excel)'}
          </button>
          <button onClick={handleExportar} className={styles.exportBtn}>
            <Download size={14} aria-hidden="true" /> Exportar informe
          </button>
        </div>
      </div>

      <SeccionCard numero="1" titulo="Sección 1: Datos utilizados">
        <div className={styles.datosGrid}>
          <DatoCard
            sigla="PA"
            nombre="Pedidos día actual"
            valor={datos.PA}
            desc="Pedidos aprobados o entregados y auditados por el agente de IA en el día en curso"
            desglose={[
              { label: datos.diaActual, valor: `${datos.PA} ped.` },
              { label: 'Conformes', valor: `${datos.conformes} ped.` },
              { label: 'Con observaciones', valor: `${datos.conObservaciones} ped.` },
            ]}
          />
          <DatoCard
            sigla="Σ"
            nombre="Acumulado del periodo"
            valor={datos.sumaAcumulada}
            desc="Suma de pedidos procesados en todos los días disponibles del historial (fórmula NPP = Σ Pedidos Procesados)"
            desglose={[{ label: `${datos.serieLabels?.length || 0} día(s) registrados`, valor: `${datos.sumaAcumulada} ped.` }]}
          />
        </div>
      </SeccionCard>

      <SeccionCard numero="2" titulo="Sección 2: Resultado del indicador">
        <div className={styles.resultadoGrid}>
          <div
            className={styles.resultadoCard}
            style={{ background: umbral.bg, border: `1px solid ${umbral.border}` }}
          >
            <p className={styles.resLabel}>Resultado</p>
            <p className={styles.resValor} style={{ color: umbral.color }}>
              {valor}
            </p>
            <p className={styles.resUnidad}>pedidos procesados en el día actual ({datos.diaActual})</p>
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
              <span
                className={styles.estadoBadge}
                style={{ color: umbral.color, background: umbral.bg, border: `1px solid ${umbral.border}` }}
              >
                {umbral.label}
              </span>
            </div>
            <div className={styles.umbralList}>
              {def.umbrales.map((u) => (
                <div key={u.nivel} className={styles.umbralRow}>
                  <span className={styles.umbralNombre}>
                    <span className={styles.umbralDot} style={{ background: u.color }} />
                    {u.label}{u.nivel === umbral.nivel ? ' —' : ''}
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
            titulo="Evolución de pedidos por día (histórico)"
            labels={datos.serieLabels}
            data={datos.serieValores}
            color="#854f0b"
          />
          <GraficoBarras
            titulo="Día actual vs. día anterior"
            labels={datos.comparativoLabels}
            data={datos.comparativoValores}
            color="#854f0b"
          />
          <DatoCard
            sigla="Comparativo"
            nombre="Pedidos por día"
            valor={`${datos.PP} → ${datos.PA}`}
            desc="Referencia visual del día anterior frente al día actual"
            desglose={[
              { label: datos.diaAnterior, valor: `${datos.PP} ped.` },
              { label: datos.diaActual, valor: `${datos.PA} ped.` },
            ]}
          />
          <GraficoBarras
            titulo="Pedidos procesados por día"
            labels={datos.serieLabels}
            data={datos.serieValores}
            color="#854f0b"
          />
          <GraficoLinea
            titulo="Acumulado de pedidos (Σ)"
            labels={datos.serieLabels}
            data={datos.serieAcumulada}
            color="#0f766e"
          />
        </div>

        <div className={styles.bottomGrid} style={{ gridTemplateColumns: '1fr' }}>
          <div
            className={styles.conclusionCard}
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <p className={styles.conclusionTitulo} style={{ color: '#c2410c' }}>Conclusión automática</p>
            <p
              className={styles.conclusionTexto}
              style={{ color: '#92400e' }}
              dangerouslySetInnerHTML={{ __html: conclusion }}
            />
          </div>
        </div>
      </SeccionCard>
    </div>
  );
}
