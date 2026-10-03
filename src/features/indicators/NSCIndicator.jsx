import { useEffect, useRef } from 'react';
import { ChevronLeft, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useIndicadorDetalle } from './useIndicators';
import { usePagination } from '../../hooks/usePagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Pagination from '../../components/ui/Pagination';
import styles from './indicators.module.css';

export function CargandoView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1E3A8A', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Cargando indicador...</p>
    </div>
  );
}

export function ErrorView({ mensaje }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <AlertCircle size={32} style={{ color: '#dc2626' }} />
      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{mensaje || 'Error al cargar el indicador.'}</p>
    </div>
  );
}

export function SeccionCard({ numero, titulo, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '18px 20px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: '#1E3A8A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
          {numero}
        </div>
        <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#0f172a' }}>{titulo}</span>
      </div>
      {children}
    </div>
  );
}

export function DatoCard({ sigla, nombre, valor, desc, desglose = [] }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '14px 16px' }}>
      <p style={{ fontSize: '0.625rem', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
        {sigla} — {nombre}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 500, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>{valor}</p>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 10 }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {desglose.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>{d.label}</span>
            <span style={{ fontWeight: 500, color: '#0f172a' }}>{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablaErrores({ filas = [], columnas = [], claves = [] }) {
  const esMovilVertical = useMediaQuery('(max-width: 768px)');
  const {
    itemsPagina, pagina, totalPaginas, totalItems, porPagina,
    irAPagina, paginaAnterior, paginaSiguiente,
  } = usePagination(filas, esMovilVertical ? 2 : 7);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {columnas.map((c) => (
                <th key={c} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                  Sin registros para este periodo.
                </td>
              </tr>
            ) : (
              itemsPagina.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {claves.map((k, ci) => (
                    <td key={k} data-label={columnas[ci]} data-primary={ci === 0 ? '' : undefined} style={{ padding: '8px 10px', color: '#0f172a' }}>
                      {f[k]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        pagina={pagina}
        totalPaginas={totalPaginas}
        totalItems={totalItems}
        porPagina={porPagina}
        onIrA={irAPagina}
        onAnterior={paginaAnterior}
        onSiguiente={paginaSiguiente}
        etiqueta="registros"
      />
    </div>
  );
}

export function GraficoLinea({ titulo, labels = [], data = [], color = '#1E3A8A' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const gc = isDark ? '#2c2c2a' : '#e2e8f0';
      const textoMuted = isDark ? '#cbd5e1' : '#334155';
      const superficie = isDark ? '#111827' : '#ffffff';

      const valorFinalPlugin = {
        id: 'valorFinalLinea',
        afterDatasetsDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          const puntos = meta.data;
          if (!puntos || puntos.length === 0) return;
          const idx = puntos.length - 1;
          const valor = chart.data.datasets[0].data[idx];
          if (valor === null || valor === undefined) return;
          const punto = puntos[idx];
          const { ctx } = chart;
          ctx.save();
          ctx.font = '600 11px sans-serif';
          ctx.fillStyle = textoMuted;
          ctx.textAlign = 'center';
          ctx.fillText(String(valor), punto.x, punto.y - 12);
          ctx.restore();
        },
      };

      chartRef.current = new Chart(ref.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: (chartCtx) => {
              const { chart } = chartCtx;
              const { ctx, chartArea } = chart;
              if (!chartArea) return color + '22';
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, color + '40');
              gradient.addColorStop(1, color + '00');
              return gradient;
            },
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 12,
            pointBackgroundColor: color,
            pointBorderColor: superficie,
            pointBorderWidth: 2,
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 22 } },
          animation: { duration: 900, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#020617' : '#1e293b',
              titleColor: '#f8fafc',
              bodyColor: '#f8fafc',
              bodyFont: { size: 12, weight: '600' },
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              caretSize: 5,
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { color: gc } },
            y: { grid: { color: gc, lineWidth: 0.5 }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false }, suggestedMin: 0 },
          },
        },
        plugins: [valorFinalPlugin],
      });
    });
    const handlePrintResize = () => chartRef.current?.resize();
    window.addEventListener('beforeprint', handlePrintResize);
    window.addEventListener('afterprint', handlePrintResize);
    return () => {
      window.removeEventListener('beforeprint', handlePrintResize);
      window.removeEventListener('afterprint', handlePrintResize);
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, color]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: 8 }}>{titulo}</p>
      <div style={{ position: 'relative', height: 170 }}>
        <canvas ref={ref} role="img" aria-label={titulo} />
      </div>
    </div>
  );
}

