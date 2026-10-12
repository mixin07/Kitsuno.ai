import React from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * NeoSelect — Kitsuno Structural Neo-Brutalist Select Dropdown
 */
export default function NeoSelect({
  label,
  error,
  helperText,
  options = [],
  className = '',
  containerClassName = '',
  id,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#241A16]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          className={`w-full appearance-none bg-white border-2 border-[#241A16] rounded-[6px] text-xs sm:text-sm text-[#241A16] focus:outline-none focus:border-[#F16524] focus:ring-1 focus:ring-[#F16524] transition-colors py-2 pl-3 pr-8.5 cursor-pointer ${
            error ? 'border-rose-600' : ''
          } ${className}`}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <ChevronDown className="w-4 h-4 text-[#241A16] absolute right-3 pointer-events-none stroke-[2.5]" />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500 font-mono">{helperText}</p>
      ) : null}
    </div>
  )
}
