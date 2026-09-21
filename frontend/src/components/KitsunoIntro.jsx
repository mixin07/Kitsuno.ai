import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import MoltenMetal from './MoltenMetal.jsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { useSupportsHover } from '../hooks/useSupportsHover.js'

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

const LOADING_FOX_SRC = '/image.png'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Removes the contiguous near-white surface that touches the image borders,
// leaving the interior whites (muzzle, shoes, cap) and the fox fully intact.
function keyOutWhiteSurface(src) {
  return loadImage(src).then((img) => {
    const width = img.naturalWidth
    const height = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, width, height).data

    const isSurface = (idx) => {
      const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]]
      return (
        r >= 238 &&
        g >= 238 &&
        b >= 238 &&
        Math.abs(r - g) <= 28 &&
        Math.abs(g - b) <= 28 &&
        Math.abs(r - b) <= 28
      )
    }

    const visited = new Uint8Array(width * height)
    const queue = new Int32Array(width * height)
    let head = 0
    let tail = 0
    const push = (p) => {
      if (visited[p]) return
      visited[p] = 1
      queue[tail++] = p
    }

    for (let x = 0; x < width; x++) {
      const top = x
      const bottom = (height - 1) * width + x
      if (isSurface(top * 4)) push(top)
      if (isSurface(bottom * 4)) push(bottom)
    }
    for (let y = 0; y < height; y++) {
      const left = y * width
      const right = y * width + (width - 1)
      if (isSurface(left * 4)) push(left)
      if (isSurface(right * 4)) push(right)
    }

    while (head < tail) {
      const p = queue[head++]
      const x = p % width
      const y = (p / width) | 0
      if (x > 0) {
        const q = p - 1
        if (!visited[q] && isSurface(q * 4)) push(q)
      }
      if (x < width - 1) {
        const q = p + 1
        if (!visited[q] && isSurface(q * 4)) push(q)
      }
      if (y > 0) {
        const q = p - width
        if (!visited[q] && isSurface(q * 4)) push(q)
      }
      if (y < height - 1) {
        const q = p + width
        if (!visited[q] && isSurface(q * 4)) push(q)
      }
    }

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    for (let p = 0; p < width * height; p++) {
      const i = p * 4
      if (visited[p]) {
        data[i + 3] = 0
        continue
      }
      const x = p % width
      const y = (p / width) | 0
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }

    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(data), width, height),
      0,
      0,
    )

    if (maxX < minX || maxY < minY) return canvas.toDataURL('image/png')

    const cropWidth = maxX - minX + 1
    const cropHeight = maxY - minY + 1
    const crop = document.createElement('canvas')
    crop.width = cropWidth
    crop.height = cropHeight
    crop.getContext('2d').drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    return crop.toDataURL('image/png')
  })
}

function KitsunoIntro({ onComplete }) {
  const reduced = usePrefersReducedMotion()
  const hoverable = useSupportsHover()

  const loadingMs = reduced ? 350 : 3200
  const holdMs = reduced ? 150 : 260
  const exitMs = reduced ? 250 : 650

  const [phase, setPhase] = useState('loading')
  const [foxSrc, setFoxSrc] = useState(LOADING_FOX_SRC)

  const rafRef = useRef(0)
  const holdRef = useRef(0)
  const exitRef = useRef(0)
  const fillRef = useRef(null)
  const percentRef = useRef(null)
  const progressRef = useRef(null)
  const runnerRef = useRef(null)
  const foxRef = useRef(null)
  const shadowRef = useRef(null)
  const computedFoxW = useRef(0)

  useLayoutEffect(() => {
    if (runnerRef.current) {
      computedFoxW.current =
        parseFloat(getComputedStyle(runnerRef.current).width) || 40
    }
  }, [])

  useEffect(() => {
    let alive = true
    keyOutWhiteSurface(LOADING_FOX_SRC)
      .then((url) => {
        if (alive) setFoxSrc(url)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return undefined

    const applyRun = (t, now) => {
      if (reduced) return

      const runEl = runnerRef.current
      const imgEl = foxRef.current
      const shadowEl = shadowRef.current
      if (!runEl) return

      const foxW =
        computedFoxW.current ||
        (computedFoxW.current =
          parseFloat(getComputedStyle(runEl).width) || 40)
      const pct = t * 100

      runEl.style.left =
        `calc(${pct.toFixed(3)}% - ${(t * foxW).toFixed(3)}px)`

      if (imgEl) {
        const speed = 0.55 + t * 0.8
        const gait = Math.sin((now - start) / (115 / speed))
        imgEl.style.transform = `scale(${1 + gait * 0.012})`
      }

      if (shadowEl) {
        shadowEl.style.transform = `scaleX(${1 + 0.25 * (0.55 + t * 0.8)})`
      }
    }

    const apply = (t) => {
      const pct = Math.round(t * 100)
      const now = performance.now()

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${t})`
      }
      if (percentRef.current) {
        percentRef.current.textContent = `${String(pct).padStart(2, '0')}%`
      }
      if (progressRef.current) {
        progressRef.current.setAttribute('aria-valuenow', String(pct))
      }

      applyRun(t, now)
    }

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / loadingMs))
      apply(easeOutCubic(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      holdRef.current = window.setTimeout(() => setPhase('exiting'), holdMs)
    }

    apply(0)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(holdRef.current)
    }
  }, [phase, loadingMs, holdMs, reduced])

  useEffect(() => {
    if (phase !== 'exiting') return undefined

    exitRef.current = window.setTimeout(onComplete, exitMs)

    return () => window.clearTimeout(exitRef.current)
  }, [phase, onComplete, exitMs])

  const isExiting = phase === 'exiting'

  return (
    <div
      className={`kitsuno-intro${isExiting ? ' kitsuno-intro--exit' : ''}`}
      aria-label="Kitsuno dot ai — loading"
    >
      <div className="kitsuno-intro__field" aria-hidden="true">
        <MoltenMetal
          className="kitsuno-intro__metal"
          color1="#7A2408"
          color2="#FF6B1A"
          color3="#FFD2A6"
          speed={reduced ? 0 : 0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.05}
          brightness={1.3}
          colorMode="molten"
          grain
          grainIntensity={0.05}
          mouseInteraction={hoverable && !reduced}
          mouseStrength={0.3}
          opacity={1}
        />
        <div className="kitsuno-intro__vignette" />
      </div>

      <div className="kitsuno-intro__panel">
        <h1 className="kitsuno-wordmark">
          Kitsuno<span className="kitsuno-wordmark__ai">.ai</span>
        </h1>

        <p className="kitsuno-tagline">Your learning journey</p>

        <div className="kitsuno-barstage">
          <div ref={runnerRef} className="kitsuno-runner" aria-hidden="true">
            <img
              ref={foxRef}
              className="kitsuno-runner__img"
              src={foxSrc}
              alt=""
              draggable="false"
            />
            <div ref={shadowRef} className="kitsuno-runner__shadow" />
          </div>

        <div
          ref={progressRef}
          className="kitsuno-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-label="Loading progress"
        >
          <div ref={fillRef} className="kitsuno-progress__fill" />
        </div>
        </div>

        <p ref={percentRef} className="kitsuno-percent">
          00%
        </p>
      </div>
    </div>
  )
}

export default KitsunoIntro
