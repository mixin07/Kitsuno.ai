export default function ProgressBar({ value = 0, className = '' }) {
  const safe = Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-[var(--ks-surface-inset)] border border-[var(--ks-border-subtle)] ${className}`}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress"
    >
      <div
        className="h-full rounded-full bg-[var(--ks-orange)] transition-all duration-300"
        style={{ width: `${safe}%` }}
      />
    </div>
  )
}