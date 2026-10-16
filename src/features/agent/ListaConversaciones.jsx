import { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import styles from './agent.module.css';

function formatoFecha(iso) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ListaConversaciones({ conversaciones, activa, cargando, onSeleccionar, onEliminar }) {
  const [confirmando, setConfirmando] = useState(null);

  if (cargando) return <div className={styles.histCargando}>Cargando...</div>;
  if (conversaciones.length === 0) return <p className={styles.histVacio}>Sin conversaciones aún</p>;

  return (
    <ul className={styles.histUl}>
      {conversaciones.map((conv) => (
        <li key={conv.id} className={`${styles.histFila} ${conv.id === activa ? styles.histItemActivo : ''}`}>
          {confirmando === conv.id ? (
            <div className={styles.histConfirmar}>
              <span>¿Eliminar esta conversación?</span>
              <div>
                <button
                  type="button"
                  className={styles.histBtnSi}
                  onClick={() => {
                    setConfirmando(null);
                    onEliminar(conv.id);
                  }}
                  aria-label="Confirmar eliminación"
                >
                  <Check size={13} aria-hidden="true" /> Eliminar
                </button>
                <button type="button" className={styles.histBtnNo} onClick={() => setConfirmando(null)} aria-label="Cancelar">
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={styles.histSeleccionar}
                onClick={() => onSeleccionar(conv.id)}
                aria-current={conv.id === activa ? 'page' : undefined}
              >
                <span className={styles.histLabel}>{conv.titulo}</span>
                <span className={styles.histFecha}>{formatoFecha(conv.fechaISO)}</span>
              </button>
              <button
                type="button"
                className={styles.histEliminar}
                onClick={() => setConfirmando(conv.id)}
                aria-label={`Eliminar conversación ${conv.titulo}`}
                title="Eliminar conversación"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
