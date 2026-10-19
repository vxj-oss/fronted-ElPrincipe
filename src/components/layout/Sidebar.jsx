import React from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo.png'
import {
  LayoutDashboard,
  Bot,
  Package,
  Users,
  FileSpreadsheet,
  ShoppingCart,
  Scale,
  TrendingUp,
  FileText,
  History,
  User,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { puede } from '../../utils/permissions'

export const MENU_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, cap: 'dashboard.ver' },
  { to: '/agente',        label: 'Agente IA',     icon: Bot,             cap: 'agente.usar' },
  { to: '/productos',     label: 'Productos',     icon: Package,         cap: 'productos.ver' },
  { to: '/clientes',      label: 'Clientes',      icon: Users,           cap: 'clientes.ver' },
  { to: '/solicitudes',   label: 'Cotizaciones',   icon: FileSpreadsheet, cap: 'solicitudes.ver' },
  { to: '/pedidos',       label: 'Pedidos',       icon: ShoppingCart,    cap: 'pedidos.ver' },
  { to: '/condiciones',   label: 'Condiciones',   icon: Scale,           cap: 'condiciones.ver' },
  { to: '/indicadores',   label: 'Indicadores',   icon: TrendingUp,      cap: 'indicadores.ver' },
  { to: '/reportes',      label: 'Reportes',      icon: FileText,        cap: 'reportes.ver' },
  { to: '/historial',     label: 'Historial',     icon: History,         cap: 'historial.ver' },
  { to: '/usuarios',      label: 'Usuarios',      icon: UserCog,         cap: 'usuarios.ver' },
  { to: '/perfil',        label: 'Perfil',        icon: User,            cap: 'perfil.ver' },
  { to: '/configuracion', label: 'Configuración', icon: Settings,        cap: 'configuracion.ver' },
]

function iniciales(nombre) {
  const partes = (nombre || '').trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || 'U'
}

export default function Sidebar({ colapsado, esMovil = false, onCerrar }) {
  const { user, logout } = useAuth()

  const contraido = esMovil ? false : colapsado

  const nombreUsuario = user?.nombre_completo || user?.nombreCompleto || user?.nombre_usuario || 'Usuario'
  const correoUsuario = user?.correo || user?.email || 'usuario@elprincipe.pe'
  const rolUsuario = user?.rol || user?.cargo || 'Administrador General'

  const menuVisible = MENU_ITEMS.filter((item) => puede(user?.rol, item.cap))

  const contenido = (
    <>
      <div className="relative p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-3 overflow-hidden h-16">
        <div className="relative shrink-0">
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-slate-200 dark:ring-slate-800"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 status-dot-live" />
        </div>
        {!contraido && (
          <div className="truncate transition-opacity duration-200">
            <p className="font-display font-bold text-base tracking-tight leading-tight text-slate-900 dark:text-white">
              EL PRÍNCIPE
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{rolUsuario}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-scroll relative flex-1 min-h-0 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuVisible.map(({ to, label, icon: Icon }, idx) => (
          <NavLink
            key={to}
            to={to}
            title={contraido ? label : undefined}
            onClick={esMovil ? onCerrar : undefined}
            style={{ animationDelay: `${idx * 30}ms` }}
            className={({ isActive }) =>
              `nav-item-enter group relative flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all duration-200 ${
                contraido ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-slate-100 dark:bg-brand-950 text-brand-600 dark:text-brand-500 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50 hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !contraido && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-600" />
                )}
                <Icon
                  size={19}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-105' : 'group-hover:scale-110 group-hover:-translate-y-px'
                  }`}
                />
                {!contraido && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className={`flex items-center ${contraido ? 'justify-center' : 'justify-between'}`}>
          {!contraido && (
            <div className="flex items-center gap-2.5 overflow-hidden mr-2">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shadow-md shadow-brand-600/30 ring-2 ring-white dark:ring-slate-800">
                  {iniciales(nombreUsuario)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{nombreUsuario}</p>
                <p className="text-xs text-slate-500 truncate">{correoUsuario}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all duration-150 shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )

  if (esMovil) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
            colapsado ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={onCerrar}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col select-none transition-transform duration-300 ease-in-out overflow-hidden ${
            colapsado ? '-translate-x-full' : 'translate-x-0 shadow-2xl'
          }`}
        >
          {contenido}
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col shrink-0 h-full select-none shadow-[0_0_32px_rgba(0,0,0,0.07)] dark:shadow-none dark:border-r dark:border-slate-800 transition-all duration-300 ease-in-out ${
        contraido ? 'w-20' : 'w-64'
      }`}
    >
      {contenido}
    </aside>
  )
}
