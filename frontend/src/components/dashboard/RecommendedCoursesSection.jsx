import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import { listCourses } from '../../services/courseService.js'

export default function RecommendedCoursesSection({ enrollments, courses: propCourses = null }) {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    let active = true

    async function updateRecommended() {
      try {
        const enrolledCourseIds = new Set((enrollments || []).map((e) => e.course_id))
        if (propCourses && Array.isArray(propCourses) && propCourses.length > 0) {
          const recommended = propCourses.filter((c) => !enrolledCourseIds.has(c.id))
          setCourses(recommended.slice(0, 3))
          return
        }

        const data = await listCourses()
        if (!active) return
        const list = Array.isArray(data) ? data : data?.items ?? []
        const recommended = list.filter((c) => !enrolledCourseIds.has(c.id))
        setCourses(recommended.slice(0, 3))
      } catch {
        // Fallback silently if offline/error
      }
    }

    updateRecommended()
    return () => {
      active = false
    }
  }, [enrollments, propCourses])

  if (courses.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[var(--ks-orange)]" />
            <h2 className="ks-section-title font-serif text-lg">
              Recommended for You
            </h2>
          </div>
          <p className="text-[11px] text-[var(--ks-text-muted)]">
            Explore new curricula aligned with your web development path
          </p>
        </div>

        <Link
          to="/courses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ks-orange)] hover:underline"
        >
          <span>All Courses</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3.5 space-y-2 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--ks-orange)] bg-[var(--ks-orange)]/10 px-2 py-0.5 rounded border border-[var(--ks-orange)]/20">
                {course.category || 'General'}
              </span>
              <h3 className="font-semibold text-xs text-[var(--ks-text)] mt-2 line-clamp-1">
                {course.title}
              </h3>
              <p className="text-[11px] text-[var(--ks-text-muted)] line-clamp-2 mt-1">
                {course.description || 'Master web development with structured lessons and AI quizzes.'}
              </p>
            </div>

            <Link
              to={`/courses/${course.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ks-orange)] hover:underline pt-2 border-t border-[var(--ks-border)]/60"
            >
              <BookOpen className="h-3 w-3" />
              <span>View Course →</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
