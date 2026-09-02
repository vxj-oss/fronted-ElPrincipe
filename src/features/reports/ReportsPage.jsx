import {
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  BarChart2,
  Package,
  Users,
  AlertTriangle,
  FileBarChart,
  FileSpreadsheet,
} from 'lucide-react';
import { useReports } from './useReports';
import { formatearFechaHistorial } from './reportsService';
import styles from './reports.module.css';

const ICONOS_REPORTE = {
  'chart-bar': BarChart2,
  'package': Package,
  'users': Users,
  'alert-triangle': AlertTriangle,
  'report-analytics': FileBarChart,
};

function KPICard({ label, value, note }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const esError = toast.tipo === 'error';
  return (
    <div
      className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`}
      role="status"
    >
      {esError ? (
        <AlertCircle size={14} aria-hidden="true" />
      ) : (
        <CheckCircle size={14} aria-hidden="true" />
      )}
      {toast.texto}
    </div>
  );
}

function TarjetaReporte({ reporte, seleccionado, onSeleccionar, onDescargarDirecto }) {
  const IconoComp = ICONOS_REPORTE[reporte.icono] ?? FileText;
  const esActivo = seleccionado?.id === reporte.id;

  return (
    <div
      className={`${styles.reporteItem} ${esActivo ? styles.reporteItemActivo : ''}`}
      onClick={() => onSeleccionar(reporte)}
      role="button"
      tabIndex={0}
      aria-pressed={esActivo}
      onKeyDown={(e) => e.key === 'Enter' && onSeleccionar(reporte)}
    >
      <div
        className={styles.reporteIcono}
        style={{ background: reporte.colorBg }}
      >
        <IconoComp size={18} style={{ color: reporte.colorIcon }} aria-hidden="true" />
      </div>

      <div className={styles.reporteInfo}>
        <p className={styles.reporteNombre}>{reporte.nombre}</p>
        <p className={styles.reporteDesc}>{reporte.descripcion}</p>
      </div>

      <div className={styles.reporteAcciones} onClick={(e) => e.stopPropagation()}>
        {reporte.formatos.map((fmt) => (
          <button
            key={fmt}
            onClick={() => onDescargarDirecto(reporte.id, fmt)}
            className={`${styles.btnFormato} ${fmt === 'PDF' ? styles.btnFormatoPdf : styles.btnFormatoExcel}`}
            aria-label={`Descargar ${reporte.nombre} en ${fmt}`}
            title={`Descargar ${fmt}`}
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );
}

function BarraProgreso({ progreso, mensaje }) {
  return (
    <div className={styles.progresoWrap} role="status" aria-live="polite">
      <div className={styles.progresoBar}>
        <div
          className={styles.progresoFill}
          style={{ width: `${progreso}%` }}
          role="progressbar"
          aria-valuenow={progreso}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className={styles.progresoTexto}>{mensaje}</p>
    </div>
  );
}

function HistorialItem({ entrada, onReDescargar }) {
  const esPdf = entrada.formato === 'PDF';
  return (
    <div className={styles.histItem}>
      <div
        className={styles.histIcono}
        style={{ background: esPdf ? '#fef2f2' : '#f0fdf4' }}
      >
        {esPdf ? (
          <FileText size={14} style={{ color: '#b91c1c' }} aria-hidden="true" />
        ) : (
          <FileSpreadsheet size={14} style={{ color: '#15803d' }} aria-hidden="true" />
        )}
      </div>

      <div className={styles.histInfo}>
        <p className={styles.histNombre}>{entrada.nombre}</p>
        <p className={styles.histMeta}>
          {formatearFechaHistorial(entrada.fecha)} · {entrada.size}
        </p>
      </div>

      <span className={`${styles.histPill} ${esPdf ? styles.pillPdf : styles.pillExcel}`}>
        {entrada.formato}
      </span>

      <button
        onClick={() => onReDescargar(entrada.reporteId, entrada.formato)}
        className={styles.btnReDescargar}
        aria-label={`Re-descargar ${entrada.nombre}`}
        title="Re-descargar"
      >
        <Download size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const {
    historial,
    kpis,
    cargando,
    toastMsg,
    reporteSeleccionado,
    formatoSeleccionado,
    setFormatoSeleccionado,
    generando,
    progreso,
    mensajeGen,
    REPORTES_CATALOGO,
    setReporteSeleccionado,
    handleGenerar,
  } = useReports();

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando reportes..." />
        <p className={styles.estadoTexto}>Cargando módulo de reportes...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toast toast={toastMsg} />

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reportes</h1>
          <p className={styles.pageSub}>
            Exportación de datos oficial — EL PRÍNCIPE
          </p>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Resumen de reportes">
        <KPICard
          label="Reportes generados"
          value={kpis.totalMes}
          note="este mes"
        />
        <KPICard
          label="Último reporte"
          value={
            kpis.ultimoReporte
              ? formatearFechaHistorial(kpis.ultimoReporte.fecha)
              : '—'
          }
          note={kpis.ultimoReporte?.nombre ?? 'Sin reportes aún'}
        />
        <KPICard
          label="Módulos disponibles"
          value={kpis.modulosActivos}
          note="activos"
        />
      </section>

      <div className={styles.bodyGrid}>
        <section className={styles.card} aria-label="Reportes disponibles">
          <h2 className={styles.cardTitle}>Reportes disponibles</h2>
          <p className={styles.cardSub}>
            Selecciona un reporte y haz clic en el formato deseado
          </p>
          <div className={styles.reportesList}>
            {REPORTES_CATALOGO.map((r) => (
              <TarjetaReporte
                key={r.id}
                reporte={r}
                seleccionado={reporteSeleccionado}
                onSeleccionar={setReporteSeleccionado}
                onDescargarDirecto={handleGenerar}
              />
            ))}
          </div>
        </section>

        <div className={styles.rightPanel}>
          <section className={styles.card} aria-label="Generación de reporte">
            <h2 className={styles.cardTitle}>Descarga de reporte</h2>
            <p className={styles.cardSub}>
              {reporteSeleccionado
                ? `Seleccionado: ${reporteSeleccionado.nombre}`
                : 'Selecciona un reporte'}
            </p>

            <div className={styles.cfgGroup}>
              <label htmlFor="cfg-formato" className={styles.cfgLabel}>
                Formato de exportación
              </label>
              <select
                id="cfg-formato"
                value={formatoSeleccionado}
                onChange={(e) => setFormatoSeleccionado(e.target.value)}
                className={styles.cfgInput}
              >
                <option value="Excel">Excel (.xlsx)</option>
                <option value="PDF">PDF (.pdf)</option>
              </select>
            </div>

            <button
              onClick={() => handleGenerar(reporteSeleccionado?.id, formatoSeleccionado)}
              disabled={generando || !reporteSeleccionado}
              className={styles.btnGenerar}
            >
              <Download size={15} aria-hidden="true" />
              {generando
                ? 'Generando archivo...'
                : `Descargar ${reporteSeleccionado?.nombre || 'Reporte'} (${formatoSeleccionado})`}
            </button>

            {generando && (
              <BarraProgreso progreso={progreso} mensaje={mensajeGen} />
            )}
          </section>

          <section className={styles.card} aria-label="Historial de descargas">
            <div className={styles.cardHeaderRow}>
              <div>
                <h2 className={styles.cardTitle}>Historial de descargas</h2>
                <p className={styles.cardSub}>Archivos descargados en este navegador</p>
              </div>
              <RefreshCw size={14} className={styles.iconRefresh} aria-hidden="true" />
            </div>

            {historial.length === 0 ? (
              <p className={styles.histVacio}>Sin descargas registradas aún.</p>
            ) : (
              <div className={styles.histList}>
                {historial.slice(0, 8).map((h) => (
                  <HistorialItem
                    key={h.id}
                    entrada={h}
                    onReDescargar={(id, fmt) => handleGenerar(id, fmt)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}