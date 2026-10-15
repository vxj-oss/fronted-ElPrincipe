import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, FileDown, Minus, Plus, Share2, X } from 'lucide-react';
import { compartirArchivo, puedeCompartirArchivos } from '../../utils/descargas';
import { fetchClientes } from '../customers/customersService';
import { crearSolicitud, descargarCotizacionPdf, CANALES_RECEPCION } from '../customer_requests/customerRequestsService';
import { EMPRESA } from '../../constants/appConstants';
import styles from './agent.module.css';

const CLAVE_RESUELTOS = 'agente_borradores_resueltos';

let clientesPromesa = null;
function cargarClientes() {
  if (!clientesPromesa) {
    clientesPromesa = fetchClientes()
      .then((lista) => lista.filter((c) => c.activo))
      .catch(() => {
        clientesPromesa = null;
        return [];
      });
  }
  return clientesPromesa;
}

function leerResueltos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESUELTOS) || '{}');
  } catch {
    return {};
  }
}

function guardarResuelto(id, valor) {
  try {
    localStorage.setItem(CLAVE_RESUELTOS, JSON.stringify({ ...leerResueltos(), [id]: valor }));
  } catch {
    return;
  }
}

const soles = (n) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const subtotalDe = (it) => (parseFloat(it.precioEsperado) || 0) * it.cant;

function itemsIniciales(datos) {
  return (datos.items || []).map((it) => ({
    producto_id: it.producto_id,
    nombre: it.nombre,
    cant: it.cantidad,
    precioEsperado: it.precio_esperado ?? '',
    stock: it.stock ?? null,
    opciones: (it.opciones || []).map((o) => ({
      id: o.producto_id,
      nombre: o.nombre,
      precio: o.precio,
      stock: o.stock ?? null,
    })),
  }));
}

function textoWhatsApp({ cliente, items, total, descuento }) {
  const lineas = items.map((it) => {
    const precio = parseFloat(it.precioEsperado);
    const importe = precio ? `S/ ${soles(precio * it.cant)}` : 'precio por confirmar';
    return `• ${it.cant} × ${it.nombre} — ${importe}`;
  });
  const partes = [
    `Hola${cliente ? ` ${cliente}` : ''}, te comparto tu cotización:`,
    '',
    ...lineas,
    '',
    `Total: S/ ${soles(total)}`,
  ];
  if (descuento > 0) {
    partes.push(`Con tu descuento pactado de ${descuento}%: S/ ${soles(total * (1 - descuento / 100))}`);
  }
  partes.push('', `Quedo atento a tu confirmación. — ${EMPRESA.NOMBRE}`);
  return partes.join('\n');
}

async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let copiado = false;
    try {
      copiado = document.execCommand('copy');
    } catch {
      copiado = false;
    }
    document.body.removeChild(area);
    return copiado;
  }
}

function BotonCopiar({ obtenerTexto }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const ok = await copiarAlPortapapeles(obtenerTexto());
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <button type="button" className={styles.borradorCopiar} onClick={copiar}>
      {copiado ? <CheckCircle2 size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copiado ? 'Copiado' : 'Copiar para WhatsApp'}
    </button>
  );
}