export function GraficoBarras({ titulo, labels = [], data = [], color = '#1E3A8A' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const gc = isDark ? '#2c2c2a' : '#e2e8f0';
      const textoMuted = isDark ? '#cbd5e1' : '#334155';

      const valoresPlugin = {
        id: 'valoresBarras',
        afterDatasetsDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          const { ctx } = chart;
          ctx.save();
          ctx.font = '600 10px sans-serif';
          ctx.fillStyle = textoMuted;
          ctx.textAlign = 'center';
          meta.data.forEach((barra, i) => {
            const valor = chart.data.datasets[0].data[i];
            if (valor === null || valor === undefined) return;
            ctx.fillText(String(valor), barra.x, barra.y - 6);
          });
          ctx.restore();
        },
      };

      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: (chartCtx) => {
              const { chart } = chartCtx;
              const { ctx, chartArea } = chart;
              if (!chartArea) return color + 'cc';
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, color + 'ee');
              gradient.addColorStop(1, color + '88');
              return gradient;
            },
            borderRadius: 4,
            borderSkipped: 'bottom',
            barPercentage: 0.6,
            categoryPercentage: 0.7,
            hoverBackgroundColor: color,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 22 } },
          animation: { duration: 900, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#020617' : '#1e293b',
              titleColor: '#f8fafc',
              bodyColor: '#f8fafc',
              bodyFont: { size: 12, weight: '600' },
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              caretSize: 5,
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { color: gc } },
            y: { grid: { color: gc, lineWidth: 0.5 }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false }, suggestedMin: 0 },
          },
        },
        plugins: [valoresPlugin],
      });
    });
    const handlePrintResize = () => chartRef.current?.resize();
    window.addEventListener('beforeprint', handlePrintResize);
    window.addEventListener('afterprint', handlePrintResize);
    return () => {
      window.removeEventListener('beforeprint', handlePrintResize);
      window.removeEventListener('afterprint', handlePrintResize);
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, color]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: 8 }}>{titulo}</p>
      <div style={{ position: 'relative', height: 170 }}>
        <canvas ref={ref} role="img" aria-label={titulo} />
      </div>
    </div>
  );
}

export function GraficoPie({ titulo, labels = [], data = [], colores = [] }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(ref.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colores, borderColor: '#fff', borderWidth: 2 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}` } },
          },
        },
      });
    });
    const handlePrintResize = () => chartRef.current?.resize();
    window.addEventListener('beforeprint', handlePrintResize);
    window.addEventListener('afterprint', handlePrintResize);
    return () => {
      window.removeEventListener('beforeprint', handlePrintResize);
      window.removeEventListener('afterprint', handlePrintResize);
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, colores]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: 8 }}>{titulo}</p>
      <div style={{ position: 'relative', height: 140 }}>
        <canvas ref={ref} role="img" aria-label={titulo} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colores[i] || '#94a3b8', flexShrink: 0 }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NSCIndicator({ onVolver }) {
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
  } = useIndicadorDetalle('NCCA');

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
            sigla="SA"
            nombre="Cotizaciones día actual"
            valor={datos.SA}
            desc="Cotizaciones atendidas (hayan derivado o no en pedido) y auditadas por el agente de IA en el día en curso"
            desglose={[
              { label: datos.diaActual, valor: `${datos.SA} solic.` },
              { label: 'Conformes', valor: `${datos.conformes} solic.` },
              { label: 'Con observaciones', valor: `${datos.conObservaciones} solic.` },
            ]}
          />
          <DatoCard
            sigla="Σ"
            nombre="Acumulado del periodo"
            valor={datos.sumaAcumulada}
            desc="Suma de cotizaciones registradas en todos los días disponibles del historial (fórmula NCCA = Σ Cotizaciones Atendidas)"
            desglose={[{ label: `${datos.serieLabels?.length || 0} día(s) registrados`, valor: `${datos.sumaAcumulada} solic.` }]}
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
            <p className={styles.resUnidad}>cotizaciones atendidas en el día actual ({datos.diaActual})</p>
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
            titulo="Evolución de cotizaciones por día (histórico)"
            labels={datos.serieLabels}
            data={datos.serieValores}
            color="#1E3A8A"
          />
          <GraficoBarras
            titulo="Día actual vs. día anterior"
            labels={datos.comparativoLabels}
            data={datos.comparativoValores}
            color="#1E3A8A"
          />
          <DatoCard
            sigla="Comparativo"
            nombre="Cotizaciones por día"
            valor={`${datos.SP} → ${datos.SA}`}
            desc="Referencia visual del día anterior frente al día actual"
            desglose={[
              { label: datos.diaAnterior, valor: `${datos.SP} solic.` },
              { label: datos.diaActual, valor: `${datos.SA} solic.` },
            ]}
          />
          <GraficoBarras
            titulo="Cotizaciones registradas por día"
            labels={datos.serieLabels}
            data={datos.serieValores}
            color="#1E3A8A"
          />
          <GraficoLinea
            titulo="Acumulado de cotizaciones (Σ)"
            labels={datos.serieLabels}
            data={datos.serieAcumulada}
            color="#0f766e"
          />
        </div>

        <div className={styles.bottomGrid} style={{ gridTemplateColumns: '1fr' }}>
          <div
            className={styles.conclusionCard}
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <p className={styles.conclusionTitulo} style={{ color: '#1d4ed8' }}>
              Conclusión automática
            </p>
            <p
              className={styles.conclusionTexto}
              style={{ color: '#1e3a8a' }}
              dangerouslySetInnerHTML={{ __html: conclusion }}
            />
          </div>
        </div>
      </SeccionCard>
    </div>
  );
}
