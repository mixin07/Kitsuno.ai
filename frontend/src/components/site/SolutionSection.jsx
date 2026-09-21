import { Lottie } from 'lottie-react'
import Reveal from './Reveal.jsx'
import MagicFrame from './MagicFrame.jsx'
import solutionIntroAnimation from '../../assets/solution-intro.json'

/*
 * Compact 4-column editorial grid — order is fixed:
 * 01 courses · 02 quizes · 03 analytics · 04 tracking.
 *
 * Each module is ONE card: a short image viewport stacked directly
 * against a compact content area. No nested panels, dots, or badges.
 */
const solutionFeatures = [
  {
    id: 'structured-courses',
    index: '01',
    title: 'Structured Courses',
    description:
      'Every course unfolds into clear modules and lessons, so you always know what comes next.',
    image: '/courses.png',
    alt: 'Structured courses visualization',
    cell: 'ks-sol--courses-cell',
  },
  {
    id: 'ai-quizzes',
    index: '02',
    title: 'AI-Generated Quizzes',
    description:
      'Turn every lesson into practice with questions generated from the material you’re learning.',
    image: '/quizes.png',
    alt: 'AI-generated quizzes visualization',
    cell: 'ks-sol--quizzes-cell',
  },
  {
    id: 'learning-analytics',
    index: '03',
    title: 'Learning Analytics',
    description:
      'See meaningful signals about what you understand, where you’re improving, and where you need more practice.',
    image: '/analytics.png',
    alt: 'Learning analytics visualization',
    cell: 'ks-sol--analytics-cell',
  },
  {
    id: 'progress-tracking',
    index: '04',
    title: 'Progress Tracking',
    description:
      'Every answered lesson updates your progress, making your learning momentum visible.',
    image: '/tracking.png',
    alt: 'Progress tracking visualization',
    cell: 'ks-sol--tracking-cell',
  },
]

function SolutionFeature({ item }) {
  return (
    <MagicFrame>
      <div className={`ks-sol__stage ks-sol__stage--${item.id}`}>
        <img
          className="ks-sol__img"
          src={item.image}
          alt={item.alt}
          loading="lazy"
        />
      </div>
      <div className="ks-sol__body">
        <p className="ks-sol__index">{item.index}</p>
        <h3 className="ks-sol__title">{item.title}</h3>
        <p className="ks-sol__text">{item.description}</p>
      </div>
    </MagicFrame>
  )
}

function SolutionIntroLottie() {
  return (
    <Lottie
      className="ks-solution__lottie"
      src={solutionIntroAnimation}
      autoplay
      loop
      aria-hidden="true"
    />
  )
}

function SolutionIntro() {
  return (
    <div className="ks-solution__intro">
      <div className="ks-solution__intro-copy">
        <Reveal>
          <p className="ks-section__kicker">The solution</p>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="ks-section__title ks-solution__title">
            <span className="ks-solution__line">Learn.</span>
            <span className="ks-solution__line">Practice.</span>
            <span className="ks-solution__line ks-solution__line--accent">
              Understand.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={170}>
          <p className="ks-section__lede ks-solution__lede">
            Kitsuno.ai turns each course into an active loop — structured
            learning, generated practice, and feedback that proves what you
            actually understood.
          </p>
        </Reveal>
      </div>

      <Reveal delay={220} className="ks-solution__intro-visual">
        <SolutionIntroLottie />
      </Reveal>
    </div>
  )
}

function SolutionCell({ item, index }) {
  return (
    <Reveal
      delay={180 + index * 60}
      className={`ks-solution__cell ${item.cell}`}
    >
      <SolutionFeature item={item} />
    </Reveal>
  )
}

function SolutionGrid() {
  // Single-row editorial order: courses → quizzes → analytics → tracking.
  const order = [
    'structured-courses',
    'ai-quizzes',
    'learning-analytics',
    'progress-tracking',
  ]
  const byId = Object.fromEntries(solutionFeatures.map((f) => [f.id, f]))

  return (
    <div className="ks-solution__grid">
      {order.map((id, i) => (
        <SolutionCell key={id} item={byId[id]} index={i} />
      ))}
    </div>
  )
}

function SolutionSection() {
  return (
    <section className="ks-section ks-solution" id="solution">
      <div className="ks-section__inner">
        <SolutionIntro />
        <SolutionGrid />
      </div>
    </section>
  )
}

export default SolutionSection
