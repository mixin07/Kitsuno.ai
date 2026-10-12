import React from 'react'

/**
 * NeoStatGrid — Responsive Grid Container for NeoMetricCard Components
 */
export default function NeoStatGrid({
  columns = 4,
  children,
  className = '',
}) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid ${colClasses} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  )
}
