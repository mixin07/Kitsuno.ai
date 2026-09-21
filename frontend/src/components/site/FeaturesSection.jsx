import { useRef, useState } from 'react'
import { Lottie } from 'lottie-react'
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  LibraryBig,
  Sparkles,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import featuresAnimation from '../../assets/features.json'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

/*
 * ONE large editorial card containing EVERYTHING:
 * top = feature content (left) + Lottie visual (right),
 * bottom = horizontal stepper + Back/Next controls.
 * Five clickable steps share ONE continuous track; the orange
 * progress fill animates up to the active node while the panel
 * content transitions in place. The card never resizes, the page
 * never scrolls. No nested cards, no image assets.
 */
const FEATURES = [
  {
    n: '01',
    title: 'Structured Courses',
    copy: 'Modules and lessons keep every course organized from the first concept to the last.',
    Icon: LibraryBig,
  },
  {
    n: '02',
    title: 'AI Quiz Generation',
    copy: 'Quizzes are generated from course material, so practice follows what you just learned.',
    Icon: Sparkles,
  },
  {
    n: '03',
    title: 'Learning Progress',
    copy: 'Progress updates as you answer lessons, so you always know where you stand.',
    Icon: TrendingUp,
  },
  {
    n: '04',
    title: 'Learning Analytics',
    copy: 'Understand your learning across quizzes, lessons and time — for you and your instructors.',
    Icon: ChartNoAxesCombined,
  },
  {
    n: '05',
    title: 'Role-based Experiences',
    copy: 'Students learn, instructors build and assess, admins see the whole picture — each in a focused view.',
    Icon: UsersRound,
  },
]

function FeaturesSection() {
  const [active, setActive] = useState(0)
  const stepRefs = useRef([])
  const reduceMotion = usePrefersReducedMotion()
  const total = FEATURES.length
  const current = FEATURES[active]
  const CurrentIcon = current.Icon

  function select(index) {
    setActive(index)
  }

  function handleStepKeyDown(event, index) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % total
        : (index - 1 + total) % total
    setActive(next)
    stepRefs.current[next]?.focus()
  }

  return (
    <section className="ks-section ks-features" id="features">
      <div className="ks-section__inner">
        <div className="ks-feat__intro">
          <Reveal>
            <p className="ks-section__kicker">Features</p>
          </Reveal>

          <Reveal delay={90}>
            <h2 className="ks-section__title ks-feat__title">
              Everything you need
              <br />
              to learn with <span className="ks-feat__accent">purpose.</span>
            </h2>
          </Reveal>

          <Reveal delay={170}>
            <p className="ks-section__lede ks-feat__lede">
              Powerful tools, thoughtful design, and AI that adapts to you —
              so learning feels clearer, easier, and more meaningful.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220} className="ks-feat__stage">
          <div className="ks-feat__panel">
            <div className="ks-feat__main">
              <div
                key={current.n}
                role="tabpanel"
                aria-label={`${current.n} — ${current.title}`}
                className="ks-feat__panel-content"
              >
                <p className="ks-feat__panel-count" aria-hidden="true">
                  {current.n} <span>/ 05</span>
                </p>
                <p className="ks-feat__panel-icon">
                  <CurrentIcon
                    className="ks-feat__icon"
                    size={30}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </p>
                <h3 className="ks-feat__panel-title">{current.title}</h3>
                <p className="ks-feat__copy ks-feat__panel-copy">
                  {current.copy}
                </p>
              </div>

              <div className="ks-feat__visual">
                <Lottie
                  className="ks-feat__lottie"
                  src={featuresAnimation}
                  renderer="svg"
                  autoplay={!reduceMotion}
                  loop
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="ks-feat__navigation">
              <button
                type="button"
                className="ks-feat__ctrl-btn"
                aria-label="Previous feature"
                disabled={active === 0}
                onClick={() => select(active - 1)}
              >
                <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                Back
              </button>
              <div
                className="ks-feat__stepper"
                role="tablist"
                aria-label="Product features"
              >
                <div
                  className="ks-feat__rail"
                  role="presentation"
                  style={{ '--frac': active / (total - 1) }}
                >
                  <span className="ks-feat__track" aria-hidden="true" />
                  <span className="ks-feat__fill" aria-hidden="true" />
                  {FEATURES.map((feature, index) => {
                    const isActive = index === active
                    const isDone = index < active
                    return (
                      <button
                        key={feature.n}
                        ref={(el) => {
                          stepRefs.current[index] = el
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`${feature.n} — ${feature.title}`}
                        tabIndex={isActive ? 0 : -1}
                        className={
                          'ks-feat__step' +
                          (isActive ? ' ks-feat__step--active' : '') +
                          (isDone ? ' ks-feat__step--done' : '')
                        }
                        onClick={() => select(index)}
                        onKeyDown={(event) => handleStepKeyDown(event, index)}
                      >
                        <span className="ks-feat__node" aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                className="ks-feat__ctrl-btn ks-feat__ctrl-btn--next"
                aria-label="Next feature"
                disabled={active === total - 1}
                onClick={() => select(active + 1)}
              >
                Next
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default FeaturesSection
