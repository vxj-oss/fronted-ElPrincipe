import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchCondiciones,
  crearCondicion,
  actualizarCondicion,
  eliminarCondicion,
  TIPOS_CONDICION,
  PLAZOS_PAGO,
} from './commercialTermsService';
import { fetchClientes } from '../customers/customersService';

const FORM_INICIAL = {
  cliente_id: '',
  tipo: 'Plazo_Credito',
  diasPlazo: '0',
  descuento: '0',
  limiteCredito: '0',
};

function validarForm(form) {
  const errs = {};
  if (!form.cliente_id) errs.cliente_id = 'Selecciona un cliente.';
  if (!form.tipo) errs.tipo = 'Selecciona el tipo de condición.';

  const desc = parseFloat(form.descuento);
  if (form.descuento !== '' && (isNaN(desc) || desc < 0 || desc > 100)) {
    errs.descuento = 'El descuento debe estar entre 0% y 100%.';
  }

  const dias = parseInt(form.diasPlazo, 10);
  if (![0, 15, 30].includes(dias)) {
    errs.diasPlazo = 'El plazo solo puede ser Contado (0d), Crédito 15d o Crédito 30d.';
  }

  return errs;
}

export function useCommercialTerms() {
  const [condiciones, setCondiciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formErrors, setFormErrors] = useState({});

  const [condicionDetalle, setCondicionDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [terms, clis] = await Promise.all([
        fetchCondiciones(),
        fetchClientes(),
      ]);
      setCondiciones(terms);
      setClientes(clis.filter((c) => c.activo));
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
    const conCredito = condiciones.filter((c) => c.diasPlazo > 0).length;
    const aContado = total - conCredito;
    const descuentos = condiciones.filter((c) => c.descuento > 0).map((c) => c.descuento);

    return {
      total,
      conCredito,
      aContado,
      maxDesc: descuentos.length ? Math.max(...descuentos) : 0,
    };
  }, [condiciones]);

  const preview = useMemo(() => ({
    descuento: parseFloat(form.descuento) || 0,
    diasPlazo: parseInt(form.diasPlazo, 10) || 0,
    limiteCredito: parseFloat(form.limiteCredito) || 0,
  }), [form.descuento, form.diasPlazo, form.limiteCredito]);

  const abrirCrear = useCallback(() => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormErrors({});
    setModalAbierto(true);
    setCondicionDetalle(null);
  }, []);

  const abrirEditar = useCallback((condicion) => {
    setEditandoId(condicion.id);
    setForm({
      cliente_id: String(condicion.cliente_id || ''),
      tipo: condicion.tipo,
      diasPlazo: String(condicion.diasPlazo),
      descuento: String(condicion.descuento),
      limiteCredito: String(condicion.limiteCredito),
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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleGuardar = useCallback(async () => {
    const errs = validarForm(form);
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
  }, [form, editandoId, cargarDatos, cerrarModal]);

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
    PLAZOS_PAGO,
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