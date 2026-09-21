export default function LessonItem({ lesson, onEdit, onDelete }) {
  const metaParts = []
  if (lesson.duration_minutes != null) metaParts.push(`${lesson.duration_minutes} min`)
  if (lesson.video_url) metaParts.push('Video')
  if (lesson.resource_url) metaParts.push('Resource')

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-3 shadow-xs">
      <div className="min-w-0">
        <p className="font-medium text-[var(--ks-text)]">
          <span className="mr-2 text-[var(--ks-text-muted)]">{lesson.order_number}.</span>
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="mt-0.5 truncate text-sm text-[var(--ks-text-muted)]">{lesson.description}</p>
        )}
        {metaParts.length > 0 && (
          <p className="mt-1 text-xs text-[var(--ks-text-muted)] opacity-75">{metaParts.join(' · ')}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"
        >
          Delete
        </button>
      </div>
    </li>
  )
}