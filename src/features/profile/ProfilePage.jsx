import { Eye, EyeOff, Save, Lock, AlertCircle, CheckCircle, ClipboardList, Pencil, Download, AlertTriangle, UserPlus, LogIn } from 'lucide-react';
import { useProfile } from './useProfile';
import styles from './profile.module.css';

const ICONOS = { 'clipboard-list': ClipboardList, edit: Pencil, download: Download, 'alert-triangle': AlertTriangle, 'user-plus': UserPlus, login: LogIn };

function Toast({ toast }) {
  if (!toast) return null;
  const esErr = toast.tipo === 'error';
  return (
    <div className={`${styles.toast} ${esErr ? styles.toastError : styles.toastSuccess}`} role="status">
      {esErr ? <AlertCircle size={14} /> : <CheckCircle size={14} />} {toast.texto}
    </div>
  );
}

function StatCard({ valor, label, color }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statVal} style={color ? { color } : {}}>{valor}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function FormField({ id, label, name, value, onChange, type = 'text', error, disabled, placeholder, autoComplete, sufijo }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInputWrap}>
        <input id={id} name={name} type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} autoComplete={autoComplete} className={`${styles.fieldInput} ${error ? styles.fieldInputError : ''} ${disabled ? styles.fieldInputDisabled : ''}`} />
        {sufijo}
      </div>
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
    </div>
  );
}

