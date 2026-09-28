import ProgressBar from './ProgressBar.jsx'

export default function EnrollmentPanel({
  enrollment,
  isBusy = false,
  onEnroll,
  onUnenroll,
  onContinue,
}) {
  if (!enrollment) {
    return (
      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="ks-panel-title">Access this course</h2>
            <p className="mt-1 text-sm text-[var(--ks-text-muted)]">
              Enroll to track your progress and unlock guided learning.
            </p>
          </div>
          <button
            type="button"
            onClick={onEnroll}
            disabled={isBusy}
            className="rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? 'Enrolling…' : 'Start Learning →'}
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round(enrollment.progress ?? 0)
  const isCompleted = progress >= 100

  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-52 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="ks-panel-title">Your progress</h2>
            <span className="text-sm font-medium text-[var(--ks-orange)]">
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} className="mt-3" />
          <p className="mt-2 text-sm text-[var(--ks-text-muted)]">
            {enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          {enrollment.next_lesson ? (
            <button
              type="button"
              onClick={() => onContinue(enrollment.next_lesson.id)}
              className="rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
            >
              {progress > 0 ? 'Continue Learning →' : 'Start Learning →'}
            </button>
          ) : isCompleted ? (
            <div className="flex flex-col gap-1.5">
              <span className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-5 py-2 text-center text-sm font-semibold text-emerald-600">
                Course completed ✓
              </span>
              {enrollment.first_lesson_id && (
                <button
                  type="button"
                  onClick={() => onContinue(enrollment.first_lesson_id)}
                  className="rounded-lg border border-[var(--ks-orange)] px-4 py-1.5 text-xs font-semibold text-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.08)]"
                >
                  Review Course →
                </button>
              )}
            </div>
          ) : (
            <span className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-5 py-2.5 text-center text-sm text-[var(--ks-text-muted)]">
              No lessons available
            </span>
          )}

          <button
            type="button"
            onClick={onUnenroll}
            disabled={isBusy}
            className="text-xs text-[var(--ks-text-muted)] transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Unenroll
          </button>
        </div>
      </div>
    </div>
  )
}