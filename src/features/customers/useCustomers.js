import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  toggleActivoCliente,
  DISTRITOS_TRUJILLO,
  TIPOS_CLIENTE,
  CLASIFICACIONES,
} from './customersService';

const FORM_INICIAL = {
  nombre: '',
  ruc: '',
  tipo: 'Mayorista',
  distrito: 'Trujillo',
  telefono: '',
  email: '',
  direccion: '',
  clasificacion: 'Regular',
};

function validarRucDni(valor) {
  return /^\d{8}$/.test(valor) || /^\d{11}$/.test(valor);
}

function validarEmail(valor) {
  if (!valor) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function validarForm(form) {
  const errs = {};
  if (!form.nombre?.trim()) errs.nombre = 'La razón social o nombre es requerido.';
  if (!form.ruc?.trim()) errs.ruc = 'El RUC o DNI es requerido.';
  else if (!validarRucDni(form.ruc.trim())) errs.ruc = 'RUC debe tener 11 dígitos, DNI 8 dígitos.';
  if (!form.tipo) errs.tipo = 'Selecciona el tipo de cliente.';
  if (!form.distrito) errs.distrito = 'Selecciona el distrito.';
  if (form.email?.trim() && !validarEmail(form.email.trim())) errs.email = 'Ingresa un correo válido.';
  return errs;
}

export function iniciales(nombre) {
  if (!nombre) return 'CL';
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function useCustomers() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formErrors, setFormErrors] = useState({});

  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await fetchClientes();
      setClientes(data);
    } catch {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return clientes.filter((c) => {
      const mq = !q || c.nombre.toLowerCase().includes(q) || c.ruc.includes(q);
      const md = !filtroDistrito || c.distrito === filtroDistrito;
      const mt = !filtroTipo || c.tipo === filtroTipo;
      return mq && md && mt;
    });
  }, [clientes, busqueda, filtroDistrito, filtroTipo]);

  const kpis = useMemo(() => {
    const total = clientes.length;
    const activos = clientes.filter((c) => c.activo).length;
    const vip = clientes.filter((c) => c.clasificacion === 'VIP').length;
    const comprasTotal = clientes.reduce((a, c) => a + (c.comprasTotal || 0), 0);

    return {
      total,
      activos,
      vip,
      comprasTotal,
    };
  }, [clientes]);

  const abrirCrear = useCallback(() => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormErrors({});
    setModalAbierto(true);
    setClienteDetalle(null);
  }, []);

  const abrirEditar = useCallback((cliente) => {
    setEditandoId(cliente.id);
    setForm({
      nombre: cliente.nombre,
      ruc: cliente.ruc,
      tipo: cliente.tipo,
      distrito: cliente.distrito,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      clasificacion: cliente.clasificacion || 'Regular',
    });
    setFormErrors({});
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormErrors({});
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleGuardar = useCallback(async () => {
    const errs = validarForm(form);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(),
      ruc: form.ruc.trim(),
      tipo: form.tipo,
      distrito: form.distrito,
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      direccion: form.direccion.trim(),
      clasificacion: form.clasificacion,
    };

    try {
      if (editandoId) {
        const actualizado = await actualizarCliente(editandoId, payload);
        setClientes((prev) => prev.map((c) => (c.id === editandoId ? actualizado : c)));
        if (clienteDetalle?.id === editandoId) setClienteDetalle(actualizado);
        setToastMsg({ tipo: 'success', texto: 'Cliente actualizado exitosamente.' });
      } else {
        const nuevo = await crearCliente(payload);
        setClientes((prev) => [nuevo, ...prev]);
        setToastMsg({ tipo: 'success', texto: 'Cliente agregado a la cartera.' });
      }
      cerrarModal();
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err?.message || 'Error al guardar el cliente.' });
    } finally {
      setGuardando(false);
    }
  }, [form, editandoId, clienteDetalle, cerrarModal]);

  const handleToggleActivo = useCallback(async (id) => {
    const target = clientes.find((c) => c.id === id);
    if (!target) return;
    try {
      const actualizado = await toggleActivoCliente(id, target.activo);
      setClientes((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
      if (clienteDetalle?.id === id) setClienteDetalle(actualizado);
      setToastMsg({
        tipo: 'success',
        texto: `Cliente ${actualizado.activo ? 'activado' : 'desactivado'}.`,
      });
    } catch {
      setToastMsg({ tipo: 'error', texto: 'No se pudo cambiar el estado del cliente.' });
    }
  }, [clientes, clienteDetalle]);

  const pedirConfirmarEliminar = useCallback((id) => {
    setConfirmDelete(id);
  }, []);

  const handleEliminar = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await eliminarCliente(confirmDelete);
      setClientes((prev) => prev.filter((c) => c.id !== confirmDelete));
      setToastMsg({ tipo: 'success', texto: 'Cliente eliminado de la cartera.' });
      if (clienteDetalle?.id === confirmDelete) setClienteDetalle(null);
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err?.message || 'No se pudo eliminar el cliente.' });
    } finally {
      setConfirmDelete(null);
    }
  }, [confirmDelete, clienteDetalle]);

  const verDetalle = useCallback((cliente) => {
    setClienteDetalle((prev) => (prev?.id === cliente.id ? null : cliente));
  }, []);

  const cerrarDetalle = useCallback(() => setClienteDetalle(null), []);

  return {
    clientesFiltrados,
    kpis,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroDistrito,
    filtroTipo,
    setBusqueda,
    setFiltroDistrito,
    setFiltroTipo,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    clienteDetalle,
    confirmDelete,
    DISTRITOS_TRUJILLO,
    TIPOS_CLIENTE,
    CLASIFICACIONES,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    handleToggleActivo,
    pedirConfirmarEliminar,
    handleEliminar,
    cancelarEliminar: () => setConfirmDelete(null),
    verDetalle,
    cerrarDetalle,
  };
}