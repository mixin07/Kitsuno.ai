import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import Reveal from './Reveal.jsx'
import { roleHomePath } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'

function FinalCtaSection() {
  const { user } = useAuth()
  const to = user ? roleHomePath(user.role) : '/register'

  return (
    <section className="ks-cta" id="start">
      {/* Molten texture and fine tactile grain matching Hero */}
      <div className="ks-cta__atmo" aria-hidden="true" />
      <div className="ks-cta__grain" aria-hidden="true" />
      <div className="ks-cta__glow" aria-hidden="true" />

      {/* Asymmetric main container */}
      <div className="ks-cta__inner">
        <div className="ks-cta__content">
          <Reveal delay={0}>
            <div className="ks-cta__kicker">
              <span className="ks-cta__kicker-dot" aria-hidden="true" />
              <span>YOUR NEXT CHAPTER</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h2 className="ks-cta__title">
              Your next discovery
              <br />
              <span className="ks-cta__title-italic">starts here.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="ks-cta__lede">
              Step into an AI-powered learning environment built to test your
              understanding, close hidden knowledge gaps, and guide your mastery
              lesson by lesson.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="ks-cta__actions">
              <Link className="ks-cta__btn-primary" to={to}>
                <span>Start learning free</span>
                <ArrowRight className="ks-cta__btn-icon" size={18} aria-hidden="true" />
              </Link>

              <div className="ks-cta__perks">
                <span className="ks-cta__perk">
                  <Sparkles size={13} className="ks-cta__perk-icon" aria-hidden="true" />
                  Free starter access
                </span>
                <span className="ks-cta__perk-dot" aria-hidden="true">·</span>
                <span className="ks-cta__perk">No credit card required</span>
                <span className="ks-cta__perk-dot" aria-hidden="true">·</span>
                <span className="ks-cta__perk">Instant quiz generation</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right side: Kitsune celestial orbital emblem */}
        <div className="ks-cta__visual" aria-hidden="true">
          <div className="ks-cta__orbit ks-cta__orbit--outer">
            <span className="ks-cta__star ks-cta__star--1" />
            <span className="ks-cta__star ks-cta__star--2" />
          </div>
          <div className="ks-cta__orbit ks-cta__orbit--mid">
            <span className="ks-cta__star ks-cta__star--3" />
          </div>
          <div className="ks-cta__orbit ks-cta__orbit--inner" />

          {/* Stylized celestial fox constellation mark */}
          <div className="ks-cta__emblem">
            <svg
              className="ks-cta__emblem-svg"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="ksEmblemGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF9F2" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#FF8A4C" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F16524" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="80" cy="80" r="76" fill="url(#ksEmblemGlow)" />
              {/* Refined geometric celestial fox constellation outline */}
              <path
                d="M44 48 L80 94 L116 48 L98 114 L80 128 L62 114 Z"
                stroke="rgba(255, 249, 242, 0.45)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M44 48 L62 114 M116 48 L98 114"
                stroke="rgba(255, 249, 242, 0.28)"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <path
                d="M80 30 L80 94"
                stroke="rgba(255, 249, 242, 0.5)"
                strokeWidth="1.5"
              />
              <circle cx="80" cy="30" r="3" fill="#FFF9F2" />
              <circle cx="44" cy="48" r="3" fill="#FFF9F2" />
              <circle cx="116" cy="48" r="3" fill="#FFF9F2" />
              <circle cx="80" cy="94" r="3.5" fill="#FFD6B8" />
              <circle cx="80" cy="128" r="2.5" fill="#FFF9F2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Organic curved transition into warm cream footer */}
      <div className="ks-cta__transition" aria-hidden="true">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="ks-cta__transition-svg"
        >
          <path
            d="M0,0 C320,48 1120,48 1440,0 L1440,64 L0,64 Z"
            fill="#FFF9F2"
          />
        </svg>
      </div>
    </section>
  )
}

export default FinalCtaSection