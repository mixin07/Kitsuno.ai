import { Link } from 'react-router-dom'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import { Bookmark, BookmarkCheck } from 'lucide-react'

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', className: 'border-orange-500/40 bg-orange-500/10 text-[var(--ks-orange)]' },
  completed: { label: 'Completed', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600' },
  want_to_study: { label: 'Want to Study', className: 'border-amber-500/40 bg-amber-500/10 text-amber-700' },
  planning: { label: 'Planning', className: 'border-blue-500/40 bg-blue-500/10 text-blue-700' },
}

export default function CourseCard({
  course,
  to,
  actions,
  isSaved,
  onToggleSave,
  isSaving = false,
  status,
  enrollment,
}) {
  const difficultyLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty
  const statusInfo = status ? STATUS_CONFIG[status] : null
  const progress = Math.round(enrollment?.progress ?? 0)
  const isCompleted = progress >= 100

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs transition hover:border-[var(--ks-orange)]/50 hover:shadow-md">
      {/* Thumbnail + Save Button */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--ks-bg-soft)]">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--ks-text-muted)]">
            No thumbnail
          </div>
        )}

        {/* Save button badge on thumbnail */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleSave(course)
            }}
            disabled={isSaving}
            className={`absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition shadow-xs ${
              isSaved
                ? 'bg-[var(--ks-orange)] text-white hover:bg-[var(--ks-orange-light)]'
                : 'bg-black/60 text-white hover:bg-black/80'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save Course'}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {to ? (
          <Link to={to} className="ks-card-title hover:text-[var(--ks-orange)]">
            {course.title}
          </Link>
        ) : (
          <h3 className="ks-card-title">{course.title}</h3>
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

          {/* Status Badge */}
          {statusInfo && (
            <span className={`rounded-full border px-3 py-1 font-semibold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}

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

        {/* Progress bar if enrolled */}
        {enrollment && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-[var(--ks-text-muted)] font-medium">
              <span>{isCompleted ? 'Completed' : 'Progress'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ks-bg-soft)]">
              <div
                className={`h-full rounded-full transition-all ${
                  isCompleted ? 'bg-emerald-500' : 'bg-[var(--ks-orange)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <p className="mt-auto text-xs text-[var(--ks-text-muted)] opacity-75">Instructor #{course.instructor_id}</p>

        {/* Action Button Row */}
        {actions ? (
          <div className="flex flex-wrap gap-2 pt-2">{actions}</div>
        ) : to ? (
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--ks-border)]/60">
            <Link
              to={to}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
            >
              <span>
                {isCompleted
                  ? 'Review Course →'
                  : progress > 0
                  ? 'Continue Learning →'
                  : enrollment
                  ? 'Start Learning →'
                  : 'Explore Course →'}
              </span>
            </Link>
            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleSave(course)
                }}
                disabled={isSaving}
                className="text-xs font-medium text-[var(--ks-text-muted)] hover:text-[var(--ks-orange)] transition-colors"
              >
                {isSaved ? '✓ Saved' : '♡ Save Course'}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}