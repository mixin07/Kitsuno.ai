import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import { useSupportsHover } from '../../hooks/useSupportsHover.js'

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

// Click pulses render slightly hotter than hover so they are clearly
// noticeable, without ever becoming filled tiles.
const PULSE_BOOST = 1.3

function falloffStrength(ratio, mode) {
  const r = clamp01(ratio)
  return mode === 'linear' ? 1 - r : 1 - r * r
}

function buildModel(size, width, height) {
  const cols = Math.ceil(width / size) + 1
  const rows = Math.ceil(height / size) + 1
  const vLines = []
  const hLines = []
  const segments = []

  for (let i = 0; i < cols; i += 1) {
    vLines.push({ x1: i * size, y1: 0, x2: i * size, y2: height })
    for (let j = 0; j < rows; j += 1) {
      segments.push({
        key: `v-${i}-${j}`,
        x1: i * size,
        y1: j * size,
        x2: i * size,
        y2: (j + 1) * size,
        cx: i * size,
        cy: (j + 0.5) * size,
      })
    }
  }

  for (let j = 0; j < rows; j += 1) {
    hLines.push({ x1: 0, y1: j * size, x2: width, y2: j * size })
    for (let i = 0; i < cols; i += 1) {
      segments.push({
        key: `h-${i}-${j}`,
        x1: i * size,
        y1: j * size,
        x2: (i + 1) * size,
        y2: j * size,
        cx: (i + 0.5) * size,
        cy: j * size,
      })
    }
  }

  return { vLines, hLines, segments }
}

