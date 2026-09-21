import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lottie } from 'lottie-react'
import ScrollIndicator from './ScrollIndicator.jsx'
import {
  cleanFoxEdgeFringe,
  keySurfaceWhite,
  removeFoxGroundArtifact,
} from '../../utils/foxAlphaKey.js'

const FOX_LOTTIE_SRC = '/HomeFoxjson.json'

function HomeHero({ reveal, primaryTo }) {
  const lottieRef = useRef(null)
  const foxCanvasCleanupRef = useRef(null)

  // The fox Lottie (HomeFoxjson.json) is an image sequence on an opaque white
  // backdrop. lottie-react plays it on its own canvas; after every drawn frame
  // this recomposes the pixels with the same true-alpha cut-out the original
  // video used (see foxAlphaKey.js), so the fox floats directly on the orange
  // hero — no white box, no card, no extra background container.
  const onLottieReady = useCallback(() => {
    const item = lottieRef.current && lottieRef.current.animationItem
    if (!item) return

    function keyFoxCanvas(animation) {
      const canvas = animation && animation.container
      if (!canvas || !canvas.width || !canvas.height) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      keySurfaceWhite(ctx, canvas.width, canvas.height)
      removeFoxGroundArtifact(ctx, canvas.width, canvas.height)
      cleanFoxEdgeFringe(ctx, canvas.width, canvas.height)
    }

    function onDrawnFrame() {
      keyFoxCanvas(item)
    }

    const observer = new ResizeObserver(() => {
      const wrapper = item && item.wrapper
      if (!wrapper || !wrapper.offsetWidth || !wrapper.offsetHeight) return
      // resize() repaints the current frame synchronously, then we compose it.
      item.resize()
      keyFoxCanvas(item)
    })
    observer.observe(item.wrapper)

    item.addEventListener('drawnFrame', onDrawnFrame)
    // Frame 0 is painted before this listener attaches; key it now so the
    // hero never flashes a white fox box while the animation runs.
    keyFoxCanvas(item)

    if (foxCanvasCleanupRef.current) foxCanvasCleanupRef.current.dispose()
    foxCanvasCleanupRef.current = {
      item,
      dispose() {
        observer.disconnect()
        item.removeEventListener('drawnFrame', onDrawnFrame)
      },
    }
  }, [])

  useEffect(
    () => () => {
      if (foxCanvasCleanupRef.current) foxCanvasCleanupRef.current.dispose()
    },
    [],
  )

  return (
    <section className={`ks-hero${reveal}`}>
      <div className="ks-hero__stage">
        <div className="ks-hero__shade" aria-hidden="true" />
        <div className="ks-hero__atmo" aria-hidden="true" />
        <div className="ks-hero__grain" aria-hidden="true" />
      </div>

      <div className="ks-hero__fox-wrap">
        <span className="ks-hero__fox-shadow" aria-hidden="true" />
        <span className="ks-hero__fox">
          <span className="ks-hero__fox-breathe">
            <span className="ks-hero__fox-par">
              <Lottie
                className="ks-hero__fox-lottie"
                src={FOX_LOTTIE_SRC}
                renderer="canvas"
                autoplay
                loop
                lottieRef={lottieRef}
                subscriptions={{ ready: onLottieReady }}
                aria-hidden="true"
              />
            </span>
          </span>
        </span>
      </div>

      <div className="ks-hero__content">
        <p className="ks-hero__eyebrow">
          <span className="ks-hero__eyebrow-line" aria-hidden="true" />
          Your AI learning companion
        </p>

        <h1 className="ks-hero__title">
          Learn smarter.
          <span className="ks-hero__title-muted">Not harder.</span>
        </h1>

        <div className="ks-hero__copy">
          <p className="ks-hero__lede">
            Kitsuno.ai pairs structured courses with AI-generated quizzes
            and learning analytics, so every lesson ends with proof of what
            you actually understood.
          </p>

          <div className="ks-hero__actions">
            <Link className="ks-btn ks-btn--primary" to={primaryTo}>
              Start Learning
            </Link>
            <Link className="ks-btn ks-btn--ghost" to="/courses">
              Explore Courses
            </Link>
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  )
}

export default HomeHero