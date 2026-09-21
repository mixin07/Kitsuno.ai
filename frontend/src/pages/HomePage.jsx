import { useEffect, useState } from 'react'
import KitsunoIntro from '../components/KitsunoIntro.jsx'
import SiteNavbar from '../components/site/SiteNavbar.jsx'
import SiteFooter from '../components/site/SiteFooter.jsx'
import HomeHero from '../components/site/HomeHero.jsx'
import CursorGridLayer from '../components/site/CursorGridLayer.jsx'
import SplashCursorLayer from '../components/site/SplashCursorLayer.jsx'
import ScrollToTop from '../components/site/ScrollToTop.jsx'
import ProductShowcase from '../components/site/ProductShowcase.jsx'
import ProblemSection from '../components/site/ProblemSection.jsx'
import SolutionSection from '../components/site/SolutionSection.jsx'
import ApproachSection from '../components/site/ApproachSection.jsx'
import FeaturesSection from '../components/site/FeaturesSection.jsx'
import FinalCtaSection from '../components/site/FinalCtaSection.jsx'
import { roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'

function HomePage() {
  const [introHidden, setIntroHidden] = useState(false)
  const { user } = useAuth()

  const primaryTo = user ? roleHomePath(user.role) : '/register'
  const reveal = introHidden ? ' is-in' : ''

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useEffect(() => {
    if (introHidden) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [introHidden])

  return (
    <>
      {!introHidden && (
        <KitsunoIntro onComplete={() => setIntroHidden(true)} />
      )}

      <div className="ks-site">
        {/* Continuous cursor grid & fluid splash active across all sections including CTA & Footer */}
        <div className="ks-viewport-cursor-layer">
          <CursorGridLayer variant="cream" />
          <SplashCursorLayer />
        </div>

        {/* Navbar remains completely hidden during intro loading */}
        {introHidden && <SiteNavbar />}

        <main id="home">
          <HomeHero reveal={reveal} primaryTo={primaryTo} />

          <div className="ks-middle">
            <ProblemSection />
            <SolutionSection />
            <ApproachSection />
            <FeaturesSection />
            <ProductShowcase />
          </div>

          <FinalCtaSection />
        </main>

        <SiteFooter />
        <ScrollToTop />
      </div>
    </>
  )
}

export default HomePage