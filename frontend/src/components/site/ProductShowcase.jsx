import { useEffect, useId, useRef, useState } from 'react'
import Reveal from './Reveal.jsx'
import ProductPreview from './ProductPreview.jsx'

const CALLOUTS_LEFT = [
  {
    num: '01',
    title: 'Continue Learning',
    copy: 'Pick up exactly where you left off.',
  },
]

const CALLOUTS_RIGHT = [
  {
    num: '02',
    title: 'AI Quiz Ready',
    copy: 'Practice generated directly from your lessons.',
  },
  {
    num: '03',
    title: 'Weekly Activity',
    copy: 'See whether your learning is actually moving forward.',
  },
]

function CalloutConnector({ direction }) {
  const gradientId = useId()
  const toRight = direction === 'right'

  return (
    <svg
      className="ks-callout__connector"
      viewBox="0 0 190 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={toRight ? 0 : 190}
          y1="0"
          x2={toRight ? 190 : 0}
          y2="0"
        >
          <stop offset="0" stopColor="#F16524" stopOpacity="0.55" />
          <stop offset="0.65" stopColor="#F16524" stopOpacity="0.38" />
          <stop offset="1" stopColor="#F16524" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="ks-callout__connector-line"
        d={
          toRight
            ? 'M6 38 C 50 40, 75 34, 105 26 S 155 12, 184 20'
            : 'M184 38 C 140 40, 115 34, 85 26 S 35 12, 6 20'
        }
        fill="none"
        stroke={`url(#${gradientId})`}
      />
    </svg>
  )
}

function Callout({ num, title, copy, side, delay }) {
  return (
    <Reveal delay={delay} className="ks-callout-reveal">
      <div className={`ks-callout ks-callout--${side}`}>
        <span className="ks-callout__num" aria-hidden="true">
          {num}
        </span>
        <h3 className="ks-callout__title">{title}</h3>
        <p className="ks-callout__copy">{copy}</p>
        <CalloutConnector direction={side === 'left' ? 'right' : 'left'} />
      </div>
    </Reveal>
  )
}

function ProductShowcase() {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.25 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className={`ks-showcase${shown ? ' ks-showcase--entered' : ''}`}
      ref={ref}
      id="product"
    >
      <div className="ks-showcase__inner">
        <Reveal>
          <p className="ks-eyebrow ks-showcase__eyebrow">
            <span className="ks-eyebrow__line" aria-hidden="true" />
            The Kitsuno experience
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="ks-showcase__title">Your learning, made visible.</h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="ks-showcase__lede">
            See your courses, practice, progress, and learning signals come
            together in one place.
          </p>
        </Reveal>

        <div className="ks-showcase__stage">
          <div className="ks-showcase__side ks-showcase__side--left">
            {CALLOUTS_LEFT.map((c, i) => (
              <Callout key={c.num} {...c} side="left" delay={560 + i * 120} />
            ))}
          </div>

          <div className="ks-showcase__preview">
            <ProductPreview active={shown} />
          </div>

          <div className="ks-showcase__side ks-showcase__side--right">
            {CALLOUTS_RIGHT.map((c, i) => (
              <Callout key={c.num} {...c} side="right" delay={680 + i * 120} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductShowcase
