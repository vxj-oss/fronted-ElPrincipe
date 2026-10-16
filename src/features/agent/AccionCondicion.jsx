import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const CAMPO_POR_TIPO = {
  Credito: 'dias_plazo_pactados',
  Descuento: 'porcentaje_descuento',
  Forma_Pago: 'forma_pago_pactada',
};

const TITULO = {
  crear: 'Pactar condición',
  actualizar: 'Cambiar condición',
  eliminar: 'Eliminar condición',
};

function valorParaApi(tipo, valor) {
  return tipo === 'Forma_Pago' ? valor : Number(valor);
}

export default function AccionCondicion({ mensajeId, datos }) {
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'pendiente');
  const [error, setError] = useState(null);
  const eliminar = datos.accion === 'eliminar';

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const aplicar = async () => {
    setEstado('aplicando');
    setError(null);
    try {
      if (datos.accion === 'eliminar') {
        await apiRequest(`/commercial-terms/${datos.condicion_id}`, { method: 'DELETE' });
      } else if (datos.accion === 'actualizar') {
        await apiRequest(`/commercial-terms/${datos.condicion_id}`, {
          method: 'PUT',
          body: JSON.stringify({ [CAMPO_POR_TIPO[datos.tipo_condicion]]: valorParaApi(datos.tipo_condicion, datos.valor) }),
        });
      } else {
        await apiRequest('/commercial-terms/', {
          method: 'POST',
          body: JSON.stringify({
            cliente_id: datos.cliente.id,
            tipo_condicion: datos.tipo_condicion,
            [CAMPO_POR_TIPO[datos.tipo_condicion]]: valorParaApi(datos.tipo_condicion, datos.valor),
          }),
        });
      }
      guardarResuelto(mensajeId, { estado: 'aplicado' });
      setEstado('aplicado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo aplicar el cambio.');
      setEstado('pendiente');
    }
  };

  if (estado === 'aplicado') {
    const texto = {
      crear: `«${datos.etiqueta_nueva}» pactado con ${datos.cliente.nombre}`,
      actualizar: `Condición de ${datos.cliente.nombre} cambiada a «${datos.etiqueta_nueva}»`,
      eliminar: `Condición «${datos.etiqueta_actual}» eliminada de ${datos.cliente.nombre}`,
    }[datos.accion];
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> {texto}
        </p>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Cambio de condición descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <div className={styles.accionEstadoFila}>
        <strong>{TITULO[datos.accion]}</strong>
        <span>{datos.cliente.nombre}</span>
      </div>

      {datos.accion === 'crear' && (
        <p className={styles.accionEstadoCambio}>
          <strong>{datos.etiqueta_nueva}</strong>
        </p>
      )}
      {datos.accion === 'actualizar' && (
        <p className={styles.accionEstadoCambio}>
          <span>{datos.etiqueta_actual}</span>
          <ArrowRight size={14} aria-hidden="true" />
          <strong>{datos.etiqueta_nueva}</strong>
        </p>
      )}
      {eliminar && (
        <p className={styles.accionEstadoCambio}>
          <strong>{datos.etiqueta_actual}</strong>
        </p>
      )}

      {datos.pedidos_pendientes > 0 && (
        <p className={styles.borradorStock}>
          <AlertTriangle size={12} aria-hidden="true" />
          Esto vuelve a evaluar {datos.pedidos_pendientes === 1 ? 'el pedido pendiente' : `los ${datos.pedidos_pendientes} pedidos pendientes`} de este cliente.
        </p>
      )}
      {error && <p className={styles.borradorError} role="alert">{error}</p>}

      <div className={styles.borradorAcciones}>
        <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'aplicando'}>
          <X size={13} aria-hidden="true" /> Descartar
        </button>
        <button
          type="button"
          className={`${styles.borradorConfirmar} ${eliminar ? styles.borradorPeligro : ''}`}
          onClick={aplicar}
          disabled={estado === 'aplicando'}
        >
          {estado === 'aplicando' ? 'Aplicando…' : eliminar ? 'Sí, eliminar' : datos.accion === 'actualizar' ? 'Cambiar' : 'Pactar condición'}
        </button>
      </div>
    </div>
  );
}
