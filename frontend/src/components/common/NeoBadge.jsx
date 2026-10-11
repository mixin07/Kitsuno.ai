import React from 'react'

/**
 * NeoBadge — Compact Outlined Rectangular Brutalist Badge
 *
 * Avoids giant rounded pills. Uses low-radius framed borders with monospace tracking.
 */
export default function NeoBadge({
  variant = 'default',
  children,
  className = '',
  icon: Icon,
  ...props
}) {
  const variantStyles = {
    default: 'bg-[#FAF8F5] text-[#241A16] border-[#241A16]',
    orange: 'bg-[#FFF2E6] text-[#F16524] border-[#241A16]',
    success: 'bg-emerald-50 text-emerald-800 border-[#241A16]',
    warning: 'bg-amber-50 text-amber-800 border-[#241A16]',
    error: 'bg-rose-50 text-rose-800 border-[#241A16]',
    dark: 'bg-[#241A16] text-white border-[#241A16]',
    outline: 'bg-white text-[#241A16] border-[#241A16]',
  }

  const selectedVariant = variantStyles[variant] || variantStyles.default

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 select-none ${selectedVariant} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  )
}
