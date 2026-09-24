import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchCondiciones,
  crearCondicion,
  actualizarCondicion,
  eliminarCondicion,
  TIPOS_CONDICION,
} from './commercialTermsService';
import { fetchOpcionesCondicionAgrupadas } from './condicionOpcionesService';
import { fetchClientes } from '../customers/customersService';

const FORM_VACIO = { cliente_id: '', tipo: 'Credito', valor: '' };

function validarForm(form, opcionesCondicion) {
  const errs = {};
  if (!form.cliente_id) errs.cliente_id = 'Selecciona un cliente.';
  if (!form.tipo) errs.tipo = 'Selecciona el tipo de condición.';

  const opciones = opcionesCondicion[form.tipo] || [];
  if (!opciones.some((o) => o.valor === form.valor)) {
    errs.valor = 'Selecciona un valor válido para este tipo de condición.';
  }

  return errs;
}

export function useCommercialTerms() {
  const [condiciones, setCondiciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [opcionesCondicion, setOpcionesCondicion] = useState({ Credito: [], Descuento: [], Forma_Pago: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [formErrors, setFormErrors] = useState({});

  const [condicionDetalle, setCondicionDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [terms, clis, opciones] = await Promise.all([
        fetchCondiciones(),
        fetchClientes(),
        fetchOpcionesCondicionAgrupadas(),
      ]);
      setCondiciones(terms);
      setClientes(clis.filter((c) => c.activo));
      setOpcionesCondicion(opciones);
    } catch {
      setError('No se pudieron cargar las condiciones comerciales.');
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

  const condicionesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return condiciones.filter((c) => {
      const mq = !q || c.cliente.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q);
      const mt = !filtroTipo || c.tipo === filtroTipo;
      return mq && mt;
    });
  }, [condiciones, busqueda, filtroTipo]);

  const kpis = useMemo(() => {
    const total = condiciones.length;
    const conCredito = condiciones.filter((c) => c.tipo === 'Credito').length;
    const conFormaPago = condiciones.filter((c) => c.tipo === 'Forma_Pago').length;
    const descuentos = condiciones.filter((c) => c.tipo === 'Descuento').map((c) => c.descuento);

    return {
      total,
      conCredito,
      conFormaPago,
      maxDesc: descuentos.length ? Math.max(...descuentos) : 0,
    };
  }, [condiciones]);

  const preview = useMemo(() => {
    const opciones = opcionesCondicion[form.tipo] || [];
    const opcion = opciones.find((o) => o.valor === form.valor);
    return {
      tipo: form.tipo,
      valor: form.valor,
      label: opcion?.label || '—',
    };
  }, [form.tipo, form.valor, opcionesCondicion]);

  const abrirCrear = useCallback(() => {
    setEditandoId(null);
    setForm({ cliente_id: '', tipo: 'Credito', valor: opcionesCondicion.Credito?.[0]?.valor || '' });
    setFormErrors({});
    setModalAbierto(true);
    setCondicionDetalle(null);
  }, [opcionesCondicion]);

  const abrirEditar = useCallback((condicion) => {
    setEditandoId(condicion.id);
    setForm({
      cliente_id: String(condicion.cliente_id || ''),
      tipo: condicion.tipo,
      valor: condicion.valor,
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
    setForm((prev) => {
      if (name === 'tipo') {
        const primeraOpcion = opcionesCondicion[value]?.[0]?.valor || '';
        return { ...prev, tipo: value, valor: primeraOpcion };
      }
      return { ...prev, [name]: value };
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, [opcionesCondicion]);

  const handleGuardar = useCallback(async () => {
    const errs = validarForm(form, opcionesCondicion);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarCondicion(editandoId, form);
        setToastMsg({ tipo: 'success', texto: 'Condición comercial actualizada.' });
      } else {
        await crearCondicion(form);
        setToastMsg({ tipo: 'success', texto: 'Condición comercial registrada.' });
      }
      await cargarDatos();
      cerrarModal();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setGuardando(false);
    }
  }, [form, editandoId, cargarDatos, cerrarModal, opcionesCondicion]);

  const verDetalle = useCallback((c) => {
    setCondicionDetalle((prev) => (prev?.id === c.id ? null : c));
  }, []);

  const cerrarDetalle = useCallback(() => setCondicionDetalle(null), []);

  const pedirConfirmarEliminar = useCallback((id) => {
    setConfirmDelete(id);
  }, []);

  const cancelarEliminar = useCallback(() => setConfirmDelete(null), []);

  const handleEliminar = useCallback(async () => {
    if (!confirmDelete) return;
    setEliminando(true);
    try {
      await eliminarCondicion(confirmDelete);
      setCondiciones((prev) => prev.filter((c) => c.id !== confirmDelete));
      setCondicionDetalle((prev) => (prev?.id === confirmDelete ? null : prev));
      setToastMsg({ tipo: 'success', texto: 'Condición comercial eliminada.' });
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'No se pudo eliminar la condición.' });
    } finally {
      setEliminando(false);
      setConfirmDelete(null);
    }
  }, [confirmDelete]);

  return {
    condicionesFiltradas,
    kpis,
    preview,
    clientes,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroTipo,
    setBusqueda,
    setFiltroTipo,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    condicionDetalle,
    TIPOS_CONDICION,
    opcionesCondicion,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    verDetalle,
    cerrarDetalle,
    confirmDelete,
    eliminando,
    pedirConfirmarEliminar,
    cancelarEliminar,
    handleEliminar,
  };
}