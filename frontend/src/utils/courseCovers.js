/**
 * Kitsuno.ai Canonical Course Covers System
 * Maps each of the 9 canonical production courses to its editorial SVG artwork.
 * Provides resilient fallback resolution so no canonical course ever displays "No thumbnail".
 */

export const CANONICAL_COVERS = {
  3897: '/covers/html.svg',
  3898: '/covers/css.svg',
  3899: '/covers/javascript.svg',
  3900: '/covers/react.svg',
  2474: '/covers/fullstack.svg',
  5611: '/covers/java.svg',
  5612: '/covers/mongodb.svg',
  5613: '/covers/c.svg',
  5614: '/covers/python.svg',
}

export const TITLE_COVER_MAP = {
  'introduction to html': '/covers/html.svg',
  'introduction to css': '/covers/css.svg',
  'introduction to javascript': '/covers/javascript.svg',
  'introduction to react': '/covers/react.svg',
  'introduction to full-stack development': '/covers/fullstack.svg',
  'introduction to java': '/covers/java.svg',
  'introduction to mongodb': '/covers/mongodb.svg',
  'introduction to c': '/covers/c.svg',
  'introduction to python': '/covers/python.svg',
}

/**
 * Resolves the cover URL for a given course object.
 *
 * @param {Object} course - The course model or minimal course info object.
 * @returns {string} The public path to the course cover image.
 */
export function getCourseCover(course) {
  if (!course) return '/covers/fullstack.svg'

  // 1. Direct ID match
  if (course.id && CANONICAL_COVERS[course.id]) {
    return CANONICAL_COVERS[course.id]
  }

  // 2. Normalized Title match
  const normalizedTitle = (course.title || '').trim().toLowerCase()
  if (TITLE_COVER_MAP[normalizedTitle]) {
    return TITLE_COVER_MAP[normalizedTitle]
  }

  // 3. Keyword / Topic pattern match
  if (normalizedTitle.includes('html')) return '/covers/html.svg'
  if (normalizedTitle.includes('css')) return '/covers/css.svg'
  if (normalizedTitle.includes('react')) return '/covers/react.svg'
  if (normalizedTitle.includes('javascript') || normalizedTitle.includes(' ecmascript')) return '/covers/javascript.svg'
  if (normalizedTitle.includes('full-stack') || normalizedTitle.includes('full stack')) return '/covers/fullstack.svg'
  if (normalizedTitle.includes('mongodb') || normalizedTitle.includes('mongo')) return '/covers/mongodb.svg'
  if (normalizedTitle.includes('python')) return '/covers/python.svg'
  if (normalizedTitle.includes('java') && !normalizedTitle.includes('javascript')) return '/covers/java.svg'
  if (
    normalizedTitle === 'introduction to c' ||
    normalizedTitle.includes(' c programming') ||
    normalizedTitle.includes(' c language') ||
    normalizedTitle.endsWith(' to c')
  ) {
    return '/covers/c.svg'
  }

  // 4. Return course.thumbnail_url if set, otherwise default editorial cover
  return course.thumbnail_url || '/covers/fullstack.svg'
}
