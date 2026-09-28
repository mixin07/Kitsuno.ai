import { useState } from 'react'
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
  const [expanded, setExpanded] = useState(true)
  const hasChildren = Boolean(children)
  const isExpanded = expanded || hasChildren

  return (
    <section className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ks-border)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="ks-panel-title text-[var(--ks-text)]">
              <span className="mr-2 text-[var(--ks-text-muted)]">{module.order_number}.</span>
              {module.title}
            </h3>
            <span className="rounded-full bg-[var(--ks-surface-soft)] px-2 py-0.5 text-xs text-[var(--ks-text-muted)]">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
          {isExpanded && module.description && (
            <p className="mt-1 text-sm text-[var(--ks-text-muted)]">{module.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text-muted)] transition hover:border-[var(--ks-orange)]/40 hover:text-[var(--ks-orange)]"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            onClick={onEditModule}
            className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDeleteModule}
            className="rounded-md border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
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
            !hasChildren && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-[var(--ks-text-muted)]">No lessons yet.</p>
                <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
                  Add lessons to start building this module.
                </p>
              </div>
            )
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
        </>
      )}
    </section>
  )
}