function CursorGrid({
  cellSize = 72,
  color = '#F16524',
  radius = 160,
  falloff = 'smooth',
  holdTime = 200,
  fadeDuration = 550,
  lineWidth = 0.85,
  maxOpacity = 0.14,
  gridOpacity = 0,
  idleDelay = 500,
  fadeIn = 250,
  fadeOut = 450,
  clickPulse = true,
  pulseSpeed = 550,
}) {
  const canvasRef = useRef(null)
  const paramsRef = useRef({})
  const hoverable = useSupportsHover()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    paramsRef.current = {
      cellSize,
      color,
      radius,
      falloff,
      holdTime,
      fadeDuration,
      lineWidth,
      maxOpacity,
      gridOpacity,
      idleDelay,
      fadeIn,
      fadeOut,
      clickPulse,
      pulseSpeed,
    }
  })

  useEffect(() => {
    if (!hoverable || reduced) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let model = { vLines: [], hLines: [], segments: [] }
    const segments = new Map()
    let rafId = null
    let running = false
    let inside = false
    let lastMove = -Infinity
    let intensity = 0
    let lastFrame = performance.now()

    function buildModelFromRect() {
      const rect = canvas.getBoundingClientRect()
      model = buildModel(paramsRef.current.cellSize, rect.width, rect.height)
    }

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildModelFromRect()
      wake()
    }

    function localPoint(clientX, clientY, rect) {
      const x = clientX - rect.left
      const y = clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
      return { x, y }
    }

    function activate(code, x, y, now) {
      const { radius: r, falloff: mode, pulseSpeed: speed } = paramsRef.current
      const r2 = r * r
      for (let k = 0; k < model.segments.length; k += 1) {
        const seg = model.segments[k]
        const dx = seg.cx - x
        const dy = seg.cy - y
        const d2 = dx * dx + dy * dy
        if (d2 <= r2) {
          const ratio = Math.sqrt(d2) / r
          const state = segments.get(seg.key) || { hover: 0, pulse: 0, strength: 0 }
          if (code === 'hover') {
            state.hover = now
          } else {
            state.pulse = now + ratio * speed
          }
          state.strength = Math.max(state.strength, falloffStrength(ratio, mode))
          segments.set(seg.key, state)
        }
      }
      wake()
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect()
      const point = localPoint(event.clientX, event.clientY, rect)
      if (!point) {
        if (inside) {
          inside = false
          wake()
        }
        return
      }
      inside = true
      lastMove = performance.now()
      activate('hover', point.x, point.y, lastMove)
    }

    function handlePointerDown(event) {
      if (!paramsRef.current.clickPulse) return
      const rect = canvas.getBoundingClientRect()
      const point = localPoint(event.clientX, event.clientY, rect)
      if (!point) return
      inside = true
      lastMove = performance.now()
      activate('pulse', point.x, point.y, lastMove)
    }

    function contribution(start, now) {
      if (!start) return 0
      const { holdTime: hold, fadeDuration: fade } = paramsRef.current
      const elapsed = now - start
      if (elapsed < 0) return 0
      if (elapsed < hold) return 1
      return Math.max(0, 1 - (elapsed - hold) / fade)
    }

    function drawBaseGrid(master = 1) {
      const { color: hex, lineWidth: lw, gridOpacity: go } = paramsRef.current
      if (go <= 0 || master <= 0) return
      ctx.strokeStyle = hex
      ctx.lineWidth = lw
      ctx.globalAlpha = go * master
      ctx.beginPath()
      for (let k = 0; k < model.vLines.length; k += 1) {
        const line = model.vLines[k]
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
      }
      for (let k = 0; k < model.hLines.length; k += 1) {
        const line = model.hLines[k]
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    function renderFrame() {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const {
        color: hex,
        lineWidth: lw,
        maxOpacity: mo,
        holdTime: hold,
        fadeDuration: fade,
        idleDelay: idle,
        fadeIn: fadeInMs,
        fadeOut: fadeOutMs,
      } = paramsRef.current

      const now = performance.now()
      const dt = Math.max(0, Math.min(now - lastFrame, 100))
      lastFrame = now

      const target = inside && now - lastMove < idle ? 1 : 0
      if (target > intensity) {
        intensity += (target - intensity) * (1 - Math.exp(-dt / fadeInMs))
      } else if (target < intensity) {
        intensity -= (intensity - target) * (1 - Math.exp(-dt / fadeOutMs))
      }
      if (intensity < 0.002 && target === 0) intensity = 0

      ctx.clearRect(0, 0, width, height)
      drawBaseGrid(intensity)

      let active = intensity > 0.002
      const pruneCutoff = now - hold - fade

      ctx.strokeStyle = hex
      ctx.lineWidth = lw
      ctx.lineCap = 'butt'
      ctx.lineJoin = 'miter'

      for (let k = 0; k < model.segments.length; k += 1) {
        const seg = model.segments[k]
        const state = segments.get(seg.key)
        if (!state) continue
        const hoverA = contribution(state.hover, now)
        const pulseA = contribution(state.pulse, now)
        const level = Math.max(hoverA, pulseA)
        if (level <= 0.001) {
          if (state.hover < pruneCutoff && state.pulse < pruneCutoff) {
            segments.delete(seg.key)
          }
          continue
        }
        active = true
        let alpha = clamp01(level * state.strength * mo) * intensity
        if (pulseA >= hoverA) {
          alpha = Math.min(1, alpha * PULSE_BOOST)
        }
        if (alpha <= 0.001) continue
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.moveTo(seg.x1, seg.y1)
        ctx.lineTo(seg.x2, seg.y2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (active) {
        // Mask / punch-out cards so the localized grid NEVER renders inside cards
        const cards = document.querySelectorAll(
          '.ks-magic, .ks-feat__panel, .ks-preview, .ks-showcase__preview, .ks-callout, .ks-footer__quote, .ks-problem__video, [data-cursor-mask]'
        )
        if (cards.length > 0) {
          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = '#000000'
          for (let i = 0; i < cards.length; i += 1) {
            const c = cards[i]
            const cr = c.getBoundingClientRect()
            if (
              cr.bottom > 0 &&
              cr.top < height &&
              cr.right > 0 &&
              cr.left < width
            ) {
              const style = window.getComputedStyle(c)
              const br = parseFloat(style.borderRadius) || 0
              ctx.beginPath()
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(cr.left, cr.top, cr.width, cr.height, br)
              } else {
                ctx.rect(cr.left, cr.top, cr.width, cr.height)
              }
              ctx.fill()
            }
          }
          ctx.restore()
        }
      }

      return active
    }

    function wake() {
      if (running) return
      running = true
      rafId = requestAnimationFrame(tick)
    }

    function tick() {
      rafId = null
      const stillActive = renderFrame()
      if (stillActive) {
        rafId = requestAnimationFrame(tick)
      } else {
        running = false
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })

    return () => {
      ro.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      if (rafId !== null) cancelAnimationFrame(rafId)
      running = false
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [hoverable, reduced])

  if (!hoverable || reduced) return null

  return <canvas ref={canvasRef} className="ks-cursorgrid__canvas" aria-hidden="true" />
}

export default CursorGrid