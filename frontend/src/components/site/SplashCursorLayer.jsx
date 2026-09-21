import { useEffect, useRef, useState } from 'react'
import SplashCursor from './SplashCursor.jsx'
import { SPLASH_CURSOR_CONFIG } from '../../constants/splashCursor.js'
import { useSupportsHover } from '../../hooks/useSupportsHover.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

function SplashCursorLayer({ className = '' }) {
  const hoverable = useSupportsHover()
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)
  const [nearView, setNearView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (!hoverable || reduced) return undefined
    const node = ref.current
    if (!node) return undefined
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setNearView(entry.isIntersecting))
      },
      { rootMargin: '35% 0%', threshold: 0.02 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hoverable, reduced])

  if (!hoverable || reduced) return null

  return (
    <div
      ref={ref}
      className={`ks-splashcursor${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {nearView ? <SplashCursor {...SPLASH_CURSOR_CONFIG} /> : null}
    </div>
  )
}

export default SplashCursorLayer