import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useLogin } from './useLogin';
import Button from '../../components/ui/Button';
import logo from '../../assets/logo.png';
import styles from './auth.module.css';

export default function LoginPage() {
  const { formData, fieldErrors, loading, error, handleChange, handleSubmit } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.branding}>
        <div className={styles.brandingContent}>
          <h1 className={styles.brandTitle}>EL PRÍNCIPE</h1>
          <p className={styles.brandSubtitle}>Sistema de Gestión Comercial</p>
          <p className={styles.brandCaption}>
            Plataforma integral para asesores y administración de ventas de productos de limpieza.
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <h1 className={styles.mobileTitle}>
          EP <span className={styles.mobileTitleAccent}>Agent</span>
        </h1>
        <img src={logo} alt="EL PRÍNCIPE" className={styles.mobileLogo} />
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Iniciar Sesión</h2>
          <p className={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>

          {error && (
            <div className={styles.alertError} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="nombre_usuario" className={styles.label}>
                Nombre de Usuario
              </label>
              <div className={styles.inputIconWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="nombre_usuario"
                  name="nombre_usuario"
                  type="text"
                  value={formData.nombre_usuario}
                  onChange={handleChange}
                  placeholder="ej. Juan Nar"
                  disabled={loading}
                  className={`input-base ${styles.hasIcon} ${fieldErrors.nombre_usuario ? styles.inputError : ''}`}
                />
              </div>
              {fieldErrors.nombre_usuario && (
                <p className={styles.fieldError}>{fieldErrors.nombre_usuario}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <div className={styles.passwordWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`input-base ${styles.hasIcon} ${fieldErrors.password ? styles.inputError : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.eyeBtn}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className={styles.fieldError}>{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? <span className={styles.spinner} /> : 'Ingresar'}
            </Button>
          </form>

          <p className={styles.registerLink}>
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" className={styles.link}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}