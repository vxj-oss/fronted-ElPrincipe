import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, User, AtSign, Mail, Lock } from 'lucide-react';
import { useRegister } from './useRegister';
import Button from '../../components/ui/Button';
import styles from './auth.module.css';

export default function RegisterPage() {
  const { formData, fieldErrors, loading, error, handleChange, handleSubmit } = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.branding}>
        <div className={styles.brandingContent}>
          <h1 className={styles.brandTitle}>EL PRÍNCIPE</h1>
          <p className={styles.brandSubtitle}>Sistema de Gestión Comercial</p>
          <p className={styles.brandCaption}>
            Únete a la plataforma de ventas y gestión comercial de productos de limpieza.
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <h1 className={styles.mobileTitle}>
          EP <span className={styles.mobileTitleAccent}>Agent</span>
        </h1>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Crear Cuenta</h2>
          <p className={styles.formSubtitle}>Ingresa tus datos para registrarte</p>

          {error && (
            <div className={styles.alertError} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="nombre_completo" className={styles.label}>
                Nombre Completo
              </label>
              <div className={styles.inputIconWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="ej. Juan Narciso"
                  disabled={loading}
                  className={`input-base ${styles.hasIcon} ${fieldErrors.nombre_completo ? styles.inputError : ''}`}
                />
              </div>
              {fieldErrors.nombre_completo && (
                <p className={styles.fieldError}>{fieldErrors.nombre_completo}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="nombre_usuario" className={styles.label}>
                Nombre de Usuario
              </label>
              <div className={styles.inputIconWrap}>
                <AtSign size={16} className={styles.inputIcon} />
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
              <label htmlFor="email" className={styles.label}>
                Correo Electrónico
              </label>
              <div className={styles.inputIconWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@elprincipe.com"
                  disabled={loading}
                  className={`input-base ${styles.hasIcon} ${fieldErrors.email ? styles.inputError : ''}`}
                />
              </div>
              {fieldErrors.email && (
                <p className={styles.fieldError}>{fieldErrors.email}</p>
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

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar Contraseña
              </label>
              <div className={styles.passwordWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`input-base ${styles.hasIcon} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className={styles.fieldError}>{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? <span className={styles.spinner} /> : 'Registrarse'}
            </Button>
          </form>

          <p className={styles.registerLink}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className={styles.link}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}