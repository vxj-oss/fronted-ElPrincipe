import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  return (
    <span className={`${variantClasses[variant] || variantClasses.neutral} ${className}`}>
      {children}
    </span>
  );
}
