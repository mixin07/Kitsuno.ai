import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { roleHomePath } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useSupportsHover } from '../../hooks/useSupportsHover.js'

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'problem', label: 'Problem' },
  { id: 'solution', label: 'Solution' },
  { id: 'approach', label: 'How It Works' },
  { id: 'features', label: 'Features' },
  { id: 'product', label: 'Product' },
]

function SiteNavbar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const hoverable = useSupportsHover()
  const navRef = useRef(null)
  const enterTimerRef = useRef(null)

  useEffect(() => {
    const sections = NAV_ITEMS.map(({ id }) => document.getElementById(id)).filter(Boolean)
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -50% 0px', threshold: [0.15, 0.4, 0.7] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24)
      if (window.scrollY < 120) {
        setActiveSection('home')
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        clearTimeout(enterTimerRef.current)
        setExpanded(false)
        navRef.current?.blur()
      }
    }
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        clearTimeout(enterTimerRef.current)
        setExpanded(false)
      }
    }
    function handleResize() {
      if (window.innerWidth > 880) {
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
      clearTimeout(enterTimerRef.current)
    }
  }, [])

  const isAuthed = Boolean(user)
  const dashboardTo = roleHomePath(user?.role)
  const ctaTo = isAuthed ? dashboardTo : '/register'
  const ctaLabel = isAuthed ? 'Continue learning' : 'Start Learning'

  function closeMenu() {
    clearTimeout(enterTimerRef.current)
    setExpanded(false)
  }

  function handleEnter() {
    if (!hoverable) return
    clearTimeout(enterTimerRef.current)
    enterTimerRef.current = setTimeout(() => {
      setExpanded(true)
    }, 80)
  }

  function handleLeave() {
    clearTimeout(enterTimerRef.current)
    if (hoverable) {
      setExpanded(false)
    }
  }

  function handleFocusIn() {
    clearTimeout(enterTimerRef.current)
    setExpanded(true)
  }

  function handleFocusOut(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    clearTimeout(enterTimerRef.current)
    setExpanded(false)
  }

  function handleLogoClick() {
    if (!hoverable) {
      setExpanded((value) => !value)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleSectionClick(id) {
    closeMenu()
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header
      ref={navRef}
      className={`ks-nav${scrolled ? ' ks-nav--scrolled' : ''}${expanded ? ' is-open' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleFocusIn}
      onBlur={handleFocusOut}
    >
      <nav className="ks-nav__dock" aria-label="Primary">
        <button
          type="button"
          className="ks-nav__logo-btn"
          aria-expanded={expanded}
          aria-controls="kitsuno-site-drawer"
          aria-label={expanded ? 'Close navigation' : 'Open navigation'}
          onClick={handleLogoClick}
        >
          <img
            className="ks-nav__logo"
            src="/logo1.png"
            alt="Kitsuno.ai"
            draggable="false"
          />
        </button>

        <div id="kitsuno-site-drawer" className="ks-nav__drawer">
          <div className="ks-nav__drawer-row">
            <div className="ks-nav__links">
              {NAV_ITEMS.map(({ id, label }) => {
                const isActive = activeSection === id
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={`ks-nav__link${isActive ? ' ks-nav__link--active' : ''}`}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={() => handleSectionClick(id)}
                  >
                    {label}
                  </a>
                )
              })}
            </div>

            <div className="ks-nav__actions">
              <Link
                className="ks-btn ks-btn--primary ks-btn--sm ks-nav__cta"
                to={ctaTo}
                onClick={closeMenu}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default SiteNavbar