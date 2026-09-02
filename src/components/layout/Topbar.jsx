import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Alternar menú lateral"
        >
          <Menu size={20} />
        </button>

        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
          Sistema LLMS para ventas El Príncipe
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <Link
          to="/perfil"
          className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
          title="Ver perfil"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">
            {inicial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none group-hover:text-blue-600 transition-colors">
              {nombreUsuario}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{rolUsuario}</span>
          </div>
        </Link>
      </div>
    </header>
  )
}