import React from 'react'

/**
 * NeoTable — Kitsuno Structural Neo-Brutalist Table Container
 */
export default function NeoTable({
  columns = [],
  data = [],
  rowKey = 'id',
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  children,
}) {
  if (children) {
    return (
      <div
        className={`w-full overflow-x-auto bg-white border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] rounded-[8px] ${className}`}
      >
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    )
  }

  return (
    <div
      className={`w-full overflow-x-auto bg-white border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] rounded-[8px] ${className}`}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAF8F5] border-b-2 border-[#241A16]">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3 px-3.5 sm:px-4 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#241A16] ${
                  col.className || ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-xs sm:text-sm text-neutral-500 font-mono"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const isClickable = typeof onRowClick === 'function'
              const key = row[rowKey] ?? rIdx
              return (
                <tr
                  key={key}
                  onClick={() => isClickable && onRowClick(row)}
                  className={`border-b border-[#241A16]/15 last:border-b-0 transition-colors ${
                    isClickable
                      ? 'cursor-pointer hover:bg-[#FFF9F3]'
                      : 'hover:bg-[#FAF8F5]/60'
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-[#241A16] ${
                        col.cellClassName || ''
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
