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
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MENU_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/agente',        label: 'Agente IA',     icon: Bot },
  { to: '/productos',     label: 'Productos',     icon: Package },
  { to: '/clientes',      label: 'Clientes',      icon: Users },
  { to: '/solicitudes',   label: 'Solicitudes',   icon: FileSpreadsheet },
  { to: '/pedidos',       label: 'Pedidos',       icon: ShoppingCart },
  { to: '/condiciones',   label: 'Condiciones',   icon: Scale },
  { to: '/indicadores',   label: 'Indicadores',   icon: TrendingUp },
  { to: '/reportes',      label: 'Reportes',      icon: FileText },
  { to: '/historial',     label: 'Historial',     icon: History },
  { to: '/perfil',        label: 'Perfil',        icon: User },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar({ colapsado }) {
  const { user, logout } = useAuth()

  const nombreUsuario = user?.nombre_completo || user?.nombreCompleto || user?.nombre_usuario || 'Usuario'
  const correoUsuario = user?.correo || user?.email || 'usuario@elprincipe.pe'
  const rolUsuario = user?.rol || user?.cargo || 'Administrador General'

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col shrink-0 h-full select-none border-r border-slate-800 transition-all duration-300 ease-in-out ${
        colapsado ? 'w-20' : 'w-64'
      }`}
    >
      {/* Encabezado Marca */}
      <div className="p-4 border-b border-slate-800 shrink-0 flex items-center gap-3 overflow-hidden h-16">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm" />
        {!colapsado && (
          <div className="truncate transition-opacity duration-200">
            <p className="font-bold text-base tracking-tight leading-tight">EL PRÍNCIPE</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{rolUsuario}</p>
          </div>
        )}
      </div>

      {/* Enlaces de Navegación */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={colapsado ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                colapsado ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {!colapsado && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer de Usuario */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
        <div className={`flex items-center ${colapsado ? 'justify-center' : 'justify-between'}`}>
          {!colapsado && (
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
    </aside>
  )
}