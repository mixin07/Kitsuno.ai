import React from 'react'

/**
 * NeoSection — Standardized Section Container with Editorial Header Hierarchy
 */
export default function NeoSection({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
}) {
  return (
    <section className={`flex flex-col gap-3.5 sm:gap-4.5 ${className}`}>
      {(eyebrow || title || action) && (
        <div
          className={`flex items-end justify-between gap-3 flex-wrap ${headerClassName}`}
        >
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#F16524]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] tracking-tight mt-0.5">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-neutral-500 font-mono mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </section>
  )
}
