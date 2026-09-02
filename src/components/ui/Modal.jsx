import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-lg shadow-card`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border dark:border-slate-800">
          <h2 className="text-sm font-semibold text-neutral-text dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-light hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-border dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
