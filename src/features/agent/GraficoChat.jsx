import { useEffect, useRef, useState } from 'react';
import { FileDown, Image as IconoImagen } from 'lucide-react';
import { descargarCanvasPng, descargarGraficoPdf } from './graficoExport';
import { AccionesChat } from './AnalisisChat';
import styles from './agent.module.css';

const COLORES = ['#5433eb', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

function formatear(valor, prefijo) {
  const numero = Number(valor) || 0;
  return `${prefijo}${numero.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
}

export default function GraficoChat({ datos }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    import('chart.js').then(({ Chart, registerables }) => {
      if (cancelado || !canvasRef.current) return;
      Chart.register(...registerables);

      const oscuro = document.documentElement.classList.contains('dark')
        || document.documentElement.dataset.theme === 'dark';
      const textoColor = oscuro ? '#cbd5e1' : '#64748b';
      const rejillaColor = oscuro ? '#334155' : '#e2e8f0';
      const prefijo = datos.prefijo || '';
      const esDona = datos.grafico === 'doughnut';
      const esLinea = datos.grafico === 'line';
      const horizontal = Boolean(datos.horizontal) && !esDona && !esLinea;

      const datasets = (datos.series || []).map((serie, i) => {
        const color = COLORES[i % COLORES.length];
        if (serie.tipo === 'linea') {
          return {
            type: 'line',
            label: serie.nombre,
            data: serie.valores,
            borderColor: '#16a34a',
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: -1,
          };
        }
        if (esDona) {
          return {
            label: serie.nombre,
            data: serie.valores,
            backgroundColor: datos.labels.map((_, j) => COLORES[j % COLORES.length]),
            borderWidth: 0,
          };
        }
        return {
          label: serie.nombre,
          data: serie.valores,
          backgroundColor: esLinea ? `${color}22` : color,
          borderColor: color,
          borderWidth: esLinea ? 2 : 0,
          borderRadius: esLinea ? 0 : 4,
          tension: 0.3,
          fill: esLinea,
          pointRadius: esLinea ? 3 : 0,
          spanGaps: true,
        };
      });

      chartRef.current = new Chart(canvasRef.current, {
        type: datos.grafico || 'bar',
        data: { labels: datos.labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: horizontal ? 'y' : 'x',
          animation: { duration: 400 },
          plugins: {
            legend: {
              display: esDona || datasets.length > 1,
              position: 'bottom',
              labels: { color: textoColor, boxWidth: 10, font: { size: 11 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${formatear(horizontal ? ctx.parsed.x : ctx.parsed.y ?? ctx.parsed, prefijo)}`,
              },
            },
          },
          scales: esDona
            ? {}
            : {
                [horizontal ? 'y' : 'x']: {
                  grid: { display: false },
                  ticks: { color: textoColor, font: { size: 10 }, maxRotation: 0, autoSkip: !horizontal },
                },
                [horizontal ? 'x' : 'y']: {
                  beginAtZero: true,
                  grid: { color: rejillaColor },
                  ticks: {
                    color: textoColor,
                    font: { size: 10 },
                    callback: (v) => (v >= 1000 ? `${prefijo}${(v / 1000).toFixed(1)}k` : `${prefijo}${v}`),
                  },
                  border: { display: false },
                },
              },
        },
      });
    });

    return () => {
      cancelado = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [datos]);

  return (
    <figure className={styles.grafico}>
      {datos.titulo && <figcaption className={styles.graficoTitulo}>{datos.titulo}</figcaption>}
      <div className={styles.graficoLienzo} style={datos.horizontal ? { height: Math.max(210, 34 * (datos.labels?.length || 0) + 40) } : undefined}>
        <canvas ref={canvasRef} role="img" aria-label={datos.titulo || 'Gráfico'} />
      </div>
      <div className={styles.graficoAcciones}>
        <button
          type="button"
          className={styles.seguimientoBtn}
          onClick={() => descargarGraficoPdf(datos).catch(() => setError('No se pudo generar el PDF.'))}
        >
          <FileDown size={12} aria-hidden="true" /> PDF
        </button>
        <button
          type="button"
          className={styles.seguimientoBtn}
          onClick={() => descargarCanvasPng(canvasRef.current, datos.titulo).catch(() => setError('No se pudo generar la imagen.'))}
        >
          <IconoImagen size={12} aria-hidden="true" /> Imagen
        </button>
      </div>
      {datos.acciones?.length > 0 && <AccionesChat acciones={datos.acciones} />}
      {error && <p className={styles.borradorError}>{error}</p>}
    </figure>
  );
}
