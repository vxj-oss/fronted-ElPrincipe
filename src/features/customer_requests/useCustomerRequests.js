import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEliminacionDiferida } from '../../hooks/useEliminacionDiferida';
import {
  fetchSolicitudes,
  crearSolicitud,
  eliminarSolicitud,
  interpretarNota,
  CANALES_RECEPCION,
  ESTADOS_SOLICITUD,
} from './customerRequestsService';
import { fetchClientes } from '../customers/customersService';
import { fetchProductos } from '../products/productsService';
import { obtenerInicioAtencion, limpiarInicioAtencion } from '../../utils/atencion';

const SEGUIMIENTO_HORAS = 24;
const SEGUIMIENTO_DIAS_MAX = 14;

const ITEM_VACIO = () => ({
  producto_id: null,
  nombre: '',
  cant: 1,
  precioEsperado: '',
});

const FORM_INICIAL = {
  cliente_id: '',
  canal: 'Presencial',
  observaciones: '',
};

function validarForm(form, items) {
  const errs = {};
  if (!form.cliente_id) errs.cliente_id = 'Selecciona un cliente.';
  if (!items || items.length === 0) errs.items = 'Agrega al menos un producto solicitado.';
  if (items.some((it) => !it.nombre.trim())) errs.items = 'Todos los ítems deben tener un nombre o producto.';
  if (items.some((it) => it.cant <= 0)) errs.items = 'Las cantidades deben ser mayores a 0.';
  if (items.some((it) => it.opciones?.length)) errs.items = 'Elige el producto en las filas marcadas.';
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
  const [horaAperturaModal, setHoraAperturaModal] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [items, setItems] = useState([ITEM_VACIO()]);
  const [formErrors, setFormErrors] = useState({});
  const [generandoIA, setGenerandoIA] = useState(false);
  const [avisoIA, setAvisoIA] = useState(null);
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
      setError('No se pudieron sincronizar las cotizaciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), toastMsg.tipo === 'warning' ? 8000 : 3200);
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
    setAvisoIA(null);
    setModalAbierto(true);
    setSolicitudDetalle(null);
    setHoraAperturaModal(new Date());
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setFormErrors({});
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const nuevaParam = searchParams.get('nueva');
  const clienteParam = searchParams.get('cliente');

  useEffect(() => {
    if (!nuevaParam || cargando) return;
    setSearchParams({}, { replace: true });
    abrirCrear();
    if (clienteParam) setForm((prev) => ({ ...prev, cliente_id: clienteParam }));
  }, [nuevaParam, clienteParam, cargando, abrirCrear, setSearchParams]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const porSeguimiento = useMemo(() => {
    const ahora = Date.now();
    const minimo = SEGUIMIENTO_HORAS * 3600000;
    const maximo = SEGUIMIENTO_DIAS_MAX * 86400000;
    return solicitudes
      .filter((s) => {
        const edad = ahora - new Date(s.fecha).getTime();
        return s.estado === 'Pendiente' && edad >= minimo && edad <= maximo;
      })
      .sort((a, b) => b.id - a.id);
  }, [solicitudes]);

  const ultimaCotizacion = useMemo(() => {
    const clienteId = parseInt(form.cliente_id, 10);
    if (!clienteId) return null;
    return solicitudes
      .filter((s) => s.cliente_id === clienteId && s.detalles.length > 0)
      .sort((a, b) => b.id - a.id)[0] || null;
  }, [solicitudes, form.cliente_id]);

  const cotizacionRepetida = useMemo(() => {
    const clienteId = parseInt(form.cliente_id, 10);
    if (!clienteId) return null;
    const ahora = Date.now();
    const reciente = solicitudes
      .filter(
        (s) =>
          s.cliente_id === clienteId &&
          s.estado === 'Pendiente' &&
          ahora - new Date(s.fecha).getTime() < 24 * 60 * 60 * 1000
      )
      .sort((a, b) => b.id - a.id)[0];
    if (!reciente) return null;
    const horas = Math.floor((ahora - new Date(reciente.fecha).getTime()) / 3600000);
    return { codigo: reciente.codigo, horas };
  }, [solicitudes, form.cliente_id]);

  const cargarUltimaCotizacion = useCallback(() => {
    if (!ultimaCotizacion) return;
    const lote = Date.now();
    setItems(
      ultimaCotizacion.detalles.map((d) => {
        const prod = productos.find((p) => p.id === d.producto_id);
        return {
          producto_id: prod ? prod.id : null,
          nombre: prod ? prod.nombre : d.nombre,
          cant: d.cant,
          precioEsperado: prod ? parseFloat(prod.precio) : d.precioEsperado || '',
          lote,
          marca: 'ia',
        };
      })
    );
    setFormErrors((prev) => ({ ...prev, items: undefined }));
    const total = ultimaCotizacion.detalles.length;
    setAvisoIA({
      tipo: 'success',
      texto: `Se cargaron ${total} ${total === 1 ? 'producto' : 'productos'} de ${ultimaCotizacion.codigo}`,
      detalles: ['Los precios se actualizaron al catálogo vigente.'],
    });
  }, [ultimaCotizacion, productos]);

  const agregarItem = useCallback(() => {
    setItems((prev) => [...prev, ITEM_VACIO()]);
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, []);

  const quitarItem = useCallback((idx) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }, []);

  const cambiarProductoItem = useCallback((idx, prodIdOrName) => {
    const prodId = /^\d+$/.test(String(prodIdOrName)) ? parseInt(prodIdOrName, 10) : null;
    const prod = productos.find((p) => p.id === prodId || p.nombre === prodIdOrName);
    
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              producto_id: prod ? prod.id : null,
              nombre: prod ? prod.nombre : prodIdOrName,
              precioEsperado: prod ? parseFloat(prod.precio) : it.precioEsperado,
              opciones: undefined,
              marca: undefined,
            }
          : it
      )
    );
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, [productos]);

  const elegirOpcionItem = useCallback((idx, productoId) => {
    const id = parseInt(productoId, 10);
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const opcion = it.opciones?.find((o) => o.id === id);
        if (!opcion) return it;
        return {
          ...it,
          producto_id: opcion.id,
          nombre: opcion.nombre,
          precioEsperado: opcion.precio,
          opciones: undefined,
          marca: 'ia',
        };
      })
    );
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, []);

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

  const handleGenerarDesdeNota = useCallback(async () => {
    const texto = (form.observaciones || '').trim();
    if (texto.length < 3) {
      setAvisoIA({ tipo: 'error', texto: 'Escribe en la nota lo que pide el cliente.' });
      return;
    }
    setGenerandoIA(true);
    setAvisoIA(null);
    try {
      const resultado = await interpretarNota({ texto, clienteId: form.cliente_id });
      if (!resultado.items.length) {
        setAvisoIA({
          tipo: 'warning',
          texto: resultado.advertencias.join(' ') || 'No se encontraron productos en la nota.',
        });
        return;
      }
      const lote = Date.now();
      setItems(
        resultado.items.map((it) => ({
          ...it,
          lote,
          opciones: it.opciones?.length ? it.opciones : undefined,
          marca: it.producto_id ? 'ia' : 'revisar',
        }))
      );
      if (resultado.clienteSugeridoId && !form.cliente_id) {
        setForm((prev) => ({ ...prev, cliente_id: resultado.clienteSugeridoId }));
      }
      setFormErrors((prev) => ({ ...prev, items: undefined, cliente_id: undefined }));
      const total = resultado.items.length;
      const resumen = `${total} ${total === 1 ? 'producto detectado' : 'productos detectados'}`;
      setAvisoIA({
        tipo: resultado.advertencias.length ? 'warning' : 'success',
        texto: resumen,
        detalles: resultado.advertencias,
      });
    } catch (err) {
      setAvisoIA({ tipo: 'error', texto: err.message || 'No se pudo interpretar la nota.' });
    } finally {
      setGenerandoIA(false);
    }
  }, [form.observaciones, form.cliente_id]);

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
        horaAperturaModal: obtenerInicioAtencion(form.cliente_id) ?? horaAperturaModal,
      });
      limpiarInicioAtencion();
      setSolicitudes((prev) => [nueva, ...prev]);
      if (nueva.resultadoAuditoria === 'Con_Observaciones') {
        setToastMsg({ tipo: 'warning', texto: `Cotización ${nueva.codigo} registrada con observaciones de la IA: ${nueva.descripcionAuditoria}` });
      } else if (nueva.resultadoAuditoria === 'No_Disponible') {
        setToastMsg({ tipo: 'warning', texto: `Cotización ${nueva.codigo} registrada. La auditoría de la IA no estuvo disponible.` });
      } else {
        setToastMsg({ tipo: 'success', texto: `Cotización ${nueva.codigo} registrada y auditada por la IA.` });
      }
      cerrarModal();
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'Error al guardar la cotización.' });
    } finally {
      setGuardando(false);
    }
  }, [form, items, cerrarModal, horaAperturaModal]);

  const pedirConfirmarEliminar = useCallback((id) => {
    setConfirmDelete(id);
  }, []);

  const cancelarEliminar = useCallback(() => setConfirmDelete(null), []);

  const {
    pendiente: eliminacionPendiente,
    programar: programarEliminacion,
    deshacer: deshacerEliminacion,
    retardoMs: retardoEliminacion,
  } = useEliminacionDiferida();

  const handleEliminar = useCallback(() => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    const objetivo = solicitudes.find((s) => s.id === id);
    setConfirmDelete(null);
    if (!objetivo) return;

    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
    setSolicitudDetalle((prev) => (prev?.id === id ? null : prev));
    programarEliminacion({
      etiqueta: `Cotización ${objetivo.codigo} eliminada`,
      ejecutar: () => eliminarSolicitud(id),
      restaurar: () =>
        setSolicitudes((prev) =>
          prev.some((s) => s.id === id) ? prev : [...prev, objetivo].sort((a, b) => b.id - a.id)
        ),
      alFallar: (err) =>
        setToastMsg({ tipo: 'error', texto: err?.message || 'No se pudo eliminar la cotización.' }),
    });
  }, [confirmDelete, solicitudes, programarEliminacion]);

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
    elegirOpcionItem,
    handleGenerarDesdeNota,
    generandoIA,
    avisoIA,
    ultimaCotizacion,
    cotizacionRepetida,
    cargarUltimaCotizacion,
    porSeguimiento,
    handleGuardar,
    verDetalle: (s) => setSolicitudDetalle((prev) => (prev?.id === s.id ? null : s)),
    cerrarDetalle: () => setSolicitudDetalle(null),
    confirmDelete,
    eliminando,
    pedirConfirmarEliminar,
    cancelarEliminar,
    handleEliminar,
    eliminacionPendiente,
    deshacerEliminacion,
    retardoEliminacion,
  };
}