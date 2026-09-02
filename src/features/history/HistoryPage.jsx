import { Search, Eye, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHistory } from './useHistory';
import { formatearFechaEvento } from './historyService';
import styles from './history.module.css';

function PillAccion({ accion, config }) {
  const cfg = config[accion] ?? {
    label: accion,
    color: '#64748b',
    bg: '#f1f5f9',
    border: '#e2e8f0',
  };
  return (
    <span
      className={styles.pill}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

function ModBadge({ modulo }) {
  return <span className={styles.modBadge}>{modulo}</span>;
}

function AvatarUsuario({ iniciales }) {
  return <div className={styles.avatar} aria-hidden="true">{iniciales}</div>;
}

function KPICard({ label, value, note, color }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue} style={color ? { color } : {}}>{value ?? '—'}</p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  );
}

function DiffLinea({ linea }) {
  if (linea.tipo === 'cambio') {
    return (
      <>
        <div className={`${styles.diffLinea} ${styles.diffRem}`}>
          − {linea.campo}: {linea.antes}
        </div>
        <div className={`${styles.diffLinea} ${styles.diffAdd}`}>
          + {linea.campo}: {linea.despues}
        </div>
      </>
    );
  }
  if (linea.tipo === 'añadido') {
    return (
      <div className={`${styles.diffLinea} ${styles.diffAdd}`}>
        + {linea.campo}: {linea.valor}
      </div>
    );
  }
  if (linea.tipo === 'eliminado') {
    return (
      <div className={`${styles.diffLinea} ${styles.diffRem}`}>
        − {linea.campo}: {linea.valor}
      </div>
    );
  }
  return (
    <div className={`${styles.diffLinea} ${styles.diffNeu}`}>
      &nbsp;&nbsp;{linea.campo}: {linea.valor}
    </div>
  );
}

