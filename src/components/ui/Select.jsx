import React from 'react';

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
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
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-base ${error ? 'border-red-500 ring-1 ring-red-500' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opcion) => {
          const valor = typeof opcion === 'object' ? opcion.value : opcion;
          const etiqueta = typeof opcion === 'object' ? opcion.label : opcion;
          return (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          );
        })}
      </select>
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}
