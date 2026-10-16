import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

export default function AccionStock({ mensajeId, datos }) {
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'pendiente');
  const [stockFinal, setStockFinal] = useState(resuelto?.stock ?? datos.stock_nuevo);
  const [error, setError] = useState(null);

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const aplicar = async () => {
    setEstado('aplicando');
    setError(null);
    try {
      const producto = await apiRequest(`/products/${datos.producto_id}/reponer`, {
        method: 'POST',
        body: JSON.stringify({
          cantidad: datos.cantidad,
          motivo: 'Reposición registrada desde el agente',
        }),
      });
      const stock = producto?.stock_actual ?? datos.stock_nuevo;
      guardarResuelto(mensajeId, { estado: 'aplicado', stock });
      setStockFinal(stock);
      setEstado('aplicado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la reposición.');
      setEstado('pendiente');
    }
  };

  if (estado === 'aplicado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Stock de {datos.nombre} actualizado: {stockFinal} u.
        </p>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Reposición descartada</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <div className={styles.accionEstadoFila}>
        <strong>{datos.nombre}</strong>
        <span>Entrada de {datos.cantidad} u.</span>
      </div>
      <p className={styles.accionEstadoCambio}>
        <span>{datos.stock_actual} u.</span>
        <ArrowRight size={14} aria-hidden="true" />
        <strong>{datos.stock_nuevo} u.</strong>
      </p>
      {error && <p className={styles.borradorError} role="alert">{error}</p>}
      <div className={styles.borradorAcciones}>
        <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'aplicando'}>
          <X size={13} aria-hidden="true" /> Descartar
        </button>
        <button type="button" className={styles.borradorConfirmar} onClick={aplicar} disabled={estado === 'aplicando'}>
          {estado === 'aplicando' ? 'Registrando…' : 'Registrar entrada'}
        </button>
      </div>
    </div>
  );
}