function ActividadItem({ item }) {
  const IconoComp = ICONOS[item.icono] ?? ClipboardList;
  return (
    <div className={styles.actItem}>
      <div className={styles.actDot} style={{ background: item.colorBg }} aria-hidden="true"><IconoComp size={13} style={{ color: item.colorIc }} /></div>
      <div className={styles.actContent}>
        <p className={styles.actTexto}>{item.texto}</p>
        <p className={styles.actMeta}>{item.tiempoRelativo} · Módulo {item.modulo}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    perfil, stats, actividadFormateada, cargando, error, toastMsg, metaPct, infoFechas,
    formPerfil, formPerfilErrors, guardandoPerfil, perfilEditado,
    formPassword, formPasswordErrors, guardandoPassword, showPasswords,
    handlePerfilChange, handleCancelarPerfil, handleGuardarPerfil,
    handlePasswordChange, toggleShowPassword, handleGuardarPassword,
  } = useProfile();

  if (cargando) return <div className={styles.estadoCentro}><div className={styles.spinner} /><p className={styles.estadoTexto}>Cargando perfil...</p></div>;
  if (error || !perfil) return <div className={styles.estadoCentro}><AlertCircle size={32} className={styles.errorIcon} /><p className={styles.estadoTexto}>{error ?? 'No se pudo cargar el perfil.'}</p></div>;

  const colorMeta = metaPct >= 80 ? '#16a34a' : metaPct >= 50 ? '#ea580c' : '#dc2626';
  const vHoy = stats ? (stats.ventasHoy >= 1000 ? `S/ ${(stats.ventasHoy / 1000).toFixed(1)}k` : `S/ ${stats.ventasHoy.toFixed(2)}`) : 'S/ 0.00';
  const vMes = stats ? (stats.ventasMes >= 1000 ? `S/ ${(stats.ventasMes / 1000).toFixed(1)}k` : `S/ ${stats.ventasMes.toFixed(2)}`) : 'S/ 0.00';

  const eyeBtn = (campo) => (
    <button type="button" onClick={() => toggleShowPassword(campo)} className={styles.eyeBtn} aria-label="Ver contraseña">
      {showPasswords[campo] ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <div className={styles.page}>
      <Toast toast={toastMsg} />
      <aside className={styles.leftPanel}>
        <div className={styles.profileTop}>
          <div className={`${styles.avatar} ${styles.avatarLg}`}>{perfil.iniciales}<span className={styles.onlineDot} /></div>
          <h1 className={styles.profileName}>{perfil.nombreCompleto}</h1>
          <p className={styles.profileCargo}>{perfil.cargo}</p>
          <span className={styles.profileEmpresa}>{perfil.empresa?.split(' — ')[0]}</span>
        </div>

        <div className={styles.statsGrid}>
          <StatCard valor={stats?.pedidosHoy ?? '0'} label="Pedidos hoy" color="#1E3A8A" />
          <StatCard valor={vHoy} label="Ventas hoy" />
          <StatCard valor={stats?.clientesHoy ?? '0'} label="Clientes" />
          <StatCard valor={vMes} label="Ventas mes" />
        </div>

        <div className={styles.metaWrap}>
          <div className={styles.metaHeader}><span className={styles.metaLabel}>Meta diaria</span><span className={styles.metaPct} style={{ color: colorMeta }}>{metaPct}%</span></div>
          <div className={styles.metaTrack}><div className={styles.metaFill} style={{ width: `${metaPct}%`, background: colorMeta }} /></div>
        </div>

        <dl className={styles.infoList}>
          <div className={styles.infoItem}><dt>Correo</dt><dd>{perfil.email}</dd></div>
          <div className={styles.infoItem}><dt>Teléfono</dt><dd>{perfil.telefono}</dd></div>
          <div className={styles.infoItem}><dt>Sede</dt><dd>{perfil.sede}</dd></div>
          <div className={styles.infoItem}><dt>En el sistema desde</dt><dd>{infoFechas?.desde}</dd></div>
          <div className={styles.infoItem}><dt>Último acceso</dt><dd>{infoFechas?.ultimoAcceso}</dd></div>
        </dl>
      </aside>

      <div className={styles.rightPanel}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Datos personales</h2>
          <div className={styles.formGrid}>
            <FormField id="f-nombre" label="Nombre" name="nombre" value={formPerfil?.nombre ?? ''} onChange={handlePerfilChange} error={formPerfilErrors.nombre} autoComplete="given-name" />
            <FormField id="f-apellido" label="Apellido" name="apellido" value={formPerfil?.apellido ?? ''} onChange={handlePerfilChange} error={formPerfilErrors.apellido} autoComplete="family-name" />
            <FormField id="f-email" label="Correo electrónico" name="email" type="email" value={formPerfil?.email ?? ''} onChange={handlePerfilChange} error={formPerfilErrors.email} autoComplete="email" />
            <FormField id="f-telefono" label="Teléfono" name="telefono" type="tel" value={formPerfil?.telefono ?? ''} onChange={handlePerfilChange} placeholder="+51 000 000 000" autoComplete="tel" />
            <FormField id="f-cargo" label="Cargo" value={perfil.cargo} disabled />
            <FormField id="f-sede" label="Sede" value={perfil.sede} disabled />
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.fieldLabel}>Empresa</label><input value={perfil.empresa} disabled className={`${styles.fieldInput} ${styles.fieldInputDisabled}`} /></div>
          </div>
          <div className={styles.saveRow}>
            {perfilEditado && <button onClick={handleCancelarPerfil} className={styles.btnSecondary}>Cancelar</button>}
            <button onClick={handleGuardarPerfil} disabled={guardandoPerfil || !perfilEditado} className={styles.btnPrimary}><Save size={14} />{guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Lock size={15} style={{ marginRight: 7 }} />Seguridad — Cambiar contraseña</h2>
          <div className={styles.passwordGrid}>
            <FormField id="f-actual" label="Contraseña actual" name="actual" type={showPasswords.actual ? 'text' : 'password'} value={formPassword.actual} onChange={handlePasswordChange} error={formPasswordErrors.actual} autoComplete="current-password" placeholder="••••••••" sufijo={eyeBtn('actual')} />
            <FormField id="f-nueva" label="Nueva contraseña" name="nueva" type={showPasswords.nueva ? 'text' : 'password'} value={formPassword.nueva} onChange={handlePasswordChange} error={formPasswordErrors.nueva} autoComplete="new-password" placeholder="••••••••" sufijo={eyeBtn('nueva')} />
            <FormField id="f-confirmar" label="Confirmar nueva" name="confirmar" type={showPasswords.confirmar ? 'text' : 'password'} value={formPassword.confirmar} onChange={handlePasswordChange} error={formPasswordErrors.confirmar} autoComplete="new-password" placeholder="••••••••" sufijo={eyeBtn('confirmar')} />
          </div>
          <div className={styles.saveRow}>
            <button onClick={handleGuardarPassword} disabled={guardandoPassword} className={styles.btnPrimary}><Lock size={14} />{guardandoPassword ? 'Actualizando...' : 'Actualizar contraseña'}</button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Actividad reciente</h2>
          <div className={styles.actividadList}>
            {actividadFormateada.length === 0 ? <p className={styles.estadoTexto} style={{ padding: '1rem 0' }}>Sin actividad registrada recientemente.</p> : actividadFormateada.map((item, i) => <ActividadItem key={item.id} item={item} esUltimo={i === actividadFormateada.length - 1} />)}
          </div>
        </section>
      </div>
    </div>
  );
}