import { ChevronLeft, Download } from 'lucide-react';
import { useIndicadorDetalle } from './useIndicators';
import {
  CargandoView,
  ErrorView,
  SeccionCard,
  DatoCard,
  TablaErrores,
  GraficoLinea,
  GraficoBarras,
  GraficoPie,
} from './NEPPIndicator';
import styles from './indicators.module.css';

export default function NTDCIndicator({ onVolver }) {
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
  } = useIndicadorDetalle('NTDC');

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
            Periodo de cálculo: {datos.periodoCalculo} · Actualizado a las {datos.horaActualizacion} hrs.
          </p>
        </div>
        <button onClick={handleExportar} className={styles.exportBtn}>
          <Download size={14} aria-hidden="true" /> Exportar informe
        </button>
      </div>

      <SeccionCard numero="1" titulo="Sección 1: Datos utilizados">
        <div className={styles.datosGrid}>
          <DatoCard
            sigla="TDCE"
            nombre="Total de decisiones comerciales efectivas"
            valor={datos.TDCE}
            desc="Decisiones que derivaron en resultado positivo o correcto"
            desglose={datos.desgloseTDCE.map((d) => ({ label: d.tipo, valor: `${d.cantidad} dec.` }))}
          />
          <DatoCard
            sigla="TDCT"
            nombre="Total de decisiones comerciales tomadas"
            valor={datos.TDCT}
            desc="Total de decisiones registradas en el periodo"
            desglose={datos.desgloseTDCT.map((d) => ({ label: d.label, valor: `${d.valor}${d.unidad ? ' ' + d.unidad : ''}` }))}
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
            <p className={styles.resValor} style={{ color: umbral.color }}>{valor.toFixed(2)}%</p>
            <p className={styles.resUnidad}>decisiones efectivas por cada 100 tomadas</p>
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
            titulo="Evolución diaria (NTDC)"
            labels={datos.labelsDiario}
            data={datos.historicoDiario}
            color="#085041"
          />
          <GraficoBarras
            titulo="Comparación semanal (NTDC)"
            labels={datos.labelsSemanal}
            data={datos.historicoSemanal}
            color="#085041"
          />
          <GraficoLinea
            titulo="Evolución mensual (NTDC)"
            labels={datos.labelsMensual}
            data={datos.historicoMensual}
            color="#085041"
          />
        </div>

        <div className={styles.bottomGrid}>
          <GraficoPie
            titulo="Distribución de decisiones efectivas por tipo"
            labels={datos.desgloseTDCE.map((d) => d.tipo)}
            data={datos.desgloseTDCE.map((d) => d.cantidad)}
            colores={['#085041', '#0d9488', '#1E3A8A', '#3b82f6']}
          />
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

        <p className={styles.tablaSubtitulo}>
          Tabla de decisiones no efectivas utilizadas en el análisis (Total no efectivas = {Math.max(0, datos.TDCT - datos.TDCE)})
        </p>
        <TablaErrores
          filas={datos.tablaErrores}
          columnas={['N.° Decisión', 'Cliente', 'Decisión tomada', 'Resultado', 'Fecha', 'Vendedor']}
          claves={['numero', 'cliente', 'decision', 'resultado', 'fecha', 'vendedor']}
        />
      </SeccionCard>
    </div>
  );
}