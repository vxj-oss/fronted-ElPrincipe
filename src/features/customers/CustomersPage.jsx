import {
  Plus, Search, Pencil, Trash2, AlertCircle,
  CheckCircle, Users, X, Phone, Mail,
  MapPin, CreditCard, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useCustomers, iniciales } from './useCustomers'
import { usePagination } from '../../hooks/usePagination'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import Pagination from '../../components/ui/Pagination'
import CustomerForm from './CustomerForm'
import styles from './customers.module.css'

function Avatar({ nombre, size = 'md' }) {
  const ini = iniciales(nombre)
  return (
    <div className={`${styles.avatar} ${styles[`avatar${size.toUpperCase()}`]}`} aria-hidden="true">
      {ini}
    </div>
  )
}

function PillEstado({ activo }) {
  return activo
    ? <span className={`${styles.pill} ${styles.pillActivo}`}>Activo</span>
    : <span className={`${styles.pill} ${styles.pillInactivo}`}>Inactivo</span>
}

function PillClasif({ clasificacion }) {
  return clasificacion === 'VIP'
    ? <span className={`${styles.pill} ${styles.pillVip}`}>VIP</span>
    : null
}

function KPICard({ label, value, note, color }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue} style={color ? { color } : {}}>{value}</p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const clase = {
    error: styles.toastError,
    warning: styles.toastWarning,
  }[toast.tipo] || styles.toastSuccess
  const Icono = {
    error: AlertCircle,
    warning: AlertCircle,
  }[toast.tipo] || CheckCircle
  return (
    <div className={`${styles.toast} ${clase}`} role="status">
      <Icono size={14} aria-hidden="true" />
      {toast.texto}
    </div>
  )
}

