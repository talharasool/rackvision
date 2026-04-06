import React from 'react';

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required = false,
  className = '',
  disabled = false,
  min,
  max,
  step,
  prefix,
  inputClassName = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm text-slate-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className={prefix ? 'flex' : ''}>
        {prefix && (
          <span className="inline-flex items-center px-3 text-sm text-slate-400 bg-slate-700 border border-r-0 border-slate-600 rounded-l-lg shrink-0">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`
            w-full ${prefix ? 'rounded-r-lg rounded-l-none' : 'rounded-lg'} px-3 py-2 text-sm text-white placeholder-slate-500
            bg-slate-800 border transition-colors duration-150 outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-600'}
            ${inputClassName}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
