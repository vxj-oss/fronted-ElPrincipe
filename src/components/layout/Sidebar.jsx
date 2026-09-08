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
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { puede } from '../../utils/permissions'

const MENU_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, cap: 'dashboard.ver' },
  { to: '/agente',        label: 'Agente IA',     icon: Bot,             cap: 'agente.usar' },
  { to: '/productos',     label: 'Productos',     icon: Package,         cap: 'productos.ver' },
  { to: '/clientes',      label: 'Clientes',      icon: Users,           cap: 'clientes.ver' },
  { to: '/solicitudes',   label: 'Solicitudes',   icon: FileSpreadsheet, cap: 'solicitudes.ver' },
  { to: '/pedidos',       label: 'Pedidos',       icon: ShoppingCart,    cap: 'pedidos.ver' },
  { to: '/condiciones',   label: 'Condiciones',   icon: Scale,           cap: 'condiciones.ver' },
  { to: '/indicadores',   label: 'Indicadores',   icon: TrendingUp,      cap: 'indicadores.ver' },
  { to: '/reportes',      label: 'Reportes',      icon: FileText,        cap: 'reportes.ver' },
  { to: '/historial',     label: 'Historial',     icon: History,         cap: 'historial.ver' },
  { to: '/usuarios',      label: 'Usuarios',      icon: UserCog,         cap: 'usuarios.ver' },
  { to: '/perfil',        label: 'Perfil',        icon: User,            cap: 'perfil.ver' },
  { to: '/configuracion', label: 'Configuración', icon: Settings,        cap: 'configuracion.ver' },
]

export default function Sidebar({ colapsado, esMovil = false, onCerrar }) {
  const { user, logout } = useAuth()

  const contraido = esMovil ? false : colapsado

  const nombreUsuario = user?.nombre_completo || user?.nombreCompleto || user?.nombre_usuario || 'Usuario'
  const correoUsuario = user?.correo || user?.email || 'usuario@elprincipe.pe'
  const rolUsuario = user?.rol || user?.cargo || 'Administrador General'

  const menuVisible = MENU_ITEMS.filter((item) => puede(user?.rol, item.cap))

  const contenido = (
    <>
      {/* Encabezado Marca */}
      <div className="p-4 border-b border-slate-800 shrink-0 flex items-center gap-3 overflow-hidden h-16">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm" />
        {!contraido && (
          <div className="truncate transition-opacity duration-200">
            <p className="font-bold text-base tracking-tight leading-tight">EL PRÍNCIPE</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{rolUsuario}</p>
          </div>
        )}
      </div>

      {/* Enlaces de Navegación */}
      <nav className="flex-1 min-h-0 px-3 py-3 space-y-1.5 overflow-y-auto">
        {menuVisible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={contraido ? label : undefined}
            onClick={esMovil ? onCerrar : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                contraido ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {!contraido && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer de Usuario */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
        <div className={`flex items-center ${contraido ? 'justify-center' : 'justify-between'}`}>
          {!contraido && (
            <div className="overflow-hidden mr-2">
              <p className="text-sm font-medium text-slate-200 truncate">{nombreUsuario}</p>
              <p className="text-xs text-slate-500 truncate">{correoUsuario}</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
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
          className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 ${
            colapsado ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={onCerrar}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-slate-900 text-white flex flex-col select-none transition-transform duration-300 ease-in-out ${
            colapsado ? '-translate-x-full' : 'translate-x-0 border-r border-slate-800 shadow-2xl'
          }`}
        >
          {contenido}
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col shrink-0 h-full select-none border-r border-slate-800 transition-all duration-300 ease-in-out ${
        contraido ? 'w-20' : 'w-64'
      }`}
    >
      {contenido}
    </aside>
  )
}
