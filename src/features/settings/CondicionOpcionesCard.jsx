import { useEffect, useState } from 'react'
import { Trash2, Plus, Pencil, Power, PowerOff, AlertTriangle, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchOpcionesCondicion,
  crearOpcionCondicion,
  actualizarOpcionCondicion,
  eliminarOpcionCondicion,
} from '../commercial_terms/condicionOpcionesService'
import { TIPOS_CONDICION_COMERCIAL, LABELS_TIPO_CONDICION } from '../../constants/appConstants'
import styles from './settings.module.css'

function ConfirmarEliminar({ opcion, procesando, onCancelar, onConfirmar }) {
  if (!opcion) return null
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar opción"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Eliminar opción</h2>
          <button onClick={onCancelar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmIconWrap}>
            <AlertTriangle size={32} style={{ color: '#ea580c' }} aria-hidden="true" />
          </div>
          <p className={styles.confirmTexto}>
            ¿Seguro que deseas eliminar <strong>{opcion.label}</strong> de {LABELS_TIPO_CONDICION[opcion.tipo] || opcion.tipo}?
            Si ya hay condiciones pactadas con este valor, mejor desactívala en vez de eliminarla.
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

function EditarOpcion({ opcion, procesando, onCancelar, onGuardar }) {
  const [valor, setValor] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [orden, setOrden] = useState(0)

  useEffect(() => {
    if (opcion) {
      setValor(opcion.valor || '')
      setEtiqueta(opcion.label || '')
      setOrden(opcion.orden ?? 0)
    }
  }, [opcion])

  if (!opcion) return null

  const enviar = (e) => {
    e.preventDefault()
    onGuardar({ valor, etiqueta, orden: parseInt(orden, 10) || 0 })
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Editar opción"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <form className={styles.modal} onSubmit={enviar}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar opción · {LABELS_TIPO_CONDICION[opcion.tipo] || opcion.tipo}</h2>
          <button type="button" onClick={onCancelar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.catEditBody}>
          <label className={styles.catEditLabel}>
            Valor (lo que se guarda y compara, ej: 15, 20, Tarjeta)
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              maxLength={50}
              disabled={procesando}
              className={styles.catInput}
              autoFocus
            />
          </label>
          <label className={styles.catEditLabel}>
            Etiqueta (lo que ve el usuario)
            <input
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              maxLength={100}
              disabled={procesando}
              className={styles.catInput}
            />
          </label>
          <label className={styles.catEditLabel}>
            Orden en la lista
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              disabled={procesando}
              className={styles.catInput}
            />
          </label>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onCancelar} className={styles.btnSecondary} disabled={procesando}>
            Cancelar
          </button>
          <button type="submit" className={styles.catAddBtn} disabled={procesando || !valor.trim() || !etiqueta.trim()}>
            {procesando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CondicionOpcionesCard() {
  const { user } = useAuth()
  const [opciones, setOpciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [tipoNuevo, setTipoNuevo] = useState(TIPOS_CONDICION_COMERCIAL[0])
  const [valorNuevo, setValorNuevo] = useState('')
  const [etiquetaNuevo, setEtiquetaNuevo] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [aEditar, setAEditar] = useState(null)

  const cargar = () => {
    setCargando(true)
    fetchOpcionesCondicion({ soloActivas: false })
      .then((data) => setOpciones(Array.isArray(data) ? data : []))
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las opciones del catálogo.' }))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  if (!user?.esAdmin) return null

  const agregar = async (e) => {
    e.preventDefault()
    if (!valorNuevo.trim() || !etiquetaNuevo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Valor y etiqueta son obligatorios.' })
      return
    }
    setProcesando(true)
    setMensaje(null)
    try {
      await crearOpcionCondicion({
        tipo: tipoNuevo,
        valor: valorNuevo.trim(),
        etiqueta: etiquetaNuevo.trim(),
        orden: opciones.filter((o) => o.tipo === tipoNuevo).length + 1,
      })
      setValorNuevo('')
      setEtiquetaNuevo('')
      setMensaje({ tipo: 'success', texto: `Opción "${etiquetaNuevo.trim()}" agregada.` })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo agregar la opción.' })
    } finally {
      setProcesando(false)
    }
  }

  const guardarEdicion = async ({ valor, etiqueta, orden }) => {
    if (!valor.trim() || !etiqueta.trim()) {
      setMensaje({ tipo: 'error', texto: 'Valor y etiqueta son obligatorios.' })
      return
    }
    const opc = aEditar
    setProcesando(true)
    setMensaje(null)
    try {
      await actualizarOpcionCondicion(opc.id, { valor: valor.trim(), etiqueta: etiqueta.trim(), orden })
      setAEditar(null)
      setMensaje({ tipo: 'success', texto: `Opción "${etiqueta.trim()}" actualizada.` })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo actualizar la opción.' })
    } finally {
      setProcesando(false)
    }
  }

  const alternarActivo = async (opc) => {
    setProcesando(true)
    setMensaje(null)
    try {
      await actualizarOpcionCondicion(opc.id, { activo: !opc.activo })
      setMensaje({
        tipo: 'success',
        texto: `Opción "${opc.label}" ${opc.activo ? 'desactivada' : 'activada'}.`,
      })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo cambiar el estado de la opción.' })
    } finally {
      setProcesando(false)
    }
  }

  const confirmarEliminar = async () => {
    const opc = aEliminar
    setProcesando(true)
    setMensaje(null)
    try {
      await eliminarOpcionCondicion(opc.id)
      setAEliminar(null)
      setMensaje({ tipo: 'success', texto: `Opción "${opc.label}" eliminada.` })
      cargar()
    } catch (err) {
      setAEliminar(null)
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo eliminar la opción.' })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className={`${styles.card} ${styles.cardAncho}`}>
      <h3 className={styles.cardTitle}>Catálogo de condiciones comerciales</h3>
      <p className={styles.cardSub}>
        Valores disponibles para pactar Crédito, Descuento y Forma de Pago — se usan tanto al registrar la
        condición del cliente como al elegir la condición de pago en un pedido.
      </p>

      {cargando ? (
        <p className={styles.catVacio}>Cargando...</p>
      ) : (
        <div className={styles.opcGruposGrid}>
        {TIPOS_CONDICION_COMERCIAL.map((tipo) => {
          const opcionesTipo = opciones.filter((o) => o.tipo === tipo)
          return (
            <div key={tipo} className={styles.opcGrupo}>
              <p className={styles.opcGrupoTitulo}>{LABELS_TIPO_CONDICION[tipo] || tipo}</p>
              <div className={styles.catList}>
                {opcionesTipo.length === 0 ? (
                  <p className={styles.catVacio}>Sin opciones registradas.</p>
                ) : (
                  opcionesTipo.map((opc) => (
                    <div key={opc.id} className={`${styles.catRow} ${!opc.activo ? styles.opcRowInactivo : ''}`}>
                      <div className={styles.filaInfo}>
                        <p className={styles.filaLabel}>{opc.label}</p>
                        <p className={styles.filaDesc}>valor: {opc.valor} {!opc.activo && '· inactiva'}</p>
                      </div>
                      <div className={styles.catRowAcciones}>
                        <button
                          onClick={() => alternarActivo(opc)}
                          disabled={procesando}
                          className={styles.catEdit}
                          aria-label={opc.activo ? `Desactivar ${opc.label}` : `Activar ${opc.label}`}
                          title={opc.activo ? 'Desactivar' : 'Activar'}
                        >
                          {opc.activo ? <PowerOff size={14} aria-hidden="true" /> : <Power size={14} aria-hidden="true" />}
                        </button>
                        <button
                          onClick={() => { setMensaje(null); setAEditar(opc) }}
                          disabled={procesando}
                          className={styles.catEdit}
                          aria-label={`Editar ${opc.label}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => { setMensaje(null); setAEliminar(opc) }}
                          disabled={procesando}
                          className={styles.catDelete}
                          aria-label={`Eliminar ${opc.label}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}

      <p className={styles.opcFormLabel}>Agregar nueva opción</p>
      <form className={styles.catForm} onSubmit={agregar}>
        <select
          value={tipoNuevo}
          onChange={(e) => setTipoNuevo(e.target.value)}
          disabled={procesando}
          className={styles.catInput}
          aria-label="Tipo de condición"
        >
          {TIPOS_CONDICION_COMERCIAL.map((t) => (
            <option key={t} value={t}>{LABELS_TIPO_CONDICION[t] || t}</option>
          ))}
        </select>
        <input
          type="text"
          value={valorNuevo}
          onChange={(e) => setValorNuevo(e.target.value)}
          placeholder="Valor (ej: 45, 50)"
          maxLength={50}
          disabled={procesando}
          className={styles.catInput}
          aria-label="Valor de la opción"
        />
        <input
          type="text"
          value={etiquetaNuevo}
          onChange={(e) => setEtiquetaNuevo(e.target.value)}
          placeholder="Etiqueta (ej: Crédito 45d)"
          maxLength={100}
          disabled={procesando}
          className={styles.catInput}
          aria-label="Etiqueta visible de la opción"
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

      <EditarOpcion
        opcion={aEditar}
        procesando={procesando}
        onCancelar={() => setAEditar(null)}
        onGuardar={guardarEdicion}
      />

      <ConfirmarEliminar
        opcion={aEliminar}
        procesando={procesando}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
