import { useEffect, useState } from 'react'

const QUERY = '(hover: hover) and (pointer: fine)'

export function useSupportsHover() {
  const [hoverable, setHoverable] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(QUERY).matches === true,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handleChange = (event) => setHoverable(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return hoverable
}