import { Link } from 'react-router-dom'
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react'

export default function ContinueLearningCard({ recommendation, activeEnrollment, enrollments = [] }) {
  // Other enrolled courses excluding the current active one
  const otherEnrollments = (enrollments || []).filter(
    (e) => e.course_id !== (recommendation?.course_id || activeEnrollment?.course_id)
  )

  if (recommendation && recommendation.status === 'in_progress') {
    return (
      <div className="ks-neo-card-static p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between space-y-3.5 h-full">
        <div>
          <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                CURRENT CURRICULUM
              </span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>
            {recommendation.category && (
              <span className="text-[10px] font-bold text-[#241A16] bg-[#FFF2E6] px-2 py-0.5 rounded-[4px] border border-[#241A16] font-mono">
                {recommendation.category}
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs text-[var(--ks-text-muted)] mb-1">
              <span className="font-bold text-[#241A16]">
                {recommendation.course_title}
              </span>
              {recommendation.module_title && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px] font-medium">Module: {recommendation.module_title}</span>
                </>
              )}
            </div>
            <h2 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
              {recommendation.lesson_title}
            </h2>
            {recommendation.duration_minutes != null && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#241A16] font-mono">
                <Clock className="h-3.5 w-3.5 text-[#F16524]" />
                <span>Estimated {recommendation.duration_minutes} min lesson</span>
              </div>
            )}
          </div>

          {recommendation.explanation && (
            <p className="mt-2.5 text-xs text-[#241A16] leading-relaxed bg-[#FFF4EB] p-2.5 rounded-[6px] border-[1.5px] border-[#241A16] font-normal">
              {recommendation.explanation}
            </p>
          )}

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--ks-text-muted)]">
              <span className="font-bold text-[#241A16]">
                {recommendation.progress_percentage || 0}% completed
              </span>
              <span className="font-mono text-[#241A16]">
                {recommendation.completed_lessons || 0} of {recommendation.total_lessons || 0} lessons done
              </span>
            </div>
            <div className="w-full h-2 rounded-[4px] border-[1.5px] border-[#241A16] bg-white p-[1px] overflow-hidden">
              <div
                className="h-full bg-[#F16524] transition-all duration-300 rounded-[1px]"
                style={{ width: `${recommendation.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="pt-1.5 flex items-center justify-between flex-wrap gap-2.5">
            <Link
              to={`/courses/${recommendation.course_id}/lessons/${recommendation.lesson_id}`}
              className="ks-neo-btn-primary"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Continue Learning →</span>
            </Link>
            <Link
              to={`/courses/${recommendation.course_id}`}
              className="ks-neo-btn-secondary"
            >
              <span>Course Syllabus</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Other Enrolled Courses Switcher */}
          {otherEnrollments.length > 0 && (
            <div className="pt-2.5 border-t-[1.5px] border-[#241A16]/10 mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F3215] block mb-1">
                Other Courses in Progress
              </span>
              <div className="flex flex-wrap gap-1.5">
                {otherEnrollments.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to={`/courses/${item.course_id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border-[1.5px] border-[#241A16] bg-white text-xs text-[#241A16] hover:bg-[#FFF4EB] transition-all font-bold"
                  >
                    <BookOpen className="h-3 w-3 text-[#F16524]" />
                    <span className="truncate max-w-[150px]">{item.course?.title || 'Course'}</span>
                    <span className="text-[10px] text-[#F16524] font-mono">
                      {item.progress || 0}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeEnrollment) {
    const course = activeEnrollment.course || {}
    const nextLesson = activeEnrollment.next_lesson
    const progress = activeEnrollment.progress || 0

    return (
      <div className="ks-neo-card-static p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between space-y-3.5 h-full">
        <div>
          <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                CURRENT CURRICULUM
              </span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>
            <span className="text-[10px] font-bold text-[#8F3215] bg-[#FFF2E6] px-2 py-0.5 rounded-[4px] border border-[#241A16]">
              {course.category || 'Curriculum'}
            </span>
          </div>

          <div className="mt-3">
            <span className="text-xs font-semibold text-[var(--ks-text-muted)] block mb-0.5">
              Enrolled Course
            </span>
            <h2 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
              {course.title}
            </h2>
            <p className="mt-1 text-xs text-[var(--ks-text-muted)] font-normal">
              {nextLesson
                ? `Next Lesson: ${nextLesson.title}`
                : progress === 100
                ? '🎉 All lessons completed in this course!'
                : 'Resume your active curriculum'}
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--ks-text-muted)]">
              <span className="font-semibold text-[#241A16]">{progress}% completed</span>
              <span className="font-mono text-[#241A16]">
                {activeEnrollment.completed_lessons || 0} of {activeEnrollment.total_lessons || 0} lessons done
              </span>
            </div>
            <div className="w-full h-2 rounded-[4px] border-[1.5px] border-[#241A16] bg-white p-[1px] overflow-hidden">
              <div
                className="h-full bg-[#F16524] transition-all duration-300 rounded-[1px]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="pt-1.5 flex items-center justify-between flex-wrap gap-2.5">
            <Link
              to={
                nextLesson
                  ? `/courses/${activeEnrollment.course_id}/lessons/${nextLesson.id}`
                  : `/courses/${activeEnrollment.course_id}`
              }
              className="ks-neo-btn-primary"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{nextLesson ? 'Continue Learning →' : 'View Course →'}</span>
            </Link>
            <Link
              to={`/courses/${activeEnrollment.course_id}`}
              className="ks-neo-btn-secondary"
            >
              <span>Course Syllabus</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Other Enrolled Courses Switcher */}
          {otherEnrollments.length > 0 && (
            <div className="pt-2.5 border-t-[1.5px] border-[#241A16]/10 mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block mb-1">
                Other Courses in Progress
              </span>
              <div className="flex flex-wrap gap-1.5">
                {otherEnrollments.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to={`/courses/${item.course_id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border-[1.5px] border-[#241A16] bg-white text-xs text-[#241A16] hover:bg-[#FFF4EB] transition-all font-bold"
                  >
                    <BookOpen className="h-3 w-3 text-[#F16524]" />
                    <span className="truncate max-w-[150px]">{item.course?.title || 'Course'}</span>
                    <span className="text-[10px] text-[#8F3215] font-semibold">
                      {item.progress || 0}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Empty state: Minimal Neo-Brutalist Welcome Card with structural orange accent block
  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3.5 h-full text-left relative overflow-hidden">
      {/* Structural top orange accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#F16524]" />

      <div>
        <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
              WELCOME TO KITSUNO
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
          </div>
          <span className="text-[10px] font-bold text-[#241A16] bg-[#FFF2E6] px-2 py-0.5 rounded-[4px] border border-[#241A16] font-mono">
            9 Production Courses
          </span>
        </div>

        <div className="mt-3">
          <h2 className="ks-card-title text-xl sm:text-2xl font-serif text-[#241A16] font-normal leading-tight">
            Start Your Learning Journey
          </h2>
          <p className="mt-1.5 text-xs text-[var(--ks-text-muted)] max-w-lg leading-relaxed font-normal">
            Choose from our curated catalog of 9 canonical programming and web development courses. Learn with interactive video lessons, automated quizzes, and your 24/7 AI tutor.
          </p>

          {/* ONE Structural Orange Highlight Block */}
          <div className="mt-3 p-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF4EB] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F16524] shrink-0" />
              <span className="font-bold text-[#241A16]">Interactive Curriculum</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#8F3215]">36+ Quizzes &amp; Exercises</span>
          </div>
        </div>
      </div>

      <div className="pt-1.5">
        <Link
          to="/courses"
          className="ks-neo-btn-primary"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Browse Course Catalog →</span>
        </Link>
      </div>
    </div>
  )
}
