import React from 'react';
import {
  Plus, Search, Pencil, Trash2, Eye,
  AlertTriangle, AlertCircle, CheckCircle,
  X, ShoppingBag, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import { useOrders } from './useOrders';
import { calcularTotal, formatearFecha } from './ordersService';
import { EMPRESA } from '../../constants/appConstants';
import { usePagination } from '../../hooks/usePagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import OrderForm from './OrderForm';
import styles from './orders.module.css';

const CONFIG_ESTADO = {
  Borrador: { clase: styles.pillPendiente, label: 'Borrador' },
  Pendiente: { clase: styles.pillPendiente, label: 'Pendiente' },
  Aprobado: { clase: styles.pillConfirmado, label: 'Aprobado' },
  Entregado: { clase: styles.pillEnviado, label: 'Entregado' },
  Cancelado: { clase: styles.pillCancelado, label: 'Cancelado' },
  borrador: { clase: styles.pillPendiente, label: 'Borrador' },
  pendiente: { clase: styles.pillPendiente, label: 'Pendiente' },
  confirmado: { clase: styles.pillConfirmado, label: 'Confirmado' },
  aprobado: { clase: styles.pillConfirmado, label: 'Aprobado' },
  enviado: { clase: styles.pillEnviado, label: 'Enviado' },
  entregado: { clase: styles.pillEnviado, label: 'Entregado' },
  cancelado: { clase: styles.pillCancelado, label: 'Cancelado' },
};

function PillEstado({ estado }) {
  const cfg = CONFIG_ESTADO[estado] ?? CONFIG_ESTADO.Cancelado;
  return <span className={`${styles.pill} ${cfg.clase}`}>{cfg.label}</span>;
}

function PillCondicion({ condicion }) {
  if (!condicion) {
    return <span className={styles.pillPendiente} style={{ fontSize: '11px' }}>Sin auditar</span>;
  }
  if (condicion.tieneFalla) {
    return (
      <span className={styles.pillInactivo} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
        <ShieldAlert size={11} /> Falla CC
      </span>
    );
  }
  return (
    <span className={styles.pillActivo} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
      <ShieldCheck size={11} /> CC OK
    </span>
  );
}

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
  const clase = {
    error: styles.toastError,
    warning: styles.toastWarning,
  }[toast.tipo] || styles.toastSuccess;
  const Icono = {
    error: AlertCircle,
    warning: AlertTriangle,
  }[toast.tipo] || CheckCircle;
  return (
    <div className={`${styles.toast} ${clase}`} role="status">
      <Icono size={14} aria-hidden="true" />
      {toast.texto}
    </div>
  );
}

