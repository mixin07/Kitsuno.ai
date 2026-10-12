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
    <section className="ks-neo-card rounded-[8px] border-2 border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#241A16] px-4 sm:px-5 py-3.5 bg-white">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg text-[#241A16]">
              <span className="mr-2 text-neutral-400 font-mono text-sm">{module.order_number}.</span>
              {module.title}
            </h3>
            <span className="rounded-[4px] border border-[#241A16] bg-[#FFF2E6] px-2 py-0.5 text-[10px] font-mono font-bold text-[#F16524]">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
          {isExpanded && module.description && (
            <p className="mt-1 text-xs text-neutral-600">{module.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ks-neo-btn-secondary px-2.5 py-1 text-xs font-bold"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            onClick={onEditModule}
            className="ks-neo-btn-secondary px-2.5 py-1 text-xs font-bold"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDeleteModule}
            className="ks-neo-btn-secondary px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {children}

          {lessons.length > 0 ? (
            <ul className="space-y-2 px-4 sm:px-5 py-4 bg-[#FAF8F5]/30">
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
              <div className="px-5 py-6 text-center bg-[#FAF8F5]/30">
                <p className="text-sm text-neutral-600 font-medium">No lessons yet.</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Add lessons to start building this module.
                </p>
              </div>
            )
          )}

          <div className="border-t-2 border-[#241A16] px-4 sm:px-5 py-2.5 bg-[#FAF8F5]">
            <button
              type="button"
              onClick={onAddLesson}
              className="ks-neo-btn-primary px-3 py-1.5 text-xs font-bold"
            >
              + Add Lesson
            </button>
          </div>
        </>
      )}
    </section>
  )
}