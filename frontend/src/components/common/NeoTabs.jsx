import React from 'react'

/**
 * NeoTabs — Universal Kitsuno Brutalist Navigation Tabs
 *
 * Replaces generic pill buttons with editorial underline or brutalist segmented tabs.
 */
export default function NeoTabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) {
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 p-1 bg-[#FAF8F5] border-2 border-[#241A16] rounded-[6px] shadow-[2px_2px_0_#241A16] ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange && onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-white text-[#241A16] border border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                  : 'text-neutral-600 hover:text-[#241A16] hover:bg-white/50 border border-transparent'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1 py-0.2 rounded-[2px] font-mono text-[9px] font-bold ${
                    isActive
                      ? 'bg-[#241A16] text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: underline editorial tab strip
  return (
    <div
      className={`flex items-center gap-6 sm:gap-8 border-b-2 border-[#241A16] overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange && onChange(tab.id)}
            className={`relative pb-3 pt-1 text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 select-none cursor-pointer ${
              isActive ? 'text-[#241A16]' : 'text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`rounded-[3px] border px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  isActive
                    ? 'border-[#241A16] bg-[#241A16] text-white'
                    : 'border-neutral-300 bg-[#FAF8F5] text-neutral-600'
                }`}
              >
                {tab.count}
              </span>
            )}

            {isActive && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] bg-[#F16524]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
