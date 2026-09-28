import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Lottie } from 'lottie-react'
import { roleHomePath } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import orangeCatPeeping from '../../assets/orange-cat-peeping.json'

const LOGO_SRC = '/logo1.png'

function GithubIcon({ size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function TwitterIcon({ size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedinIcon({ size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.65 1.65 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66A1.66 1.66 0 0 0 7.83 6.64z" />
    </svg>
  )
}

function SiteFooter() {
  const { user } = useAuth()
  const startTo = user ? roleHomePath(user.role) : '/register'

  return (
    <footer className="ks-footer">
      <div className="ks-footer__inner">
        {/* Main Grid: Asymmetric 4-column layout */}
        <div className="ks-footer__grid">
          {/* Brand & Narrative Column */}
          <div className="ks-footer__brand-col">
            <Link to="/" className="ks-footer__brand-link">
              <img
                className="ks-footer__logo"
                src={LOGO_SRC}
                alt="Kitsuno.ai"
                draggable="false"
              />
              <span className="ks-footer__wordmark">
                Kitsuno<span className="ks-footer__wordmark-accent">.ai</span>
              </span>
            </Link>

            <p className="ks-footer__tag">Learn smarter. Not harder.</p>

            <p className="ks-footer__mission">
              An AI-powered learning environment engineered to prove comprehension
              through structured courses, dynamic quiz generation, and centralized analytics.
            </p>

            <blockquote className="ks-footer__quote">
              <span className="ks-footer__quote-glyph" aria-hidden="true">“</span>
              <p>Knowledge grows when it’s shared — and deepens when it’s proven.</p>
            </blockquote>

            <div className="ks-footer__socials" aria-label="Social links">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="ks-footer__social-btn"
                aria-label="GitHub"
              >
                <GithubIcon size={16} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="ks-footer__social-btn"
                aria-label="X / Twitter"
              >
                <TwitterIcon size={15} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="ks-footer__social-btn"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={16} />
              </a>
              <a
                href="mailto:contact@kitsuno.ai"
                className="ks-footer__social-btn"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="ks-footer__col">
            <h4 className="ks-footer__heading">Product</h4>
            <ul className="ks-footer__list">
              <li>
                <Link to="/courses" className="ks-footer__link">
                  Structured Courses
                </Link>
              </li>
              <li>
                <Link to="/courses" className="ks-footer__link">
                  Automated Quizzes
                </Link>
              </li>
              <li>
                <Link to="/courses" className="ks-footer__link">
                  Progress Analytics
                </Link>
              </li>
              <li>
                <Link to="/courses" className="ks-footer__link">
                  Adaptive Recall
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="ks-footer__col">
            <h4 className="ks-footer__heading">Platform</h4>
            <ul className="ks-footer__list">
              <li>
                <Link to="/login" className="ks-footer__link">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to={startTo} className="ks-footer__link">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/student" className="ks-footer__link">
                  Student Workspace
                </Link>
              </li>
              <li>
                <Link to="/instructor" className="ks-footer__link">
                  Instructor Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Explore */}
          <div className="ks-footer__col">
            <h4 className="ks-footer__heading">Explore</h4>
            <ul className="ks-footer__list">
              <li>
                <a href="#problem" className="ks-footer__link">
                  The Problem
                </a>
              </li>
              <li>
                <a href="#solution" className="ks-footer__link">
                  Our Solution
                </a>
              </li>
              <li>
                <a href="#approach" className="ks-footer__link">
                  Three Pillars
                </a>
              </li>
              <li>
                <a href="#features" className="ks-footer__link">
                  Core Features
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Craftsmanship Row */}
        <div className="ks-footer__bottom">
          {/* Peeping Orange Cat Easter Egg directly ABOVE the horizontal divider */}
          <div className="ks-footer__cat-wrap" aria-hidden="true">
            <Lottie
              className="ks-footer__cat-lottie"
              src={orangeCatPeeping}
              renderer="svg"
              autoplay
              loop
              rendererSettings={{
                preserveAspectRatio: 'xMidYMax meet',
              }}
              aria-hidden="true"
            />
          </div>

          <p className="ks-footer__copy">
            © {new Date().getFullYear()} Kitsuno.ai, Inc. All rights reserved.
          </p>

          <div className="ks-footer__legal">
            <a href="#privacy" className="ks-footer__legal-link">Privacy Policy</a>
            <span className="ks-footer__legal-sep">·</span>
            <a href="#terms" className="ks-footer__legal-link">Terms of Service</a>
            <span className="ks-footer__legal-sep">·</span>
            <a href="#cookies" className="ks-footer__legal-link">Cookie Preferences</a>
          </div>

          <div className="ks-footer__craft-container">
            <div className="ks-footer__craft">
              <span className="ks-footer__craft-dot" aria-hidden="true" />
              <span>Made with curiosity for lifelong learners</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter