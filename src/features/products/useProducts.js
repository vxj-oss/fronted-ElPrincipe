import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchProductos,
  fetchCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  UNIDADES,
  NIVELES_ROTACION,
} from './productsService'
const FORM_INICIAL = {
  codigo: '',
  nombre: '',
  categoria_id: '',
  precio: '',
  costo: '',
  stock: '',
  minimo: '5',
  unidad: 'Unidad',
  rotacion: 'Media',
  descripcion: '',
}

function generarSKU(nombre, productosExistentes) {
  const limpio = (nombre || '').normalize('NFD').toUpperCase().replace(/[^A-Z\s]/g, '').trim()
  const prefijo = (limpio.split(/\s+/)[0] || 'PRD').slice(0, 3) || 'PRD'

  const codigosExistentes = new Set(
    productosExistentes.map(p => (p.codigo || '').toUpperCase())
  )
  let numero = 1
  let sku = `${prefijo}-${String(numero).padStart(3, '0')}`
  while (codigosExistentes.has(sku)) {
    numero += 1
    sku = `${prefijo}-${String(numero).padStart(3, '0')}`
  }
  return sku
}

function validarForm(form) {
  const errs = {}
  if (!form.nombre.trim()) errs.nombre = 'El nombre del producto es requerido.'
  if (!form.categoria_id) errs.categoria_id = 'Selecciona una categoría.'
  if (!form.precio || Number(form.precio) <= 0)
    errs.precio = 'El precio debe ser mayor a 0.'
  if (form.stock === '' || Number(form.stock) < 0)
    errs.stock = 'El stock no puede ser negativo.'
  return errs
}

export function useProducts() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [codigoAuto, setCodigoAuto] = useState(true)
  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList] = await Promise.all([
          fetchProductos(),
          fetchCategorias(),
        ])
        setProductos(prodList)
        setCategorias(catList)
      } catch (err) {
        setError('No se pudieron cargar los datos de productos y categorías.')
      } finally {
        setCargando(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(t)
  }, [toastMsg])

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const q = busqueda.toLowerCase()
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      const matchCat = !filtroCategoria || String(p.categoria_id) === String(filtroCategoria)
      const matchEst = !filtroStock || estadoStock(p) === filtroStock
      return matchQ && matchCat && matchEst
    })
  }, [productos, busqueda, filtroCategoria, filtroStock])

  const kpis = useMemo(() => {
    const lista = productosFiltrados
    return {
      total: lista.length,
      criticos: lista.filter(p => estadoStock(p) === 'critico').length,
      activos: lista.length,
      valorInventario: lista.reduce((acc, p) => acc + (p.costo * p.stock), 0),
    }
  }, [productosFiltrados])

  const abrirCrear = useCallback(() => {
    setEditandoId(null)
    setCodigoAuto(true)
    setForm({
      ...FORM_INICIAL,
      categoria_id: categorias[0]?.id ? String(categorias[0].id) : '',
    })
    setFormErrors({})
    setModalAbierto(true)
  }, [categorias])

  const abrirEditar = useCallback((producto) => {
    setEditandoId(producto.id)
    setCodigoAuto(false)
    setForm({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria_id: String(producto.categoria_id),
      precio: String(producto.precio),
      costo: String(producto.costo),
      stock: String(producto.stock),
      minimo: String(producto.minimo),
      unidad: producto.unidad,
      rotacion: producto.rotacion || 'Media',
      descripcion: producto.descripcion || '',
    })
    setFormErrors({})
    setModalAbierto(true)
  }, [])

  const cerrarModal = useCallback(() => {
    setModalAbierto(false)
    setEditandoId(null)
    setFormErrors({})
  }, [])

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target

    if (name === 'codigo') {
      setCodigoAuto(false)
      setForm(prev => ({ ...prev, codigo: value }))
      setFormErrors(prev => ({ ...prev, codigo: undefined }))
      return
    }

    setForm(prev => {
      const siguiente = { ...prev, [name]: value }
      if (name === 'nombre' && codigoAuto && !editandoId) {
        siguiente.codigo = generarSKU(value, productos)
      }
      return siguiente
    })
    setFormErrors(prev => ({ ...prev, [name]: undefined }))
  }, [codigoAuto, editandoId, productos])

  const handleGuardar = useCallback(async () => {
    const errs = validarForm(form)
    if (Object.keys(errs).length) {
      setFormErrors(errs)
      return
    }

    setGuardando(true)
    const codigoFinal = form.codigo.trim() || generarSKU(form.nombre, productos)
    const payload = {
      categoria_id: form.categoria_id,
      codigo: codigoFinal.toUpperCase(),
      nombre: form.nombre.trim(),
      precio: form.precio,
      costo: form.costo,
      stock: form.stock,
      minimo: form.minimo,
      unidad: form.unidad,
      rotacion: form.rotacion,
      descripcion: form.descripcion.trim(),
    }

    try {
      if (editandoId) {
        const actualizado = await actualizarProducto(editandoId, payload)
        setProductos(prev => prev.map(p => p.id === editandoId ? actualizado : p))
        setToastMsg({ tipo: 'success', texto: 'Producto actualizado exitosamente.' })
      } else {
        const nuevo = await crearProducto(payload)
        setProductos(prev => [...prev, nuevo])
        setToastMsg({ tipo: 'success', texto: 'Producto agregado al catálogo.' })
      }
      cerrarModal()
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'Error al guardar el producto.' })
    } finally {
      setGuardando(false)
    }
  }, [form, editandoId, cerrarModal, productos])

  const pedirConfirmarEliminar = useCallback((id) => {
    setConfirmDelete(id)
  }, [])

  const handleEliminar = useCallback(async () => {
    if (!confirmDelete) return
    try {
      await eliminarProducto(confirmDelete)
      setProductos(prev => prev.filter(p => p.id !== confirmDelete))
      setToastMsg({ tipo: 'success', texto: 'Producto eliminado del sistema.' })
    } catch (err) {
      setToastMsg({ tipo: 'error', texto: err.message || 'No se pudo eliminar el producto.' })
    } finally {
      setConfirmDelete(null)
    }
  }, [confirmDelete])

  return {
    productosFiltrados,
    categorias,
    kpis,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroCategoria,
    filtroStock,
    setBusqueda,
    setFiltroCategoria,
    setFiltroStock,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    confirmDelete,
    UNIDADES,
    NIVELES_ROTACION,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    pedirConfirmarEliminar,
    handleEliminar,
    cancelarEliminar: () => setConfirmDelete(null),
  }
}

export function estadoStock(producto) {
  if (producto.minimo <= 0) return 'ok'
  const pct = producto.stock / producto.minimo
  if (pct <= 0.5) return 'critico'
  if (pct <= 1.0) return 'bajo'
  return 'ok'
}