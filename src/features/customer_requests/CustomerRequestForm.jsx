import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import ProductSearchSelect from '../../components/ui/ProductSearchSelect';
import styles from './customerRequests.module.css';

const subtotalDeItem = (it) => (parseFloat(it.precioEsperado) || 0) * (parseInt(it.cant, 10) || 0);
const formatoSoles = (valor) => valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
              <span>Precio unit. (S/)</span>
              <span>Subtotal (S/)</span>
              <span></span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className={styles.itemRow}>
                <div className={`${styles.celda} ${styles.celdaProducto}`}>
                  <span className={styles.celdaEtiqueta}>Producto</span>
                  <ProductSearchSelect
                    productos={productos}
                    productoId={it.producto_id}
                    nombre={it.nombre}
                    onChange={(valor) => onCambiarProducto(idx, valor)}
                    inputClassName={styles.itemInput}
                  />
                </div>

                <div className={`${styles.celda} ${styles.celdaCant}`}>
                  <span className={styles.celdaEtiqueta}>Cantidad</span>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => onCambiarCant(idx, (parseInt(it.cant, 10) || 1) - 1)}
                      className={styles.btnStep}
                      disabled={(parseInt(it.cant, 10) || 1) <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={it.cant}
                      onChange={(e) => onCambiarCant(idx, e.target.value)}
                      className={`${styles.itemInput} ${styles.stepperInput}`}
                      aria-label="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => onCambiarCant(idx, (parseInt(it.cant, 10) || 0) + 1)}
                      className={styles.btnStep}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`${styles.celda} ${styles.celdaPrecio}`}>
                  <span className={styles.celdaEtiqueta}>Precio unit. (S/)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={it.precioEsperado || ''}
                    onChange={(e) => onCambiarPrecio(idx, e.target.value)}
                    placeholder="0.00"
                    className={styles.itemInput}
                    aria-label="Precio unitario"
                  />
                </div>

                <div className={`${styles.celda} ${styles.celdaSubtotal}`}>
                  <span className={styles.celdaEtiqueta}>Subtotal (S/)</span>
                  <span className={styles.subtotalItem}>{formatoSoles(subtotalDeItem(it))}</span>
                </div>

                <div className={`${styles.celda} ${styles.celdaQuitar}`}>
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
              </div>
            ))}
          </div>

          <p className={styles.totalItems}>
            Total aproximado: <strong>S/ {formatoSoles(items.reduce((acc, it) => acc + subtotalDeItem(it), 0))}</strong>
          </p>

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
          {guardando ? 'Guardando...' : 'Registrar Cotización'}
        </button>
      </div>
    </form>
  );
}