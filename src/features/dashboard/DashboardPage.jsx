import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Users,
  Package,
  TriangleAlert,
  FileDown,
  Bot,
  ArrowRight,
  Gauge,
  RefreshCw,
  ChevronDown,
  TrendingDown,
  Send,
  Lightbulb,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentContext } from '../agent/AgentContext';
import { fetchLecturaDashboard } from '../agent/agentService';
import { useDashboard } from './useDashboard';
import { descargarCierreDia } from './dashboardService';
import { descargarArchivo } from '../../utils/descargas';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EMPRESA } from '../../constants/appConstants';
import { saludoLima } from '../../utils/fechas';
import styles from './dashboard.module.css';

function KPICard({ label, value, deltaLabel, icon: Icon, accent }) {
  return (
    <div className={`${styles.kpiCard} ${accent ? styles.kpiAccent : ''}`}>
      <div className={styles.kpiLabel}>
        <Icon size={13} aria-hidden="true" />
        {label}
      </div>
      <div className={styles.kpiValue} style={accent ? { color: '#5433eb' } : {}}>
        {value}
      </div>
      <div className={`${styles.kpiDelta} ${styles.up}`}>
        <TrendingUp size={12} />
        {deltaLabel}
      </div>
    </div>
  );
}

function PreguntarAlAgente({ pregunta, etiqueta = 'Preguntar al agente' }) {
  const { abrirPanel, usarSeguimiento, enviando } = useAgentContext();
  return (
    <button
      type="button"
      className={styles.btnPreguntar}
      disabled={enviando}
      onClick={() => {
        abrirPanel();
        usarSeguimiento(pregunta);
      }}
    >
      <Bot size={13} aria-hidden="true" />
      {etiqueta}
    </button>
  );
}

const ICONOS_LECTURA = {
  ventas: TrendingUp,
  indicadores: Gauge,
  stock: Package,
  recompra: Users,
  seguimiento: Clock,
  anomalias: AlertTriangle,
  pedidos: ClipboardCheck,
};

const FILTROS_LECTURA = [
  { clave: 'todo', etiqueta: 'Todo' },
  { clave: 'urgente', etiqueta: 'Urgente' },
  { clave: 'oportunidades', etiqueta: 'Oportunidades' },
];

function hace(minutos) {
  if (minutos < 1) return 'justo ahora';
  if (minutos === 1) return 'hace 1 min';
  return `hace ${minutos} min`;
}

