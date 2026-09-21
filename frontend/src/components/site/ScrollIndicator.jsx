import { useEffect, useRef } from 'react'

function ScrollIndicator() {
  const ref = useRef(null)

  function scrollToNextSection() {
    document.querySelector('.ks-showcase')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    let frame = 0
    const update = () => {
      frame = 0
      const fadeRange = window.innerHeight * 0.6
      const opacity = Math.max(0, 1 - window.scrollY / fadeRange)
      node.style.opacity = String(opacity)
      node.style.visibility = opacity <= 0.02 ? 'hidden' : 'visible'
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <button
      className="ks-scroll"
      ref={ref}
      type="button"
      aria-label="Scroll to next section"
      onClick={scrollToNextSection}
    >
      <span className="ks-scroll__label">Scroll down</span>
      <span className="ks-scroll__mouse" aria-hidden="true">
        <span className="ks-scroll__wheel" />
      </span>
      <span className="ks-scroll__line" aria-hidden="true" />
    </button>
  )
}

export default ScrollIndicator