import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import styles from './settings.module.css'

export default function MetaComercialCard() {
  const { user } = useAuth()
  const [meta, setMeta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    let cancelado = false
    apiRequest('/dashboard/config')
      .then((data) => {
        if (!cancelado) setMeta(String(data.meta_diaria_ventas ?? ''))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  if (!user?.esAdmin) return null

  const guardar = async () => {
    const valor = parseFloat(meta)
    if (!(valor > 0)) {
      setMensaje({ tipo: 'error', texto: 'La meta debe ser un número mayor a cero.' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      const data = await apiRequest('/dashboard/config', {
        method: 'PUT',
        body: JSON.stringify({ meta_diaria_ventas: valor }),
      })
      setMeta(String(data.meta_diaria_ventas))
      setMensaje({ tipo: 'success', texto: 'Meta comercial actualizada.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo guardar.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Configuración comercial</h3>
      <p className={styles.cardSub}>Parámetros de la empresa usados en el dashboard</p>
      <div className={styles.ajustesList}>
        <div className={styles.filaAjuste}>
          <div className={styles.filaInfo}>
            <p className={styles.filaLabel}>Meta diaria de ventas (S/)</p>
            <p className={styles.filaDesc}>Objetivo que muestra la barra de progreso del dashboard</p>
          </div>
          <div className={styles.filaControl}>
            <input
              type="number"
              min="1"
              step="100"
              value={meta}
              disabled={cargando || guardando}
              onChange={(e) => setMeta(e.target.value)}
              className={styles.metaInput}
              aria-label="Meta diaria de ventas"
            />
            <button onClick={guardar} disabled={cargando || guardando} className={styles.btnGuardar}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
      {mensaje && (
        <p className={mensaje.tipo === 'error' ? styles.metaMsgError : styles.metaMsgOk}>
          {mensaje.texto}
        </p>
      )}
    </div>
  )
}
