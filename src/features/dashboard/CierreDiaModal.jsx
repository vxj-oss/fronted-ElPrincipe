import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, FileDown, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import VistaTicketModal from '../../components/ui/VistaTicketModal';
import { fechaHoyLima } from '../../utils/fechas';
import { fetchResumenCierre, imprimirBlobPdf, obtenerTicketCierre } from './dashboardService';
import styles from './cierre.module.css';

const TASA_IGV = 1.18;

const soles = (valor) =>
  Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

let contador = 0;
const aEditable = (f) => ({
  clave: `l${contador++}`,
  nombre: f.nombre,
  cantidad: String(f.cantidad),
  precio: String(f.precio_unitario),
});

const valida = (l) =>
  l.nombre.trim() && Number.isInteger(Number(l.cantidad)) && Number(l.cantidad) >= 1 && Number(l.precio) >= 0 && l.precio !== '';

export default function CierreDiaModal({ open, onClose }) {
  const [fecha, setFecha] = useState(fechaHoyLima());
  const [resumen, setResumen] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState('');
  const [verPedidos, setVerPedidos] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);

  const cargar = useCallback(async (dia) => {
    setCargando(true);
    setError('');
    try {
      const datos = await fetchResumenCierre(dia);
      setResumen(datos);
      setLineas(datos.lineas.map(aEditable));
    } catch (e) {
      setResumen(null);
      setLineas([]);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (open) cargar(fecha);
  }, [open, fecha, cargar]);

  const total = useMemo(
    () => redondear(lineas.filter(valida).reduce((acc, l) => acc + redondear(Number(l.cantidad) * Number(l.precio)), 0)),
    [lineas]
  );
  const valorVenta = redondear(total / TASA_IGV);
  const igv = redondear(total - valorVenta);
  const invalidas = lineas.filter((l) => !valida(l)).length;

  const editado = useMemo(() => {
    if (!resumen) return false;
    if (lineas.length !== resumen.lineas.length) return true;
    return lineas.some((l, i) => {
      const o = resumen.lineas[i];
      return l.nombre !== o.nombre || Number(l.cantidad) !== o.cantidad || Number(l.precio) !== o.precio_unitario;
    });
  }, [lineas, resumen]);

  const cambiar = (clave, campo, valor) =>
    setLineas((actual) => actual.map((l) => (l.clave === clave ? { ...l, [campo]: valor } : l)));
  const quitar = (clave) => setLineas((actual) => actual.filter((l) => l.clave !== clave));
  const agregar = () =>
    setLineas((actual) => [...actual, aEditable({ nombre: '', cantidad: 1, precio_unitario: '' })]);
  const restablecer = () => resumen && setLineas(resumen.lineas.map(aEditable));

  const lineasParaTicket = () =>
    lineas.filter(valida).map((l) => ({
      nombre: l.nombre.trim(),
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio),
    }));

  const obtenerTicket = () => obtenerTicketCierre(fecha, lineasParaTicket());

  const imprimir = async () => {
    setTrabajando('imprimir');
    try {
      imprimirBlobPdf(await obtenerTicket());
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando('');
    }
  };

  const descargar = async () => {
    setTrabajando('descargar');
    try {
      const url = URL.createObjectURL(await obtenerTicket());
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `cierre_dia_${fecha}-ticket.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando('');
    }
  };

  const bloqueado = !resumen || lineasParaTicket().length === 0 || invalidas > 0 || Boolean(trabajando);
  const diferencia = resumen ? redondear(total - resumen.total_pedidos) : 0;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="Cierre del día · Verificar antes de imprimir"
        footer={
          <>
            <button type="button" className={styles.cierreBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className={styles.cierreBtn} onClick={() => setVistaPrevia(true)} disabled={bloqueado}>
              <Eye size={14} aria-hidden="true" /> Vista previa
            </button>
            <button type="button" className={styles.cierreBtn} onClick={descargar} disabled={bloqueado}>
              <FileDown size={14} aria-hidden="true" /> Descargar
            </button>
            <button
              type="button"
              className={`${styles.cierreBtn} ${styles.cierreBtnPrimario}`}
              onClick={imprimir}
              disabled={bloqueado}
            >
              <Printer size={14} aria-hidden="true" /> {trabajando === 'imprimir' ? 'Preparando…' : 'Imprimir'}
            </button>
          </>
        }
      >
        <div className={styles.cierreFecha}>
          <label htmlFor="cierre-fecha">Fecha del cierre</label>
          <input
            id="cierre-fecha"
            type="date"
            value={fecha}
            max={fechaHoyLima()}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
          />
        </div>

        {error && <p className={styles.cierreError}>{error}</p>}
        {cargando && <p className={styles.cierreVacio}>Cargando ventas del día…</p>}

        {!cargando && resumen && (
          <>
            <div className={styles.cierreResumen}>
              <div><span>Pedidos incluidos</span><strong>{resumen.pedidos.length}</strong></div>
              <div><span>Venta gravada</span><strong>S/ {soles(valorVenta)}</strong></div>
              <div><span>IGV (18 %)</span><strong>S/ {soles(igv)}</strong></div>
              <div className={styles.cierreTotal}><span>Total del ticket</span><strong>S/ {soles(total)}</strong></div>
            </div>

            {diferencia === 0 ? (
              <p className={styles.cierreOk}>
                <CheckCircle2 size={14} aria-hidden="true" /> El ticket coincide con el total de los pedidos del día
                (S/ {soles(resumen.total_pedidos)}).
              </p>
            ) : (
              <p className={styles.cierreAviso}>
                <AlertTriangle size={14} aria-hidden="true" /> El ticket difiere en S/ {soles(Math.abs(diferencia))} del total de los
                pedidos del día (S/ {soles(resumen.total_pedidos)}).
                {editado ? ' Es por los cambios que hiciste.' : ' Revísalo antes de imprimir.'}
              </p>
            )}
            {editado && (
              <p className={styles.cierreNota}>
                Estás editando solo el ticket: los pedidos y el stock no se modifican.
                <button type="button" className={styles.cierreEnlace} onClick={restablecer}>
                  <RotateCcw size={11} aria-hidden="true" /> Restablecer
                </button>
              </p>
            )}
            {resumen.excluidos.cantidad > 0 && (
              <p className={styles.cierreNota}>
                No incluye {resumen.excluidos.cantidad} {resumen.excluidos.cantidad === 1 ? 'pedido' : 'pedidos'} del día sin
                aprobar o cancelados (S/ {soles(resumen.excluidos.monto)}): {resumen.excluidos.codigos.join(', ')}.
              </p>
            )}

            <div className={styles.cierreTablaWrap}>
              <table className={styles.cierreTabla}>
                <thead>
                  <tr>
                    <th>Cant.</th>
                    <th>Producto</th>
                    <th className={styles.cierreNum}>P/U</th>
                    <th className={styles.cierreNum}>Total</th>
                    <th aria-label="Quitar" />
                  </tr>
                </thead>
                <tbody>
                  {lineas.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.cierreVacio}>No hay productos. Agrega uno si lo necesitas.</td>
                    </tr>
                  )}
                  {lineas.map((l) => (
                    <tr key={l.clave} className={valida(l) ? '' : styles.cierreFilaInvalida}>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className={`${styles.cierreInput} ${styles.cierreInputCorto}`}
                          value={l.cantidad}
                          onChange={(e) => cambiar(l.clave, 'cantidad', e.target.value)}
                          aria-label="Cantidad"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.cierreInput}
                          value={l.nombre}
                          onChange={(e) => cambiar(l.clave, 'nombre', e.target.value)}
                          placeholder="Nombre del producto"
                          aria-label="Producto"
                        />
                      </td>
                      <td className={styles.cierreNum}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`${styles.cierreInput} ${styles.cierreInputPrecio}`}
                          value={l.precio}
                          onChange={(e) => cambiar(l.clave, 'precio', e.target.value)}
                          aria-label="Precio unitario"
                        />
                      </td>
                      <td className={styles.cierreNum}>
                        {valida(l) ? soles(redondear(Number(l.cantidad) * Number(l.precio))) : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.cierreQuitar}
                          onClick={() => quitar(l.clave)}
                          aria-label="Quitar producto"
                          title="Quitar del ticket"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    <td className={styles.cierreNum}>{soles(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className={styles.cierreAccionesTabla}>
              <button type="button" className={styles.cierreEnlace} onClick={agregar}>
                <Plus size={12} aria-hidden="true" /> Agregar producto
              </button>
              {invalidas > 0 && (
                <span className={styles.cierreInvalidoTexto}>
                  Completa o quita las filas marcadas (cantidad entera desde 1, producto y precio).
                </span>
              )}
            </div>

            {resumen.pedidos.length > 0 && (
              <>
                <button type="button" className={styles.cierreEnlace} onClick={() => setVerPedidos((v) => !v)}>
                  {verPedidos ? 'Ocultar' : 'Ver'} los {resumen.pedidos.length} pedidos incluidos
                </button>
                {verPedidos && (
                  <ul className={styles.cierrePedidos}>
                    {resumen.pedidos.map((p) => (
                      <li key={p.codigo}>
                        <span>{p.hora} · {p.codigo} · {p.cliente}</span>
                        <strong>S/ {soles(p.total)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </Modal>

      <VistaTicketModal
        open={vistaPrevia}
        onClose={() => setVistaPrevia(false)}
        titulo="Vista previa del ticket de cierre"
        obtenerBlob={obtenerTicket}
        nombreArchivo={`cierre_dia_${fecha}-ticket.pdf`}
      />
    </>
  );
}