export default function BorradorCotizacion({ mensajeId, datos, inicioAtencion }) {
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(datos.cliente?.id ?? '');
  const [canal, setCanal] = useState('Presencial');
  const [items, setItems] = useState(() => itemsIniciales(datos));
  const [sugerencias, setSugerencias] = useState(datos.sugerencias || []);
  const [estado, setEstado] = useState(resuelto?.estado || 'borrador');
  const [registro, setRegistro] = useState(resuelto);
  const [error, setError] = useState(null);

  const descuento = datos.descuento_pactado_pct || 0;

  useEffect(() => {
    if (estado !== 'borrador') return;
    cargarClientes().then(setClientes);
  }, [estado]);

  const total = useMemo(() => items.reduce((acc, it) => acc + subtotalDe(it), 0), [items]);
  const pendientes = items.some((it) => it.opciones.length > 0);
  const puedeRegistrar = Boolean(clienteId) && !pendientes && estado === 'borrador';

  const nombreCliente = () => {
    const elegido = clientes.find((c) => String(c.id) === String(clienteId));
    return elegido ? elegido.nombre || elegido.razon_social : datos.cliente?.nombre || '';
  };

  const cambiarCantidad = (idx, delta) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, cant: Math.max(1, it.cant + delta) } : it))
    );

  const elegirOpcion = (idx, id) => {
    const opcionId = parseInt(id, 10);
    setItems((prev) =>
      prev.map((it, i) => {
        const opcion = i === idx ? it.opciones.find((o) => o.id === opcionId) : null;
        return opcion
          ? {
              ...it,
              producto_id: opcion.id,
              nombre: opcion.nombre,
              precioEsperado: opcion.precio,
              stock: opcion.stock,
              opciones: [],
            }
          : it;
      })
    );
  };

  const agregarSugerencia = (sugerido) => {
    setItems((prev) => [
      ...prev,
      {
        producto_id: sugerido.producto_id,
        nombre: sugerido.nombre,
        cant: 1,
        precioEsperado: sugerido.precio,
        stock: sugerido.stock ?? null,
        opciones: [],
      },
    ]);
    setSugerencias((prev) => prev.filter((s) => s.producto_id !== sugerido.producto_id));
  };

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const registrar = async () => {
    setEstado('registrando');
    setError(null);
    try {
      const creada = await crearSolicitud({
        cliente_id: clienteId,
        canal,
        observaciones: datos.nota,
        detalles: items,
        horaAperturaModal: inicioAtencion || null,
      });
      const guardado = {
        estado: 'registrado',
        id: creada.id,
        codigo: creada.codigo,
        cliente: nombreCliente(),
        total,
        items: items.map(({ nombre, cant, precioEsperado }) => ({ nombre, cant, precioEsperado })),
        observacionIA:
          creada.resultadoAuditoria === 'Con_Observaciones' ? creada.descripcionAuditoria : null,
      };
      guardarResuelto(mensajeId, guardado);
      setRegistro(guardado);
      setEstado('registrado');
    } catch (err) {
      setError(err.message || 'No se pudo registrar la cotización.');
      setEstado('borrador');
    }
  };

  if (estado === 'registrado' && registro) {
    const itemsGuardados = registro.items || items;
    const totalGuardado = registro.total ?? total;
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Cotización {registro.codigo} registrada
        </p>
        {registro.observacionIA && (
          <p className={styles.borradorNota}>Observaciones de la IA: {registro.observacionIA}</p>
        )}
        <div className={styles.borradorAcciones}>
          <BotonCopiar
            obtenerTexto={() =>
              textoWhatsApp({
                cliente: registro.cliente || datos.cliente?.nombre,
                items: itemsGuardados,
                total: totalGuardado,
                descuento,
              })
            }
          />
          {registro.id && (
            <button
              type="button"
              className={styles.borradorCopiar}
              onClick={() => descargarCotizacionPdf(registro.id, registro.codigo).catch(() => {})}
            >
              <FileDown size={13} aria-hidden="true" /> Descargar PDF
            </button>
          )}
          {registro.id && puedeCompartirArchivos() && (
            <button
              type="button"
              className={styles.borradorCopiar}
              onClick={() =>
                compartirArchivo(`/customer-requests/${registro.id}/pdf`, `${registro.codigo}.pdf`, `Cotización ${registro.codigo}`).catch(() => {})
              }
            >
              <Share2 size={13} aria-hidden="true" /> Compartir
            </button>
          )}
        </div>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Borrador descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      {datos.origen && <p className={styles.borradorOrigen}>Basado en {datos.origen}</p>}

      <div className={styles.borradorCampos}>
        <label className={styles.borradorCampo}>
          <span>Cliente</span>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Seleccionar cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre || c.razon_social}</option>
            ))}
            {datos.cliente && !clientes.some((c) => c.id === datos.cliente.id) && (
              <option value={datos.cliente.id}>{datos.cliente.nombre}</option>
            )}
          </select>
        </label>
        <label className={styles.borradorCampo}>
          <span>Canal</span>
          <select value={canal} onChange={(e) => setCanal(e.target.value)}>
            {CANALES_RECEPCION.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className={styles.borradorItems}>
        {items.map((it, idx) => {
          const sinStock = it.stock !== null && it.cant > it.stock;
          return (
            <li key={`${idx}-${it.nombre}`} className={it.opciones.length ? styles.borradorItemPendiente : ''}>
              <div className={styles.borradorItemFila}>
                <span className={styles.borradorNombre}>{it.nombre}</span>
                <div className={styles.borradorCant}>
                  <button type="button" onClick={() => cambiarCantidad(idx, -1)} disabled={it.cant <= 1} aria-label="Disminuir">
                    <Minus size={12} aria-hidden="true" />
                  </button>
                  <span>{it.cant}</span>
                  <button type="button" onClick={() => cambiarCantidad(idx, 1)} aria-label="Aumentar">
                    <Plus size={12} aria-hidden="true" />
                  </button>
                </div>
                <span className={styles.borradorSubtotal}>S/ {soles(subtotalDe(it))}</span>
              </div>
              {sinStock && (
                <p className={styles.borradorStock}>
                  <AlertTriangle size={12} aria-hidden="true" />
                  {it.stock === 0 ? 'Sin stock disponible' : `Solo hay ${it.stock} en stock`}
                </p>
              )}
              {it.opciones.length > 0 && (
                <select
                  className={styles.borradorOpcion}
                  value=""
                  onChange={(e) => elegirOpcion(idx, e.target.value)}
                  aria-label={`Elegir producto para ${it.nombre}`}
                >
                  <option value="">Elige cuál ({it.opciones.length} opciones)…</option>
                  {it.opciones.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre} — S/ {soles(o.precio)}</option>
                  ))}
                </select>
              )}
            </li>
          );
        })}
      </ul>

      {sugerencias.length > 0 && (
        <div className={styles.borradorSugerencias}>
          <span>Suelen llevar también:</span>
          {sugerencias.map((s) => (
            <button key={s.producto_id} type="button" onClick={() => agregarSugerencia(s)}>
              <Plus size={11} aria-hidden="true" /> {s.nombre}
            </button>
          ))}
        </div>
      )}

      {datos.advertencias?.length > 0 && (
        <p className={styles.borradorNota}>{datos.advertencias.join(' ')}</p>
      )}
      {error && <p className={styles.borradorError} role="alert">{error}</p>}

      <div className={styles.borradorPie}>
        <div className={styles.borradorTotales}>
          <span className={styles.borradorTotal}>Total aprox. <strong>S/ {soles(total)}</strong></span>
          {descuento > 0 && (
            <span className={styles.borradorDescuento}>
              Con descuento pactado ({descuento}%): <strong>S/ {soles(total * (1 - descuento / 100))}</strong>
            </span>
          )}
        </div>
        <div className={styles.borradorAcciones}>
          <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'registrando'}>
            <X size={13} aria-hidden="true" /> Descartar
          </button>
          <button type="button" className={styles.borradorConfirmar} onClick={registrar} disabled={!puedeRegistrar}>
            {estado === 'registrando' ? 'Registrando…' : 'Registrar cotización'}
          </button>
        </div>
      </div>

      <BotonCopiar
        obtenerTexto={() => textoWhatsApp({ cliente: nombreCliente(), items, total, descuento })}
      />
    </div>
  );
}
