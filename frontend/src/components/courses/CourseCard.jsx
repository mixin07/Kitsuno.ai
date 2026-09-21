import { Link } from 'react-router-dom'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'

export default function CourseCard({ course, to, actions }) {
  const difficultyLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs transition hover:border-[var(--ks-orange)]/50 hover:shadow-md">
      {course.thumbnail_url ? (
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--ks-bg-soft)]">
          <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-[var(--ks-bg-soft)] text-sm text-[var(--ks-text-muted)]">
          No thumbnail
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        {to ? (
          <Link to={to} className="text-xl font-bold tracking-tight text-[var(--ks-text)] hover:text-[var(--ks-orange)]">
            {course.title}
          </Link>
        ) : (
          <h3 className="text-xl font-bold tracking-tight text-[var(--ks-text)]">{course.title}</h3>
        )}

        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {course.category && (
            <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-3 py-1 text-[var(--ks-text-muted)]">
              {course.category}
            </span>
          )}
          <span className="rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-3 py-1 text-[var(--ks-orange)]">
            {difficultyLabel}
          </span>
          {actions && course.published !== undefined && (
            <span
              className={`rounded-full px-3 py-1 ${
                course.published
                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-semibold'
                  : 'border border-amber-500/40 bg-amber-500/10 text-amber-700 font-semibold'
              }`}
            >
              {course.published ? 'Published' : 'Unpublished'}
            </span>
          )}
        </div>

        {course.description && (
          <p className="text-sm leading-relaxed text-[var(--ks-text-muted)] line-clamp-2">{course.description}</p>
        )}

        <p className="mt-auto text-xs text-[var(--ks-text-muted)] opacity-75">Instructor #{course.instructor_id}</p>

        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </div>
    </div>
  )
}