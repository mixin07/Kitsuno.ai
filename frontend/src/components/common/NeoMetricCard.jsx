import React from 'react'

/**
 * NeoMetricCard — Universal Minimal Neo-Brutalist Metric Card
 *
 * Implements the single source-of-truth metric card specification for Kitsuno:
 * - Surface: #FFFFFF
 * - Border: 2px solid #241A16
 * - Shadow: 4px 4px 0 #241A16 (unblurred, physical)
 * - Radius: rounded-[8px]
 * - Number: Instrument Serif (font-serif font-normal)
 * - Label: Uppercase tracked UI sans-serif
 * - Optional 16-20px Lucide icon in a compact framed container
 */
export default function NeoMetricCard({
  label,
  value,
  description,
  hint,
  icon: Icon,
  iconColor = 'text-[#F16524]',
  valueColor = 'text-[#241A16]',
  badge,
  badgeVariant = 'default',
  trend,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const supportingText = description ?? hint

  const badgeStyles = {
    default: 'bg-[#FAF8F5] text-[#241A16] border-[#241A16]',
    orange: 'bg-[#FFF2E6] text-[#F16524] border-[#241A16]',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-600',
    warning: 'bg-amber-50 text-amber-800 border-amber-600',
    error: 'bg-rose-50 text-rose-800 border-rose-600',
  }

  const isInteractive = typeof onClick === 'function'

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`relative bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-150 ${
        isInteractive
          ? 'cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#241A16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#241A16]'
          : ''
      } ${className}`}
      {...rest}
    >
      {/* 1. Header: Label + Optional Badge + Optional Framed Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate">
          {label}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span
              className={`rounded-[4px] border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                badgeStyles[badgeVariant] || badgeStyles.default
              }`}
            >
              {badge}
            </span>
          )}

          {Icon && (
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#241A16] bg-[#FAF8F5]">
              {React.isValidElement(Icon) ? (
                Icon
              ) : (
                <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle & Bottom: Editorial Value + Supporting Text */}
      <div className="mt-2.5">
        <div className="flex items-baseline gap-2">
          <p
            className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight leading-none ${valueColor}`}
          >
            {value}
          </p>
          {trend && (
            <span className="text-[11px] font-mono font-bold text-neutral-600">
              {trend}
            </span>
          )}
        </div>

        {supportingText && (
          <p className="mt-1 text-[11px] font-mono text-neutral-500 leading-snug line-clamp-2">
            {supportingText}
          </p>
        )}
      </div>

      {/* 3. Optional Custom Content (e.g., Progress bar) */}
      {children && <div className="mt-2 pt-2 border-t border-[rgba(36,26,22,0.08)]">{children}</div>}
    </div>
  )
}
