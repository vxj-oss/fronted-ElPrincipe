import React from 'react';
import styles from './products.module.css';

export default function ProductForm({
  form,
  formErrors,
  guardando,
  editandoId,
  categorias,
  UNIDADES,
  NIVELES_ROTACION,
  onChange,
  onGuardar,
  onCancelar,
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onGuardar(); }}>
      <div className={styles.modalBody}>
        <div className={styles.field}>
          <label htmlFor="f-codigo" className={styles.fieldLabel}>
            Código SKU <span className={styles.fieldHint}>(automatico)</span>
          </label>
          <input
            id="f-codigo"
            name="codigo"
            type="text"
            value={form.codigo}
            onChange={onChange}
            placeholder="Se genera al escribir el nombre"
            className={`${styles.fieldInput} ${formErrors.codigo ? styles.fieldInputError : ''}`}
          />
          {formErrors.codigo && <p className={styles.fieldError}>{formErrors.codigo}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-categoria_id" className={styles.fieldLabel}>Categoría</label>
          <select
            id="f-categoria_id"
            name="categoria_id"
            value={form.categoria_id}
            onChange={onChange}
            className={`${styles.fieldInput} ${formErrors.categoria_id ? styles.fieldInputError : ''}`}
          >
            <option value="">Seleccionar categoría...</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          {formErrors.categoria_id && <p className={styles.fieldError}>{formErrors.categoria_id}</p>}
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="f-nombre" className={styles.fieldLabel}>Nombre del producto</label>
          <input
            id="f-nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={onChange}
            placeholder="Detergente Industrial 5L"
            className={`${styles.fieldInput} ${formErrors.nombre ? styles.fieldInputError : ''}`}
          />
          {formErrors.nombre && <p className={styles.fieldError}>{formErrors.nombre}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-precio" className={styles.fieldLabel}>Precio venta (S/)</label>
          <input
            id="f-precio"
            name="precio"
            type="number"
            step="0.01"
            value={form.precio}
            onChange={onChange}
            placeholder="0.00"
            className={`${styles.fieldInput} ${formErrors.precio ? styles.fieldInputError : ''}`}
          />
          {formErrors.precio && <p className={styles.fieldError}>{formErrors.precio}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-costo" className={styles.fieldLabel}>Precio costo (S/)</label>
          <input
            id="f-costo"
            name="costo"
            type="number"
            step="0.01"
            value={form.costo}
            onChange={onChange}
            placeholder="0.00"
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="f-stock" className={styles.fieldLabel}>Stock actual</label>
          <input
            id="f-stock"
            name="stock"
            type="number"
            value={form.stock}
            onChange={onChange}
            placeholder="0"
            className={`${styles.fieldInput} ${formErrors.stock ? styles.fieldInputError : ''}`}
          />
          {formErrors.stock && <p className={styles.fieldError}>{formErrors.stock}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-minimo" className={styles.fieldLabel}>Stock mínimo</label>
          <input
            id="f-minimo"
            name="minimo"
            type="number"
            value={form.minimo}
            onChange={onChange}
            placeholder="5"
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="f-unidad" className={styles.fieldLabel}>Unidad de medida</label>
          <select
            id="f-unidad"
            name="unidad"
            value={form.unidad}
            onChange={onChange}
            className={styles.fieldInput}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="f-rotacion" className={styles.fieldLabel}>Nivel de rotación</label>
          <select
            id="f-rotacion"
            name="rotacion"
            value={form.rotacion}
            onChange={onChange}
            className={styles.fieldInput}
          >
            {NIVELES_ROTACION.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="f-descripcion" className={styles.fieldLabel}>Descripción</label>
          <textarea
            id="f-descripcion"
            name="descripcion"
            rows="3"
            value={form.descripcion}
            onChange={onChange}
            placeholder="Breve descripción del producto"
            className={styles.fieldInput}
          />
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button type="button" onClick={onCancelar} className={styles.btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={styles.btnPrimary}>
          {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
        </button>
      </div>
    </form>
  );
}