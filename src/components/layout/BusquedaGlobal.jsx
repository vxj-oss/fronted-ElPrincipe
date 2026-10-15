import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FilePlus, FileDown, FileSpreadsheet, Package, Search, ShoppingCart, UserPlus, Users } from 'lucide-react'
import { MENU_ITEMS } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { puede } from '../../utils/permissions'
import { descargarArchivo } from '../../utils/descargas'
import { fechaHoyLima } from '../../utils/fechas'
import { fetchClientes } from '../../features/customers/customersService'
import { fetchProductos } from '../../features/products/productsService'

const VIGENCIA_CACHE_MS = 5 * 60 * 1000

const ACCIONES = [
  { clave: 'a-cotizacion', titulo: 'Nueva cotización', detalle: 'Abrir el formulario de cotización', palabras: 'crear registrar agregar', icono: FilePlus, cap: 'solicitudes.escribir', destino: '/solicitudes?nueva=1' },
  { clave: 'a-pedido', titulo: 'Nuevo pedido', detalle: 'Abrir el formulario de pedido', palabras: 'crear registrar agregar', icono: ShoppingCart, cap: 'pedidos.escribir', destino: '/pedidos?nuevo=1' },
  { clave: 'a-cliente', titulo: 'Nuevo cliente', detalle: 'Registrar un cliente', palabras: 'crear agregar', icono: UserPlus, cap: 'clientes.escribir', destino: '/clientes?nuevo=1' },
  { clave: 'a-producto', titulo: 'Nuevo producto', detalle: 'Registrar un producto', palabras: 'crear agregar', icono: Package, cap: 'productos.escribir', destino: '/productos?nuevo=1' },
  { clave: 'a-cierre', titulo: 'Cierre del día (PDF)', detalle: 'Descargar el resumen de hoy', palabras: 'reporte descargar', icono: FileDown, cap: 'dashboard.ver', ejecutar: () => descargarArchivo('/reports/cierre-dia/pdf', `cierre_dia_${fechaHoyLima()}.pdf`).catch(() => {}) },
  { clave: 'a-reposicion', titulo: 'Lista de reposición (Excel)', detalle: 'Productos a pedir al proveedor', palabras: 'stock reponer descargar', icono: FileSpreadsheet, cap: 'productos.ver', ejecutar: () => descargarArchivo('/reports/reposicion/excel', 'lista_reposicion.xlsx').catch(() => {}) },
]
let cache = { momento: 0, clientes: [], productos: [] }

const normalizar = (texto) =>
  (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

async function cargarDatos() {
  if (Date.now() - cache.momento < VIGENCIA_CACHE_MS) return cache
  const [clientes, productos] = await Promise.all([
    fetchClientes().catch(() => []),
    fetchProductos().catch(() => []),
  ])
  cache = {
    momento: Date.now(),
    clientes: clientes.filter((c) => c.activo),
    productos: productos.filter((p) => p.activo),
  }
  return cache
}

function filtrar(lista, tokens, texto, limite) {
  if (tokens.length === 0) return lista.slice(0, limite)
  return lista
    .map((item) => ({ item, base: normalizar(texto(item)) }))
    .filter(({ base }) => tokens.every((t) => base.includes(t)))
    .sort((a, b) => a.base.indexOf(tokens[0]) - b.base.indexOf(tokens[0]))
    .slice(0, limite)
    .map(({ item }) => item)
}

export default function BusquedaGlobal({ abierto, onCerrar }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [consulta, setConsulta] = useState('')
  const [activo, setActivo] = useState(0)
  const [datos, setDatos] = useState({ clientes: [], productos: [] })
  const listaRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    setConsulta('')
    setActivo(0)
    cargarDatos().then((d) => setDatos({ clientes: d.clientes, productos: d.productos }))
  }, [abierto])

  const resultados = useMemo(() => {
    const tokens = normalizar(consulta).split(/\s+/).filter(Boolean)
    const acciones = filtrar(
      ACCIONES.filter((a) => puede(user?.rol, a.cap)),
      tokens,
      (a) => `${a.titulo} ${a.palabras}`,
      tokens.length ? 4 : 6
    ).map((a) => ({ clave: a.clave, tipo: 'Acciones', titulo: a.titulo, detalle: a.detalle, icono: a.icono, destino: a.destino, ejecutar: a.ejecutar }))

    const paginas = filtrar(
      MENU_ITEMS.filter((m) => puede(user?.rol, m.cap)),
      tokens,
      (m) => m.label,
      tokens.length ? 4 : 6
    ).map((m) => ({ clave: `p-${m.to}`, tipo: 'Páginas', titulo: m.label, detalle: m.to, icono: m.icon, destino: m.to }))

    const clientes = tokens.length && puede(user?.rol, 'clientes.ver')
      ? filtrar(datos.clientes, tokens, (c) => `${c.nombre} ${c.ruc}`, 5).map((c) => ({
          clave: `c-${c.id}`,
          tipo: 'Clientes',
          titulo: c.nombre,
          detalle: c.ruc || c.distrito,
          icono: Users,
          destino: `/clientes?q=${encodeURIComponent(c.nombre)}`,
        }))
      : []

    const productos = tokens.length && puede(user?.rol, 'productos.ver')
      ? filtrar(datos.productos, tokens, (p) => `${p.nombre} ${p.codigo}`, 6).map((p) => ({
          clave: `pr-${p.id}`,
          tipo: 'Productos',
          titulo: p.nombre,
          detalle: `S/ ${Number(p.precio).toFixed(2)} · stock ${p.stock}`,
          icono: Package,
          destino: `/productos?q=${encodeURIComponent(p.nombre)}`,
        }))
      : []

    return [...acciones, ...paginas, ...clientes, ...productos]
  }, [consulta, datos, user])

  useEffect(() => {
    setActivo(0)
  }, [consulta])

  useEffect(() => {
    listaRef.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  if (!abierto) return null

  const abrir = (resultado) => {
    if (!resultado) return
    onCerrar()
    if (resultado.ejecutar) resultado.ejecutar()
    else navigate(resultado.destino)
  }

  const manejarTecla = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCerrar()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((i) => Math.min(resultados.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      abrir(resultados[activo])
    }
  }

  let tipoAnterior = null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm px-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda rápida"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
          <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            autoFocus
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={manejarTecla}
            placeholder="Buscar páginas, clientes o productos…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Buscar"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block dark:border-slate-700">Esc</kbd>
        </div>

        <ul ref={listaRef} className="max-h-[50vh] overflow-y-auto p-2">
          {resultados.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">Sin resultados para «{consulta}».</li>
          )}
          {resultados.map((r, i) => {
            const Icono = r.icono
            const encabezado = r.tipo !== tipoAnterior
            tipoAnterior = r.tipo
            return (
              <React.Fragment key={r.clave}>
                {encabezado && (
                  <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400" aria-hidden="true">
                    {r.tipo}
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    data-activo={i === activo}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => abrir(r)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      i === activo
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Icono size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.titulo}</span>
                      {r.detalle && <span className="block truncate text-xs text-slate-500">{r.detalle}</span>}
                    </span>
                    {i === activo && <CornerDownLeft size={13} className="shrink-0 text-slate-400" aria-hidden="true" />}
                  </button>
                </li>
              </React.Fragment>
            )
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-700">
          <span>↑↓ navegar</span>
          <span>Enter abrir</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
