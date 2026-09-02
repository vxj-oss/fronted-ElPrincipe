import React from 'react';

export default function Card({ children, className = '', title, subtitle, actions }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-neutral-text dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-muted dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
