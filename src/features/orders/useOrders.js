import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchPedidos,
  crearPedido,
  actualizarPedido,
  eliminarPedido,
  cambiarEstadoPedido,
  registrarErrorPedido,
  limpiarErrorPedido,
  validarPedidoConIA,
  calcularTotal,
  ESTADOS_PEDIDO,
  CONDICIONES_PAGO,
  TIPOS_ERROR,
} from './ordersService';
import { fetchClientes } from '../customers/customersService';
import { fetchProductos } from '../products/productsService';
import { apiRequest } from '../../utils/api';
import { fechaHoyLima } from '../../utils/fechas';

const ITEM_VACIO = () => ({ producto: '', cant: 1, precio: 0, producto_id: null });

const FORM_INICIAL = () => ({
  solicitud_id: null,
  cliente_id: null,
  cliente: '',
  condicion_comercial_id: null,
  fecha: fechaHoyLima(),
  estado: ESTADOS_PEDIDO[0] || 'Pendiente',
  pago: 'Contado',
  direccion: '',
  observaciones: '',
});

function validarForm(form, items) {
  const errs = {};
  if (!form.cliente_id) errs.cliente_id = 'Selecciona un cliente.';
  if (!form.fecha) errs.fecha = 'La fecha es requerida.';
  if (items.length === 0) errs.items = 'Agrega al menos una línea de pedido.';
  if (items.some((i) => !i.producto_id)) errs.items = 'Todos los ítems deben tener un producto válido.';
  if (items.some((i) => i.cant <= 0)) errs.items = 'Las cantidades deben ser mayores a cero.';
  if (items.some((i) => !(parseFloat(i.precio) > 0))) errs.items = 'Todos los ítems deben tener un precio mayor a cero.';
  return errs;
}

function validarError(errDesc) {
  const errs = {};
  if (!errDesc.trim()) errs.errDesc = 'Describe el error detectado.';
  return errs;
}

const ESTADOS_CONFIRMADOS = ['Aprobado', 'Entregado'];

function detectarRiesgos(pedido) {
  const riesgos = [];
  if (pedido?.tieneError) {
    riesgos.push(pedido.errDesc || 'Se detectó un error en uno de los ítems del pedido.');
  }
  if (pedido?.tieneFallaCondicion) {
    riesgos.push(pedido.motivoFallaCondicion || 'El pedido no cumple la condición comercial pactada con el cliente.');
  }
  return riesgos;
}

function avisoStockBajo(alertas = []) {
  if (!alertas.length) return null;
  const detalle = alertas
    .map((a) => (a.agotado ? `${a.nombre} (agotado)` : `${a.nombre} (${a.stock}/${a.minimo})`))
    .join(', ');
  return {
    tipo: 'warning',
    texto: `Stock bajo el mínimo tras descontar el pedido: ${detalle}. Se recomienda reponer.`,
  };
}

function opcionesEstadoPara(estadoOriginal) {
  if (estadoOriginal === 'Aprobado') return ['Aprobado', 'Entregado', 'Cancelado'];
  if (estadoOriginal === 'Entregado') return ['Entregado', 'Cancelado'];
  if (estadoOriginal === 'Cancelado') return ['Cancelado'];
  return ESTADOS_PEDIDO;
}

