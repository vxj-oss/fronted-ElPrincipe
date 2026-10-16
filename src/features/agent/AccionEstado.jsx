import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { cambiarEstadoPedido } from '../orders/ordersService';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const soles = (n) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AccionEstado({ mensajeId, datos }) {
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'pendiente');
  const [error, setError] = useState(null);

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const aplicar = async () => {
    setEstado('aplicando');
    setError(null);
    try {
      await cambiarEstadoPedido(datos.pedido_id, datos.estado_nuevo);
      guardarResuelto(mensajeId, { estado: 'aplicado' });
      setEstado('aplicado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado.');
      setEstado('pendiente');
    }
  };

  if (estado === 'aplicado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Pedido {datos.codigo} ahora está {datos.estado_nuevo.toLowerCase()}
        </p>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Cambio descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <div className={styles.accionEstadoFila}>
        <strong>{datos.codigo}</strong>
        <span>{datos.cliente} · S/ {soles(datos.total)}</span>
      </div>
      <p className={styles.accionEstadoCambio}>
        <span>{datos.estado_actual}</span>
        <ArrowRight size={14} aria-hidden="true" />
        <strong>{datos.estado_nuevo}</strong>
      </p>
      {error && <p className={styles.borradorError} role="alert">{error}</p>}
      <div className={styles.borradorAcciones}>
        <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'aplicando'}>
          <X size={13} aria-hidden="true" /> Descartar
        </button>
        <button type="button" className={styles.borradorConfirmar} onClick={aplicar} disabled={estado === 'aplicando'}>
          {estado === 'aplicando' ? 'Aplicando…' : `Pasar a ${datos.estado_nuevo.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}
