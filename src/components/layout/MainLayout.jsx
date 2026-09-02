import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export default function MainLayout() {
  const esPantallaPequena = useMediaQuery('(max-width: 1024px)')
  const [colapsado, setColapsado] = useState(false)

  useEffect(() => {
    setColapsado(esPantallaPequena)
  }, [esPantallaPequena])

  return (
    <div id="app-shell" className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar colapsado={colapsado} />

      <div id="app-shell-inner" className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar onToggleSidebar={() => setColapsado((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  )
}