function DetallePanel({ cliente, onCerrar, onEditar }) {
  if (!cliente) return null

  return (
    <>
    <div className={styles.detalleBackdrop} onClick={onCerrar} aria-hidden="true" />
    <aside className={styles.detallePanel} aria-label="Detalle del cliente">
      <div className={styles.detallePanelHeader}>
        <h2 className={styles.detallePanelTitulo}>Detalle</h2>
        <button onClick={onCerrar} className={styles.btnIcono} aria-label="Cerrar detalle">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.detalleAvatar}>
        <Avatar nombre={cliente.nombre} size="LG" />
        <div>
          <p className={styles.detalleNombre}>{cliente.nombre}</p>
          <p className={styles.detalleTipo}>{cliente.tipo}</p>
        </div>
      </div>

      <div className={styles.detalleBadges}>
        <PillEstado activo={cliente.activo} />
        <PillClasif clasificacion={cliente.clasificacion} />
      </div>

      <dl className={styles.detalleGrid}>
        <div className={styles.detalleItem}>
          <dt><CreditCard size={13} aria-hidden="true" /> RUC / DNI</dt>
          <dd className={styles.mono}>{cliente.ruc}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt><MapPin size={13} aria-hidden="true" /> Distrito</dt>
          <dd>{cliente.distrito}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt><Phone size={13} aria-hidden="true" /> Teléfono</dt>
          <dd>{cliente.telefono || '—'}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt><Mail size={13} aria-hidden="true" /> Correo</dt>
          <dd className={styles.detalleEmail}>{cliente.email || '—'}</dd>
        </div>
        <div className={`${styles.detalleItem} ${styles.detalleItemFull}`}>
          <dt><MapPin size={13} aria-hidden="true" /> Dirección</dt>
          <dd>{cliente.direccion || '—'}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Compras totales</dt>
          <dd style={{ color: '#1E3A8A', fontWeight: 600 }}>
            S/ {cliente.comprasTotal.toLocaleString('es-PE')}
          </dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Cliente desde</dt>
          <dd>{new Date(cliente.creadoEn).toLocaleDateString('es-PE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}</dd>
        </div>
      </dl>

      <div className={styles.detallePanelFooter}>
        <button
          onClick={() => onEditar(cliente)}
          className={styles.btnPrimary}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Pencil size={13} aria-hidden="true" />
          Editar cliente
        </button>
      </div>
    </aside>
    </>
  )
}

function ClienteModal({
  abierto, editandoId, form, formErrors, guardando,
  DISTRITOS_TRUJILLO, TIPOS_CLIENTE, CLASIFICACIONES,
  onClose, onChange, onGuardar,
}) {
  if (!abierto) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={editandoId ? 'Editar cliente' : 'Nuevo cliente'}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editandoId ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>

        <CustomerForm
          form={form}
          formErrors={formErrors}
          guardando={guardando}
          editandoId={editandoId}
          DISTRITOS_TRUJILLO={DISTRITOS_TRUJILLO}
          TIPOS_CLIENTE={TIPOS_CLIENTE}
          CLASIFICACIONES={CLASIFICACIONES}
          onChange={onChange}
          onGuardar={onGuardar}
          onCancelar={onClose}
        />
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ clienteId, clientes, onConfirm, onCancel }) {
  if (!clienteId) return null
  const cliente = clientes.find(c => c.id === clienteId)
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar cliente</h2>
          <button onClick={onCancel} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.confirmBody}>
          <AlertCircle size={32} className={styles.confirmIcon} aria-hidden="true" />
          <p className={styles.confirmText}>
            ¿Eliminar a <strong>{cliente?.nombre}</strong> de la cartera? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.btnSecondary}>Cancelar</button>
          <button onClick={onConfirm} className={styles.btnDanger}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const {
    clientesFiltrados,
    kpis,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroDistrito,
    filtroTipo,
    setBusqueda,
    setFiltroDistrito,
    setFiltroTipo,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    clienteDetalle,
    confirmDelete,
    DISTRITOS_TRUJILLO,
    TIPOS_CLIENTE,
    CLASIFICACIONES,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    handleToggleActivo,
    pedirConfirmarEliminar,
    handleEliminar,
    cancelarEliminar,
    verDetalle,
    cerrarDetalle,
  } = useCustomers()

  const esMovilVertical = useMediaQuery('(max-width: 768px)')

  const {
    itemsPagina: clientesPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(clientesFiltrados, esMovilVertical ? 2 : 7)

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando clientes..." />
        <p className={styles.estadoTexto}>Cargando cartera de clientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.estadoCentro}>
        <AlertCircle size={32} className={styles.errorIcon} aria-hidden="true" />
        <p className={styles.estadoTexto}>{error}</p>
      </div>
    )
  }

  return (
    <div className={`${styles.page} ${clienteDetalle ? styles.pageConDetalle : ''}`}>
      <Toast toast={toastMsg} />

      <div className={styles.mainArea}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Clientes</h1>
            <p className={styles.pageSub}>Cartera comercial — Trujillo, La Libertad</p>
          </div>
          <button onClick={abrirCrear} className={styles.btnPrimary}>
            <Plus size={15} aria-hidden="true" />
            Nuevo cliente
          </button>
        </header>

        <section className={styles.kpiGrid} aria-label="Resumen de cartera">
          <KPICard label="Total clientes" value={kpis.total} note="en cartera" />
          <KPICard label="Activos" value={kpis.activos} note="en sistema" color="#1E3A8A" />
          <KPICard label="VIP" value={kpis.vip} note="alto volumen" color="#7e22ce" />
          <KPICard
            label="Compras totales"
            value={`S/ ${kpis.comprasTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`}
            note="acumulado histórico"
          />
        </section>

        <div className={styles.toolbar} role="search">
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o RUC..."
              className={styles.searchInput}
              aria-label="Buscar clientes"
            />
          </div>
          <select
            value={filtroDistrito}
            onChange={e => setFiltroDistrito(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filtrar por distrito"
          >
            <option value="">Todos los distritos</option>
            {DISTRITOS_TRUJILLO.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <section className={styles.tableCard} aria-label="Lista de clientes">
          {clientesFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={36} className={styles.emptyIcon} aria-hidden="true" />
              <p className={styles.emptyTitle}>Sin clientes</p>
              <p className={styles.emptySub}>No hay clientes que coincidan con los filtros aplicados.</p>
              <button onClick={abrirCrear} className={styles.btnPrimary}>
                <Plus size={14} aria-hidden="true" />
                Agregar primer cliente
              </button>
            </div>
          ) : (
            <table className={`${styles.table} responsive-table`}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Cliente</th>
                  <th>RUC / DNI</th>
                  <th>Distrito</th>
                  <th>Compras S/</th>
                  <th>Estado</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPagina.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => verDetalle(c)}
                    data-activo={c.activo ? 'si' : 'no'}
                    data-rownav=""
                    className={clienteDetalle?.id === c.id ? styles.rowActiva : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label=""><Avatar nombre={c.nombre} /></td>
                    <td data-label="Cliente" data-primary>
                      <span className={styles.clienteNombre}>{c.nombre}</span>
                      <span className={styles.clienteSub}>
                        {c.tipo}
                        {c.clasificacion === 'VIP' && <span className={styles.vipBadge}> · VIP</span>}
                      </span>
                    </td>
                    <td data-label="RUC / DNI" className={styles.mono}>{c.ruc}</td>
                    <td data-label="Distrito" className={styles.tdSecundario}>{c.distrito}</td>
                    <td data-label="Compras S/">S/ {c.comprasTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</td>
                    <td data-label="Estado"><PillEstado activo={c.activo} /></td>
                    <td data-label="Activo" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActivo(c.id)}
                        className={styles.toggleBtn}
                        aria-label={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo
                          ? <ToggleRight size={20} style={{ color: '#1E3A8A' }} />
                          : <ToggleLeft size={20} style={{ color: '#94a3b8' }} />
                        }
                      </button>
                    </td>
                    <td data-label="Acciones" onClick={e => e.stopPropagation()}>
                      <div className={styles.acciones}>
                        <button
                          onClick={() => abrirEditar(c)}
                          className={styles.btnIcono}
                          aria-label={`Editar ${c.nombre}`}
                          title="Editar"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => pedirConfirmarEliminar(c.id)}
                          className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
                          aria-label={`Eliminar ${c.nombre}`}
                          title="Eliminar"
                        >
                          <Trash2 size={13} aria-hidden="true" />
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
            etiqueta="clientes"
          />
        </section>
      </div>

      <DetallePanel
        cliente={clienteDetalle}
        onCerrar={cerrarDetalle}
        onEditar={abrirEditar}
      />

      <ClienteModal
        abierto={modalAbierto}
        editandoId={editandoId}
        form={form}
        formErrors={formErrors}
        guardando={guardando}
        DISTRITOS_TRUJILLO={DISTRITOS_TRUJILLO}
        TIPOS_CLIENTE={TIPOS_CLIENTE}
        CLASIFICACIONES={CLASIFICACIONES}
        onClose={cerrarModal}
        onChange={handleFormChange}
        onGuardar={handleGuardar}
      />

      <ConfirmDeleteModal
        clienteId={confirmDelete}
        clientes={clientesFiltrados}
        onConfirm={handleEliminar}
        onCancel={cancelarEliminar}
      />
    </div>
  )
}