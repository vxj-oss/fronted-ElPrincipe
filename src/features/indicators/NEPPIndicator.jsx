import { useEffect, useRef } from 'react';
import { ChevronLeft, Download, AlertCircle } from 'lucide-react';
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
                  Sin registros de incidencias para este periodo.
                </td>
              </tr>
            ) : (
              itemsPagina.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {claves.map((k, ci) => (
                    <td key={k} data-label={columnas[ci]} data-primary={ci === 0 ? '' : undefined} style={{ padding: '8px 10px', color: '#0f172a' }}>
                      {k === 'error' || k === 'resultado' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#fef2f2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 500, border: '1px solid #fecaca' }}>
                          <AlertCircle size={11} aria-hidden="true" />
                          {f[k]}
                        </span>
                      ) : (
                        f[k]
                      )}
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
        etiqueta="incidencias"
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
      chartRef.current = new Chart(ref.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: color + '15',
            borderWidth: 1.5,
            pointRadius: 3,
            pointBackgroundColor: color,
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { color: gc } },
            y: { grid: { color: gc, lineWidth: 0.5 }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => v.toFixed(2) }, border: { display: false }, suggestedMin: 0, suggestedMax: 0.15 },
          },
        },
      });
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, color]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px' }}>
      <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: 8 }}>{titulo}</p>
      <div style={{ position: 'relative', height: 100 }}>
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
      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: color + 'aa',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 3,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { color: gc } },
            y: { grid: { color: gc, lineWidth: 0.5 }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => v.toFixed(2) }, border: { display: false }, suggestedMin: 0, suggestedMax: 0.15 },
          },
        },
      });
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, color]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px' }}>
      <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: 8 }}>{titulo}</p>
      <div style={{ position: 'relative', height: 100 }}>
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
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, colores]);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '12px' }}>
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

export default function NEPPIndicator({ onVolver }) {
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
  } = useIndicadorDetalle('NEPP');

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
            sigla="TEPP"
            nombre="Total de errores en productos pedidos"
            valor={datos.TEPP}
            desc="Ítems con error detectado en el periodo"
            desglose={datos.desgloseTEPP.map((d) => ({ label: d.tipo, valor: `${d.cantidad} unid.` }))}
          />
          <DatoCard
            sigla="TPP"
            nombre="Total de productos pedidos"
            valor={datos.TPP}
            desc="Total de productos registrados en pedidos del periodo"
            desglose={datos.desgloseTPP.map((d) => ({ label: d.label, valor: `${d.valor}${d.unidad ? ' ' + d.unidad : ''}` }))}
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
              {valor.toFixed(3)}
            </p>
            <p className={styles.resUnidad}>errores por producto pedido</p>
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
            titulo="Evolución diaria (NEPP)"
            labels={datos.labelsDiario}
            data={datos.historicoDiario}
            color="#1E3A8A"
          />
          <GraficoBarras
            titulo="Comparación semanal (NEPP)"
            labels={datos.labelsSemanal}
            data={datos.historicoSemanal}
            color="#1E3A8A"
          />
          <GraficoLinea
            titulo="Evolución mensual (NEPP)"
            labels={datos.labelsMensual}
            data={datos.historicoMensual}
            color="#1E3A8A"
          />
        </div>

        <div className={styles.bottomGrid}>
          <GraficoPie
            titulo="Distribución de errores"
            labels={datos.desgloseTEPP.map((d) => d.tipo)}
            data={datos.desgloseTEPP.map((d) => d.cantidad)}
            colores={['#1e3a8a', '#3b82f6', '#ea580c', '#dc2626']}
          />
          <div
            className={styles.conclusionCard}
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <p className={styles.conclusionTitulo} style={{ color: '#c2410c' }}>
              Conclusión automática
            </p>
            <p
              className={styles.conclusionTexto}
              style={{ color: '#92400e' }}
              dangerouslySetInnerHTML={{ __html: conclusion }}
            />
          </div>
        </div>

        <p className={styles.tablaSubtitulo}>
          Tabla de incidencias utilizadas en el cálculo (TEPP = {datos.TEPP})
        </p>
        <TablaErrores
          filas={datos.tablaErrores}
          columnas={['N.° Pedido', 'Cliente', 'Producto', 'Error detectado', 'Fecha', 'Vendedor']}
          claves={['numero', 'cliente', 'producto', 'error', 'fecha', 'vendedor']}
        />
      </SeccionCard>
    </div>
  );
}