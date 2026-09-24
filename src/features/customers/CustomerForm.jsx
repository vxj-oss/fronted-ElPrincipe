import React from 'react';
import styles from './customers.module.css';

export default function CustomerForm({
    form,
    formErrors,
    guardando,
    editandoId,
    DISTRITOS_TRUJILLO,
    TIPOS_CLIENTE,
    CLASIFICACIONES,
    onChange,
    onGuardar,
    onCancelar,
}) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(); }}>
            <div className={styles.modalBody}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label htmlFor="f-nombre" className={styles.fieldLabel}>
                        Razón social / Nombre completo
                    </label>
                    <input
                        id="f-nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={onChange}
                        placeholder="Distribuciones Rojas SAC"
                        className={`${styles.fieldInput} ${formErrors.nombre ? styles.fieldInputError : ''}`}
                    />
                    {formErrors.nombre && (
                        <p className={styles.fieldError} role="alert">{formErrors.nombre}</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-ruc" className={styles.fieldLabel}>RUC / DNI</label>
                    <input
                        id="f-ruc"
                        name="ruc"
                        value={form.ruc}
                        onChange={onChange}
                        placeholder="20481234567"
                        maxLength={11}
                        className={`${styles.fieldInput} ${styles.mono} ${formErrors.ruc ? styles.fieldInputError : ''}`}
                    />
                    {formErrors.ruc && (
                        <p className={styles.fieldError} role="alert">{formErrors.ruc}</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-tipo" className={styles.fieldLabel}>Tipo de cliente</label>
                    <select
                        id="f-tipo"
                        name="tipo"
                        value={form.tipo}
                        onChange={onChange}
                        className={`${styles.fieldInput} ${formErrors.tipo ? styles.fieldInputError : ''}`}
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {formErrors.tipo && (
                        <p className={styles.fieldError} role="alert">{formErrors.tipo}</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-distrito" className={styles.fieldLabel}>Distrito</label>
                    <select
                        id="f-distrito"
                        name="distrito"
                        value={form.distrito}
                        onChange={onChange}
                        className={`${styles.fieldInput} ${formErrors.distrito ? styles.fieldInputError : ''}`}
                    >
                        <option value="">Seleccionar...</option>
                        {DISTRITOS_TRUJILLO.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {formErrors.distrito && (
                        <p className={styles.fieldError} role="alert">{formErrors.distrito}</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-tel" className={styles.fieldLabel}>Teléfono</label>
                    <input
                        id="f-tel"
                        name="telefono"
                        value={form.telefono}
                        onChange={onChange}
                        placeholder="044-123456 / 987654321"
                        className={styles.fieldInput}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-email" className={styles.fieldLabel}>Correo electrónico</label>
                    <input
                        id="f-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                        placeholder="contacto@empresa.com"
                        className={`${styles.fieldInput} ${formErrors.email ? styles.fieldInputError : ''}`}
                    />
                    {formErrors.email && (
                        <p className={styles.fieldError} role="alert">{formErrors.email}</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="f-clasif" className={styles.fieldLabel}>Clasificación</label>
                    <select
                        id="f-clasif"
                        name="clasificacion"
                        value={form.clasificacion}
                        onChange={onChange}
                        className={styles.fieldInput}
                    >
                        {CLASIFICACIONES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label htmlFor="f-dir" className={styles.fieldLabel}>Dirección</label>
                    <input
                        id="f-dir"
                        name="direccion"
                        value={form.direccion}
                        onChange={onChange}
                        placeholder="Av. España 123, Trujillo"
                        className={styles.fieldInput}
                    />
                </div>
            </div>

            <div className={styles.modalFooter}>
                <button type="button" onClick={onCancelar} className={styles.btnSecondary}>
                    Cancelar
                </button>
                <button type="submit" disabled={guardando} className={styles.btnPrimary}>
                    {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar cliente'}
                </button>
            </div>
        </form>
    );
}
