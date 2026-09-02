import React from 'react';
import { Plus, X } from 'lucide-react';
import styles from './customerRequests.module.css';

export default function CustomerRequestForm({
  form,
  formErrors,
  items,
  guardando,
  clientes,
  productos,
  canales,
  onChange,
  onGuardar,
  onCancelar,
  onAgregarItem,
  onQuitarItem,
  onCambiarProducto,
  onCambiarCant,
  onCambiarPrecio,
}) {
  return (
    <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); onGuardar(); }}>
      <div className={styles.modalBody}>
        <div className={styles.field}>
          <label htmlFor="f-cli" className={styles.fieldLabel}>Cliente</label>
          <select
            id="f-cli"
            name="cliente_id"
            value={form.cliente_id}
            onChange={onChange}
            className={`${styles.fieldInput} ${formErrors.cliente_id ? styles.fieldInputError : ''}`}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.ruc ? `(${c.ruc})` : ''}
              </option>
            ))}
          </select>
          {formErrors.cliente_id && (
            <p className={styles.fieldError} role="alert">{formErrors.cliente_id}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-canal" className={styles.fieldLabel}>Canal de Recepción</label>
          <select
            id="f-canal"
            name="canal"
            value={form.canal}
            onChange={onChange}
            className={styles.fieldInput}
          >
            {canales.map((canal) => (
              <option key={canal} value={canal}>{canal}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <div className={styles.itemsHeader}>
            <span className={styles.fieldLabel}>Productos Solicitados por el Cliente</span>
            <button
              type="button"
              onClick={onAgregarItem}
              className={styles.btnAgregarItem}
            >
              <Plus size={12} aria-hidden="true" /> Agregar ítem
            </button>
          </div>

          <div className={styles.itemsWrap}>
            <div className={styles.itemsColHeaders}>
              <span>Producto</span>
              <span>Cant.</span>
              <span>Precio Aprox. (S/)</span>
              <span></span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className={styles.itemRow}>
                <select
                  value={it.producto_id || it.nombre}
                  onChange={(e) => onCambiarProducto(idx, e.target.value)}
                  className={styles.itemInput}
                >
                  <option value="">Seleccionar o escribir producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock: {p.stock ?? 0})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={it.cant}
                  onChange={(e) => onCambiarCant(idx, e.target.value)}
                  className={styles.itemInput}
                />

                <input
                  type="number"
                  step="0.01"
                  value={it.precioEsperado || ''}
                  onChange={(e) => onCambiarPrecio(idx, e.target.value)}
                  placeholder="0.00"
                  className={styles.itemInput}
                />

                <button
                  type="button"
                  onClick={() => onQuitarItem(idx)}
                  className={styles.btnQuitarItem}
                  disabled={items.length === 1}
                  aria-label="Quitar fila"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {formErrors.items && (
            <p className={styles.fieldError} role="alert">{formErrors.items}</p>
          )}
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="f-obs" className={styles.fieldLabel}>Notas / Mensaje del Cliente</label>
          <textarea
            id="f-obs"
            name="observaciones"
            value={form.observaciones}
            onChange={onChange}
            placeholder="Pegar transcripción de WhatsApp o requerimientos especiales..."
            className={styles.textareaInput}
            rows={3}
          />
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button type="button" onClick={onCancelar} className={styles.btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={styles.btnPrimary}>
          {guardando ? 'Guardando...' : 'Registrar Solicitud'}
        </button>
      </div>
    </form>
  );
}