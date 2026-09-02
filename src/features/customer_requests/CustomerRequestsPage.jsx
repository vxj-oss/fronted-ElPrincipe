import React from 'react';
import {
  Plus, Search, Eye, X, MessageSquare,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { useCustomerRequests } from './useCustomerRequests';
import { formatearFecha } from './customerRequestsService';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import CustomerRequestForm from './CustomerRequestForm';
import styles from './customerRequests.module.css';

function KPICard({ label, value, note, color }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue} style={color ? { color } : {}}>{value}</p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const esError = toast.tipo === 'error';
  return (
    <div className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`} role="status">
      {esError ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
      {toast.texto}
    </div>
  );
}

function DetallePanel({ solicitud, onCerrar }) {
  if (!solicitud) return null;

  return (
    <aside className={styles.detallePanel}>
      <div className={styles.detallePanelHeader}>
        <h2 className={styles.detalleTitulo}>{solicitud.codigo}</h2>
        <button onClick={onCerrar} className={styles.btnIcono} aria-label="Cerrar">
          <X size={14} />
        </button>
      </div>

      <dl className={styles.detalleGrid}>
        <div className={styles.detalleItem}>
          <dt>Cliente</dt>
          <dd>{solicitud.cliente}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Canal</dt>
          <dd>{solicitud.canal}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Estado</dt>
          <dd>
            <span className={`${styles.pill} ${solicitud.estado === 'Pendiente' ? styles.pillPendiente : styles.pillAtendida}`}>
              {solicitud.estado}
            </span>
          </dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Fecha</dt>
          <dd>{formatearFecha(solicitud.fecha)}</dd>
        </div>
        {solicitud.observaciones && (
          <div className={`${styles.detalleItem} ${styles.detalleItemFull}`}>
            <dt>Mensaje / Transcripción</dt>
            <dd className={styles.obsText}>{solicitud.observaciones}</dd>
          </div>
        )}
      </dl>

      <div className={styles.detalleLineas}>
        <p className={styles.detalleSectionLabel}>Ítems Solicitados</p>
        {solicitud.detalles.map((it, idx) => (
          <div key={idx} className={styles.detalleLinea}>
            <span className={styles.detalleLineaNombre}>{it.nombre}</span>
            <span className={styles.detalleLineaQty}>×{it.cant}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function CustomerRequestsPage() {
  const {
    solicitudesFiltradas, kpis, cargando, guardando, error, toastMsg,
    busqueda, filtroEstado, filtroCanal,
    setBusqueda, setFiltroEstado, setFiltroCanal,
    modalAbierto, form, formErrors, items, solicitudDetalle,
    clientes, productos, CANALES_RECEPCION, ESTADOS_SOLICITUD,
    abrirCrear, cerrarModal, handleFormChange,
    agregarItem, quitarItem,
    cambiarProductoItem, cambiarCantItem, cambiarPrecioItem,
    handleGuardar, verDetalle, cerrarDetalle,
  } = useCustomerRequests();

  const {
    itemsPagina: solicitudesPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(solicitudesFiltradas, 7);

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} />
        <p className={styles.estadoTexto}>Cargando solicitudes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.estadoCentro}>
        <AlertCircle size={32} color="#DC2626" />
        <p className={styles.estadoTexto}>{error}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${solicitudDetalle ? styles.pageConDetalle : ''}`}>
      <Toast toast={toastMsg} />

      <div className={styles.mainArea}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Solicitudes de Clientes</h1>
            <p className={styles.pageSub}>Registro de pedidos entrantes antes de confirmación comercial</p>
          </div>
          <button onClick={abrirCrear} className={styles.btnPrimary}>
            <Plus size={15} /> Nueva Solicitud
          </button>
        </header>

        <section className={styles.kpiGrid}>
          <KPICard label="Total Solicitudes" value={kpis.total} note="registradas" />
          <KPICard label="Pendientes de Pedido" value={kpis.pendientes} note="por auditar" color="#C2410C" />
          <KPICard label="Atendidas" value={kpis.atendidas} note="convertidas a pedido" color="#15803D" />
        </section>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o cliente..."
              className={styles.searchInput}
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_SOLICITUD.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todos los canales</option>
            {CANALES_RECEPCION.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <section className={styles.tableCard}>
          {solicitudesFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={36} color="#94A3B8" />
              <p className={styles.emptyTitle}>Sin solicitudes registradas</p>
              <button onClick={abrirCrear} className={styles.btnPrimary}>
                <Plus size={14} /> Registrar primera solicitud
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Ítems Solicitados</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesPagina.map((s) => (
                  <tr key={s.id} onClick={() => verDetalle(s)} style={{ cursor: 'pointer' }}>
                    <td><strong style={{ color: '#1E293B' }}>{s.codigo}</strong></td>
                    <td>{s.cliente}</td>
                    <td>{s.canal}</td>
                    <td>{s.detalles.length} ítem{s.detalles.length !== 1 ? 's' : ''}</td>
                    <td>{formatearFecha(s.fecha)}</td>
                    <td>
                      <span className={`${styles.pill} ${s.estado === 'Pendiente' ? styles.pillPendiente : styles.pillAtendida}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => verDetalle(s)} className={styles.btnIcono}>
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalItems={totalItems}
            porPagina={porPagina}
            onIrA={irAPagina}
            onAnterior={paginaAnterior}
            onSiguiente={paginaSiguiente}
            etiqueta="solicitudes"
          />
        </section>
      </div>

      <DetallePanel solicitud={solicitudDetalle} onCerrar={cerrarDetalle} />

      {modalAbierto && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva Solicitud de Cliente</h2>
              <button onClick={cerrarModal} className={styles.modalClose}>×</button>
            </div>
            <CustomerRequestForm
              form={form}
              formErrors={formErrors}
              items={items}
              guardando={guardando}
              clientes={clientes}
              productos={productos}
              canales={CANALES_RECEPCION}
              onChange={handleFormChange}
              onGuardar={handleGuardar}
              onCancelar={cerrarModal}
              onAgregarItem={agregarItem}
              onQuitarItem={quitarItem}
              onCambiarProducto={cambiarProductoItem}
              onCambiarCant={cambiarCantItem}
              onCambiarPrecio={cambiarPrecioItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}