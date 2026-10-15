import React from 'react'
import { Undo2 } from 'lucide-react'

export default function SnackbarDeshacer({ pendiente, retardoMs, onDeshacer }) {
  if (!pendiente) return null

  return (
    <div
      key={pendiente.clave}
      role="status"
      className="fixed bottom-6 left-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="min-w-0 text-sm">{pendiente.etiqueta}</span>
        <button
          type="button"
          onClick={onDeshacer}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          <Undo2 size={14} aria-hidden="true" /> Deshacer
        </button>
      </div>
      <div className="h-1 w-full bg-white/10">
        <div className="snackbar-progreso h-full bg-blue-400" style={{ animationDuration: `${retardoMs}ms` }} />
      </div>
    </div>
  )
}
