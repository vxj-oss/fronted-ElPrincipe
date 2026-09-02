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

export default function PFCCIndicator({ onVolver }) {
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
  } = useIndicadorDetalle('PFCC');

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
            sigla="TCCF"
            nombre="Total de condiciones comerciales fallidas"
            valor={datos.TCCF}
            desc="Condiciones con error o inconsistencia detectada"
            desglose={datos.desgloseTCCF.map((d) => ({ label: d.tipo, valor: `${d.cantidad} cond.` }))}
          />
          <DatoCard
            sigla="TCCD"
            nombre="Total de condiciones comerciales definidas"
            valor={datos.TCCD}
            desc="Total de condiciones registradas en el periodo"
            desglose={datos.desgloseTCCD.map((d) => ({ label: d.label, valor: `${d.valor}${d.unidad ? ' ' + d.unidad : ''}` }))}
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
            <p className={styles.resUnidad}>fallas por cada 100 condiciones definidas</p>
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
            titulo="Evolución diaria (PFCC)"
            labels={datos.labelsDiario}
            data={datos.historicoDiario}
            color="#854f0b"
          />
          <GraficoBarras
            titulo="Comparación semanal (PFCC)"
            labels={datos.labelsSemanal}
            data={datos.historicoSemanal}
            color="#854f0b"
          />
          <GraficoLinea
            titulo="Evolución mensual (PFCC)"
            labels={datos.labelsMensual}
            data={datos.historicoMensual}
            color="#854f0b"
          />
        </div>

        <div className={styles.bottomGrid}>
          <GraficoPie
            titulo="Distribución de fallas por tipo"
            labels={datos.desgloseTCCF.map((d) => d.tipo)}
            data={datos.desgloseTCCF.map((d) => d.cantidad)}
            colores={['#854f0b', '#ea580c', '#1E3A8A', '#3b82f6']}
          />
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

        <p className={styles.tablaSubtitulo}>
          Tabla de condiciones con fallas utilizadas en el cálculo (TCCF = {datos.TCCF})
        </p>
        <TablaErrores
          filas={datos.tablaErrores}
          columnas={['N.° Registro', 'Cliente', 'Condición', 'Falla detectada', 'Fecha', 'Vendedor']}
          claves={['numero', 'cliente', 'condicion', 'error', 'fecha', 'vendedor']}
        />
      </SeccionCard>
    </div>
  );
}