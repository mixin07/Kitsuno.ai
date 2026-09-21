import LessonItem from './LessonItem.jsx'

export default function ModuleSection({
  module,
  lessons,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  children,
}) {
  return (
    <section className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ks-border)] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--ks-text)]">
            <span className="mr-2 text-[var(--ks-text-muted)]">{module.order_number}.</span>
            {module.title}
          </h3>
          {module.description && (
            <p className="mt-1 text-sm text-[var(--ks-text-muted)]">{module.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEditModule}
            className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)]"
          >
            Edit Module
          </button>
          <button
            type="button"
            onClick={onDeleteModule}
            className="rounded-md border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"
          >
            Delete Module
          </button>
        </div>
      </div>

      {children}

      {lessons.length > 0 ? (
        <ul className="space-y-2 px-5 py-4">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson)}
            />
          ))}
        </ul>
      ) : (
        <p className="px-5 pt-4 text-sm text-[var(--ks-text-muted)]">No lessons yet.</p>
      )}

      <div className="border-t border-[var(--ks-border)] px-5 py-3">
        <button
          type="button"
          onClick={onAddLesson}
          className="rounded-md border border-[var(--ks-orange)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--ks-orange)] transition hover:bg-[var(--ks-orange)]/10"
        >
          + Add Lesson
        </button>
      </div>
    </section>
  )
}