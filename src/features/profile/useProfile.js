import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchPerfil,
  fetchStats,
  fetchActividad,
  actualizarPerfil,
  cambiarPassword,
  validarPerfil,
  validarPassword,
  formatearDesde,
  formatearUltimoAcceso,
  formatearActividad,
  calcularPorcentajeMeta,
} from './profileService';

const buildFormPerfil = (perfil) => ({
  nombre: perfil?.nombre ?? '',
  apellido: perfil?.apellido ?? '',
  email: perfil?.email ?? '',
  telefono: perfil?.telefono ?? '',
});

const FORM_PASSWORD_INICIAL = {
  actual: '',
  nueva: '',
  confirmar: '',
};

export function useProfile() {
  const { updateUser } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [formPerfil, setFormPerfil] = useState(null);
  const [formPerfilErrors, setFormPerfilErrors] = useState({});
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState(false);

  const [formPassword, setFormPassword] = useState(FORM_PASSWORD_INICIAL);
  const [formPasswordErrors, setFormPasswordErrors] = useState({});
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const perfilData = await fetchPerfil();
        const [statsData, actividadData] = await Promise.all([
          fetchStats(),
          fetchActividad(perfilData.id),
        ]);

        if (isMounted) {
          setPerfil(perfilData);
          setStats(statsData);
          setActividad(actividadData);
          setFormPerfil(buildFormPerfil(perfilData));
        }
      } catch {
        if (isMounted) setError('No se pudo cargar la información del perfil.');
      } finally {
        if (isMounted) setCargando(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    if (!perfil || !formPerfil) return;
    const original = buildFormPerfil(perfil);
    const editado = Object.keys(original).some((k) => original[k] !== formPerfil[k]);
    setPerfilEditado(editado);
  }, [formPerfil, perfil]);

  const metaPct = useMemo(() => {
    if (!stats) return 0;
    return calcularPorcentajeMeta(stats.ventasHoy, stats.metaDiaria);
  }, [stats]);

  const infoFechas = useMemo(() => {
    if (!perfil) return null;
    return {
      desde: formatearDesde(perfil.desdeISO),
      ultimoAcceso: formatearUltimoAcceso(perfil.ultimoAccesoISO),
    };
  }, [perfil]);

  const actividadFormateada = useMemo(() => {
    return actividad.map((a) => ({
      ...a,
      tiempoRelativo: formatearActividad(a.fechaISO),
    }));
  }, [actividad]);

  const handlePerfilChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormPerfil((prev) => ({ ...prev, [name]: value }));
    setFormPerfilErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleCancelarPerfil = useCallback(() => {
    if (perfil) {
      setFormPerfil(buildFormPerfil(perfil));
      setFormPerfilErrors({});
    }
  }, [perfil]);

  const handleGuardarPerfil = useCallback(async () => {
    if (!formPerfil) return;
    const errs = validarPerfil({
      nombre_completo: `${formPerfil.nombre} ${formPerfil.apellido}`,
      correo: formPerfil.email,
    });
    if (Object.keys(errs).length) {
      setFormPerfilErrors({
        nombre: errs.nombre_completo ? 'Nombre requerido' : undefined,
        apellido: errs.nombre_completo ? 'Apellido requerido' : undefined,
        email: errs.correo,
      });
      return;
    }

    setGuardandoPerfil(true);
    try {
      const actualizado = await actualizarPerfil(formPerfil);
      setPerfil(actualizado);
      setFormPerfil(buildFormPerfil(actualizado));
      if (updateUser) {
        updateUser({
          nombre: actualizado.nombre,
          apellido: actualizado.apellido,
          nombreCompleto: actualizado.nombreCompleto,
          email: actualizado.correo,
        });
      }
      setToastMsg({ tipo: 'success', texto: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'Error al actualizar el perfil.' });
    } finally {
      setGuardandoPerfil(false);
    }
  }, [formPerfil, updateUser]);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormPassword((prev) => ({ ...prev, [name]: value }));
    setFormPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const toggleShowPassword = useCallback((campo) => {
    setShowPasswords((prev) => ({ ...prev, [campo]: !prev[campo] }));
  }, []);

  const handleGuardarPassword = useCallback(async () => {
    const errs = validarPassword(formPassword);
    if (Object.keys(errs).length) {
      setFormPasswordErrors(errs);
      return;
    }

    setGuardandoPassword(true);
    try {
      await cambiarPassword(formPassword);
      setFormPassword(FORM_PASSWORD_INICIAL);
      setFormPasswordErrors({});
      setToastMsg({ tipo: 'success', texto: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      setFormPasswordErrors({ nueva: err.message });
    } finally {
      setGuardandoPassword(false);
    }
  }, [formPassword]);

  return {
    perfil,
    stats,
    actividadFormateada,
    cargando,
    error,
    toastMsg,
    metaPct,
    infoFechas,
    formPerfil,
    formPerfilErrors,
    guardandoPerfil,
    perfilEditado,
    formPassword,
    formPasswordErrors,
    guardandoPassword,
    showPasswords,
    handlePerfilChange,
    handleCancelarPerfil,
    handleGuardarPerfil,
    handlePasswordChange,
    toggleShowPassword,
    handleGuardarPassword,
  };
}