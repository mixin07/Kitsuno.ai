import { Link } from 'react-router-dom'
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react'
import ProgressBar from '../learning/ProgressBar.jsx'

export default function ContinueLearningCard({ recommendation, activeEnrollment, enrollments = [] }) {
  // Other enrolled courses excluding the current active one
  const otherEnrollments = (enrollments || []).filter(
    (e) => e.course_id !== (recommendation?.course_id || activeEnrollment?.course_id)
  )

  if (recommendation && recommendation.status === 'in_progress') {
    return (
      <div className="rounded-2xl border border-[var(--ks-orange)]/35 bg-[var(--ks-surface)] p-6 md:p-7 space-y-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--ks-orange)]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--ks-border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--ks-orange)] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
              Continue Learning
            </span>
          </div>
          {recommendation.category && (
            <span className="text-[11px] font-semibold text-[var(--ks-text-muted)] bg-[var(--ks-surface-soft)] px-3 py-1 rounded-full border border-[var(--ks-border)]">
              {recommendation.category}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--ks-text-muted)] mb-1">
            <span className="font-semibold text-[var(--ks-text)]">
              {recommendation.course_title}
            </span>
            {recommendation.module_title && (
              <>
                <span>•</span>
                <span>Module: {recommendation.module_title}</span>
              </>
            )}
          </div>
          <h2 className="ks-card-title text-2xl font-serif md:text-3xl text-[var(--ks-text)] leading-tight">
            {recommendation.lesson_title}
          </h2>
          {recommendation.duration_minutes != null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--ks-text-subtle)]">
              <Clock className="h-3.5 w-3.5" />
              <span>Estimated {recommendation.duration_minutes} min lesson</span>
            </div>
          )}
        </div>

        {recommendation.explanation && (
          <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed bg-[var(--ks-surface-soft)] p-3.5 rounded-xl border border-[var(--ks-border)]/70">
            {recommendation.explanation}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ks-text-muted)]">
            <span className="font-semibold text-[var(--ks-text)]">
              {recommendation.progress_percentage || 0}% completed
            </span>
            <span>
              {recommendation.completed_lessons || 0} of {recommendation.total_lessons || 0} lessons done
            </span>
          </div>
          <ProgressBar value={recommendation.progress_percentage || 0} className="h-2.5 rounded-full" />
        </div>

        <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
          <Link
            to={`/courses/${recommendation.course_id}/lessons/${recommendation.lesson_id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#E0520D] shadow-xs active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Continue Learning →</span>
          </Link>
          <Link
            to={`/courses/${recommendation.course_id}`}
            className="text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-orange)] transition-colors inline-flex items-center gap-1"
          >
            <span>Course Syllabus</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Other Enrolled Courses Switcher */}
        {otherEnrollments.length > 0 && (
          <div className="pt-4 border-t border-[var(--ks-border)]/80 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block mb-2">
              Other Enrolled Courses
            </span>
            <div className="flex flex-wrap gap-2">
              {otherEnrollments.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/courses/${item.course_id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] text-xs text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
                  <span className="font-medium truncate max-w-[180px]">{item.course?.title || 'Course'}</span>
                  <span className="text-[10px] text-[var(--ks-text-subtle)] font-semibold">
                    {item.progress || 0}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeEnrollment) {
    const course = activeEnrollment.course || {}
    const nextLesson = activeEnrollment.next_lesson
    const progress = activeEnrollment.progress || 0

    return (
      <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 md:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--ks-border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--ks-orange)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
              Continue Learning
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[var(--ks-text-muted)] bg-[var(--ks-surface-soft)] px-3 py-1 rounded-full border border-[var(--ks-border)]">
            {course.category || 'Curriculum'}
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-[var(--ks-text-muted)] block mb-1">
            Current Course
          </span>
          <h2 className="ks-card-title text-2xl font-serif md:text-3xl text-[var(--ks-text)] leading-tight">
            {course.title}
          </h2>
          <p className="mt-2 text-xs text-[var(--ks-text-muted)]">
            {nextLesson
              ? `Next Lesson: ${nextLesson.title}`
              : progress === 100
              ? '🎉 All lessons completed in this course!'
              : 'Resume your active curriculum'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ks-text-muted)]">
            <span className="font-semibold text-[var(--ks-text)]">{progress}% completed</span>
            <span>
              {activeEnrollment.completed_lessons || 0} of {activeEnrollment.total_lessons || 0} lessons done
            </span>
          </div>
          <ProgressBar value={progress} className="h-2.5 rounded-full" />
        </div>

        <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
          <Link
            to={
              nextLesson
                ? `/courses/${activeEnrollment.course_id}/lessons/${nextLesson.id}`
                : `/courses/${activeEnrollment.course_id}`
            }
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#E0520D] shadow-xs active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>{nextLesson ? 'Continue Learning →' : 'View Course →'}</span>
          </Link>
          <Link
            to={`/courses/${activeEnrollment.course_id}`}
            className="text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-orange)] transition-colors inline-flex items-center gap-1"
          >
            <span>Course Syllabus</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Other Enrolled Courses Switcher */}
        {otherEnrollments.length > 0 && (
          <div className="pt-4 border-t border-[var(--ks-border)]/80 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block mb-2">
              Other Enrolled Courses
            </span>
            <div className="flex flex-wrap gap-2">
              {otherEnrollments.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/courses/${item.course_id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] text-xs text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
                  <span className="font-medium truncate max-w-[180px]">{item.course?.title || 'Course'}</span>
                  <span className="text-[10px] text-[var(--ks-text-subtle)] font-semibold">
                    {item.progress || 0}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Empty state when student is not enrolled in any course yet
  return (
    <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 md:p-8 space-y-4 shadow-xs text-center sm:text-left">
      <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
          Welcome to Kitsuno
        </span>
      </div>
      <h2 className="ks-card-title text-2xl font-serif text-[var(--ks-text)]">
        Start Your Learning Journey
      </h2>
      <p className="text-xs text-[var(--ks-text-muted)] max-w-lg leading-relaxed">
        Choose from our curated catalog of beginner-friendly programming and web development courses. Learn with interactive video lessons, quizzes, and your 24/7 AI tutor.
      </p>
      <div className="pt-2">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#E0520D] shadow-xs"
        >
          <BookOpen className="h-4 w-4" />
          <span>Browse Course Catalog →</span>
        </Link>
      </div>
    </div>
  )
}
