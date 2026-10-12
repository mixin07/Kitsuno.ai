export default function ProgressBar({ value = 0, className = '' }) {
  const safe = Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-[3px] border border-[#241A16] bg-[#FAF8F5] ${className}`}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress"
    >
      <div
        className="h-full bg-[#F16524] transition-all duration-300"
        style={{ width: `${safe}%` }}
      />
    </div>
  )
}