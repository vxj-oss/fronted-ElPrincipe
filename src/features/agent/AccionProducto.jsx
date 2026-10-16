import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const soles = (n) =>
  `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatear = (valor, formato) => (formato === 'soles' ? soles(valor) : String(valor));

const TITULO = {
  editar: 'Editar producto',
  eliminar: 'Eliminar producto',
  reactivar: 'Reactivar producto',
};

export default function AccionProducto({ mensajeId, datos }) {
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'pendiente');
  const [resultado, setResultado] = useState(resuelto?.mensaje || '');
  const [error, setError] = useState(null);
  const eliminar = datos.accion === 'eliminar';
  const desactivar = eliminar && datos.tiene_historial;

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const aplicar = async () => {
    setEstado('aplicando');
    setError(null);
    try {
      let mensaje = '';
      if (datos.accion === 'editar') {
        await apiRequest(`/products/${datos.producto.id}`, { method: 'PUT', body: JSON.stringify(datos.payload) });
        mensaje = `«${datos.producto.nombre}» actualizado`;
      } else if (datos.accion === 'eliminar') {
        const respuesta = await apiRequest(`/products/${datos.producto.id}`, { method: 'DELETE' });
        mensaje = respuesta?.soft_delete
          ? `«${datos.producto.nombre}» desactivado (conserva su historial)`
          : `«${datos.producto.nombre}» eliminado del catálogo`;
      } else {
        await apiRequest(`/products/${datos.producto.id}/reactivar`, { method: 'PATCH' });
        mensaje = `«${datos.producto.nombre}» reactivado`;
      }
      guardarResuelto(mensajeId, { estado: 'aplicado', mensaje });
      setResultado(mensaje);
      setEstado('aplicado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo aplicar el cambio.');
      setEstado('pendiente');
    }
  };

  if (estado === 'aplicado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> {resultado}
        </p>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Cambio de producto descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <div className={styles.accionEstadoFila}>
        <strong>{TITULO[datos.accion]}</strong>
        <span>
          {datos.producto.nombre} · {datos.producto.sku}
        </span>
      </div>

      {datos.accion === 'editar' && (
        <ul className={styles.cambiosLista}>
          {datos.cambios.map((c) => (
            <li key={c.campo}>
              <span className={styles.cambioEtiqueta}>{c.etiqueta}</span>
              <span className={styles.accionEstadoCambio}>
                <span>{formatear(c.actual, c.formato)}</span>
                <ArrowRight size={13} aria-hidden="true" />
                <strong>{formatear(c.nuevo, c.formato)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}

      {(datos.advertencias || []).map((a) => (
        <p key={a} className={styles.borradorStock}>
          <AlertTriangle size={12} aria-hidden="true" /> {a}
        </p>
      ))}
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
          {estado === 'aplicando'
            ? 'Aplicando…'
            : eliminar
              ? desactivar ? 'Sí, desactivar' : 'Sí, eliminar'
              : datos.accion === 'reactivar' ? 'Reactivar' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
