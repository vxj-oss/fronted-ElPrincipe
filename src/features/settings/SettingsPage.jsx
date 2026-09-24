import { AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useSettings } from './useSettings'
import MetaComercialCard from './MetaComercialCard'
import CategoriasCard from './CategoriasCard'
import CondicionOpcionesCard from './CondicionOpcionesCard'
import styles from './settings.module.css'

function Toast({ toast }) {
  if (!toast) return null
  const esError = toast.tipo === 'error'
  return (
    <div className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`}
         role="status">
      {esError
        ? <AlertCircle size={14} aria-hidden="true" />
        : <CheckCircle size={14} aria-hidden="true" />}
      {toast.texto}
    </div>
  )
}

function BtnAccion({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className={styles.btnPeligro}>
      <AlertTriangle size={13} aria-hidden="true" />
      {label}
    </button>
  )
}

function ConfirmModal({ modal, onCerrar, procesando }) {
  if (!modal) return null
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={modal.label}
      onClick={e => e.target === e.currentTarget && onCerrar()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{modal.label}</h2>
          <button onClick={onCerrar} className={styles.modalClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmIconWrap}>
            <AlertTriangle size={32} style={{ color: '#ea580c' }} aria-hidden="true" />
          </div>
          <p className={styles.confirmTexto}>{modal.mensaje}</p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onCerrar} className={styles.btnSecondary} disabled={procesando}>
            Cancelar
          </button>
          <button onClick={modal.onConfirmar} disabled={procesando} className={styles.btnWarning}>
            {procesando ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { procesando, toastMsg, acciones, confirmModal, cerrarConfirm, ACCIONES } = useSettings()

  return (
    <div className={styles.page}>
      <Toast toast={toastMsg} />

      <div className={styles.content} role="main">
        <MetaComercialCard />
        <CategoriasCard />
        <CondicionOpcionesCard />

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Datos y preferencias</h3>
          <p className={styles.cardSub}>Operaciones disponibles sobre tu cuenta y tus datos en el sistema</p>
          <div className={styles.ajustesList}>
            {ACCIONES.map(accion => (
              <div key={accion.id} className={styles.filaAjuste}>
                <div className={styles.filaInfo}>
                  <p className={styles.filaLabel}>{accion.label}</p>
                  <p className={styles.filaDesc}>{accion.desc}</p>
                </div>
                <div className={styles.filaControl}>
                  <BtnAccion
                    label={accion.btnLabel}
                    onClick={() => acciones[accion.id]?.()}
                    disabled={procesando}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        modal={confirmModal}
        onCerrar={cerrarConfirm}
        procesando={procesando}
      />
    </div>
  )
}
