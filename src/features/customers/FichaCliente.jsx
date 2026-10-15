import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, MessageCircle } from 'lucide-react';
import { fetchFichaCliente } from './customersService';
import styles from './customers.module.css';

const soles = (n) =>
  Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleDateString('es-PE') : '—');

function textoUltimaCompra(resumen) {
  if (resumen.dias_sin_comprar === null || resumen.dias_sin_comprar === undefined) return 'Sin compras';
  if (resumen.dias_sin_comprar === 0) return 'Hoy';
  if (resumen.dias_sin_comprar === 1) return 'Ayer';
  return `Hace ${resumen.dias_sin_comprar} días`;
}

function enlaceWhatsApp(telefono) {
  const digitos = (telefono || '').replace(/\D/g, '');
  const numero = digitos.length === 9 ? `51${digitos}` : digitos.length === 11 && digitos.startsWith('51') ? digitos : null;
  return numero ? `https://wa.me/${numero}` : null;
}

export default function FichaCliente({ clienteId, telefono }) {
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    setFicha(null);
    setError(false);
    fetchFichaCliente(clienteId)
      .then((datos) => activo && setFicha(datos))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [clienteId]);

  if (error) return <p className={styles.fichaVacio}>No se pudo cargar el resumen comercial.</p>;
  if (!ficha) return <p className={styles.fichaVacio}>Cargando resumen comercial…</p>;

  const { resumen, productos_frecuentes: productos, cotizaciones_pendientes: pendientes, ultimos_pedidos: pedidos, condiciones } = ficha;
  const enRiesgo = (resumen.dias_sin_comprar ?? 0) >= 30;
  const whatsapp = enlaceWhatsApp(telefono);

  return (
    <section className={styles.ficha} aria-label="Resumen comercial">
      <h3 className={styles.fichaTitulo}>Resumen comercial</h3>

      <div className={styles.fichaStats}>
        <div>
          <span>Total comprado</span>
          <strong>S/ {soles(resumen.total_comprado)}</strong>
        </div>
        <div>
          <span>Pedidos</span>
          <strong>{resumen.pedidos}</strong>
        </div>
        <div>
          <span>Ticket promedio</span>
          <strong>S/ {soles(resumen.ticket_promedio)}</strong>
        </div>
        <div className={enRiesgo ? styles.fichaStatAlerta : ''}>
          <span>Última compra</span>
          <strong>{textoUltimaCompra(resumen)}</strong>
        </div>
      </div>

      {condiciones.length > 0 && (
        <div className={styles.fichaBloque}>
          <h4>Condición pactada</h4>
          <div className={styles.fichaChips}>
            {condiciones.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {productos.length > 0 && (
        <div className={styles.fichaBloque}>
          <h4>Lo que más lleva</h4>
          <ul className={styles.fichaLista}>
            {productos.map((p) => (
              <li key={p.nombre}>
                <span>{p.nombre}</span>
                <strong>{p.unidades} u.</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.items.length > 0 && (
        <div className={styles.fichaBloque}>
          <h4>Cotizaciones pendientes ({pendientes.total})</h4>
          <ul className={styles.fichaLista}>
            {pendientes.items.map((c) => (
              <li key={c.id}>
                <span>{c.codigo} · {c.items} {c.items === 1 ? 'ítem' : 'ítems'}</span>
                <strong>{fechaCorta(c.fecha)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pedidos.length > 0 && (
        <div className={styles.fichaBloque}>
          <h4>Últimos pedidos</h4>
          <ul className={styles.fichaLista}>
            {pedidos.map((p) => (
              <li key={p.id}>
                <span>{p.codigo} · {fechaCorta(p.fecha)} · {p.estado}</span>
                <strong>S/ {soles(p.total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.fichaAcciones}>
        <button
          type="button"
          className={styles.fichaBtn}
          onClick={() => navigate(`/solicitudes?nueva=1&cliente=${clienteId}`)}
        >
          <FileSpreadsheet size={14} aria-hidden="true" /> Nueva cotización
        </button>
        {whatsapp && (
          <a className={`${styles.fichaBtn} ${styles.fichaBtnWhatsApp}`} href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
