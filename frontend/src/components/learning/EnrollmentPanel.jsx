import { useRef, useState } from 'react'
import ProgressBar from './ProgressBar.jsx'

export default function EnrollmentPanel({
  enrollment,
  isBusy = false,
  onEnroll,
  onUnenroll,
  onContinue,
}) {
  const [confirming, setConfirming] = useState(false)
  const confirmTimer = useRef(null)

  function handleUnenrollClick() {
    if (!confirming) {
      setConfirming(true)
      confirmTimer.current = window.setTimeout(() => setConfirming(false), 4000)
      return
    }
    window.clearTimeout(confirmTimer.current)
    setConfirming(false)
    onUnenroll()
  }

  if (!enrollment) {
    return (
      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ks-text)]">Access this course</h2>
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
            {isBusy ? 'Enrolling…' : 'Enroll Now'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-52 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--ks-text)]">Your progress</h2>
            <span className="text-sm font-medium text-[var(--ks-orange)]">
              {enrollment.progress}%
            </span>
          </div>
          <ProgressBar value={enrollment.progress} className="mt-3" />
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
              Continue Learning →
            </button>
          ) : (
            <span className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 text-center text-sm font-semibold text-emerald-600">
              Course completed ✓
            </span>
          )}
          {enrollment.total_lessons === 0 && (
            <p className="text-center text-xs text-[var(--ks-text-muted)]">No lessons available yet</p>
          )}
          <button
            type="button"
            onClick={handleUnenrollClick}
            disabled={isBusy}
            className="text-xs transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 text-[var(--ks-text-muted)]"
          >
            {confirming ? 'Confirm unenroll?' : 'Unenroll'}
          </button>
        </div>
      </div>
    </div>
  )
}