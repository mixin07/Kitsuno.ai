import React, { useState, useRef, useEffect } from 'react'

/**
 * NeoDropdown — Kitsuno Tactile Brutalist Dropdown / Popover
 */
export default function NeoDropdown({
  trigger,
  align = 'right',
  children,
  className = '',
  menuClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  }[align] || 'right-0 origin-top-right'

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute z-40 mt-1.5 min-w-[160px] bg-white border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] rounded-[6px] py-1.5 ${alignClasses} ${menuClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
