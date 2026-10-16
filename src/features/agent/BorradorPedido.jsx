import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileDown, X } from 'lucide-react';
import { crearPedido } from '../orders/ordersService';
import { descargarArchivo } from '../../utils/descargas';
import { useAgentContext } from './AgentContext';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const soles = (n) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const etiquetaPago = (valor) => valor.replace(/^Credito/, 'Crédito');

export default function BorradorPedido({ mensajeId, datos, inicioAtencion }) {
  const navigate = useNavigate();
  const { cerrarPanel, registrarBorrador, desregistrarBorrador } = useAgentContext();
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'borrador');
  const [registro, setRegistro] = useState(resuelto);
  const [pagoIdx, setPagoIdx] = useState(0);
  const [error, setError] = useState(null);

  const formas = datos.formas_pago?.length ? datos.formas_pago : [{ condicion_id: null, valor: 'Contado' }];
  const forma = formas[pagoIdx] || formas[0];
  const [items, setItems] = useState(datos.items || []);
  const total = items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0);
  const hayProblemas = items.some(
    (it) => !it.producto_id || (it.stock !== null && it.stock !== undefined && it.cantidad > it.stock)
  );

  const ultimo = useRef(items);
  ultimo.current = items;

  useEffect(() => {
    if (estado !== 'borrador') return undefined;
    registrarBorrador(mensajeId, {
      tipo: 'pedido',
      obtener: () => ({
        tipo: 'pedido',
        mensaje_id: String(mensajeId),
        descuento_pct: datos.descuento_pactado_pct || 0,
        cliente: datos.cliente,
        items: ultimo.current,
      }),
      aplicar: (edicion) => setItems(edicion.items),
    });
    return () => desregistrarBorrador(mensajeId);
  }, [estado, mensajeId, datos, registrarBorrador, desregistrarBorrador]);

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const crear = async () => {
    setEstado('creando');
    setError(null);
    try {
      const pedido = await crearPedido({
        cliente_id: datos.cliente.id,
        solicitud_id: datos.solicitud_id,
        condicion_comercial_id: forma.condicion_id,
        pago: forma.valor,
        horaAperturaModal: inicioAtencion || null,
        items: items.map((it) => ({
          producto_id: it.producto_id,
          cant: it.cantidad,
          precio: it.precio_unitario,
        })),
      });
      const guardado = {
        estado: 'creado',
        id: pedido.id,
        numero: pedido.numero,
        total: items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0),
        observacionIA: pedido.resultadoAuditoria === 'Con_Observaciones' ? pedido.descripcionAuditoria : null,
        ventaAdicional: pedido.ventaAdicional || null,
        alertasStock: (pedido.alertasStock || []).map((a) => a.nombre),
      };
      guardarResuelto(mensajeId, guardado);
      setRegistro(guardado);
      setEstado('creado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo crear el pedido.');
      setEstado('borrador');
    }
  };

  if (estado === 'creado' && registro) {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Pedido {registro.numero} creado por S/ {soles(registro.total)}
        </p>
        {registro.observacionIA && <p className={styles.borradorNota}>Observaciones de la IA: {registro.observacionIA}</p>}
        {registro.ventaAdicional && <p className={styles.borradorNota}>Venta adicional: {registro.ventaAdicional}</p>}
        {registro.alertasStock?.length > 0 && (
          <p className={styles.borradorStock}>
            <AlertTriangle size={12} aria-hidden="true" /> Stock bajo: {registro.alertasStock.join(', ')}
          </p>
        )}
        <div className={styles.borradorAcciones}>
          <button
            type="button"
            className={styles.borradorCopiar}
            onClick={() => descargarArchivo(`/orders/${registro.id}/pdf`, `${registro.numero}.pdf`).catch(() => {})}
          >
            <FileDown size={13} aria-hidden="true" /> PDF
          </button>
          <button
            type="button"
            className={styles.borradorCopiar}
            onClick={() => descargarArchivo(`/orders/${registro.id}/ticket`, `${registro.numero}-ticket.pdf`).catch(() => {})}
          >
            <FileDown size={13} aria-hidden="true" /> Ticket
          </button>
          <button
            type="button"
            className={styles.borradorCopiar}
            onClick={() => {
              cerrarPanel();
              navigate('/pedidos');
            }}
          >
            Ver pedidos
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Pedido descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <p className={styles.borradorOrigen}>
        Pedido de {datos.cliente.nombre} desde {datos.codigo_solicitud}
      </p>

      {formas.length > 1 && (
        <label className={styles.borradorCampo}>
          <span>Condición de pago</span>
          <select value={pagoIdx} onChange={(e) => setPagoIdx(Number(e.target.value))}>
            {formas.map((f, i) => (
              <option key={`${f.condicion_id}-${f.valor}`} value={i}>{etiquetaPago(f.valor)}</option>
            ))}
          </select>
        </label>
      )}
      {formas.length === 1 && (
        <p className={styles.borradorNota}>Pago: {etiquetaPago(forma.valor)}</p>
      )}

      <ul className={styles.borradorItems}>
        {items.map((it, idx) => {
          const sinStock = it.stock !== null && it.stock !== undefined && it.cantidad > it.stock;
          return (
            <li key={`${idx}-${it.nombre}`}>
              <div className={styles.borradorItemFila}>
                <span className={styles.borradorNombre}>{it.cantidad} × {it.nombre}</span>
                <span className={styles.borradorSubtotal}>S/ {soles(it.cantidad * it.precio_unitario)}</span>
              </div>
              {!it.producto_id && (
                <p className={styles.borradorStock}>
                  <AlertTriangle size={12} aria-hidden="true" /> Producto sin vincular al catálogo
                </p>
              )}
              {sinStock && (
                <p className={styles.borradorStock}>
                  <AlertTriangle size={12} aria-hidden="true" />
                  {it.stock === 0 ? 'Sin stock disponible' : `Solo hay ${it.stock} en stock`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {datos.advertencias?.length > 0 && <p className={styles.borradorNota}>{datos.advertencias.join(' ')}</p>}
      {error && <p className={styles.borradorError} role="alert">{error}</p>}

      <div className={styles.borradorPie}>
        <div className={styles.borradorTotales}>
          <span className={styles.borradorTotal}>Total <strong>S/ {soles(total)}</strong></span>
          {datos.descuento_pactado_pct > 0 && (
            <span className={styles.borradorDescuento}>Incluye descuento pactado de {datos.descuento_pactado_pct}%</span>
          )}
        </div>
        <div className={styles.borradorAcciones}>
          <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'creando'}>
            <X size={13} aria-hidden="true" /> Descartar
          </button>
          <button type="button" className={styles.borradorConfirmar} onClick={crear} disabled={hayProblemas || estado === 'creando'}>
            {estado === 'creando' ? 'Creando…' : 'Crear pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
