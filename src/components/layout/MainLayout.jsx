import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export default function MainLayout() {
  const esMovil = useMediaQuery('(max-width: 767px)')
  const esPantallaPequena = useMediaQuery('(max-width: 1024px)')
  const [colapsado, setColapsado] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setColapsado(esPantallaPequena)
  }, [esPantallaPequena])

  useEffect(() => {
    if (esMovil) setColapsado(true)
  }, [location.pathname, esMovil])

  return (
    <div id="app-shell" className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar colapsado={colapsado} esMovil={esMovil} onCerrar={() => setColapsado(true)} />

      <div id="app-shell-inner" className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Topbar onToggleSidebar={() => setColapsado((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  )
}