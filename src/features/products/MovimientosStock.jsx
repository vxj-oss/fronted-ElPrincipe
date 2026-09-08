import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, PackageSearch } from 'lucide-react'
import { fetchMovimientosStock } from './productsService'
import styles from './products.module.css'

const ICONO_TIPO = {
  Salida: ArrowDownRight,
  Entrada: ArrowUpRight,
  Ajuste: SlidersHorizontal,
}

function formatearFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MovimientosStock({ productoId }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    fetchMovimientosStock(productoId)
      .then((data) => {
        if (!cancelado) setMovimientos(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el historial de stock.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [productoId])

  if (cargando) {
    return (
      <div className={styles.movEstado}>
        <div className={styles.spinner} aria-label="Cargando historial..." />
      </div>
    )
  }

  if (error) {
    return <div className={styles.movEstado}><p className={styles.estadoTexto}>{error}</p></div>
  }

  if (movimientos.length === 0) {
    return (
      <div className={styles.movEstado}>
        <PackageSearch size={30} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>Sin movimientos</p>
        <p className={styles.emptySub}>
          Este producto aún no registra descuentos ni reposiciones de stock por pedidos.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.movLista}>
      {movimientos.map((m) => {
        const Icono = ICONO_TIPO[m.tipo] || SlidersHorizontal
        const esSalida = m.tipo === 'Salida'
        return (
          <div key={m.id} className={styles.movItem}>
            <div className={`${styles.movIcono} ${esSalida ? styles.movSalida : styles.movEntrada}`}>
              <Icono size={15} aria-hidden="true" />
            </div>
            <div className={styles.movInfo}>
              <p className={styles.movMotivo}>{m.motivo || m.tipo}</p>
              <p className={styles.movMeta}>
                {formatearFecha(m.fecha)}
                {m.pedidoId ? ` · Pedido #${m.pedidoId}` : ''}
              </p>
            </div>
            <div className={styles.movCantidad}>
              <span className={esSalida ? styles.movNeg : styles.movPos}>
                {esSalida ? '−' : '+'}{m.cantidad}
              </span>
              <span className={styles.movStock}>{m.stockAnterior} → {m.stockNuevo}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
