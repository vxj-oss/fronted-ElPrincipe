import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchSolicitudes,
  crearSolicitud,
  eliminarSolicitud,
  CANALES_RECEPCION,
  ESTADOS_SOLICITUD,
} from './customerRequestsService';
import { fetchClientes } from '../customers/customersService';
import { fetchProductos } from '../products/productsService';

const ITEM_VACIO = () => ({
  producto_id: null,
  nombre: '',
  cant: 1,
  precioEsperado: '',
});

const FORM_INICIAL = {
  cliente_id: '',
  canal: 'WhatsApp',
  observaciones: '',
};

function validarForm(form, items) {
  const errs = {};
  if (!form.cliente_id) errs.cliente_id = 'Selecciona un cliente.';
  if (!items || items.length === 0) errs.items = 'Agrega al menos un producto solicitado.';
  if (items.some((it) => !it.nombre.trim())) errs.items = 'Todos los ítems deben tener un nombre o producto.';
  if (items.some((it) => it.cant <= 0)) errs.items = 'Las cantidades deben ser mayores a 0.';
  return errs;
}

export function useCustomerRequests() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [items, setItems] = useState([ITEM_VACIO()]);
  const [formErrors, setFormErrors] = useState({});
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [solData, cliData, prodData] = await Promise.all([
        fetchSolicitudes(),
        fetchClientes(),
        fetchProductos(),
      ]);
      setSolicitudes(solData);
      setClientes(cliData.filter((c) => c.activo));
      setProductos(prodData);
    } catch {
      setError('No se pudieron sincronizar las solicitudes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return solicitudes.filter((s) => {
      const matchQ = !q || s.codigo.toLowerCase().includes(q) || s.cliente.toLowerCase().includes(q);
      const matchEstado = !filtroEstado || s.estado === filtroEstado;
      const matchCanal = !filtroCanal || s.canal === filtroCanal;
      return matchQ && matchEstado && matchCanal;
    });
  }, [solicitudes, busqueda, filtroEstado, filtroCanal]);

  const kpis = useMemo(() => ({
    total: solicitudesFiltradas.length,
    pendientes: solicitudesFiltradas.filter((s) => s.estado === 'Pendiente').length,
    atendidas: solicitudesFiltradas.filter((s) => s.estado === 'Atendida').length,
  }), [solicitudesFiltradas]);

  const abrirCrear = useCallback(() => {
    setForm(FORM_INICIAL);
    setItems([ITEM_VACIO()]);
    setFormErrors({});
    setModalAbierto(true);
    setSolicitudDetalle(null);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setFormErrors({});
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const agregarItem = useCallback(() => {
    setItems((prev) => [...prev, ITEM_VACIO()]);
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, []);

  const quitarItem = useCallback((idx) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }, []);

  const cambiarProductoItem = useCallback((idx, prodIdOrName) => {
    const prodId = parseInt(prodIdOrName, 10);
    const prod = productos.find((p) => p.id === prodId || p.nombre === prodIdOrName);
    
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              producto_id: prod ? prod.id : null,
              nombre: prod ? prod.nombre : prodIdOrName,
              precioEsperado: prod ? parseFloat(prod.precio) : it.precioEsperado,
            }
          : it
      )
    );
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, [productos]);

  const cambiarCantItem = useCallback((idx, val) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, cant: Math.max(1, parseInt(val, 10) || 1) } : it
      )
    );
  }, []);

  const cambiarPrecioItem = useCallback((idx, val) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, precioEsperado: val } : it
      )
    );
  }, []);

  const handleGuardar = useCallback(async () => {
    const errs = validarForm(form, items);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setGuardando(true);
    try {
      const nueva = await crearSolicitud({
        ...form,
        detalles: items,
      });
      setSolicitudes((prev) => [nueva, ...prev]);
      setToastMsg({ tipo: 'success', texto: `Solicitud ${nueva.codigo} registrada.` });
      cerrarModal();
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'Error al guardar la solicitud.' });
    } finally {
      setGuardando(false);
    }
  }, [form, items, cerrarModal]);

  const pedirConfirmarEliminar = useCallback((id) => {
    setConfirmDelete(id);
  }, []);

  const cancelarEliminar = useCallback(() => setConfirmDelete(null), []);

  const handleEliminar = useCallback(async () => {
    if (!confirmDelete) return;
    setEliminando(true);
    try {
      await eliminarSolicitud(confirmDelete);
      setSolicitudes((prev) => prev.filter((s) => s.id !== confirmDelete));
      setSolicitudDetalle((prev) => (prev?.id === confirmDelete ? null : prev));
      setToastMsg({ tipo: 'success', texto: 'Solicitud eliminada.' });
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'No se pudo eliminar la solicitud.' });
    } finally {
      setEliminando(false);
      setConfirmDelete(null);
    }
  }, [confirmDelete]);

  return {
    solicitudesFiltradas,
    kpis,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroEstado,
    filtroCanal,
    setBusqueda,
    setFiltroEstado,
    setFiltroCanal,
    modalAbierto,
    form,
    formErrors,
    items,
    solicitudDetalle,
    clientes,
    productos,
    CANALES_RECEPCION,
    ESTADOS_SOLICITUD,
    abrirCrear,
    cerrarModal,
    handleFormChange,
    agregarItem,
    quitarItem,
    cambiarProductoItem,
    cambiarCantItem,
    cambiarPrecioItem,
    handleGuardar,
    verDetalle: (s) => setSolicitudDetalle((prev) => (prev?.id === s.id ? null : s)),
    cerrarDetalle: () => setSolicitudDetalle(null),
    confirmDelete,
    eliminando,
    pedirConfirmarEliminar,
    cancelarEliminar,
    handleEliminar,
  };
}