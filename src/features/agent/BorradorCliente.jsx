import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus, X } from 'lucide-react';
import { crearCliente, TIPOS_CLIENTE } from '../customers/customersService';
import { useAgentContext } from './AgentContext';
import { avisarDatosActualizados, guardarResuelto, leerResueltos } from './resueltos';
import styles from './agent.module.css';

export default function BorradorCliente({ mensajeId, datos }) {
  const navigate = useNavigate();
  const { usarSeguimiento, cerrarPanel, enviando } = useAgentContext();
  const resuelto = useMemo(() => leerResueltos()[mensajeId] || null, [mensajeId]);
  const [estado, setEstado] = useState(resuelto?.estado || 'borrador');
  const [registro, setRegistro] = useState(resuelto);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    nombre: datos.cliente.razon_social || '',
    tipo: datos.cliente.tipo_cliente || TIPOS_CLIENTE[0],
    ruc: datos.cliente.ruc_dni || '',
    telefono: datos.cliente.telefono || '',
    email: datos.cliente.correo || '',
    distrito: datos.cliente.distrito || '',
    direccion: datos.cliente.direccion || '',
    clasificacion: datos.cliente.clasificacion || 'Regular',
  });

  const cambiar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  const puedeRegistrar = form.nombre.trim().length >= 2 && estado === 'borrador';

  const descartar = () => {
    guardarResuelto(mensajeId, { estado: 'descartado' });
    setEstado('descartado');
  };

  const registrar = async () => {
    setEstado('registrando');
    setError(null);
    try {
      const cliente = await crearCliente({
        nombre: form.nombre,
        tipo: form.tipo,
        ruc: form.ruc,
        telefono: form.telefono,
        email: form.email,
        distrito: form.distrito || undefined,
        direccion: form.direccion,
        clasificacion: form.clasificacion,
        activo: true,
      });
      const guardado = { estado: 'registrado', id: cliente.id, nombre: cliente.nombre };
      guardarResuelto(mensajeId, guardado);
      setRegistro(guardado);
      setEstado('registrado');
      avisarDatosActualizados();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el cliente.');
      setEstado('borrador');
    }
  };

  if (estado === 'registrado' && registro) {
    return (
      <div className={`${styles.borrador} ${styles.borradorOk}`}>
        <p className={styles.borradorEstado}>
          <CheckCircle2 size={15} aria-hidden="true" /> Cliente {registro.nombre} registrado
        </p>
        <div className={styles.borradorAcciones}>
          <button
            type="button"
            className={styles.borradorCopiar}
            disabled={enviando}
            onClick={() => usarSeguimiento(`Arma una cotización para ${registro.nombre}`)}
          >
            Armar cotización
          </button>
          <button
            type="button"
            className={styles.borradorCopiar}
            onClick={() => {
              cerrarPanel();
              navigate('/clientes');
            }}
          >
            Ver clientes
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'descartado') {
    return (
      <div className={`${styles.borrador} ${styles.borradorGris}`}>
        <p className={styles.borradorEstado}>Registro de cliente descartado</p>
      </div>
    );
  }

  return (
    <div className={styles.borrador}>
      <p className={styles.borradorOrigen}>
        <UserPlus size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Nuevo cliente
      </p>

      <label className={styles.borradorCampo}>
        <span>Razón social o nombre</span>
        <input className={styles.borradorEntrada} value={form.nombre} onChange={cambiar('nombre')} maxLength={200} />
      </label>

      <div className={styles.borradorCampos}>
        <label className={styles.borradorCampo}>
          <span>Tipo</span>
          <select value={form.tipo} onChange={cambiar('tipo')}>
            {TIPOS_CLIENTE.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className={styles.borradorCampo}>
          <span>RUC / DNI</span>
          <input className={styles.borradorEntrada} value={form.ruc} onChange={cambiar('ruc')} inputMode="numeric" maxLength={11} />
        </label>
        <label className={styles.borradorCampo}>
          <span>Teléfono</span>
          <input className={styles.borradorEntrada} value={form.telefono} onChange={cambiar('telefono')} inputMode="tel" maxLength={20} />
        </label>
        <label className={styles.borradorCampo}>
          <span>Correo</span>
          <input className={styles.borradorEntrada} value={form.email} onChange={cambiar('email')} inputMode="email" />
        </label>
        <label className={styles.borradorCampo}>
          <span>Distrito</span>
          <input className={styles.borradorEntrada} value={form.distrito} onChange={cambiar('distrito')} maxLength={100} />
        </label>
        <label className={styles.borradorCampo}>
          <span>Clasificación</span>
          <select value={form.clasificacion} onChange={cambiar('clasificacion')}>
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
          </select>
        </label>
      </div>

      <label className={styles.borradorCampo}>
        <span>Dirección</span>
        <input className={styles.borradorEntrada} value={form.direccion} onChange={cambiar('direccion')} maxLength={300} />
      </label>

      {datos.advertencias?.length > 0 && <p className={styles.borradorNota}>{datos.advertencias.join(' ')}</p>}
      {error && <p className={styles.borradorError} role="alert">{error}</p>}

      <div className={styles.borradorAcciones}>
        <button type="button" className={styles.borradorDescartar} onClick={descartar} disabled={estado === 'registrando'}>
          <X size={13} aria-hidden="true" /> Descartar
        </button>
        <button type="button" className={styles.borradorConfirmar} onClick={registrar} disabled={!puedeRegistrar}>
          {estado === 'registrando' ? 'Registrando…' : 'Registrar cliente'}
        </button>
      </div>
    </div>
  );
}
