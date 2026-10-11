import React from 'react'

/**
 * NeoInput — Kitsuno Structural Neo-Brutalist Form Input
 */
export default function NeoInput({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  containerClassName = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#241A16]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-neutral-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-white border-2 border-[#241A16] rounded-[6px] text-xs sm:text-sm text-[#241A16] placeholder:text-neutral-400 focus:outline-none focus:border-[#F16524] focus:ring-1 focus:ring-[#F16524] transition-colors py-2 px-3 ${
            Icon ? 'pl-9.5' : ''
          } ${error ? 'border-rose-600 focus:border-rose-600 focus:ring-rose-600' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500 font-mono">{helperText}</p>
      ) : null}
    </div>
  )
}
