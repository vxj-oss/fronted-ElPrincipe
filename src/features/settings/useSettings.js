import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  restablecerSettings,
  limpiarCache,
  exportarDatosUsuario,
  ACCIONES,
} from './settingsService'

export function useSettings() {
  const [procesando, setProcesando] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(t)
  }, [toastMsg])

  const pedirRestablecerSettings = useCallback(() => {
    setConfirmModal({
      id: 'reset',
      label: 'Restablecer preferencias',
      mensaje: '¿Seguro que quieres eliminar las preferencias guardadas en el servidor? Esta acción no se puede deshacer.',
      onConfirmar: async () => {
        setProcesando(true)
        try {
          await restablecerSettings()
          setToastMsg({ tipo: 'success', texto: 'Preferencias restablecidas.' })
        } catch {
          setToastMsg({ tipo: 'error', texto: 'No se pudo restablecer.' })
        } finally {
          setProcesando(false)
          setConfirmModal(null)
        }
      },
    })
  }, [])

  const pedirLimpiarCache = useCallback(() => {
    setConfirmModal({
      id: 'clear-cache',
      label: 'Limpiar caché local',
      mensaje: '¿Eliminar todos los datos en caché de este navegador? La página se recargará al finalizar.',
      onConfirmar: async () => {
        setProcesando(true)
        try {
          await limpiarCache()
          setConfirmModal(null)
          setToastMsg({ tipo: 'success', texto: 'Caché limpiado correctamente.' })
          setTimeout(() => window.location.reload(), 1500)
        } catch {
          setToastMsg({ tipo: 'error', texto: 'No se pudo limpiar el caché.' })
          setProcesando(false)
          setConfirmModal(null)
        }
      },
    })
  }, [])

  const handleExportarDatos = useCallback(async () => {
    setProcesando(true)
    try {
      await exportarDatosUsuario()
      setToastMsg({ tipo: 'success', texto: 'Datos exportados correctamente.' })
    } catch {
      setToastMsg({ tipo: 'error', texto: 'No se pudo exportar los datos.' })
    } finally {
      setProcesando(false)
    }
  }, [])

  const acciones = useMemo(() => ({
    clearCache: pedirLimpiarCache,
    exportData: handleExportarDatos,
    resetPrefs: pedirRestablecerSettings,
  }), [pedirLimpiarCache, handleExportarDatos, pedirRestablecerSettings])

  const cerrarConfirm = useCallback(() => setConfirmModal(null), [])

  return {
    procesando,
    toastMsg,
    acciones,
    confirmModal,
    cerrarConfirm,
    ACCIONES,
  }
}