export function useOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [clientesCatalogo, setClientesCatalogo] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [condicionesCatalogo, setCondicionesCatalogo] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [validandoIA, setValidandoIA] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroError, setFiltroError] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL());
  const [formErrors, setFormErrors] = useState({});
  const [items, setItems] = useState([ITEM_VACIO()]);
  const [alertaIA, setAlertaIA] = useState(null);

  const [modalErrorAbierto, setModalErrorAbierto] = useState(false);
  const [errorTargetId, setErrorTargetId] = useState(null);
  const [errorSeleccionados, setErrorSeleccionados] = useState([]);
  const [errDesc, setErrDesc] = useState('');
  const [errFormErrors, setErrFormErrors] = useState({});

  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [advertenciaConfirmacion, setAdvertenciaConfirmacion] = useState(null);

  const cargarDatosIniciales = useCallback(async () => {
    try {
      const [pedidosData, clientesData, productosData, solicitudesData, condicionesData] = await Promise.all([
        fetchPedidos(),
        fetchClientes(),
        fetchProductos(),
        apiRequest('/customer-requests/').catch(() => []),
        apiRequest('/commercial-terms/').catch(() => []),
      ]);
      setPedidos(pedidosData);
      setClientesCatalogo(clientesData.filter((c) => c.activo));
      setProductosCatalogo(productosData);
      setSolicitudesPendientes(solicitudesData.filter((s) => s.estado === 'Pendiente'));
      setCondicionesCatalogo(condicionesData);
    } catch {
      setError('No se pudieron sincronizar los datos de pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  useEffect(() => {
    if (!toastMsg) return;
    const duracion = toastMsg.tipo === 'warning' ? 6500 : 3200;
    const t = setTimeout(() => setToastMsg(null), duracion);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const estadosPedidoDisponibles = useMemo(() => {
    if (!editandoId) return ESTADOS_PEDIDO;
    const pedidoOriginal = pedidos.find((p) => p.id === editandoId);
    return opcionesEstadoPara(pedidoOriginal?.estado);
  }, [editandoId, pedidos]);

  const condicionesDelCliente = useMemo(() => {
    if (!form.cliente_id) return [];
    return condicionesCatalogo.filter((c) => c.cliente_id === parseInt(form.cliente_id, 10));
  }, [form.cliente_id, condicionesCatalogo]);

  const condicionClienteActiva = useMemo(() => {
    if (condicionesDelCliente.length === 0) return null;
    if (form.condicion_comercial_id) {
      return (
        condicionesDelCliente.find((c) => c.id === parseInt(form.condicion_comercial_id, 10)) ||
        condicionesDelCliente[0]
      );
    }
    return condicionesDelCliente[0];
  }, [condicionesDelCliente, form.condicion_comercial_id]);

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return pedidos.filter((p) => {
      const mq = !q || p.numero.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
      const me = !filtroEstado || p.estado === filtroEstado;
      const merr = filtroError === '' ? true : filtroError === '1' ? p.tieneError : !p.tieneError;
      return mq && me && merr;
    });
  }, [pedidos, busqueda, filtroEstado, filtroError]);

  const kpis = useMemo(
    () => ({
      total: pedidosFiltrados.length,
      pendientes: pedidosFiltrados.filter(
        (p) => p.estado?.toLowerCase() === 'pendiente'
      ).length,
      conError: pedidosFiltrados.filter((p) => p.tieneError).length,
      montoTotal: pedidosFiltrados.reduce((a, p) => a + calcularTotal(p.items), 0),
    }),
    [pedidosFiltrados]
  );

  const totalFormulario = useMemo(
    () => items.reduce((a, i) => a + (parseFloat(i.cant) || 0) * (parseFloat(i.precio) || 0), 0),
    [items]
  );

  const abrirCrear = useCallback(() => {
    setEditandoId(null);
    setForm(FORM_INICIAL());
    setItems([ITEM_VACIO()]);
    setFormErrors({});
    setAlertaIA(null);
    setModalAbierto(true);
    setPedidoDetalle(null);
  }, []);

  const abrirEditar = useCallback((pedido) => {
    setEditandoId(pedido.id);
    setForm({
      solicitud_id: pedido.solicitud_id || null,
      cliente_id: pedido.cliente_id,
      cliente: pedido.cliente,
      condicion_comercial_id: pedido.condicionComercial?.condicion_id || null,
      fecha: pedido.fecha,
      estado: pedido.estado,
      pago: pedido.pago,
      direccion: pedido.direccion || '',
      observaciones: pedido.observaciones || '',
    });

    const itemsMapeados = (pedido.items || []).map((i) => {
      const prodEncontrado = productosCatalogo.find(
        (p) => p.id === i.producto_id || p.nombre === i.producto
      );
      return {
        ...i,
        producto: prodEncontrado?.nombre || i.producto,
        producto_id: i.producto_id || prodEncontrado?.id || null,
        cant: i.cant || 1,
        precio: i.precio || (prodEncontrado ? parseFloat(prodEncontrado.precio) : 0),
      };
    });

    setItems(itemsMapeados.length > 0 ? itemsMapeados : [ITEM_VACIO()]);
    setFormErrors({});
    setAlertaIA(null);
    setModalAbierto(true);
  }, [productosCatalogo]);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormErrors({});
    setAlertaIA(null);
  }, []);

  const handleSeleccionarSolicitud = useCallback(
    (solicitudId) => {
      const solId = parseInt(solicitudId, 10);
      if (!solId) {
        setForm((prev) => ({ ...prev, solicitud_id: null }));
        return;
      }

      const sol = solicitudesPendientes.find((s) => s.id === solId);
      if (sol) {
        const cli = clientesCatalogo.find((c) => c.id === sol.cliente_id);
        const condsCli = condicionesCatalogo.filter((c) => c.cliente_id === sol.cliente_id);
        const primeraCond = condsCli.length > 0 ? condsCli[0] : null;

        setForm((prev) => ({
          ...prev,
          solicitud_id: sol.id,
          cliente_id: sol.cliente_id,
          cliente: cli?.nombre || cli?.razon_social || prev.cliente,
          condicion_comercial_id: primeraCond?.id || null,
          direccion: cli?.direccion || prev.direccion,
          observaciones: sol.observaciones || prev.observaciones,
          pago: 'Contado',
        }));

        if (sol.detalles && sol.detalles.length > 0) {
          const nuevosItems = sol.detalles.map((d) => {
            const prod = productosCatalogo.find((p) => p.id === d.producto_id);
            return {
              producto: prod?.nombre || d.nombre_producto_solicitado,
              producto_id: d.producto_id || prod?.id || null,
              cant: d.cantidad_solicitada || 1,
              precio: prod ? parseFloat(prod.precio) : parseFloat(d.precio_esperado || 0),
            };
          });
          setItems(nuevosItems);
        }
      }
    },
    [solicitudesPendientes, clientesCatalogo, productosCatalogo, condicionesCatalogo]
  );

  const handleFormChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (name === 'solicitud_id') {
        handleSeleccionarSolicitud(value);
      } else if (name === 'cliente_id') {
        const targetId = parseInt(value, 10) || null;
        const cli = clientesCatalogo.find((c) => c.id === targetId);
        const condsCli = condicionesCatalogo.filter((c) => c.cliente_id === targetId);
        const primeraCond = condsCli.length > 0 ? condsCli[0] : null;

        setForm((prev) => ({
          ...prev,
          cliente_id: targetId,
          cliente: cli?.nombre || cli?.razon_social || '',
          condicion_comercial_id: primeraCond ? primeraCond.id : null,
          direccion: cli?.direccion || prev.direccion,
        }));
      } else if (name === 'condicion_comercial_id') {
        const condId = parseInt(value, 10) || null;
        setForm((prev) => ({
          ...prev,
          condicion_comercial_id: condId,
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
      setFormErrors((prev) => ({ ...prev, [name]: undefined, cliente_id: undefined }));
    },
    [clientesCatalogo, condicionesCatalogo, handleSeleccionarSolicitud]
  );

  const agregarItem = useCallback(() => {
    setItems((prev) => [...prev, ITEM_VACIO()]);
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  }, []);

  const quitarItem = useCallback((idx) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }, []);

  const cambiarProductoItem = useCallback(
    (idx, valorSeleccionado) => {
      const prodId = parseInt(valorSeleccionado, 10);
      const prod = productosCatalogo.find(
        (p) => p.id === prodId || p.nombre === valorSeleccionado
      );
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx
            ? {
                ...it,
                producto: prod?.nombre || valorSeleccionado,
                producto_id: prod?.id || null,
                precio: prod ? parseFloat(prod.precio) : it.precio,
              }
            : it
        )
      );
      setFormErrors((prev) => ({ ...prev, items: undefined }));
    },
    [productosCatalogo]
  );

  const cambiarCantItem = useCallback((idx, valor) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, cant: Math.max(1, parseInt(valor, 10) || 1) } : it
      )
    );
  }, []);

  const cambiarPrecioItem = useCallback((idx, valor) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, precio: parseFloat(valor) || 0 } : it
      )
    );
  }, []);

  const persistirPedido = useCallback(
    async (payload) => {
      setGuardando(true);
      try {
        let resultado;
        if (editandoId) {
          resultado = await actualizarPedido(editandoId, payload);
          setPedidos((prev) => prev.map((p) => (p.id === editandoId ? resultado : p)));
          if (pedidoDetalle?.id === editandoId) setPedidoDetalle(resultado);
          setToastMsg({ tipo: 'success', texto: 'Pedido actualizado exitosamente.' });
        } else {
          resultado = await crearPedido(payload);
          setPedidos((prev) => [resultado, ...prev]);
          setSolicitudesPendientes((prev) => prev.filter((s) => s.id !== form.solicitud_id));
          setToastMsg({ tipo: 'success', texto: `Pedido ${resultado.numero} procesado con éxito.` });
        }
        const aviso = avisoStockBajo(resultado.alertasStock);
        if (aviso) setToastMsg(aviso);
        fetchProductos().then(setProductosCatalogo).catch(() => {});
        cerrarModal();
      } catch (err) {
        setToastMsg({ tipo: 'error', texto: err.message || 'Error al guardar el pedido.' });
      } finally {
        setGuardando(false);
      }
    },
    [editandoId, pedidoDetalle, form.solicitud_id, cerrarModal]
  );

  const handleGuardar = useCallback(
    async (forzarGuardado = false) => {
      const errs = validarForm(form, items);
      if (Object.keys(errs).length) {
        setFormErrors(errs);
        return;
      }

      const payload = {
        ...form,
        items: items.map((i) => ({ ...i })),
      };

      if (form.cliente_id && !forzarGuardado) {
        setValidandoIA(true);
        try {
          const analisis = await validarPedidoConIA({
            solicitud_id: form.solicitud_id,
            cliente_id: form.cliente_id,
            forma_pago: form.pago,
            items: payload.items,
          });

          if (analisis.hay_discrepancia) {
            setAlertaIA(analisis);
            setValidandoIA(false);
            return;
          }
        } catch {
        } finally {
          setValidandoIA(false);
        }
      }

      if (editandoId && !forzarGuardado) {
        const pedidoOriginal = pedidos.find((p) => p.id === editandoId);
        const riesgos = detectarRiesgos(pedidoOriginal);
        const vaAConfirmarse =
          ESTADOS_CONFIRMADOS.includes(form.estado) &&
          pedidoOriginal &&
          pedidoOriginal.estado !== form.estado;

        if (vaAConfirmarse && riesgos.length > 0) {
          setAdvertenciaConfirmacion({ pedido: pedidoOriginal, riesgos });
          return;
        }
      }

      await persistirPedido(payload);
    },
    [form, items, persistirPedido, editandoId, pedidos]
  );

  const handleCambiarEstado = useCallback(
    async (id, nuevoEstado) => {
      const pedido = pedidos.find((p) => p.id === id);
      const riesgos = detectarRiesgos(pedido);
      const esConfirmacion = ESTADOS_CONFIRMADOS.includes(nuevoEstado);

      if (esConfirmacion && riesgos.length > 0) {
        setAdvertenciaConfirmacion({ pedido, riesgos });
        return;
      }

      try {
        const actualizado = await cambiarEstadoPedido(id, nuevoEstado);
        setPedidos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
        if (pedidoDetalle?.id === id) setPedidoDetalle(actualizado);
        const aviso = avisoStockBajo(actualizado.alertasStock);
        setToastMsg(aviso || { tipo: 'success', texto: `Estado cambiado a "${nuevoEstado}".` });
        fetchProductos().then(setProductosCatalogo).catch(() => {});
        if (nuevoEstado === 'Cancelado') {
          apiRequest('/customer-requests/')
            .then((data) => setSolicitudesPendientes((data || []).filter((s) => s.estado === 'Pendiente')))
            .catch(() => {});
        }
      } catch {
        setToastMsg({ tipo: 'error', texto: 'No se pudo actualizar el estado.' });
      }
    },
    [pedidos, pedidoDetalle]
  );

  const cerrarAdvertenciaConfirmacion = useCallback(() => {
    setAdvertenciaConfirmacion(null);
  }, []);

  const pedirConfirmarEliminar = useCallback((id) => setConfirmDelete(id), []);

  const handleEliminar = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await eliminarPedido(confirmDelete);
      setPedidos((prev) => prev.filter((p) => p.id !== confirmDelete));
      if (pedidoDetalle?.id === confirmDelete) setPedidoDetalle(null);
      setToastMsg({ tipo: 'success', texto: 'Pedido eliminado de la lista.' });
      fetchProductos().then(setProductosCatalogo).catch(() => {});
      apiRequest('/customer-requests/')
        .then((data) => setSolicitudesPendientes((data || []).filter((s) => s.estado === 'Pendiente')))
        .catch(() => {});
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'No se pudo eliminar el pedido.' });
    } finally {
      setConfirmDelete(null);
    }
  }, [confirmDelete, pedidoDetalle]);

  const abrirModalError = useCallback((pedido) => {
    setErrorTargetId(pedido.id);
    setErrorSeleccionados(pedido.errores ?? []);
    setErrDesc(pedido.errDesc ?? '');
    setErrFormErrors({});
    setModalErrorAbierto(true);
  }, []);

  const cerrarModalError = useCallback(() => {
    setModalErrorAbierto(false);
    setErrorTargetId(null);
    setErrFormErrors({});
  }, []);

  const toggleTipoError = useCallback((tipo) => {
    setErrorSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  }, []);

  const handleGuardarError = useCallback(async () => {
    const errs = validarError(errDesc);
    if (Object.keys(errs).length) {
      setErrFormErrors(errs);
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await registrarErrorPedido(errorTargetId, {
        errores: errorSeleccionados,
        errDesc: errDesc.trim(),
      });
      setPedidos((prev) => prev.map((p) => (p.id === errorTargetId ? actualizado : p)));
      if (pedidoDetalle?.id === errorTargetId) setPedidoDetalle(actualizado);
      setToastMsg({ tipo: 'success', texto: 'Error registrado en el pedido.' });
      cerrarModalError();
    } catch {
      setToastMsg({ tipo: 'error', texto: 'No se pudo registrar el error.' });
    } finally {
      setGuardando(false);
    }
  }, [errorTargetId, errorSeleccionados, errDesc, pedidoDetalle, cerrarModalError]);

  const handleLimpiarError = useCallback(
    async (id) => {
      try {
        const actualizado = await limpiarErrorPedido(id);
        setPedidos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
        if (pedidoDetalle?.id === id) setPedidoDetalle(actualizado);
        setToastMsg({ tipo: 'success', texto: 'Error removido del pedido.' });
      } catch {
        setToastMsg({ tipo: 'error', texto: 'No se pudo limpiar el error.' });
      }
    },
    [pedidoDetalle]
  );

  const verDetalle = useCallback((p) => {
    setPedidoDetalle((prev) => (prev?.id === p.id ? null : p));
  }, []);

  const cerrarDetalle = useCallback(() => setPedidoDetalle(null), []);

  return {
    pedidosFiltrados,
    kpis,
    cargando,
    guardando,
    validandoIA,
    error,
    toastMsg,
    busqueda,
    filtroEstado,
    filtroError,
    setBusqueda,
    setFiltroEstado,
    setFiltroError,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    items,
    totalFormulario,
    alertaIA,
    setAlertaIA,
    condicionesDelCliente,
    condicionClienteActiva,
    modalErrorAbierto,
    errorTargetId,
    errorSeleccionados,
    errDesc,
    errFormErrors,
    pedidoDetalle,
    confirmDelete,
    advertenciaConfirmacion,
    cerrarAdvertenciaConfirmacion,
    ESTADOS_PEDIDO,
    estadosPedidoDisponibles,
    CONDICIONES_PAGO,
    TIPOS_ERROR,
    clientesCatalogo,
    productosCatalogo,
    solicitudesPendientes,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    handleCambiarEstado,
    pedirConfirmarEliminar,
    handleEliminar,
    cancelarEliminar: () => setConfirmDelete(null),
    agregarItem,
    quitarItem,
    cambiarProductoItem,
    cambiarCantItem,
    cambiarPrecioItem,
    abrirModalError,
    cerrarModalError,
    toggleTipoError,
    setErrDesc,
    handleGuardarError,
    handleLimpiarError,
    verDetalle,
    cerrarDetalle,
  };
}