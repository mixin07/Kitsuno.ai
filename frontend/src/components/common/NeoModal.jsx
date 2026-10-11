import React, { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * NeoModal — Kitsuno Physical Brutalist Dialog Container
 */
export default function NeoModal({
  isOpen,
  onClose,
  title,
  eyebrow,
  maxWidth = 'max-w-lg',
  children,
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#241A16]/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Shell */}
      <div
        className={`relative w-full ${maxWidth} bg-white border-2 border-[#241A16] shadow-[5px_5px_0_#241A16] rounded-[8px] z-10 overflow-hidden flex flex-col max-h-[90vh] transition-all ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b-2 border-[#241A16] bg-[#FAF8F5]">
          <div>
            {eyebrow && (
              <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#F16524]">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="font-serif text-xl sm:text-2xl text-[#241A16] font-normal tracking-tight mt-0.5">
                {title}
              </h2>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
