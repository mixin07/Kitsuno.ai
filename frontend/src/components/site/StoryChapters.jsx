function ChapterProblem() {
  return (
    <section className="ks-chapter ks-chapter--left" id="story-problem">
      <div className="ks-chapter__panel">
        <p className="ks-chapter__eyebrow">
          <span className="ks-eyebrow__line" aria-hidden="true" />
          Chapter 01 · The problem
        </p>
        <h2 className="ks-chapter__title">Most learning never lands.</h2>
        <ul className="ks-cine-list">
          <li>Watching a lesson feels like progress, until nothing sticks.</li>
          <li>Courses, quizzes and results live in separate worlds.</li>
          <li>No one can see where understanding actually breaks.</li>
        </ul>
        <p className="ks-chapter__note">
          That is the journey most learners quietly abandon.
        </p>
      </div>
    </section>
  )
}

function ChapterSolution() {
  return (
    <section className="ks-chapter ks-chapter--right" id="story-solution">
      <div className="ks-chapter__panel">
        <p className="ks-chapter__eyebrow">
          <span className="ks-eyebrow__line" aria-hidden="true" />
          Chapter 02 · The solution
        </p>
        <h2 className="ks-chapter__title">
          One path from learning to understanding.
        </h2>
        <p className="ks-chapter__lede">
          Kitsuno ties the whole journey together, so every step leaves a trace
          you can actually see.
        </p>
        <div className="ks-cine-chips">
          <span className="ks-cine-chip">Structured learning</span>
          <span className="ks-cine-chip">AI-generated quizzes</span>
          <span className="ks-cine-chip">Progress tracking</span>
          <span className="ks-cine-chip">Learning analytics</span>
        </div>
      </div>
    </section>
  )
}

const ECOSYSTEM = [
  ['Courses', 'A calm, structured path to follow'],
  ['Modules', 'Clear milestones along the way'],
  ['Lessons', 'Focused content, one idea at a time'],
  ['AI-generated quizzes', 'Practice shaped from each lesson'],
  ['Progress tracking', 'Proof of where you are'],
  ['Learning analytics', 'Insight into how you learn'],
]

function ChapterEcosystem() {
  return (
    <section className="ks-chapter ks-chapter--left" id="story-ecosystem">
      <div className="ks-chapter__panel">
        <p className="ks-chapter__eyebrow">
          <span className="ks-eyebrow__line" aria-hidden="true" />
          Chapter 03 · What Kitsuno has
        </p>
        <h2 className="ks-chapter__title">An ecosystem around your progress.</h2>
        <dl className="ks-cine-ecosystem">
          {ECOSYSTEM.map(([name, detail]) => (
            <div className="ks-cine-ecosystem__row" key={name}>
              <dt>{name}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const STEPS = [
  ['Learn', 'Take in one focused lesson at a time'],
  ['Practice', 'Test what you just absorbed'],
  ['Prove', 'Show what you actually understood'],
  ['Understand', 'See the gaps you missed'],
  ['Improve', 'Come back stronger'],
]

function ChapterHowItWorks() {
  return (
    <section className="ks-chapter ks-chapter--right" id="story-how-it-works">
      <div className="ks-chapter__panel ks-chapter__panel--wide">
        <p className="ks-chapter__eyebrow">
          <span className="ks-eyebrow__line" aria-hidden="true" />
          Chapter 04 · How it works
        </p>
        <h2 className="ks-chapter__title">The journey of every lesson.</h2>
        <div className="ks-steps">
          {STEPS.map(([label, detail], index) => (
            <div className="ks-step" key={label}>
              <span className="ks-step__num">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="ks-step__label">{label}</span>
              <span className="ks-step__detail">{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StoryChapters() {
  return (
    <>
      <ChapterProblem />
      <ChapterSolution />
      <ChapterEcosystem />
      <ChapterHowItWorks />
    </>
  )
}

export default StoryChapters