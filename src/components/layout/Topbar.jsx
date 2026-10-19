import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Sun, Moon, Sparkles, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const ROL_LABELS = {
  administrador: 'Administrador General',
  asesor_comercial: 'Asesor Comercial',
}

export default function Topbar({ onToggleSidebar, onAbrirBusqueda }) {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const nombreUsuario = user?.nombre_completo || user?.nombreCompleto || user?.nombre_usuario || 'Usuario'
  const rolUsuario = ROL_LABELS[user?.rol] || user?.rol || 'Administrador General'
  const inicial = nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'

  return (
    <header className="h-16 bg-white/85 dark:bg-slate-900/90 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_#2b2b32] transition-colors">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="Alternar menú lateral"
        >
          <Menu size={20} />
        </button>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-500">
          <Sparkles size={12} className="text-brand-600 dark:text-brand-500" />
          Sistema LLMS para ventas El Príncipe
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAbrirBusqueda}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Búsqueda rápida"
          title="Búsqueda rápida (Ctrl + K)"
        >
          <Search size={14} aria-hidden="true" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden rounded-full border border-slate-200 px-1.5 py-px text-[10px] md:inline dark:border-slate-700">Ctrl K</kbd>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <Sun size={18} className={`transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-50 absolute inset-0 m-auto' : 'opacity-100 rotate-0 scale-100'}`} />
          <Moon size={18} className={`transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50 absolute inset-0 m-auto'}`} />
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <Link
          to="/perfil"
          className="flex items-center gap-3 p-1.5 pr-2.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 group cursor-pointer"
          title="Ver perfil"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center font-semibold text-xs text-white shadow-sm ring-2 ring-transparent group-hover:ring-brand-100 dark:group-hover:ring-brand-950 group-hover:scale-105 transition-all duration-200">
            {inicial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
              {nombreUsuario}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{rolUsuario}</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
