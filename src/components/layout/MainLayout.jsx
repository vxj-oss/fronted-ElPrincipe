import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BusquedaGlobal from './BusquedaGlobal'
import { AgentProvider } from '../../features/agent/AgentContext'
import AgentFlotante from '../../features/agent/AgentFlotante'
import { EVENTO_DATOS_ACTUALIZADOS } from '../../features/agent/resueltos'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export default function MainLayout() {
  const esMovil = useMediaQuery('(max-width: 767px)')
  const esPantallaPequena = useMediaQuery('(max-width: 1024px)')
  const [colapsado, setColapsado] = useState(false)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [versionDatos, setVersionDatos] = useState(0)
  const location = useLocation()

  useEffect(() => {
    setColapsado(esPantallaPequena)
  }, [esPantallaPequena])

  useEffect(() => {
    const alPresionar = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBusquedaAbierta((abierta) => !abierta)
      }
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [])

  useEffect(() => {
    const alCambiarDatos = () => setVersionDatos((v) => v + 1)
    window.addEventListener(EVENTO_DATOS_ACTUALIZADOS, alCambiarDatos)
    return () => window.removeEventListener(EVENTO_DATOS_ACTUALIZADOS, alCambiarDatos)
  }, [])

  useEffect(() => {
    setBusquedaAbierta(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (esMovil) setColapsado(true)
  }, [location.pathname, esMovil])

  return (
    <AgentProvider>
    <div id="app-shell" className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors">
      <Sidebar colapsado={colapsado} esMovil={esMovil} onCerrar={() => setColapsado(true)} />

      <div id="app-shell-inner" className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Topbar
          onToggleSidebar={() => setColapsado((prev) => !prev)}
          onAbrirBusqueda={() => setBusquedaAbierta(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-950 transition-colors">
          <React.Fragment key={versionDatos}>
            <Outlet />
          </React.Fragment>
        </main>
      </div>
      <BusquedaGlobal abierto={busquedaAbierta} onCerrar={() => setBusquedaAbierta(false)} />
      <AgentFlotante />
    </div>
    </AgentProvider>
  )
}