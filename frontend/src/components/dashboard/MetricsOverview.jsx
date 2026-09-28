import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Bookmark, Award } from 'lucide-react'

export default function MetricsOverview({ analytics, enrollments, savedCount = 0 }) {
  const summary = analytics?.summary || {}
  const totalCourses = enrollments?.length || 0
  const completedCourses = summary.completed_courses ?? enrollments?.filter(e => (e.progress ?? 0) >= 100).length ?? 0
  const activeCourses = summary.active_courses ?? (totalCourses - completedCourses)
  const lessonsCompleted = summary.lessons_completed ?? 0
  const overallProgress = summary.overall_progress ?? 0

  return (
    <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Compact Metrics Strip */}
      <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs">
        {/* Lessons Completed */}
        <div className="flex items-center gap-1.5 text-[var(--ks-text)]">
          <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
            <BookOpen className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{lessonsCompleted}</span>
          <span className="text-[var(--ks-text-muted)]">Lessons Completed</span>
        </div>

        <span className="text-[var(--ks-border)] hidden sm:inline" aria-hidden="true">•</span>

        {/* Active Courses */}
        <div className="flex items-center gap-1.5 text-[var(--ks-text)]">
          <span className="p-1 rounded-md bg-sky-500/10 text-sky-600">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{activeCourses}</span>
          <span className="text-[var(--ks-text-muted)]">
            {activeCourses === 1 ? 'Course in Progress' : 'Courses in Progress'}
          </span>
        </div>

        <span className="text-[var(--ks-border)] hidden sm:inline" aria-hidden="true">•</span>

        {/* Overall Progress */}
        <div className="flex items-center gap-1.5 text-[var(--ks-text)]">
          <span className="p-1 rounded-md bg-purple-500/10 text-purple-600">
            <Award className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{overallProgress}%</span>
          <span className="text-[var(--ks-text-muted)]">Overall Progress</span>
        </div>
      </div>

      {/* Saved Content Shortcut */}
      <Link
        to="/student/learning?tab=saved"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-orange)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--ks-surface-soft)] border border-[var(--ks-border)] shadow-2xs group"
        title="View your saved courses, lessons, and notes"
      >
        <Bookmark className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
        <span>Saved Content</span>
        <span className="text-[11px] text-[var(--ks-text-subtle)] font-normal">
          • {savedCount} {savedCount === 1 ? 'item' : 'items'}
        </span>
        <span className="text-[var(--ks-orange)] group-hover:translate-x-0.5 transition-transform">
          View saved →
        </span>
      </Link>
    </div>
  )
}
