import React from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-base ${error ? 'border-red-500 ring-1 ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}