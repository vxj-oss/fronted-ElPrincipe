import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', 
  className = '',
  disabled = false,
  onClick,
  ...props
}) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses[variant] || 'btn-primary'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}