function LecturaAgente() {
  const navigate = useNavigate();
  const { abrirPanel, usarSeguimiento, enviando } = useAgentContext();
  const [lectura, setLectura] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [filtro, setFiltro] = useState('todo');
  const [consulta, setConsulta] = useState('');
  const [momento, setMomento] = useState(Date.now());
  const [ahora, setAhora] = useState(Date.now());

  const cargar = useCallback(async (forzar = false) => {
    setActualizando(true);
    try {
      const datos = await fetchLecturaDashboard(forzar);
      setLectura(datos);
      setMomento(Date.now());
    } catch {
      return;
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargar(false);
    const intervalo = setInterval(() => {
      if (!document.hidden) cargar(false);
    }, 5 * 60 * 1000);
    const reloj = setInterval(() => setAhora(Date.now()), 30000);
    return () => {
      clearInterval(intervalo);
      clearInterval(reloj);
    };
  }, [cargar]);

  const ejecutar = (accion) => {
    if (accion.tipo === 'enlace') {
      navigate(accion.ruta);
      return;
    }
    abrirPanel();
    usarSeguimiento(accion.texto);
  };

  const preguntar = (e) => {
    e.preventDefault();
    const texto = consulta.trim();
    if (!texto || enviando) return;
    abrirPanel();
    usarSeguimiento(texto);
    setConsulta('');
  };

  const puntos = useMemo(() => {
    const todos = lectura?.puntos || [];
    if (filtro === 'urgente') return todos.filter((p) => p.nivel === 'alta');
    if (filtro === 'oportunidades') return todos.filter((p) => ['recompra', 'por_convertir', 'por_aprobar', 'stock'].includes(p.id));
    return todos;
  }, [lectura, filtro]);

  if (cargando) {
    return (
      <section className={styles.lectura} aria-label="Lectura del agente">
        <p className={styles.lecturaTitulo}><Bot size={15} aria-hidden="true" /> Lectura del agente</p>
        <div className={styles.lecturaEsqueleto} aria-hidden="true">
          <span /><span /><span />
        </div>
      </section>
    );
  }
  if (!lectura?.puntos?.length) return null;

  const minutos = Math.max(0, Math.floor((ahora - momento) / 60000));

  return (
    <section className={styles.lectura} aria-label="Lectura del agente">
      <div className={styles.lecturaCabecera}>
        <div className={styles.lecturaTituloFila}>
          <p className={styles.lecturaTitulo}><Bot size={15} aria-hidden="true" /> Lectura del agente</p>
          {lectura.urgentes > 0 && (
            <span className={styles.lecturaUrgentes}>{lectura.urgentes} {lectura.urgentes === 1 ? 'urgente' : 'urgentes'}</span>
          )}
        </div>
        <div className={styles.lecturaControles}>
          <div className={styles.lecturaFiltros} role="tablist" aria-label="Filtrar lectura">
            {FILTROS_LECTURA.map((f) => (
              <button
                key={f.clave}
                type="button"
                role="tab"
                aria-selected={filtro === f.clave}
                className={`${styles.lecturaFiltro} ${filtro === f.clave ? styles.lecturaFiltroActivo : ''}`}
                onClick={() => setFiltro(f.clave)}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.lecturaRefrescar}
            onClick={() => cargar(true)}
            disabled={actualizando}
            aria-label="Actualizar lectura"
            title={`Actualizada ${hace(minutos)}`}
          >
            <RefreshCw size={13} aria-hidden="true" className={actualizando ? styles.girando : ''} />
            <span>{hace(minutos)}</span>
          </button>
        </div>
      </div>

      {puntos.length === 0 ? (
        <p className={styles.cardSub}>No hay elementos en este filtro.</p>
      ) : (
        <ul className={styles.lecturaLista}>
          {puntos.map((p, i) => {
            const Icono = ICONOS_LECTURA[p.icono] || Bot;
            const expandido = abierto === p.id;
            const hayDetalle = p.detalle?.length > 0;
            return (
              <li
                key={p.id}
                className={`${styles.lecturaItem} ${styles[`lectura_${p.nivel}`] || ''} ${expandido ? styles.lecturaItemAbierto : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={styles.lecturaFila}>
                  <span className={`${styles.lecturaIcono} ${p.nivel === 'alta' ? styles.lecturaPulso : ''}`} aria-hidden="true">
                    {p.icono === 'ventas' && p.tendencia === 'baja' ? <TrendingDown size={15} /> : <Icono size={15} />}
                  </span>
                  <button
                    type="button"
                    className={styles.lecturaCuerpo}
                    onClick={() => hayDetalle && setAbierto(expandido ? null : p.id)}
                    aria-expanded={hayDetalle ? expandido : undefined}
                    disabled={!hayDetalle}
                  >
                    <span className={styles.lecturaCabeza}>
                      <strong>{p.titulo}</strong>
                      {p.valor && <span className={styles.lecturaChip}>{p.valor}</span>}
                    </span>
                    <span className={styles.lecturaTexto}>{p.texto}</span>
                    {p.sugerencia && (
                      <span className={styles.lecturaSugerencia}>
                        <Lightbulb size={12} aria-hidden="true" /> {p.sugerencia}
                      </span>
                    )}
                  </button>
                  <div className={styles.lecturaAcciones}>
                    {p.accion && (
                      <button
                        type="button"
                        className={styles.lecturaBtn}
                        disabled={enviando && p.accion.tipo === 'pregunta'}
                        onClick={() => ejecutar(p.accion)}
                      >
                        {p.accion.etiqueta}
                        <ArrowRight size={12} aria-hidden="true" />
                      </button>
                    )}
                    {hayDetalle && (
                      <button
                        type="button"
                        className={styles.lecturaChevron}
                        onClick={() => setAbierto(expandido ? null : p.id)}
                        aria-label={expandido ? 'Ocultar detalle' : 'Ver detalle'}
                      >
                        <ChevronDown size={16} aria-hidden="true" className={expandido ? styles.chevronArriba : ''} />
                      </button>
                    )}
                  </div>
                </div>
                {expandido && (
                  <ul className={styles.lecturaDetalle}>
                    {p.detalle.map((d) => (
                      <li key={d.texto}>
                        <span className={d.color ? styles[`punto_${d.color}`] : undefined}>{d.texto}</span>
                        {d.accion && (
                          <button type="button" className={styles.lecturaMini} disabled={enviando} onClick={() => ejecutar(d.accion)}>
                            {d.accion.etiqueta}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form className={styles.lecturaPregunta} onSubmit={preguntar}>
        <input
          type="text"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Pregúntale algo al agente sobre tu negocio…"
          aria-label="Pregunta para el agente"
        />
        <button type="submit" disabled={!consulta.trim() || enviando} aria-label="Enviar pregunta">
          <Send size={14} aria-hidden="true" />
        </button>
      </form>
    </section>
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
  const { isDark: temaOscuro } = useTheme();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    import('chart.js').then(({ Chart, registerables }) => {
      if (cancelado || !canvasRef.current) return;
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const isDark = temaOscuro;
      const gridColor = isDark ? '#2b2b32' : '#ebebeb';
      const tickColor = '#898781';

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: `Ventas ${EMPRESA.MONEDA_SIMBOLO}`,
              data: data.valores,
              backgroundColor: '#5433eb20',
              borderColor: '#5433eb',
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
      cancelado = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, temaOscuro]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardTitle}>Ventas por período</p>
          <p className={styles.cardSub}>{data?.subtitulo}</p>
        </div>
        <div className={styles.cardAcciones}>
        <PreguntarAlAgente
          pregunta={`¿Por qué cambiaron las ventas ${{ hoy: 'hoy', semana: 'esta semana', mes: 'este mes' }[periodo] || 'esta semana'}?`}
        />
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
  const [descargandoCierre, setDescargandoCierre] = useState(false);

  const cerrarDia = async () => {
    setDescargandoCierre(true);
    try {
      await descargarCierreDia();
    } catch {
      return;
    } finally {
      setDescargandoCierre(false);
    }
  };
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
            {saludoLima()}, {user?.nombre_completo || user?.nombre_usuario || 'Asesor'}
          </h1>
          <p className={styles.greetingSub}>
            Resumen comercial
          </p>
        </div>
        <div className={styles.topbarAcciones}>
          <button type="button" className={styles.btnCierre} onClick={cerrarDia} disabled={descargandoCierre}>
            <FileDown size={14} aria-hidden="true" />
            {descargandoCierre ? 'Generando…' : 'Cierre del día (PDF)'}
          </button>
          <span className={styles.dateBadge}>{fechaHoy}</span>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Indicadores clave del día">
        <KPICard
          label="Ventas de hoy"
          value={`${EMPRESA.MONEDA_SIMBOLO} ${(kpis?.ventasHoy || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          deltaLabel={`${kpis?.pedidosConfirmadosHoy || 0} ${kpis?.pedidosConfirmadosHoy === 1 ? 'pedido confirmado' : 'pedidos confirmados'} hoy`}
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
          <div className={styles.cardHeader} style={{ marginBottom: '10px' }}>
            <p className={styles.cardTitle}>Inventario en riesgo</p>
            <PreguntarAlAgente pregunta="¿Qué debo reponer?" etiqueta="Preguntar" />
          </div>
          {stock.length > 0 && (
            <button
              type="button"
              className={styles.btnCierre}
              style={{ marginBottom: '12px' }}
              onClick={() => descargarArchivo('/reports/reposicion/excel', 'lista_reposicion.xlsx').catch(() => {})}
            >
              <FileDown size={14} aria-hidden="true" />
              Lista de reposición (Excel)
            </button>
          )}
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

      <LecturaAgente />

      <section className={styles.metaBar} aria-label="Progreso de meta diaria">
        <div className={styles.metaHeader}>
          <span className={styles.metaLabel}>
            Meta comercial — {porcentajeMeta}% completado
          </span>
          <span className={styles.metaValores}>
            {EMPRESA.MONEDA_SIMBOLO} {Math.min(kpis?.ventasHoy || 0, metaDiaria).toLocaleString('es-PE', { minimumFractionDigits: 2 })} / {EMPRESA.MONEDA_SIMBOLO} {metaDiaria.toLocaleString('es-PE')}
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