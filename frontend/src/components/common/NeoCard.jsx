import React from 'react'

/**
 * NeoCard — Kitsuno Neo-Brutalist Surface Container
 *
 * Hierarchy:
 * - Level 1: Major Card (border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] rounded-[8px])
 * - Level 2: Inner / Secondary Block (border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] rounded-[6px])
 * - Level 3: Text / Metadata flat container (no border, no shadow)
 */
export default function NeoCard({
  level = 1,
  as: Component = 'div',
  interactive = false,
  onClick,
  className = '',
  children,
  ...props
}) {
  const isInteractive = interactive || typeof onClick === 'function'

  let levelClasses = ''
  if (level === 1) {
    levelClasses =
      'bg-white border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] rounded-[8px]'
  } else if (level === 2) {
    levelClasses =
      'bg-white border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] rounded-[6px]'
  } else {
    levelClasses = 'bg-transparent border-0 shadow-none'
  }

  const interactiveClasses = isInteractive
    ? 'cursor-pointer transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#241A16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#241A16]'
    : ''

  return (
    <Component
      onClick={onClick}
      className={`${levelClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
