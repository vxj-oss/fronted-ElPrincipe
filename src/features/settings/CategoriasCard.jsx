import { useEffect, useState } from 'react'
import { Trash2, Plus, Pencil, AlertTriangle, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../products/productsService'
import styles from './settings.module.css'

function ConfirmarEliminar({ categoria, procesando, onCancelar, onConfirmar }) {
  if (!categoria) return null
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar categoría"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar categoría</h2>
          <button onClick={onCancelar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmIconWrap}>
            <AlertTriangle size={32} style={{ color: '#ea580c' }} aria-hidden="true" />
          </div>
          <p className={styles.confirmTexto}>
            ¿Seguro que deseas eliminar la categoría <strong>{categoria.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onCancelar} className={styles.btnSecondary} disabled={procesando}>
            Cancelar
          </button>
          <button onClick={onConfirmar} className={styles.btnWarning} disabled={procesando}>
            {procesando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditarCategoria({ categoria, procesando, onCancelar, onGuardar }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '')
      setDescripcion(categoria.descripcion || '')
    }
  }, [categoria])

  if (!categoria) return null

  const enviar = (e) => {
    e.preventDefault()
    onGuardar({ nombre, descripcion })
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Editar categoría"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <form className={styles.modal} onSubmit={enviar}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar categoría</h2>
          <button type="button" onClick={onCancelar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.catEditBody}>
          <label className={styles.catEditLabel}>
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              disabled={procesando}
              className={styles.catInput}
              autoFocus
            />
          </label>
          <label className={styles.catEditLabel}>
            Descripción
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional"
              disabled={procesando}
              className={styles.catInput}
            />
          </label>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onCancelar} className={styles.btnSecondary} disabled={procesando}>
            Cancelar
          </button>
          <button type="submit" className={styles.catAddBtn} disabled={procesando || !nombre.trim()}>
            {procesando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CategoriasCard() {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [aEditar, setAEditar] = useState(null)

  const cargar = () => {
    setCargando(true)
    fetchCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las categorías.' }))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  if (!user?.esAdmin) return null

  const agregar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre de la categoría es obligatorio.' })
      return
    }
    setProcesando(true)
    setMensaje(null)
    try {
      await crearCategoria({ nombre, descripcion })
      setNombre('')
      setDescripcion('')
      setMensaje({ tipo: 'success', texto: `Categoría "${nombre.trim()}" creada.` })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo crear la categoría.' })
    } finally {
      setProcesando(false)
    }
  }

  const guardarEdicion = async ({ nombre: nom, descripcion: desc }) => {
    if (!nom.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre de la categoría es obligatorio.' })
      return
    }
    const cat = aEditar
    setProcesando(true)
    setMensaje(null)
    try {
      await actualizarCategoria(cat.id, { nombre: nom, descripcion: desc })
      setAEditar(null)
      setMensaje({ tipo: 'success', texto: `Categoría "${nom.trim()}" actualizada.` })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo actualizar la categoría.' })
    } finally {
      setProcesando(false)
    }
  }

  const confirmarEliminar = async () => {
    const cat = aEliminar
    setProcesando(true)
    setMensaje(null)
    try {
      await eliminarCategoria(cat.id)
      setAEliminar(null)
      setMensaje({ tipo: 'success', texto: `Categoría "${cat.nombre}" eliminada.` })
      cargar()
    } catch (err) {
      setAEliminar(null)
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo eliminar la categoría.' })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Categorías de productos</h3>
      <p className={styles.cardSub}>Administra las categorías disponibles al registrar productos</p>

      <div className={styles.catList}>
        {cargando ? (
          <p className={styles.catVacio}>Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className={styles.catVacio}>Aún no hay categorías registradas.</p>
        ) : (
          categorias.map((cat) => (
            <div key={cat.id} className={styles.catRow}>
              <div className={styles.filaInfo}>
                <p className={styles.filaLabel}>{cat.nombre}</p>
                {cat.descripcion && <p className={styles.filaDesc}>{cat.descripcion}</p>}
              </div>
              <div className={styles.catRowAcciones}>
                <button
                  onClick={() => { setMensaje(null); setAEditar(cat) }}
                  disabled={procesando}
                  className={styles.catEdit}
                  aria-label={`Editar ${cat.nombre}`}
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                  onClick={() => { setMensaje(null); setAEliminar(cat) }}
                  disabled={procesando}
                  className={styles.catDelete}
                  aria-label={`Eliminar ${cat.nombre}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form className={styles.catForm} onSubmit={agregar}>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          maxLength={100}
          disabled={procesando}
          className={styles.catInput}
          aria-label="Nombre de la categoría"
        />
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          disabled={procesando}
          className={styles.catInput}
          aria-label="Descripción de la categoría"
        />
        <button type="submit" disabled={procesando} className={styles.catAddBtn}>
          <Plus size={14} aria-hidden="true" /> Agregar
        </button>
      </form>

      {mensaje && (
        <div
          className={`${styles.catMsg} ${mensaje.tipo === 'error' ? styles.catMsgError : styles.catMsgOk}`}
          role="status"
        >
          {mensaje.tipo === 'error'
            ? <AlertCircle size={15} className={styles.catMsgIcon} aria-hidden="true" />
            : <CheckCircle size={15} className={styles.catMsgIcon} aria-hidden="true" />}
          <span className={styles.catMsgTexto}>{mensaje.texto}</span>
          <button
            onClick={() => setMensaje(null)}
            className={styles.catMsgClose}
            aria-label="Descartar mensaje"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <EditarCategoria
        categoria={aEditar}
        procesando={procesando}
        onCancelar={() => setAEditar(null)}
        onGuardar={guardarEdicion}
      />

      <ConfirmarEliminar
        categoria={aEliminar}
        procesando={procesando}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
