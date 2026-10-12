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
      <div className="ks-neo-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="ks-card-title text-lg sm:text-xl text-[#241A16]">Access this course</h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Enroll to track your progress and unlock guided learning.
            </p>
          </div>
          <button
            type="button"
            onClick={onEnroll}
            disabled={isBusy}
            className="ks-neo-btn-primary px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="ks-neo-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-52 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="ks-card-title text-lg sm:text-xl text-[#241A16]">Your progress</h2>
            <span className="text-sm font-mono font-bold text-[#F16524]">
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} className="mt-3" />
          <p className="mt-2 text-xs font-mono text-neutral-600">
            {enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          {enrollment.next_lesson ? (
            <button
              type="button"
              onClick={() => onContinue(enrollment.next_lesson.id)}
              className="ks-neo-btn-primary px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-center"
            >
              {progress > 0 ? 'Continue Learning →' : 'Start Learning →'}
            </button>
          ) : isCompleted ? (
            <div className="flex flex-col gap-1.5">
              <span className="rounded border border-[#241A16] bg-emerald-50 px-5 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                Course completed ✓
              </span>
              {enrollment.first_lesson_id && (
                <button
                  type="button"
                  onClick={() => onContinue(enrollment.first_lesson_id)}
                  className="ks-neo-btn-secondary px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider"
                >
                  Review Course →
                </button>
              )}
            </div>
          ) : (
            <span className="rounded border border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] px-5 py-2.5 text-center text-xs font-mono text-neutral-600">
              No lessons available
            </span>
          )}

          <button
            type="button"
            onClick={onUnenroll}
            disabled={isBusy}
            className="text-[11px] font-mono text-neutral-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 text-center font-medium"
          >
            Unenroll
          </button>
        </div>
      </div>
    </div>
  )
}