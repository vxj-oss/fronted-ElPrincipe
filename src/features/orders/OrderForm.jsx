import React, { useMemo } from 'react';
import { Plus, X, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { EMPRESA } from '../../constants/appConstants';
import styles from './orders.module.css';

export default function OrderForm({
  form,
  formErrors,
  items,
  totalFormulario,
  guardando,
  validandoIA,
  alertaIA,
  editandoId,
  condicionesDelCliente = [],
  condicionClienteActiva,
  clientesCatalogo,
  productosCatalogo,
  solicitudesPendientes = [],
  estadosPedido,
  condicionesPago,
  onChange,
  onGuardar,
  onCancelar,
  onAgregarItem,
  onQuitarItem,
  onCambiarProducto,
  onCambiarCant,
  onCambiarPrecio,
}) {
  const evaluacionComercial = useMemo(() => {
    if (!form.cliente_id) return null;

    const diasPactados = condicionClienteActiva ? (condicionClienteActiva.dias_plazo_pactados ?? 0) : 0;
    const limiteCredito = condicionClienteActiva ? parseFloat(condicionClienteActiva.limite_credito_asignado || 0) : 0;

    let diasPedido = 0;
    if (form.pago === 'Credito 15d' || form.pago?.includes('15')) diasPedido = 15;
    else if (form.pago === 'Credito 30d' || form.pago?.includes('30')) diasPedido = 30;

    const motivos = [];
    let hayFalla = false;

    if (diasPedido !== diasPactados) {
      hayFalla = true;
      const pactadoTxt = diasPactados > 0 ? `Crédito ${diasPactados}d` : 'Contado';
      const digitadoTxt = diasPedido > 0 ? `Crédito ${diasPedido}d` : 'Contado';
      motivos.push(`Discrepancia en condición: Se seleccionó '${digitadoTxt}' pero la condición pactada es '${pactadoTxt}'.`);
    }

    if (diasPedido > 0 && limiteCredito > 0 && totalFormulario > limiteCredito) {
      hayFalla = true;
      motivos.push(`Límite de crédito excedido: Total de S/ ${totalFormulario.toFixed(2)} supera el límite de S/ ${limiteCredito.toFixed(2)}.`);
    }

    return {
      hayFalla,
      diasPactados,
      diasPedido,
      limiteCredito,
      motivos,
    };
  }, [form.cliente_id, form.pago, condicionClienteActiva, totalFormulario]);

  return (
    <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); onGuardar(); }}>
      <div className={styles.modalBody}>
        {!editandoId && (
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="f-solicitud" className={styles.fieldLabel}>
              Vincular con Solicitud de Cliente
            </label>
            <select
              id="f-solicitud"
              name="solicitud_id"
              value={form.solicitud_id || ''}
              onChange={onChange}
              className={styles.fieldInput}
            >
              <option value="">-- Sin solicitud (Pedido directo) --</option>
              {solicitudesPendientes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo_solicitud} — {s.cliente?.razon_social || s.cliente?.nombre || `Cliente #${s.cliente_id}`} ({s.detalles?.length || 0} ítems)
                </option>
              ))}
            </select>
          </div>
        )}

        {alertaIA && alertaIA.hay_discrepancia && (
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#991B1B',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '6px' }}>
                <Sparkles size={16} color="#DC2626" />
                <span>Advertencia de la IA: {alertaIA.tipo_error || 'Discrepancia detectada'}</span>
              </div>
              <p style={{ margin: '0 0 6px 0', lineHeight: '1.4' }}>
                {alertaIA.descripcion_discrepancia || alertaIA.analisis_ia}
              </p>
              {alertaIA.sugerencias_correccion && alertaIA.sugerencias_correccion.length > 0 && (
                <ul style={{ margin: '4px 0 8px 18px', padding: 0 }}>
                  {alertaIA.sugerencias_correccion.map((sug, idx) => (
                    <li key={idx}>{sug}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => onGuardar(true)}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFF',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Confirmar y registrar con discrepancia
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="f-cliente" className={styles.fieldLabel}>Cliente</label>
          <select
            id="f-cliente"
            name="cliente_id"
            value={form.cliente_id || ''}
            onChange={onChange}
            className={`${styles.fieldInput} ${formErrors.cliente_id ? styles.fieldInputError : ''}`}
          >
            <option value="">Seleccionar cliente...</option>
            {clientesCatalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre || c.razon_social} {c.ruc ? `(${c.ruc})` : ''}
              </option>
            ))}
          </select>
          {formErrors.cliente_id && (
            <p className={styles.fieldError} role="alert">{formErrors.cliente_id}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-estado" className={styles.fieldLabel}>Estado</label>
          <select
            id="f-estado"
            name="estado"
            value={form.estado}
            onChange={onChange}
            className={styles.fieldInput}
          >
            {estadosPedido.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="f-condicion_id" className={styles.fieldLabel} style={{ fontWeight: 600 }}>
            1. Condición Comercial Pactada
          </label>
          <select
            id="f-condicion_id"
            name="condicion_comercial_id"
            value={form.condicion_comercial_id || ''}
            onChange={onChange}
            className={styles.fieldInput}
            disabled={!form.cliente_id}
          >
            {condicionesDelCliente.length === 0 ? (
              <option value="">Sin condición pactada (Estricto Contado)</option>
            ) : (
              condicionesDelCliente.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipo_condicion.replace('_', ' ')} — {c.dias_plazo_pactados > 0 ? `Crédito ${c.dias_plazo_pactados}d` : 'Contado 0d'} | Límite: S/ {parseFloat(c.limite_credito_asignado || 0).toFixed(2)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="f-pago" className={styles.fieldLabel} style={{ fontWeight: 600 }}>
            2. Condición de pago
          </label>
          <select
            id="f-pago"
            name="pago"
            value={form.pago}
            onChange={onChange}
            className={styles.fieldInput}
          >
            {condicionesPago.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {evaluacionComercial && (
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <div style={{
              backgroundColor: evaluacionComercial.hayFalla ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${evaluacionComercial.hayFalla ? '#FECACA' : '#BBF7D0'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: evaluacionComercial.hayFalla ? '6px' : '0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: evaluacionComercial.hayFalla ? '#B91C1C' : '#15803D',
                  fontWeight: 600
                }}>
                  {evaluacionComercial.hayFalla ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                  <span>
                    {evaluacionComercial.hayFalla
                      ? 'Inconsistencia Comercial Detectada (Registrará Falla)'
                      : 'Todo Conforme (CC OK)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', color: '#475569' }}>
                  <span><strong>Pactado:</strong> {evaluacionComercial.diasPactados > 0 ? `${evaluacionComercial.diasPactados}d` : 'Contado'}</span>
                  <span><strong>Digitado:</strong> {form.pago}</span>
                  <span><strong>Límite:</strong> S/ {evaluacionComercial.limiteCredito.toFixed(2)}</span>
                </div>
              </div>

              {evaluacionComercial.hayFalla && (
                <div style={{ color: '#991B1B', marginTop: '4px', fontSize: '11.5px', lineHeight: '1.4' }}>
                  {evaluacionComercial.motivos.map((m, idx) => (
                    <p key={idx} style={{ margin: '2px 0' }}>• {m}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="f-fecha" className={styles.fieldLabel}>Fecha del pedido</label>
          <input
            id="f-fecha"
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={onChange}
            className={`${styles.fieldInput} ${formErrors.fecha ? styles.fieldInputError : ''}`}
          />
          {formErrors.fecha && (
            <p className={styles.fieldError} role="alert">{formErrors.fecha}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="f-dir" className={styles.fieldLabel}>Dirección de entrega</label>
          <input
            id="f-dir"
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            placeholder="Av. España 340, Trujillo"
            className={styles.fieldInput}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <div className={styles.itemsHeader}>
            <span className={styles.fieldLabel}>Líneas del pedido</span>
            <button
              type="button"
              onClick={onAgregarItem}
              className={styles.btnAgregarItem}
            >
              <Plus size={12} aria-hidden="true" /> Agregar línea
            </button>
          </div>

          <div className={styles.itemsWrap}>
            <div className={styles.itemsColHeaders}>
              <span>Producto</span>
              <span>Cant.</span>
              <span>Precio {EMPRESA.MONEDA_SIMBOLO}</span>
              <span></span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className={styles.itemRow}>
                <select
                  value={it.producto_id || (productosCatalogo.find((p) => p.nombre === it.producto)?.id || '')}
                  onChange={(e) => onCambiarProducto(idx, e.target.value)}
                  className={styles.itemInput}
                >
                  <option value="">Seleccionar producto...</option>
                  {productosCatalogo.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {EMPRESA.MONEDA_SIMBOLO} {parseFloat(p.precio).toFixed(2)}
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
                  min="0"
                  step="0.01"
                  value={it.precio || ''}
                  onChange={(e) => onCambiarPrecio(idx, e.target.value)}
                  placeholder="0.00"
                  className={styles.itemInput}
                />

                <button
                  type="button"
                  onClick={() => onQuitarItem(idx)}
                  className={styles.btnQuitarItem}
                  aria-label="Quitar línea"
                  disabled={items.length === 1}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {formErrors.items && (
            <p className={styles.fieldError} role="alert">{formErrors.items}</p>
          )}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total del pedido</span>
            <span className={styles.totalValue}>
              {EMPRESA.MONEDA_SIMBOLO} {totalFormulario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="f-obs" className={styles.fieldLabel}>Observaciones</label>
          <input
            id="f-obs"
            name="observaciones"
            value={form.observaciones}
            onChange={onChange}
            placeholder="Notas adicionales (opcional)"
            className={styles.fieldInput}
          />
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button type="button" onClick={onCancelar} className={styles.btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando || validandoIA} className={styles.btnPrimary}>
          {validandoIA ? (
            'Verificando con IA...'
          ) : guardando ? (
            'Guardando...'
          ) : editandoId ? (
            'Guardar cambios'
          ) : (
            'Crear pedido'
          )}
        </button>
      </div>
    </form>
  );
}