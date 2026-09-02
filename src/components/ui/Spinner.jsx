import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-brand-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
      aria-label="Cargando..."
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}