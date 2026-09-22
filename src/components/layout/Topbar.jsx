import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Sun, Moon, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const ROL_LABELS = {
  administrador: 'Administrador General',
  asesor_comercial: 'Asesor Comercial',
}

export default function Topbar({ onToggleSidebar }) {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const nombreUsuario = user?.nombre_completo || user?.nombreCompleto || user?.nombre_usuario || 'Usuario'
  const rolUsuario = ROL_LABELS[user?.rol] || user?.rol || 'Administrador General'
  const inicial = nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="Alternar menú lateral"
        >
          <Menu size={20} />
        </button>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 dark:from-blue-950 dark:to-indigo-950 dark:text-blue-300 dark:border-blue-900 shadow-sm">
          <Sparkles size={12} className="text-blue-500 dark:text-blue-400" />
          Sistema LLMS para ventas El Príncipe
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden"
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-semibold text-xs text-white shadow-sm ring-2 ring-transparent group-hover:ring-blue-300 dark:group-hover:ring-blue-800 group-hover:scale-105 transition-all duration-200">
            {inicial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {nombreUsuario}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{rolUsuario}</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
