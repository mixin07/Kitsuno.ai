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
    <div className="ks-neo-card-static p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
              EXPLORE CATALOG
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Sparkles className="h-4 w-4 text-[#F16524]" />
            <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
              Recommended for You
            </h3>
          </div>
        </div>

        <Link
          to="/courses"
          className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1.5 shrink-0"
        >
          <span>All 9 Courses</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all p-3.5 space-y-2 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-[4px] bg-[#FFF2E6] px-2 py-0.5 text-[9px] font-bold text-[#8F3215] border border-[#241A16]/30">
                  {course.category || 'Curriculum'}
                </span>
                <span className="text-[10px] font-mono font-medium text-[#241A16]/70">
                  {course.total_lessons || 10}+ lessons
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#241A16] group-hover:text-[#F16524] transition-colors mt-2 line-clamp-1">
                {course.title}
              </h4>
              <p className="text-[11px] text-[var(--ks-text-muted)] line-clamp-2 mt-0.5 leading-relaxed font-normal">
                {course.description || 'Master web development with structured lessons, practical exercises, and AI quizzes.'}
              </p>
            </div>

            <Link
              to={`/courses/${course.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F16524] group-hover:underline pt-2 border-t-[1.5px] border-[#241A16]/15"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Explore Syllabus →</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
