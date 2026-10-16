import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, PackagePlus, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAgentContext } from './AgentContext';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

const ROTACIONES = ['Alta', 'Media', 'Baja'];

export default function BorradorProducto({ mensajeId, datos }) {
  const navigate = useNavigate();
  const { cerrarPanel } = useAgentContext();
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'borrador');
  const [registro, setRegistro] = useState(resuelto);
  const [error, setError] = useState(null);
  const inicial = datos.producto;
  const [form, setForm] = useState({
    nombre: inicial.nombre,
    sku: inicial.sku,
    categoria_id: String(inicial.categoria_id),
    unidad_medida: inicial.unidad_medida,
    precio_unitario: String(inicial.precio_unitario),
    precio_costo: String(inicial.precio_costo),
    stock_actual: String(inicial.stock_actual),
    stock_minimo: String(inicial.stock_minimo),
    nivel_rotacion: inicial.nivel_rotacion,
  });

  const cambiar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  const precio = parseFloat(form.precio_unitario);
  const costo = parseFloat(form.precio_costo);
  const valido =
    form.nombre.trim().length >= 2 &&
    form.sku.trim() &&
    form.unidad_medida.trim() &&
    form.categoria_id &&
    precio >= 0 &&
    costo >= 0 &&
    estado === 'borrador';
  const margenNegativo = Number.isFinite(precio) && Number.isFinite(costo) && costo > precio;

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const registrar = async () => {
    setEstado('registrando');
    setError(null);
    try {
      const creado = await apiRequest('/products/', {
        method: 'POST',
        body: JSON.stringify({
          categoria_id: Number(form.categoria_id),
          sku: form.sku.trim(),
          nombre: form.nombre.trim(),
          unidad_medida: form.unidad_medida.trim(),
          precio_unitario: precio,
          precio_costo: costo,
          stock_actual: 0,
          stock_minimo: parseInt(form.stock_minimo, 10) || 0,
          nivel_rotacion: form.nivel_rotacion,
          activo: true,
        }),
      });
      const stockInicial = parseInt(form.stock_actual, 10) || 0;
      if (stockInicial > 0) {
        await apiRequest(`/products/${creado.id}/reponer`, {
          method: 'POST',
          body: JSON.stringify({ cantidad: stockInicial, motivo: 'Stock inicial' }),
        });
      }
      const guardado = { estado: 'registrado', id: creado.id, nombre: creado.nombre, sku: creado.sku, stock: stockInicial };
      guardarResuelto(mensajeId, guardado);
      setRegistro(guardado);
      setEstado('registrado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el producto.');
      setEstado('borrador');
    }
  };

  if (estado === 'registrado' && registro) {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Producto {registro.nombre} registrado ({registro.sku})
        </p>
        {registro.stock > 0 && <p className={styles.borradorNota}>Stock inicial registrado: {registro.stock} u.</p>}
        <div className={styles.borradorAcciones}>
          <button
            type="button"
            className={styles.borradorCopiar}
            onClick={() => {
              cerrarPanel();
              navigate(`/productos?q=${encodeURIComponent(registro.nombre)}`);
            }}
          >
            Ver en productos
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Registro de producto descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <p className={styles.borradorOrigen}>
        <PackagePlus size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Nuevo producto
      </p>

      <label className={styles.borradorCampo}>
        <span>Nombre</span>
        <input className={styles.borradorEntrada} value={form.nombre} onChange={cambiar('nombre')} maxLength={200} />
      </label>

      <div className={styles.borradorCampos}>
        <label className={styles.borradorCampo}>
          <span>Código (SKU)</span>
          <input className={styles.borradorEntrada} value={form.sku} onChange={cambiar('sku')} maxLength={50} />
        </label>
        <label className={styles.borradorCampo}>
          <span>Categoría</span>
          <select value={form.categoria_id} onChange={cambiar('categoria_id')}>
            {datos.categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className={styles.borradorCampo}>
          <span>Precio de venta (S/)</span>
          <input className={styles.borradorEntrada} value={form.precio_unitario} onChange={cambiar('precio_unitario')} inputMode="decimal" />
        </label>
        <label className={styles.borradorCampo}>
          <span>Costo (S/)</span>
          <input className={styles.borradorEntrada} value={form.precio_costo} onChange={cambiar('precio_costo')} inputMode="decimal" />
        </label>
        <label className={styles.borradorCampo}>
          <span>Stock inicial</span>
          <input className={styles.borradorEntrada} value={form.stock_actual} onChange={cambiar('stock_actual')} inputMode="numeric" />
        </label>
        <label className={styles.borradorCampo}>
          <span>Stock mínimo</span>
          <input className={styles.borradorEntrada} value={form.stock_minimo} onChange={cambiar('stock_minimo')} inputMode="numeric" />
        </label>
        <label className={styles.borradorCampo}>
          <span>Unidad de medida</span>
          <input className={styles.borradorEntrada} value={form.unidad_medida} onChange={cambiar('unidad_medida')} maxLength={100} />
        </label>
        <label className={styles.borradorCampo}>
          <span>Rotación</span>
          <select value={form.nivel_rotacion} onChange={cambiar('nivel_rotacion')}>
            {ROTACIONES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {(margenNegativo || datos.advertencias?.length > 0) && (
        <p className={styles.borradorStock}>
          <AlertTriangle size={12} aria-hidden="true" />
          {margenNegativo ? 'El costo está por encima del precio de venta: el margen sería negativo.' : datos.advertencias.join(' ')}
        </p>
      )}
      {error && <p className={styles.borradorError} role="alert">{error}</p>}

      <div className={styles.borradorAcciones}>
        <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'registrando'}>
          <X size={13} aria-hidden="true" /> Descartar
        </button>
        <button type="button" className={styles.borradorConfirmar} onClick={registrar} disabled={!valido}>
          {estado === 'registrando' ? 'Registrando…' : 'Registrar producto'}
        </button>
      </div>
    </div>
  );
}
