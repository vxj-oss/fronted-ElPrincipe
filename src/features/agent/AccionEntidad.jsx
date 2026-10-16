import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const soles = (n) =>
  `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function configuracion(datos) {
  if (datos.tipo === 'accion_cotizacion') {
    return {
      titulo: 'Eliminar cotización',
      sujeto: `${datos.codigo} · ${datos.cliente}`,
      peligro: true,
      boton: 'Sí, eliminar',
      hecho: `Cotización ${datos.codigo} eliminada`,
      ejecutar: () => apiRequest(`/customer-requests/${datos.solicitud_id}`, { method: 'DELETE' }),
    };
  }
  if (datos.tipo === 'accion_pedido_items') {
    return {
      titulo: 'Cambiar productos del pedido',
      sujeto: `${datos.codigo} · ${datos.cliente}`,
      peligro: false,
      boton: 'Guardar cambios',
      hecho: `Pedido ${datos.codigo} actualizado`,
      ejecutar: () =>
        apiRequest(`/orders/${datos.pedido_id}`, { method: 'PUT', body: JSON.stringify({ items: datos.items_payload }) }),
    };
  }
  const nombre = datos.cliente.nombre;
  const base = { sujeto: nombre, peligro: false };
  if (datos.accion === 'editar') {
    return {
      ...base,
      titulo: 'Editar cliente',
      boton: 'Guardar cambios',
      hecho: `Cliente ${nombre} actualizado`,
      ejecutar: () => apiRequest(`/customers/${datos.cliente.id}`, { method: 'PUT', body: JSON.stringify(datos.payload) }),
    };
  }
  if (datos.accion === 'desactivar') {
    return {
      ...base,
      titulo: 'Desactivar cliente',
      boton: 'Sí, desactivar',
      hecho: `Cliente ${nombre} desactivado`,
      ejecutar: () => apiRequest(`/customers/${datos.cliente.id}`, { method: 'PUT', body: JSON.stringify({ estado: 'Inactivo' }) }),
    };
  }
  if (datos.accion === 'reactivar') {
    return {
      ...base,
      titulo: 'Reactivar cliente',
      boton: 'Reactivar',
      hecho: `Cliente ${nombre} reactivado`,
      ejecutar: () => apiRequest(`/customers/${datos.cliente.id}`, { method: 'PUT', body: JSON.stringify({ estado: 'Activo' }) }),
    };
  }
  return {
    ...base,
    titulo: 'Eliminar cliente',
    peligro: true,
    boton: datos.tiene_historial ? 'Sí, desactivar' : 'Sí, eliminar',
    hecho: datos.tiene_historial ? `Cliente ${nombre} desactivado (conserva su historial)` : `Cliente ${nombre} eliminado`,
    ejecutar: () => apiRequest(`/customers/${datos.cliente.id}`, { method: 'DELETE' }),
  };
}

export default function AccionEntidad({ mensajeId, datos }) {
  const config = useMemo(() => configuracion(datos), [datos]);
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
      await config.ejecutar();
      guardarResuelto(mensajeId, { estado: 'aplicado' });
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
          <CheckCircle2 size={15} aria-hidden="true" /> {config.hecho}
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
        <strong>{config.titulo}</strong>
        <span>{config.sujeto}</span>
      </div>

      {datos.cambios?.length > 0 && (
        <ul className={styles.cambiosLista}>
          {datos.cambios.map((c) => (
            <li key={c.campo}>
              <span className={styles.cambioEtiqueta}>{c.etiqueta}</span>
              <span className={styles.accionEstadoCambio}>
                <span>{String(c.actual)}</span>
                <ArrowRight size={13} aria-hidden="true" />
                <strong>{String(c.nuevo)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}

      {datos.lineas?.length > 0 && (
        <>
          <ul className={styles.cambiosLista}>
            {datos.lineas.map((l) => (
              <li key={l.nombre}>
                <span className={styles.cambioEtiqueta}>{l.nombre}</span>
                <span className={styles.accionEstadoCambio}>
                  <span>{l.antes} u.</span>
                  <ArrowRight size={13} aria-hidden="true" />
                  <strong>{l.despues === 0 ? 'se quita' : `${l.despues} u.`}</strong>
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.borradorTotal}>
            Total: {soles(datos.total_antes)} → <strong>{soles(datos.total_despues)}</strong>
          </p>
        </>
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
          className={`${styles.borradorConfirmar} ${config.peligro ? styles.borradorPeligro : ''}`}
          onClick={aplicar}
          disabled={estado === 'aplicando'}
        >
          {estado === 'aplicando' ? 'Aplicando…' : config.boton}
        </button>
      </div>
    </div>
  );
}
