import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsuarios, actualizarUsuario, eliminarUsuario } from './usersService';

export function useUsers() {
  const { user: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notificar = useCallback((tipo, texto) => {
    setToastMsg({ tipo, texto });
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setUsuarios(await fetchUsuarios());
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchQ =
        !q ||
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q);
      const matchRol = !filtroRol || u.rol === filtroRol;
      const matchEstado =
        !filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo);
      return matchQ && matchRol && matchEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const kpis = useMemo(
    () => ({
      total: usuarios.length,
      admins: usuarios.filter((u) => u.rol === 'administrador').length,
      asesores: usuarios.filter((u) => u.rol === 'asesor_comercial').length,
      inactivos: usuarios.filter((u) => !u.activo).length,
    }),
    [usuarios],
  );

  const abrirEditar = useCallback((u) => {
    setEditando(u);
    setForm({
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      rol: u.rol,
      activo: u.activo,
    });
    setFormErrors({});
  }, []);

  const cerrarModal = useCallback(() => {
    setEditando(null);
    setForm(null);
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const validar = useCallback(() => {
    const errs = {};
    if (!form.nombreCompleto.trim()) errs.nombreCompleto = 'El nombre completo es requerido.';
    if (!form.correo.trim()) {
      errs.correo = 'El correo es requerido.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      errs.correo = 'Ingresa un correo válido.';
    }
    return errs;
  }, [form]);

  const handleGuardar = useCallback(async () => {
    const errs = validar();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setGuardando(true);
    try {
      await actualizarUsuario(editando.id, {
        nombreCompleto: form.nombreCompleto,
        correo: form.correo,
        rol: form.rol,
        activo: form.activo,
      });
      notificar('success', 'Usuario actualizado.');
      cerrarModal();
      await cargar();
    } catch (err) {
      notificar('error', err.message || 'No se pudo guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }, [validar, editando, form, notificar, cerrarModal, cargar]);

  const handleToggleActivo = useCallback(
    async (u) => {
      try {
        await actualizarUsuario(u.id, { activo: !u.activo });
        notificar('success', u.activo ? 'Usuario desactivado.' : 'Usuario activado.');
        await cargar();
      } catch (err) {
        notificar('error', err.message || 'No se pudo cambiar el estado.');
      }
    },
    [notificar, cargar],
  );

  const pedirEliminar = useCallback((u) => setConfirmDelete(u), []);
  const cancelarEliminar = useCallback(() => setConfirmDelete(null), []);

  const handleEliminar = useCallback(async () => {
    const u = confirmDelete;
    if (!u) return;
    try {
      const res = await eliminarUsuario(u.id);
      setConfirmDelete(null);
      notificar(
        'success',
        res?.soft_delete
          ? 'Usuario desactivado (tiene actividad registrada).'
          : 'Usuario eliminado.',
      );
      await cargar();
    } catch (err) {
      setConfirmDelete(null);
      notificar('error', err.message || 'No se pudo eliminar el usuario.');
    }
  }, [confirmDelete, notificar, cargar]);

  return {
    usuarioActual,
    usuarios,
    usuariosFiltrados,
    kpis,
    cargando,
    error,
    guardando,
    toastMsg,
    busqueda,
    filtroRol,
    filtroEstado,
    setBusqueda,
    setFiltroRol,
    setFiltroEstado,
    editando,
    form,
    formErrors,
    confirmDelete,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    handleToggleActivo,
    pedirEliminar,
    cancelarEliminar,
    handleEliminar,
  };
}