function DetallePanel({ pedido, onCerrar, onEditar, onConfirmar }) {
  if (!pedido) return null;
  const total = calcularTotal(pedido.items);
  const cond = pedido.condicionComercial;

  return (
    <>
    <div className="rt-backdrop" onClick={onCerrar} aria-hidden="true" />
    <aside className={`${styles.detallePanel} rt-drawer`} aria-label="Detalle del pedido">
      <div className={styles.detallePanelHeader}>
        <h2 className={styles.detalleTitulo}>{pedido.numero}</h2>
        <button onClick={onCerrar} className={styles.btnIcono} aria-label="Cerrar">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {pedido.tieneError && (
        <div className={styles.errorAlert}>
          <AlertTriangle size={14} aria-hidden="true" />
          <div>
            <p className={styles.errorAlertTitulo}>Inconsistencia detectada por IA</p>
            <p className={styles.errorAlertDesc}>{pedido.errDesc}</p>
            {pedido.errores.length > 0 && (
              <div className={styles.errorTags}>
                {pedido.errores.map((e) => (
                  <span key={e} className={styles.errorTag}>{e}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {cond && (
        <div style={{
          margin: '12px 0',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: cond.tieneFalla ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${cond.tieneFalla ? '#FECACA' : '#BBF7D0'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: cond.tieneFalla ? '#B91C1C' : '#15803D',
            fontWeight: 600,
            fontSize: '12px',
            marginBottom: '4px'
          }}>
            {cond.tieneFalla ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            <span>{cond.tieneFalla ? 'Falla en Condición Comercial (Afecta PFCC)' : 'Condición Comercial Conforme'}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: cond.tieneFalla ? '#991B1B' : '#166534', lineHeight: '1.4' }}>
            {cond.motivoFalla || 'Los términos del pedido cumplen estrictamente con la política comercial pactada del cliente.'}
          </p>
        </div>
      )}

      <dl className={styles.detalleGrid}>
        <div className={styles.detalleItem}>
          <dt>Cliente</dt>
          <dd>{pedido.cliente}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Estado</dt>
          <dd><PillEstado estado={pedido.estado} /></dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Fecha</dt>
          <dd>{formatearFecha(pedido.fecha)}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Condición de pago</dt>
          <dd>{pedido.pago}</dd>
        </div>
        <div className={`${styles.detalleItem} ${styles.detalleItemFull}`}>
          <dt>Dirección de entrega</dt>
          <dd>{pedido.direccion || '—'}</dd>
        </div>
        {pedido.observaciones && (
          <div className={`${styles.detalleItem} ${styles.detalleItemFull}`}>
            <dt>Observaciones</dt>
            <dd className={styles.obsText}>{pedido.observaciones}</dd>
          </div>
        )}
      </dl>

      <div className={styles.detalleLineas}>
        <p className={styles.detalleSectionLabel}>Líneas del pedido</p>
        {pedido.items.map((it, i) => (
          <div key={i} className={styles.detalleLinea}>
            <span className={styles.detalleLineaNombre}>{it.producto}</span>
            <span className={styles.detalleLineaQty}>×{it.cant}</span>
            <span className={styles.detalleLineaPrecio}>
              {EMPRESA.MONEDA_SIMBOLO} {(it.cant * it.precio).toFixed(2)}
            </span>
          </div>
        ))}
        <div className={styles.detalleTotalRow}>
          <span>Total del pedido</span>
          <strong style={{ color: '#1E3A8A' }}>
            {EMPRESA.MONEDA_SIMBOLO} {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      <div className={styles.detallePanelFooter}>
        {pedido.estado === 'Pendiente' && (
          <button
            onClick={() => onConfirmar(pedido.id, 'Aprobado')}
            className={styles.btnPrimary}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            <CheckCircle size={13} aria-hidden="true" /> Confirmar pedido
          </button>
        )}
        <button
          onClick={() => onEditar(pedido)}
          className={styles.btnSecondary}
          style={{ width: '100%' }}
        >
          <Pencil size={13} aria-hidden="true" /> Editar
        </button>
      </div>
    </aside>
    </>
  );
}

function AdvertenciaConfirmacionModal({ advertencia, onCancelar }) {
  if (!advertencia) return null;

  return (
    <Modal
      open={Boolean(advertencia)}
      onClose={onCancelar}
      title="No se puede confirmar el pedido"
      size="md"
      footer={
        <Button variant="primary" onClick={onCancelar}>
          Entendido
        </Button>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div style={{ fontSize: '13.5px', lineHeight: '1.5', color: '#374151' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            El pedido <strong>{advertencia.pedido?.numero}</strong> tiene lo siguiente pendiente de corregir antes de poder aprobarlo:
          </p>
          <ul style={{ margin: '0 0 8px 18px', padding: 0 }}>
            {advertencia.riesgos.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p style={{ margin: 0 }}>
            Corrige el pedido y vuelve a intentarlo. Un pedido con errores no puede pasar a "Aprobado".
          </p>
        </div>
      </div>
    </Modal>
  );
}

function PedidoModal({
  abierto, editandoId, form, formErrors, guardando, validandoIA, alertaIA,
  condicionesDelCliente,
  condicionClienteActiva,
  items, totalFormulario,
  clientesCatalogo, productosCatalogo, solicitudesPendientes, estadosPedido, condicionesPago,
  onClose, onChange, onGuardar,
  onAgregarItem, onQuitarItem,
  onCambiarProducto, onCambiarCant, onCambiarPrecio,
}) {
  if (!abierto) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={editandoId ? 'Editar pedido' : 'Nuevo pedido'}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editandoId ? 'Editar pedido' : 'Nuevo pedido'}
          </h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>

        <OrderForm
          form={form}
          formErrors={formErrors}
          items={items}
          totalFormulario={totalFormulario}
          guardando={guardando}
          validandoIA={validandoIA}
          alertaIA={alertaIA}
          condicionesDelCliente={condicionesDelCliente}
          condicionClienteActiva={condicionClienteActiva}
          editandoId={editandoId}
          clientesCatalogo={clientesCatalogo}
          productosCatalogo={productosCatalogo}
          solicitudesPendientes={solicitudesPendientes}
          estadosPedido={estadosPedido}
          condicionesPago={condicionesPago}
          onChange={onChange}
          onGuardar={onGuardar}
          onCancelar={onClose}
          onAgregarItem={onAgregarItem}
          onQuitarItem={onQuitarItem}
          onCambiarProducto={onCambiarProducto}
          onCambiarCant={onCambiarCant}
          onCambiarPrecio={onCambiarPrecio}
        />
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ pedidoId, pedidos, onConfirm, onCancel }) {
  if (!pedidoId) return null;
  const pedido = pedidos.find((p) => p.id === pedidoId);
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar pedido</h2>
          <button onClick={onCancel} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.confirmBody}>
          <AlertCircle size={32} className={styles.confirmIcon} aria-hidden="true" />
          <p className={styles.confirmText}>
            ¿Eliminar el pedido <strong>{pedido?.numero}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.btnSecondary}>Cancelar</button>
          <button onClick={onConfirm} className={styles.btnDanger}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const {
    pedidosFiltrados, kpis, cargando, guardando, validandoIA, error, toastMsg,
    busqueda, filtroEstado, filtroError,
    setBusqueda, setFiltroEstado, setFiltroError,
    modalAbierto, editandoId, form, formErrors,
    items, totalFormulario, alertaIA,
    condicionesDelCliente,
    condicionClienteActiva,
    pedidoDetalle, confirmDelete,
    advertenciaConfirmacion, cerrarAdvertenciaConfirmacion,
    ESTADOS_PEDIDO, estadosPedidoDisponibles, opcionesPagoActivas,
    clientesCatalogo, productosCatalogo, solicitudesPendientes,
    abrirCrear, abrirEditar, cerrarModal,
    handleFormChange, handleGuardar, handleCambiarEstado,
    pedirConfirmarEliminar, handleEliminar, cancelarEliminar,
    agregarItem, quitarItem,
    cambiarProductoItem, cambiarCantItem, cambiarPrecioItem,
    verDetalle, cerrarDetalle,
  } = useOrders();

  const esMovilVertical = useMediaQuery('(max-width: 768px)');

  const {
    itemsPagina: pedidosPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(pedidosFiltrados, esMovilVertical ? 2 : 7);

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando pedidos..." />
        <p className={styles.estadoTexto}>Cargando pedidos...</p>
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
    <div className={`${styles.page} ${pedidoDetalle ? styles.pageConDetalle : ''}`}>
      <Toast toast={toastMsg} />

      <div className={styles.mainArea}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Pedidos</h1>
            <p className={styles.pageSub}>Gestion de Pedidos — {EMPRESA.NOMBRE}, {EMPRESA.CIUDAD}</p>
          </div>
          <button onClick={abrirCrear} className={styles.btnPrimary}>
            <Plus size={15} aria-hidden="true" /> Nuevo pedido
          </button>
        </header>

        <section className={styles.kpiGrid} aria-label="Resumen de pedidos">
          <KPICard label="Total pedidos" value={kpis.total} note="este mes" />
          <KPICard label="Pendientes" value={kpis.pendientes} note="por confirmar" color="#c2410c" />
          <KPICard label="Con error" value={kpis.conError} note="detectados por IA" color="#b91c1c" />
          <KPICard
            label="Monto total"
            value={`${EMPRESA.MONEDA_SIMBOLO} ${kpis.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            note="acumulado mes"
          />
        </section>

        <div className={styles.toolbar} role="search">
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° o cliente..."
              className={styles.searchInput}
              aria-label="Buscar pedidos"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={filtroError}
            onChange={(e) => setFiltroError(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filtrar por error"
          >
            <option value="">Con y sin error</option>
            <option value="1">Solo con error (IA)</option>
            <option value="0">Sin errores</option>
          </select>
        </div>

        <section className={`${styles.tableCard} rt-flat`} aria-label="Lista de pedidos">
          {pedidosFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={36} className={styles.emptyIcon} aria-hidden="true" />
              <p className={styles.emptyTitle}>Sin pedidos</p>
              <p className={styles.emptySub}>No hay pedidos que coincidan con los filtros.</p>
              <button onClick={abrirCrear} className={styles.btnPrimary}>
                <Plus size={14} aria-hidden="true" /> Crear primer pedido
              </button>
            </div>
          ) : (
            <table className={`${styles.table} responsive-table`}>
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Ítems</th>
                  <th>Total {EMPRESA.MONEDA_SIMBOLO}</th>
                  <th>Auditoría CC</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPagina.map((p) => (
                  <tr
                    key={p.id}
                    className={p.tieneError || p.tieneFallaCondicion ? styles.rowConError : ''}
                    onClick={() => verDetalle(p)}
                    data-rownav=""
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label="N° Pedido" data-primary>
                      <span className={styles.numPedido}>{p.numero}</span>
                      {p.tieneError && (
                        <span className={styles.errBadge}>
                          <AlertTriangle size={9} aria-hidden="true" /> Ítem Err
                        </span>
                      )}
                    </td>
                    <td data-label="Cliente">
                      <span className={styles.clienteNombre}>{p.cliente}</span>
                      <span className={styles.clienteSub}>{p.pago}</span>
                    </td>
                    <td data-label="Fecha" className={styles.tdSecundario}>{formatearFecha(p.fecha)}</td>
                    <td data-label="Ítems" className={styles.tdSecundario}>
                      {p.items.length} línea{p.items.length !== 1 ? 's' : ''}
                    </td>
                    <td data-label={`Total ${EMPRESA.MONEDA_SIMBOLO}`} className={styles.tdMonto}>
                      {EMPRESA.MONEDA_SIMBOLO} {calcularTotal(p.items).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td data-label="Auditoría CC">
                      <PillCondicion condicion={p.condicionComercial} />
                    </td>
                    <td data-label="Estado"><PillEstado estado={p.estado} /></td>
                    <td data-label="Acciones" onClick={(e) => e.stopPropagation()}>
                      <div className={styles.acciones}>
                        <button
                          onClick={() => verDetalle(p)}
                          className={styles.btnIcono}
                          aria-label="Ver detalle"
                          title="Detalle"
                        >
                          <Eye size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => abrirEditar(p)}
                          className={styles.btnIcono}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => pedirConfirmarEliminar(p.id)}
                          className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
                          aria-label="Eliminar"
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
            etiqueta="pedidos"
          />
        </section>
      </div>

      <DetallePanel
        pedido={pedidoDetalle}
        onCerrar={cerrarDetalle}
        onEditar={abrirEditar}
        onConfirmar={handleCambiarEstado}
      />

      <PedidoModal
        abierto={modalAbierto}
        editandoId={editandoId}
        form={form}
        formErrors={formErrors}
        guardando={guardando}
        validandoIA={validandoIA}
        alertaIA={alertaIA}
        condicionesDelCliente={condicionesDelCliente}
        condicionClienteActiva={condicionClienteActiva}
        items={items}
        totalFormulario={totalFormulario}
        clientesCatalogo={clientesCatalogo}
        productosCatalogo={productosCatalogo}
        solicitudesPendientes={solicitudesPendientes}
        estadosPedido={estadosPedidoDisponibles}
        condicionesPago={opcionesPagoActivas}
        onClose={cerrarModal}
        onChange={handleFormChange}
        onGuardar={handleGuardar}
        onAgregarItem={agregarItem}
        onQuitarItem={quitarItem}
        onCambiarProducto={cambiarProductoItem}
        onCambiarCant={cambiarCantItem}
        onCambiarPrecio={cambiarPrecioItem}
      />

      <ConfirmDeleteModal
        pedidoId={confirmDelete}
        pedidos={pedidosFiltrados}
        onConfirm={handleEliminar}
        onCancel={cancelarEliminar}
      />

      <AdvertenciaConfirmacionModal
        advertencia={advertenciaConfirmacion}
        onCancelar={cerrarAdvertenciaConfirmacion}
      />
    </div>
  );
}