function EventoDetalleModal({ abierto, evento, cargando, config, onCerrar, calcularDiff }) {
  if (!abierto) return null;

  const diff = evento ? calcularDiff(evento.detalle) : [];
  const fechaFmt = evento ? formatearFechaEvento(evento.fecha) : null;
  const cfgAcc = evento ? config[evento.accion] ?? {} : {};

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del evento"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {evento
              ? `Evento ${evento.id} — ${cfgAcc.label ?? evento.accion} en ${evento.modulo}`
              : 'Detalle del evento'}
          </h2>
          <button onClick={onCerrar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {cargando ? (
            <div className={styles.detalleCargando}>
              <div className={styles.spinner} aria-label="Cargando detalle..." />
              <p>Cargando detalle...</p>
            </div>
          ) : !evento ? (
            <p className={styles.detalleError}>No se pudo cargar el detalle.</p>
          ) : (
            <>
              <div className={styles.detalleGrid}>
                <div className={styles.detalleItem}>
                  <dt>Fecha y hora</dt>
                  <dd>{fechaFmt.fecha} — {fechaFmt.hora}</dd>
                </div>
                <div className={styles.detalleItem}>
                  <dt>Usuario</dt>
                  <dd style={{ fontWeight: 600 }}>{evento.usuario}</dd>
                </div>
                <div className={styles.detalleItem}>
                  <dt>Acción / Módulo</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PillAccion accion={evento.accion} config={config} />
                    <ModBadge modulo={evento.modulo} />
                  </dd>
                </div>
                {evento.detalle?.entidad && (
                  <div className={styles.detalleItem}>
                    <dt>Entidad afectada</dt>
                    <dd className={styles.mono} style={{ fontWeight: 600, color: '#1e3a8a' }}>
                      {evento.modulo === 'Pedidos' ? `Pedido ${evento.detalle.entidad}` : evento.detalle.entidad}
                    </dd>
                  </div>
                )}
                <div className={`${styles.detalleItem} ${styles.detalleItemFull}`}>
                  <dt>Descripción</dt>
                  <dd>{evento.descripcion}</dd>
                </div>
                <div className={styles.detalleItem}>
                  <dt>Resultado</dt>
                  <dd>
                    <span
                      className={styles.pill}
                      style={
                        evento.exitoso
                          ? { color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0' }
                          : { color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }
                      }
                    >
                      {evento.exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                  </dd>
                </div>
              </div>

              {diff.length > 0 && (
                <div className={styles.diffSection}>
                  <p className={styles.diffTitulo}>Cambios registrados</p>
                  <div className={styles.diffBox}>
                    {diff.map((l, i) => (
                      <DiffLinea key={i} linea={l} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Paginacion({ pagina, totalPaginas, totalItems, POR_PAGINA, onAnterior, onSiguiente, onIrA }) {
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * POR_PAGINA + 1;
  const fin = Math.min(pagina * POR_PAGINA, totalItems);

  const paginas = [];
  let desde = Math.max(1, pagina - 2);
  let hasta = Math.min(totalPaginas, pagina + 2);
  if (pagina <= 2) hasta = Math.min(5, totalPaginas);
  if (pagina >= totalPaginas - 1) desde = Math.max(1, totalPaginas - 4);
  for (let i = desde; i <= hasta; i++) paginas.push(i);

  return (
    <div className={styles.paginacion}>
      <p className={styles.paginacionInfo}>
        Mostrando {inicio}–{fin} de {totalItems} eventos
      </p>
      <div className={styles.paginacionBtns}>
        <button
          onClick={onAnterior}
          disabled={pagina === 1}
          className={styles.btnPag}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>

        {desde > 1 && (
          <>
            <button onClick={() => onIrA(1)} className={styles.btnPag}>1</button>
            {desde > 2 && <span className={styles.paginacionEllipsis}>…</span>}
          </>
        )}

        {paginas.map((p) => (
          <button
            key={p}
            onClick={() => onIrA(p)}
            className={`${styles.btnPag} ${p === pagina ? styles.btnPagActivo : ''}`}
            aria-current={p === pagina ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {hasta < totalPaginas && (
          <>
            {hasta < totalPaginas - 1 && <span className={styles.paginacionEllipsis}>…</span>}
            <button onClick={() => onIrA(totalPaginas)} className={styles.btnPag}>
              {totalPaginas}
            </button>
          </>
        )}

        <button
          onClick={onSiguiente}
          disabled={pagina === totalPaginas}
          className={styles.btnPag}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const {
    eventos,
    stats,
    cargando,
    cargandoDet,
    error,
    pagina,
    totalItems,
    totalPaginas,
    POR_PAGINA,
    busqueda,
    filtroAccion,
    filtroModulo,
    filtroRango,
    modalAbierto,
    eventoDetalle,
    ACCIONES,
    MODULOS,
    CONFIG_ACCION,
    RANGOS,
    handleBusqueda,
    handleFiltroAccion,
    handleFiltroModulo,
    handleFiltroRango,
    verDetalle,
    cerrarDetalle,
    calcularDiff,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = useHistory();

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
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Historial de Auditoría</h1>
          <p className={styles.pageSub}>
            Registro de todas las acciones del sistema — EL PRÍNCIPE
          </p>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Resumen de auditoría">
        <KPICard label="Eventos hoy" value={stats?.eventosHoy} note="acciones registradas" />
        <KPICard label="Este mes" value={stats?.eventosMes} note="total de eventos" />
        <KPICard label="Con error" value={stats?.conError} note="eventos fallidos" color="#b91c1c" />
        <KPICard label="Módulo más activo" value={stats?.moduloActivo} note="mayor cantidad de eventos" />
      </section>

      <div className={styles.toolbar} role="search">
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            placeholder="Buscar acción, módulo o usuario..."
            className={styles.searchInput}
            aria-label="Buscar en el historial"
          />
        </div>

        <select
          value={filtroAccion}
          onChange={(e) => handleFiltroAccion(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filtrar por acción"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.map((a) => (
            <option key={a} value={a}>{CONFIG_ACCION[a]?.label ?? a}</option>
          ))}
        </select>

        <select
          value={filtroModulo}
          onChange={(e) => handleFiltroModulo(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filtrar por módulo"
        >
          <option value="">Todos los módulos</option>
          {MODULOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filtroRango}
          onChange={(e) => handleFiltroRango(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filtrar por periodo"
        >
          {RANGOS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <section className={styles.tableCard} aria-label="Registro de auditoría">
        {cargando ? (
          <div className={styles.tablaCargando}>
            <div className={styles.spinner} aria-label="Cargando historial..." />
            <p className={styles.estadoTexto}>Cargando historial...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Sin eventos</p>
            <p className={styles.emptySub}>
              No hay eventos que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Módulo</th>
                  <th>Descripción</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const fechaFmt = formatearFechaEvento(evento.fecha);
                  return (
                    <tr
                      key={evento.id}
                      className={!evento.exitoso ? styles.rowError : ''}
                    >
                      <td>
                        <span className={styles.fechaDia}>{fechaFmt.fecha}</span>
                        <span className={styles.fechaHora}>{fechaFmt.hora}</span>
                      </td>
                      <td>
                        <div className={styles.usuarioCell}>
                          <AvatarUsuario iniciales={evento.iniciales} />
                          <span className={styles.usuarioNombre}>{evento.usuario}</span>
                        </div>
                      </td>
                      <td>
                        <PillAccion accion={evento.accion} config={CONFIG_ACCION} />
                      </td>
                      <td>
                        <ModBadge modulo={evento.modulo} />
                      </td>
                      <td className={styles.tdDescripcion}>
                        {evento.descripcion}
                      </td>
                      <td>
                        <button
                          onClick={() => verDetalle(evento.id)}
                          className={styles.btnDetalle}
                          aria-label={`Ver detalle del evento #${evento.id}`}
                        >
                          <Eye size={13} aria-hidden="true" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Paginacion
              pagina={pagina}
              totalPaginas={totalPaginas}
              totalItems={totalItems}
              POR_PAGINA={POR_PAGINA}
              onAnterior={paginaAnterior}
              onSiguiente={paginaSiguiente}
              onIrA={irAPagina}
            />
          </>
        )}
      </section>

      <EventoDetalleModal
        abierto={modalAbierto}
        evento={eventoDetalle}
        cargando={cargandoDet}
        config={CONFIG_ACCION}
        onCerrar={cerrarDetalle}
        calcularDiff={calcularDiff}
      />
    </div>
  );
}