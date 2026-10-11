export default function LessonItem({ lesson, onEdit, onDelete }) {
  const metaParts = []
  if (lesson.duration_minutes != null) metaParts.push(`${lesson.duration_minutes} min`)
  if (lesson.video_url) metaParts.push('Video')
  if (lesson.resource_url) metaParts.push('Resource')

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border-[1.5px] border-[#241A16] bg-white px-4 py-3 shadow-[2px_2px_0_#241A16]">
      <div className="min-w-0">
        <p className="font-semibold text-xs sm:text-sm text-[#241A16]">
          <span className="mr-2 text-neutral-400 font-mono text-xs">{lesson.order_number}.</span>
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="mt-0.5 truncate text-xs text-neutral-600">{lesson.description}</p>
        )}
        {metaParts.length > 0 && (
          <p className="mt-1 text-[11px] font-mono text-neutral-500">{metaParts.join(' · ')}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="ks-neo-btn-secondary px-2.5 py-1 text-xs"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="ks-neo-btn-secondary px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700"
        >
          Delete
        </button>
      </div>
    </li>
  )
}