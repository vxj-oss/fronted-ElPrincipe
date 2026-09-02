import { useEffect, useRef } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Users,
  Package,
  TriangleAlert,
} from 'lucide-react';
import { useDashboard } from './useDashboard';
import { useAuth } from '../../context/AuthContext';
import { EMPRESA } from '../../constants/appConstants';
import styles from './dashboard.module.css';

function KPICard({ label, value, deltaLabel, icon: Icon, accent }) {
  return (
    <div className={`${styles.kpiCard} ${accent ? styles.kpiAccent : ''}`}>
      <div className={styles.kpiLabel}>
        <Icon size={13} aria-hidden="true" />
        {label}
      </div>
      <div className={styles.kpiValue} style={accent ? { color: '#1E3A8A' } : {}}>
        {value}
      </div>
      <div className={`${styles.kpiDelta} ${styles.up}`}>
        <TrendingUp size={12} />
        {deltaLabel}
      </div>
    </div>
  );
}

function StockItem({ item, porcentaje }) {
  const colorBarra = {
    critico: '#dc2626',
    bajo: '#ea580c',
    ok: '#16a34a',
  }[item.estado] || '#dc2626';

  const pillClase = {
    critico: styles.pillRed,
    bajo: styles.pillAmber,
    ok: styles.pillGreen,
  }[item.estado] || styles.pillRed;

  const etiqueta = { critico: 'Crítico', bajo: 'Bajo', ok: 'OK' }[item.estado] || 'Crítico';

  return (
    <div className={styles.stockItem}>
      <div className={styles.stockInfo}>
        <span className={styles.stockNombre}>{item.nombre}</span>
        <span className={styles.stockQty}>Stock: {item.stock} / Mín: {item.minimo}</span>
      </div>
      <div className={styles.stockBarWrap}>
        <div className={styles.stockBarBg}>
          <div
            className={styles.stockBarFill}
            style={{ width: `${porcentaje}%`, background: colorBarra }}
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
      <span className={`${styles.pill} ${pillClase}`}>{etiqueta}</span>
    </div>
  );
}

function AlertaCard({ alerta }) {
  const claseColor = {
    danger: styles.alertaDanger,
    warning: styles.alertaWarning,
    success: styles.alertaSuccess,
  }[alerta.tipo] || styles.alertaWarning;

  const IconoAlerta = {
    danger: AlertCircle,
    warning: Clock,
    success: CheckCircle,
  }[alerta.tipo] || AlertCircle;

  return (
    <div className={`${styles.alertaCard} ${claseColor}`}>
      <IconoAlerta size={20} aria-hidden="true" className={styles.alertaIcon} />
      <div>
        <p className={styles.alertaTitulo}>{alerta.titulo}</p>
        <p className={styles.alertaCuerpo}>{alerta.cuerpo}</p>
      </div>
    </div>
  );
}

