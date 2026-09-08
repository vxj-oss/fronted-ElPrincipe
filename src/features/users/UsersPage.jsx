import {
  Search, Pencil, Trash2, AlertCircle, CheckCircle,
  UserCog, X, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useUsers } from './useUsers'
import { ROLES, etiquetaRol } from './usersService'
import { usePagination } from '../../hooks/usePagination'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import Pagination from '../../components/ui/Pagination'
import styles from './users.module.css'

function iniciales(nombre = '') {
  const p = nombre.trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || 'U'
}

function Avatar({ nombre }) {
  return <div className={styles.avatar} aria-hidden="true">{iniciales(nombre)}</div>
}

function PillEstado({ activo }) {
  return activo
    ? <span className={`${styles.pill} ${styles.pillActivo}`}>Activo</span>
    : <span className={`${styles.pill} ${styles.pillInactivo}`}>Inactivo</span>
}

function PillRol({ rol }) {
  return (
    <span className={`${styles.pill} ${rol === 'administrador' ? styles.pillAdmin : styles.pillAsesor}`}>
      {etiquetaRol(rol)}
    </span>
  )
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
  const esError = toast.tipo === 'error'
  return (
    <div className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`} role="status">
      {esError ? <AlertCircle size={14} aria-hidden="true" /> : <CheckCircle size={14} aria-hidden="true" />}
      {toast.texto}
    </div>
  )
}

function UsuarioModal({ usuario, esEditandoYo, form, formErrors, guardando, onClose, onChange, onGuardar }) {
  if (!usuario || !form) return null
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Editar usuario"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar usuario</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Cerrar"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label htmlFor="u-nombre" className={styles.fieldLabel}>Nombre completo</label>
            <input id="u-nombre" name="nombreCompleto" value={form.nombreCompleto} onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.nombreCompleto ? styles.fieldInputError : ''}`} />
            {formErrors.nombreCompleto && <p className={styles.fieldError}>{formErrors.nombreCompleto}</p>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Nombre de usuario</label>
              <input value={`@${usuario.usuario}`} disabled className={styles.fieldInput} />
            </div>
            <div className={styles.field}>
              <label htmlFor="u-rol" className={styles.fieldLabel}>Rol</label>
              <select id="u-rol" name="rol" value={form.rol} onChange={onChange} className={styles.fieldSelect} disabled={esEditandoYo}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="u-correo" className={styles.fieldLabel}>Correo electrónico</label>
            <input id="u-correo" name="correo" type="email" value={form.correo} onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.correo ? styles.fieldInputError : ''}`} />
            {formErrors.correo && <p className={styles.fieldError}>{formErrors.correo}</p>}
          </div>

          {esEditandoYo ? (
            <p className={styles.fieldHint}>
              Cada usuario cambia su propia contraseña desde la sección <strong>Seguridad</strong> de su Perfil.
            </p>
          ) : (
            <label className={styles.checkRow}>
              <input type="checkbox" name="activo" checked={form.activo} onChange={onChange} />
              Cuenta activa
            </label>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary} disabled={guardando}>Cancelar</button>
          <button onClick={onGuardar} className={styles.btnPrimary} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ usuario, onConfirm, onCancel }) {
  if (!usuario) return null
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar usuario</h2>
          <button onClick={onCancel} className={styles.modalClose} aria-label="Cerrar"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className={styles.confirmBody}>
          <AlertCircle size={32} className={styles.confirmIcon} aria-hidden="true" />
          <p className={styles.confirmText}>
            ¿Eliminar a <strong>{usuario.nombreCompleto}</strong>? Si tiene actividad registrada se desactivará en lugar de borrarse.
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

export default function UsersPage() {
  const {
    usuarioActual, usuariosFiltrados, kpis, cargando, error, guardando, toastMsg,
    busqueda, filtroRol, filtroEstado, setBusqueda, setFiltroRol, setFiltroEstado,
    editando, form, formErrors, confirmDelete,
    abrirEditar, cerrarModal, handleFormChange, handleGuardar,
    handleToggleActivo, pedirEliminar, cancelarEliminar, handleEliminar,
  } = useUsers()

  const esMovil = useMediaQuery('(max-width: 768px)')
  const {
    itemsPagina, pagina, totalPaginas, totalItems, porPagina,
    irAPagina, paginaAnterior, paginaSiguiente,
  } = usePagination(usuariosFiltrados, esMovil ? 3 : 8)

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando usuarios..." />
        <p className={styles.estadoTexto}>Cargando usuarios...</p>
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
          <h1 className={styles.pageTitle}>Usuarios</h1>
          <p className={styles.pageSub}>
            Gestión de accesos — las cuentas se crean desde el registro en el inicio de sesión
          </p>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Resumen de usuarios">
        <KPICard label="Total" value={kpis.total} note="cuentas registradas" />
        <KPICard label="Administradores" value={kpis.admins} note="acceso total" color="#4338ca" />
        <KPICard label="Asesores" value={kpis.asesores} note="acceso comercial" color="#1E3A8A" />
        <KPICard label="Inactivos" value={kpis.inactivos} note="sin acceso" color="#b91c1c" />
      </section>

      <div className={styles.toolbar} role="search">
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} aria-hidden="true" />
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo..." className={styles.searchInput}
            aria-label="Buscar usuarios" />
        </div>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className={styles.filterSelect} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.filterSelect} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <section className={styles.tableCard} aria-label="Lista de usuarios">
        {usuariosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <UserCog size={36} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Sin usuarios</p>
            <p className={styles.emptySub}>No hay usuarios que coincidan con los filtros.</p>
          </div>
        ) : (
          <table className={`${styles.table} responsive-table`}>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsPagina.map((u) => {
                const esYo = u.id === usuarioActual?.id
                return (
                  <tr key={u.id} data-activo={u.activo ? 'si' : 'no'}>
                    <td data-label=""><Avatar nombre={u.nombreCompleto} /></td>
                    <td data-label="Usuario" data-primary>
                      <span className={styles.usuarioNombre}>
                        {u.nombreCompleto}
                        {esYo && <span className={styles.tuBadge}>Tú</span>}
                      </span>
                      <span className={styles.usuarioSub}>@{u.usuario}</span>
                    </td>
                    <td data-label="Correo" className={styles.tdSecundario}>{u.correo}</td>
                    <td data-label="Rol"><PillRol rol={u.rol} /></td>
                    <td data-label="Estado"><PillEstado activo={u.activo} /></td>
                    <td data-label="Activo">
                      <button onClick={() => handleToggleActivo(u)} className={styles.toggleBtn}
                        disabled={esYo} aria-label={u.activo ? 'Desactivar' : 'Activar'}
                        title={esYo ? 'No puedes cambiar tu propio estado' : ''}>
                        {u.activo
                          ? <ToggleRight size={20} style={{ color: '#1E3A8A' }} />
                          : <ToggleLeft size={20} style={{ color: '#94a3b8' }} />}
                      </button>
                    </td>
                    <td data-label="Acciones">
                      <div className={styles.acciones}>
                        <button onClick={() => abrirEditar(u)} className={styles.btnIcono}
                          aria-label={`Editar ${u.nombreCompleto}`} title="Editar">
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button onClick={() => pedirEliminar(u)} className={`${styles.btnIcono} ${styles.btnIconoDanger}`}
                          disabled={esYo} aria-label={`Eliminar ${u.nombreCompleto}`}
                          title={esYo ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}>
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
          etiqueta="usuarios"
        />
      </section>

      <UsuarioModal
        usuario={editando}
        esEditandoYo={editando != null && editando.id === usuarioActual?.id}
        form={form}
        formErrors={formErrors}
        guardando={guardando}
        onClose={cerrarModal}
        onChange={handleFormChange}
        onGuardar={handleGuardar}
      />

      <ConfirmDeleteModal
        usuario={confirmDelete}
        onConfirm={handleEliminar}
        onCancel={cancelarEliminar}
      />
    </div>
  )
}
