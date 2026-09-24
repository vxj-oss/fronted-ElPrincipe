import React from 'react';
import {
  Plus, Search, Eye, X, MessageSquare,
  CheckCircle, AlertCircle, Trash2,
} from 'lucide-react';
import { useCustomerRequests } from './useCustomerRequests';
import { formatearFecha } from './customerRequestsService';
import { usePagination } from '../../hooks/usePagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';
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

function DetallePanel({ solicitud, onCerrar, onEliminar }) {
  if (!solicitud) return null;

  return (
    <>
    <div className="rt-backdrop" onClick={onCerrar} aria-hidden="true" />
    <aside className={`${styles.detallePanel} rt-drawer`}>
      <div className={styles.detallePanelHeader}>
        <h2 className={styles.detalleTitulo}>{solicitud.codigo}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onEliminar(solicitud.id)}
            className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
            aria-label="Eliminar solicitud"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
          <button onClick={onCerrar} className={styles.btnIcono} aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
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
    </>
  );
}

function ConfirmDeleteModal({ solicitud, guardando, onConfirm, onCancel }) {
  if (!solicitud) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar solicitud</h2>
          <button onClick={onCancel} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.confirmBody}>
          <AlertCircle size={32} className={styles.confirmIcon} aria-hidden="true" />
          <p className={styles.confirmText}>
            ¿Eliminar la solicitud <strong>{solicitud.codigo}</strong> de {solicitud.cliente}? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.btnSecondary}>Cancelar</button>
          <button onClick={onConfirm} disabled={guardando} className={styles.btnDanger}>
            {guardando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
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
    confirmDelete, eliminando, pedirConfirmarEliminar, cancelarEliminar, handleEliminar,
  } = useCustomerRequests();

  const esMovilVertical = useMediaQuery('(max-width: 768px)');

  const {
    itemsPagina: solicitudesPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(solicitudesFiltradas, esMovilVertical ? 2 : 7);

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

        <section className={`${styles.tableCard} rt-flat`}>
          {solicitudesFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={36} color="#94A3B8" />
              <p className={styles.emptyTitle}>Sin solicitudes registradas</p>
              <button onClick={abrirCrear} className={styles.btnPrimary}>
                <Plus size={14} /> Registrar primera solicitud
              </button>
            </div>
          ) : (
            <table className={`${styles.table} responsive-table`}>
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
                  <tr key={s.id} onClick={() => verDetalle(s)} data-estado={s.estado === 'Pendiente' ? 'pendiente' : 'atendida'} data-rownav="" style={{ cursor: 'pointer' }}>
                    <td data-label="Código" data-primary><strong style={{ color: '#1E293B' }}>{s.codigo}</strong></td>
                    <td data-label="Cliente">{s.cliente}</td>
                    <td data-label="Canal">{s.canal}</td>
                    <td data-label="Ítems Solicitados">{s.detalles.length} ítem{s.detalles.length !== 1 ? 's' : ''}</td>
                    <td data-label="Fecha">{formatearFecha(s.fecha)}</td>
                    <td data-label="Estado">
                      <span className={`${styles.pill} ${s.estado === 'Pendiente' ? styles.pillPendiente : styles.pillAtendida}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td data-label="Acción" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => verDetalle(s)} className={styles.btnIcono} title="Ver detalle">
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => pedirConfirmarEliminar(s.id)}
                          className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
                          aria-label={`Eliminar solicitud ${s.codigo}`}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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

      <DetallePanel solicitud={solicitudDetalle} onCerrar={cerrarDetalle} onEliminar={pedirConfirmarEliminar} />

      <ConfirmDeleteModal
        solicitud={solicitudesFiltradas.find((s) => s.id === confirmDelete)}
        guardando={eliminando}
        onConfirm={handleEliminar}
        onCancel={cancelarEliminar}
      />

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