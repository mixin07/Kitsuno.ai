import { useEffect, useRef } from 'react'

/*
 * Solution-scoped Magic Bento frame.
 *
 * Uses the official React Bits Magic Bento border technique
 * (per-card --glow-x / --glow-y / --glow-intensity custom properties
 * driving a masked radial ::after border glow that follows the cursor),
 * adapted to Kitsuno: warm peach base border, muted orange spotlight,
 * transparent body so the generated artwork stays the visual.
 *
 * No particles, no tilt, no magnetism, no badges, no dots.
 */

const SPOTLIGHT_RADIUS = 260

function MagicFrame({ children, className = '' }) {
  const ref = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const setGlow = (x, y, intensity) => {
      const rect = el.getBoundingClientRect()
      const relX = ((x - rect.left) / rect.width) * 100
      const relY = ((y - rect.top) / rect.height) * 100
      el.style.setProperty('--glow-x', `${relX}%`)
      el.style.setProperty('--glow-y', `${relY}%`)
      el.style.setProperty('--glow-intensity', intensity.toString())
      el.style.setProperty('--glow-radius', `${SPOTLIGHT_RADIUS}px`)
    }

    const handleMove = (event) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setGlow(event.clientX, event.clientY, 1)
      })
    }

    const handleLeave = () => {
      cancelAnimationFrame(rafRef.current)
      el.style.setProperty('--glow-intensity', '0')
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)

    return () => {
      cancelAnimationFrame(rafRef.current)
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div ref={ref} className={`ks-magic ${className}`.trim()}>
      {children}
    </div>
  )
}

export default MagicFrame
