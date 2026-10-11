import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * NeoButton — Universal Kitsuno Tactile Brutalist Button
 *
 * Variants:
 * - primary: Orange bg, 2px border, 3px hard shadow
 * - secondary: White bg, 2px border, 2px hard shadow
 * - dark: Dark bg, 2px border, 2px hard shadow
 * - danger: Rose bg, 2px border, 2px hard shadow
 * - tertiary / ghost: Flat transparent text button
 */
export default function NeoButton({
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] rounded-[4px] gap-1 font-mono uppercase font-bold tracking-wider',
    sm: 'px-2.5 py-1 text-xs rounded-[5px] gap-1.5 font-semibold',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-[6px] gap-2 font-semibold',
    lg: 'px-5 py-2.5 text-sm sm:text-base rounded-[6px] gap-2.5 font-semibold',
  }[size] || 'px-4 py-2 text-xs sm:text-sm rounded-[6px] gap-2 font-semibold'

  const variantClasses = {
    primary:
      'bg-[#F16524] text-white border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] hover:bg-[#e05312] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#241A16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    secondary:
      'bg-white text-[#241A16] border-2 border-[#241A16] shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#241A16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    dark:
      'bg-[#241A16] text-white border-2 border-[#241A16] shadow-[2px_2px_0_#241A16] hover:bg-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    danger:
      'bg-rose-600 text-white border-2 border-[#241A16] shadow-[2px_2px_0_#241A16] hover:bg-rose-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    subtle:
      'bg-[#FAF8F5] text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FFF2E6] hover:border-[#F16524] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    ghost:
      'bg-transparent text-[#241A16] hover:bg-[#241A16]/5 border-0 shadow-none font-medium',
  }[variant] || 'bg-[#F16524] text-white border-2 border-[#241A16]'

  const isDisabled = disabled || loading

  const buttonProps = Component === 'button' ? { type, disabled: isDisabled } : {}

  return (
    <Component
      {...buttonProps}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none ${
        isDisabled
          ? 'opacity-55 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer'
      } ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      {children}

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
    </Component>
  )
}
