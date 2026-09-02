import {
  Plus, Search, Pencil, Trash2, AlertCircle,
  CheckCircle, Package,
} from 'lucide-react'
import { useProducts, estadoStock } from './useProducts'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'
import ProductForm from './ProductForm'
import styles from './products.module.css'

function PillStock({ producto }) {
  const estado = estadoStock(producto)
  const clases = {
    critico: styles.pillCritico,
    bajo: styles.pillBajo,
    ok: styles.pillOk,
  }
  const etiquetas = { critico: 'Crítico', bajo: 'Bajo', ok: 'OK' }
  return <span className={`${styles.pill} ${clases[estado]}`}>{etiquetas[estado]}</span>
}

function KPICard({ label, value, note, colorValue }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue} style={colorValue ? { color: colorValue } : {}}>
        {value}
      </p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const esError = toast.tipo === 'error'
  return (
    <div className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`} role="status">
      {esError ? <AlertCircle size={14} aria-hidden="true" /> : <CheckCircle size={14} aria-hidden="true" />}
      {toast.texto}
    </div>
  )
}

function ProductModal({
  abierto, editandoId, form, formErrors, guardando,
  categorias, UNIDADES, NIVELES_ROTACION,
  onClose, onChange, onGuardar,
}) {
  if (!abierto) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={editandoId ? 'Editar producto' : 'Nuevo producto'}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editandoId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>

        <ProductForm
          form={form}
          formErrors={formErrors}
          guardando={guardando}
          editandoId={editandoId}
          categorias={categorias}
          UNIDADES={UNIDADES}
          NIVELES_ROTACION={NIVELES_ROTACION}
          onChange={onChange}
          onGuardar={onGuardar}
          onCancelar={onClose}
        />
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ productoId, productos, onConfirm, onCancel }) {
  if (!productoId) return null
  const producto = productos.find(p => p.id === productoId)
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar producto</h2>
          <button onClick={onCancel} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.confirmBody}>
          <AlertCircle size={32} className={styles.confirmIcon} aria-hidden="true" />
          <p className={styles.confirmText}>
            ¿Eliminar <strong>{producto?.nombre}</strong> del catálogo? Esta acción no se puede deshacer.
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

export default function ProductsPage() {
  const {
    productosFiltrados,
    categorias,
    kpis,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroCategoria,
    filtroStock,
    setBusqueda,
    setFiltroCategoria,
    setFiltroStock,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    confirmDelete,
    UNIDADES,
    NIVELES_ROTACION,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    pedirConfirmarEliminar,
    handleEliminar,
    cancelarEliminar,
  } = useProducts()

  const {
    itemsPagina: productosPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(productosFiltrados, 7)

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando productos..." />
        <p className={styles.estadoTexto}>Cargando catálogo de productos...</p>
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
    <div className={styles.page}>
      <Toast toast={toastMsg} />

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Productos</h1>
          <p className={styles.pageSub}>Catálogo de productos de limpieza — EL PRÍNCIPE</p>
        </div>
        <button onClick={abrirCrear} className={styles.btnPrimary}>
          <Plus size={15} aria-hidden="true" />
          Nuevo producto
        </button>
      </header>

      <section className={styles.kpiGrid} aria-label="Resumen del catálogo">
        <KPICard label="Total productos" value={kpis.total} note="en catálogo" />
        <KPICard label="Stock crítico" value={kpis.criticos} note="bajo mínimo" colorValue="#dc2626" />
        <KPICard label="Activos" value={kpis.activos} note="en venta" colorValue="#1E3A8A" />
        <KPICard
          label="Valor inventario"
          value={`S/ ${kpis.valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          note="costo total stock"
        />
      </section>

      <div className={styles.toolbar} role="search">
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className={styles.searchInput}
            aria-label="Buscar productos"
          />
        </div>

        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={filtroStock}
          onChange={e => setFiltroStock(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filtrar por estado de stock"
        >
          <option value="">Todo el stock</option>
          <option value="critico">Crítico</option>
          <option value="bajo">Bajo</option>
          <option value="ok">OK</option>
        </select>
      </div>

      <section className={styles.tableCard} aria-label="Lista de productos">
        {productosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={36} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Sin productos</p>
            <p className={styles.emptySub}>No hay productos que coincidan con los filtros aplicados.</p>
            <button onClick={abrirCrear} className={styles.btnPrimary}>
              <Plus size={14} aria-hidden="true" />
              Agregar primer producto
            </button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio S/</th>
                <th>Costo S/</th>
                <th>Stock</th>
                <th>Mín.</th>
                <th>Rotación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosPagina.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className={styles.productoNombre}>{p.nombre}</span>
                    <span className={styles.productoCodigo}>{p.codigo}</span>
                  </td>
                  <td>{p.categoria}</td>
                  <td>S/ {p.precio.toFixed(2)}</td>
                  <td>S/ {p.costo.toFixed(2)}</td>
                  <td>
                    <strong>{p.stock}</strong>
                    <span className={styles.unidadLabel}> {p.unidad}</span>
                  </td>
                  <td className={styles.tdMuted}>{p.minimo}</td>
                  <td>{p.rotacion}</td>
                  <td><PillStock producto={p} /></td>
                  <td>
                    <div className={styles.acciones}>
                      <button
                        onClick={() => abrirEditar(p)}
                        className={styles.btnIcono}
                        aria-label={`Editar ${p.nombre}`}
                        title="Editar"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => pedirConfirmarEliminar(p.id)}
                        className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
                        aria-label={`Eliminar ${p.nombre}`}
                        title="Eliminar"
                      >
                        <Trash2 size={14} aria-hidden="true" />
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
          etiqueta="productos"
        />
      </section>

      <ProductModal
        abierto={modalAbierto}
        editandoId={editandoId}
        form={form}
        formErrors={formErrors}
        guardando={guardando}
        categorias={categorias}
        UNIDADES={UNIDADES}
        NIVELES_ROTACION={NIVELES_ROTACION}
        onClose={cerrarModal}
        onChange={handleFormChange}
        onGuardar={handleGuardar}
      />

      <ConfirmDeleteModal
        productoId={confirmDelete}
        productos={productosFiltrados}
        onConfirm={handleEliminar}
        onCancel={cancelarEliminar}
      />
    </div>
  )
}