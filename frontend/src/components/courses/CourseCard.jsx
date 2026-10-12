import { Link } from 'react-router-dom'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import { Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react'
import { getCourseCover } from '../../utils/courseCovers.js'

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
  const coverUrl = getCourseCover(course)

  // Determine contextual CTA label
  const ctaLabel = isCompleted
    ? 'Review Course'
    : progress > 0
    ? 'Continue Learning'
    : enrollment
    ? 'Start Learning'
    : 'Explore Course'

  return (
    <div className="ks-neo-card group relative flex flex-col h-full overflow-hidden rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white transition-all duration-150">
      {/* 1. TOP: INSET COVER FRAME (Separates cover from white card body) */}
      <div className="p-3 sm:p-3.5 pb-0">
        <div className="relative overflow-hidden rounded-md bg-[#F4EDE5] p-2 sm:p-2.5 border-[1.5px] border-[rgba(36,26,22,0.18)]">
          {/* Subtle Kitsuno Orange accent hairline along top edge */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-[#F16524]/60 rounded-full" />

          {/* Actual 16:9 Editorial Cover Artwork */}
          <div className="relative aspect-video w-full overflow-hidden rounded-sm border-[1.5px] border-[#241A16] bg-[#FFF9F2] shadow-[1px_2px_0_#241A16]">
            <img
              src={coverUrl}
              alt={course.title ? `${course.title} Cover` : 'Course Cover'}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                if (e.currentTarget.src !== coverUrl) {
                  e.currentTarget.src = coverUrl
                }
              }}
            />

            {/* Integrated Save button badge on cover */}
            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleSave(course)
                }}
                disabled={isSaving}
                className={`absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] px-2 py-0.5 text-[10px] font-mono font-bold transition shadow-[1px_1px_0_#241A16] cursor-pointer ${
                  isSaved
                    ? 'bg-[#FFF2E6] text-[#F16524]'
                    : 'bg-white/95 text-[#241A16] hover:bg-[#FFF2E6]'
                }`}
                title={isSaved ? 'Remove from Saved' : 'Save Course'}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5 text-[#F16524]" />
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
        </div>
      </div>

      {/* 2. CARD BODY: Crisp White Editorial Information Sheet */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 pt-3.5 sm:pt-4 bg-white gap-3.5">
        {/* Upper Block: Meta Tags, Title, Description */}
        <div className="space-y-2.5">
          {/* Subtle Tags Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {course.category && (
              <span className="rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#241A16]">
                {course.category}
              </span>
            )}
            <span className="rounded-[4px] border border-[#241A16] bg-[#FFF2E6] px-2 py-0.5 text-[10px] font-mono font-bold text-[#F16524]">
              {difficultyLabel}
            </span>

            {/* Enrolled Status Badge */}
            {statusInfo && (
              <span className={`rounded-[4px] border border-[#241A16] px-2 py-0.5 text-[10px] font-mono font-bold ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            )}

            {/* Instructor Publication Status Badge */}
            {actions && course.published !== undefined && (
              <span
                className={`rounded-[4px] border border-[#241A16] px-2 py-0.5 text-[10px] font-mono font-bold ${
                  course.published
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {course.published ? 'Published' : 'Draft'}
              </span>
            )}
          </div>

          {/* Editorial Course Title */}
          {to ? (
            <Link
              to={to}
              className="ks-card-title block text-lg sm:text-xl font-normal text-[#241A16] hover:text-[#F16524] transition-colors leading-snug line-clamp-1"
            >
              {course.title}
            </Link>
          ) : (
            <h3 className="ks-card-title block text-lg sm:text-xl font-normal text-[#241A16] leading-snug line-clamp-1">
              {course.title}
            </h3>
          )}

          {/* Readable Muted Description */}
          {course.description && (
            <p className="text-xs leading-relaxed text-neutral-600 line-clamp-2 min-h-[2.4rem]">
              {course.description}
            </p>
          )}

          {/* Enrolled Progress Bar */}
          {enrollment && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-neutral-500 font-mono font-medium">
                <span>{isCompleted ? 'Completed' : 'Progress'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCompleted ? 'bg-emerald-500' : 'bg-[#F16524]'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lower Block: Instructor Row + Action Footer */}
        <div className="space-y-2.5 pt-1">
          {/* Subtle Instructor Divider */}
          <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-[rgba(36,26,22,0.12)] pt-2.5">
            <span className="font-mono text-[11px]">
              Instructor #{course.instructor_id}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              {course.category || 'Curriculum'}
            </span>
          </div>

          {/* Dedicated Action Footer */}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[rgba(36,26,22,0.12)]">
              {actions}
            </div>
          ) : to ? (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(36,26,22,0.12)]">
              <Link
                to={to}
                className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-[#F16524] transition-colors cursor-pointer"
                >
                  {isSaved ? '✓ Saved' : '+ Save'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}