import { Lottie } from 'lottie-react'
import Reveal from './Reveal.jsx'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import ratRaceAnimation from '../../assets/rat-race.json'

const PROBLEMS = [
  {
    n: '01',
    title: 'Passive learning',
    copy: 'Most courses hand you content and trust that it sticks. Very little ever checks whether it did.',
  },
  {
    n: '02',
    title: 'Uncertain understanding',
    copy: 'A lesson can feel easy in the moment — and unravel the moment it is actually asked for.',
  },
  {
    n: '03',
    title: 'Disconnected experiences',
    copy: 'Content, practice and progress live in separate places, so none of them ever reinforce the others.',
  },
  {
    n: '04',
    title: 'Invisible progress',
    copy: 'You finish lessons, yet still cannot see what you have truly mastered or where you are stuck.',
  },
]

function ProblemSection() {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <section className="ks-section ks-problem" id="problem">
      <div className="ks-section__inner">
        <div className="ks-problem__composition">
          <div className="ks-problem__intro">
            <Reveal>
              <p className="ks-section__kicker">The problem</p>
            </Reveal>

            <Reveal delay={90}>
              <h2 className="ks-section__title ks-problem__title">
                Learning has been a one-way street.
              </h2>
            </Reveal>

            <Reveal delay={170} className="ks-problem__media-reveal">
              <figure className="ks-problem__media">
                <div className="ks-problem__video">
                  <Lottie
                    className="ks-problem__lottie"
                    src={ratRaceAnimation}
                    renderer="svg"
                    autoplay={!reduceMotion}
                    loop
                    aria-hidden="true"
                  />
                </div>
                <figcaption className="ks-problem__caption">
                  <span className="ks-problem__caption-mark" aria-hidden="true" />
                  <span className="ks-problem__caption-text">
                    Stuck in a rat race
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          <ul className="ks-problem__list">
            {PROBLEMS.map((item, index) => (
              <Reveal
                as="li"
                key={item.n}
                className="ks-problem__item"
                delay={220 + index * 90}
              >
                <span className="ks-problem__mark-index" aria-hidden="true">
                  {item.n}
                </span>
                <span className="ks-problem__dot" aria-hidden="true" />
                <h3 className="ks-problem__head">{item.title}</h3>
                <p className="ks-problem__copy">{item.copy}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ProblemSection