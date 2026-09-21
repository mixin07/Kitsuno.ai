import CursorGrid from './CursorGrid.jsx'
import { CURSOR_GRID_BASE, CURSOR_GRID_VARIANTS } from '../../constants/cursorGrid.js'

function CursorGridLayer({ variant = 'cream', className = '', ...tuning }) {
  return (
    <div className={`ks-cursorgrid${className ? ` ${className}` : ''}`} aria-hidden="true">
      <CursorGrid {...CURSOR_GRID_BASE} {...CURSOR_GRID_VARIANTS[variant]} {...tuning} />
    </div>
  )
}

export default CursorGridLayer