import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Features', href: '/#features' },
  { label: 'Curriculum', href: '/courses' },
]

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4'

function Logo({ className = '' }) {
  return (
    <span className={`flex items-center ${className}`}>
      <span className="grid grid-cols-2 gap-0.5">
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
      </span>
      <span className="text-white font-bold text-lg sm:text-xl ml-1">Kitsuno.ai</span>
    </span>
  )
}

function NotFoundPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const textRef = useRef(null)
  const [scales, setScales] = useState({ y: 1 })

  useEffect(() => {
    document.title = '404 - Page Not Found'
  }, [])

  useEffect(() => {
    const html = document.documentElement.style
    const body = document.body.style
    const prevHtmlOverflow = html.overflow
    const prevBodyOverflow = body.overflow
    html.overflow = 'hidden'
    body.overflow = 'hidden'
    return () => {
      html.overflow = prevHtmlOverflow
      body.overflow = prevBodyOverflow
    }
  }, [])

  useEffect(() => {
    const computeScales = () => {
      if (!textRef.current) return
      const ratio = window.innerHeight / textRef.current.offsetHeight
      setScales({ y: ratio * 1.4 })
    }
    computeScales()
    window.addEventListener('resize', computeScales)
    return () => window.removeEventListener('resize', computeScales)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[linear-gradient(to_bottom,#FF8233_0%,#FDAC55_100%)]">
      <div
        className="absolute inset-0 pointer-events-none opacity-80 [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_95%)] [mask-image:linear-gradient(to_bottom,black_40%,transparent_95%)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          <span
            ref={textRef}
            className="text-white font-black leading-none tracking-tighter whitespace-nowrap text-[clamp(200px,48vw,800px)]"
            style={{ transform: `scale(1.15, ${scales.y})`, transformOrigin: 'center' }}
          >
            404
          </span>
          <div
            className="absolute rounded-full bg-white h-[22vh] sm:h-[26vh] md:h-[50vh] w-[clamp(120px,20vw,400px)]"
            style={{ transform: `scale(1, ${scales.y})`, transformOrigin: 'center' }}
          />
        </div>
      </div>

      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5">
        <a href="/" aria-label="Kitsuno.ai home">
          <Logo />
        </a>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-white text-[#F16524] hover:opacity-90 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white bg-[#F16524] hover:opacity-90 transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Menu</span>
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? '' : 'pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />

        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-[linear-gradient(135deg,#FF6B1A_0%,#FF9642_100%)] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-6">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-2 flex flex-col gap-2">
            {NAV_LINKS.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                className={`px-6 py-4 text-lg font-semibold text-white rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 ${
                  menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 60}ms` : '0ms' }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <a
              href="/"
              className={`w-full py-4 rounded-full bg-white font-semibold text-base text-[#F16524] hover:scale-[1.02] inline-flex items-center justify-center gap-2 transition-all duration-500 ${
                menuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: menuOpen ? '450ms' : '0ms' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ marginTop: 'calc(-6vh - 40px)' }}
        aria-hidden="true"
      >
        <div className="w-[120vw] h-[85vh] sm:w-[70vw] sm:h-[70vh] md:w-[62vw] md:h-[78vh]">
          <video
            className="w-full h-full object-contain pointer-events-none mix-blend-darken"
            src={VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>

      <div className="relative z-30 mt-auto pb-8 sm:pb-16 flex flex-col items-center text-center px-4">
        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4">
          Oops, something went wrong!
        </h1>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white font-semibold text-sm sm:text-base bg-[#F16524] hover:scale-105 hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Home
        </a>
      </div>
    </div>
  )
}

export default NotFoundPage