import React from 'react'
import NeoCard from './NeoCard'

/**
 * NeoEmptyState — Compact Brutalist Empty State
 *
 * Removes giant empty SaaS containers. Uses compact framed icon,
 * Instrument Serif heading, short description, and optional action button.
 */
export default function NeoEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <NeoCard
      level={1}
      className={`p-6 sm:p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-[6px] border-2 border-[#241A16] bg-[#FAF8F5] shadow-[2px_2px_0_#241A16] mb-3 text-[#F16524]">
          <Icon className="h-6 w-6" />
        </div>
      )}

      {title && (
        <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] tracking-tight">
          {title}
        </h3>
      )}

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-4.5">{action}</div>}
    </NeoCard>
  )
}