function GraficaVentas({ data, periodo, periodos, onCambiarPeriodo }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const gridColor = isDark ? '#2c2c2a' : '#e1e0d9';
      const tickColor = '#898781';

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: `Ventas ${EMPRESA.MONEDA_SIMBOLO}`,
              data: data.valores,
              backgroundColor: '#1E3A8A20',
              borderColor: '#1E3A8A',
              borderWidth: 1.5,
              borderRadius: { topLeft: 4, topRight: 4 },
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${EMPRESA.MONEDA_SIMBOLO} ${ctx.parsed.y.toLocaleString('es-PE')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: tickColor, font: { size: 11 } },
              border: { color: gridColor },
            },
            y: {
              grid: { color: gridColor, lineWidth: 0.5 },
              ticks: {
                color: tickColor,
                font: { size: 11 },
                callback: (v) => `${EMPRESA.MONEDA_SIMBOLO} ` + (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
              },
              border: { display: false },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardTitle}>Ventas por período</p>
          <p className={styles.cardSub}>{data?.subtitulo}</p>
        </div>
        <div className={styles.tabRow}>
          {periodos.map((p) => (
            <button
              key={p.key}
              onClick={() => onCambiarPeriodo(p.key)}
              className={`${styles.tab} ${periodo === p.key ? styles.tabActive : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.chartWrap}>
        <canvas ref={canvasRef} role="img" aria-label="Gráfico de ventas por período seleccionado">
          Datos de ventas cargando...
        </canvas>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    kpis,
    graficaData,
    stock,
    alertas,
    periodo,
    periodos,
    metaDiaria,
    porcentajeMeta,
    porcentajeStock,
    loading,
    error,
    cambiarPeriodo,
  } = useDashboard();

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (loading) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando dashboard..." />
        <p className={styles.estadoTexto}>Cargando dashboard...</p>
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

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <h1 className={styles.greeting}>
            Buenos días, {user?.nombre_completo || user?.nombre_usuario || 'Asesor'}
          </h1>
          <p className={styles.greetingSub}>
            Resumen comercial — {EMPRESA.NOMBRE}, {EMPRESA.CIUDAD}
          </p>
        </div>
        <span className={styles.dateBadge}>{fechaHoy}</span>
      </header>

      <section className={styles.kpiGrid} aria-label="Indicadores clave del día">
        <KPICard
          label="Ventas totales"
          value={`${EMPRESA.MONEDA_SIMBOLO} ${(kpis?.ventasTotales || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          deltaLabel="acumulado total"
          icon={ShoppingCart}
          accent
        />
        <KPICard
          label="Pedidos registrados"
          value={kpis?.totalPedidos || 0}
          deltaLabel="en sistema"
          icon={Package}
        />
        <KPICard
          label="Cartera clientes"
          value={kpis?.totalClientes || 0}
          deltaLabel="registrados"
          icon={Users}
        />
        <KPICard
          label="Stock bajo mínimo"
          value={kpis?.stockCriticoCount || 0}
          deltaLabel="requieren reposición"
          icon={TriangleAlert}
        />
      </section>

      <section className={styles.mainGrid} aria-label="Ventas y stock">
        {graficaData && (
          <GraficaVentas
            data={graficaData}
            periodo={periodo}
            periodos={periodos}
            onCambiarPeriodo={cambiarPeriodo}
          />
        )}

        <div className={styles.card}>
          <p className={styles.cardTitle} style={{ marginBottom: '14px' }}>
            Inventario en riesgo
          </p>
          <div className={styles.stockList}>
            {stock.length === 0 ? (
              <p className={styles.cardSub}>Todo el inventario está en niveles óptimos.</p>
            ) : (
              stock.map((item) => (
                <StockItem
                  key={item.id}
                  item={item}
                  porcentaje={porcentajeStock(item)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className={styles.metaBar} aria-label="Progreso de meta diaria">
        <div className={styles.metaHeader}>
          <span className={styles.metaLabel}>
            Meta comercial — {porcentajeMeta}% completado
          </span>
          <span className={styles.metaValores}>
            {EMPRESA.MONEDA_SIMBOLO} {((kpis?.ventasTotales || 0) % metaDiaria).toLocaleString('es-PE', { minimumFractionDigits: 2 })} / {EMPRESA.MONEDA_SIMBOLO} {metaDiaria.toLocaleString('es-PE')}
          </span>
        </div>
        <div className={styles.metaTrack}>
          <div
            className={styles.metaFill}
            style={{ width: `${Math.min(100, porcentajeMeta)}%` }}
            role="progressbar"
            aria-valuenow={porcentajeMeta}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </section>

      <section aria-label="Alertas del día">
        <p className={styles.sectionLabel}>Alertas del sistema</p>
        <div className={styles.alertasGrid}>
          {alertas.length === 0 ? (
            <p className={styles.cardSub}>Sin alertas operativas pendientes.</p>
          ) : (
            alertas.map((a) => (
              <AlertaCard key={a.id} alerta={a} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}