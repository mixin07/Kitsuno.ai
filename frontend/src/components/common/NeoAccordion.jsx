import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import NeoCard from './NeoCard'

/**
 * NeoAccordion — Expandable Neo-Brutalist Panel
 *
 * Collapsed: compact NeoCard
 * Expanded: same card expands naturally without switching styling.
 */
export default function NeoAccordion({
  title,
  subtitle,
  badge,
  icon: Icon,
  defaultExpanded = false,
  level = 2,
  children,
  className = '',
  headerClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded)

  return (
    <NeoCard
      level={level}
      className={`overflow-hidden transition-all duration-150 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left cursor-pointer select-none transition-colors hover:bg-[#FAF8F5]/80 ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#241A16] bg-[#FAF8F5] shrink-0 text-[#F16524]">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-[#241A16] truncate">
                {title}
              </span>
              {badge && (
                <span className="rounded-[3px] border border-[#241A16] bg-[#FAF8F5] px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-[#241A16]">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] font-mono text-neutral-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-[3px] border border-[#241A16] bg-white transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 bg-[#FAF8F5]' : ''
          }`}
        >
          <ChevronDown className="h-3.5 w-3.5 text-[#241A16] stroke-[2.5]" />
        </div>
      </button>

      {isOpen && (
        <div className="border-t-[1.5px] border-[#241A16] p-3.5 sm:p-4 bg-white">
          {children}
        </div>
      )}
    </NeoCard>
  )
}
