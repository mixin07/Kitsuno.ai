import { Lottie } from 'lottie-react'
import Reveal from './Reveal.jsx'
import approachAnimation from '../../assets/approach.json'

function ApproachSection() {
  return (
    <section className="ks-section ks-approach" id="approach">
      <div className="ks-section__inner">
        <Reveal>
          <p className="ks-section__kicker">How we approach</p>
        </Reveal>

        <div className="ks-approach__bottom">
          <div className="ks-approach__copy">
            <div className="ks-approach__statement">
              <Reveal delay={60}>
                <p className="ks-approach__line">Learn with structure.</p>
              </Reveal>
              <Reveal delay={140}>
                <p className="ks-approach__line">Practice with purpose.</p>
              </Reveal>
              <Reveal delay={220}>
                <p className="ks-approach__line ks-approach__line--accent">
                  Understand through feedback.
                </p>
              </Reveal>
            </div>

            <Reveal delay={280}>
              <p className="ks-section__lede ks-approach__lede">
                Kitsuno turns learning into an active process. Every course
                leads to practice; every practice leads to feedback you can
                act on. No more scrolling to the end and wondering whether it
                stuck.
              </p>
            </Reveal>
          </div>

          <Reveal delay={220} className="ks-approach__media">
            <Lottie
              className="ks-approach__lottie"
              src={approachAnimation}
              renderer="svg"
              autoplay
              loop
              aria-hidden="true"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default ApproachSection