import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Check, Loader2 } from 'lucide-react'

/**
 * NeoTaskRow — Universal Neo-Brutalist Task Row Component
 *
 * Implements Section 8 of the Kitsuno Master UI System:
 * - Surface: Crisp white physical row with dark structural separator
 * - Checkbox: Square 1.5px dark border (NOT circular)
 * - Duration: Compact outlined badge
 * - Action: Brutalist button with hard shadow
 * - Completed state: Restrained treatment (no green flood, line-through text, dark square check)
 */
export default function NeoTaskRow({
  task,
  isOverdue = false,
  onComplete,
  completing = false,
  className = '',
}) {
  const isDone = task.status === 'COMPLETED'
  const isQuiz = task.task_type === 'QUIZ'

  const linkTarget = isQuiz
    ? `/student/quiz/${task.quiz_id}`
    : task.course_id && task.lesson_id
    ? `/courses/${task.course_id}/lessons/${task.lesson_id}`
    : null

  return (
    <div
      className={`py-3 px-3 sm:px-4 rounded-[6px] border-[1.5px] transition-all flex items-center justify-between gap-3 ${
        isDone
          ? 'bg-[#FAF8F5]/80 border-[rgba(36,26,22,0.18)] opacity-75'
          : isOverdue
          ? 'bg-white border-amber-600 shadow-[2px_2px_0_#241A16]'
          : 'bg-white border-[#241A16] shadow-[2px_2px_0_#241A16]'
      } ${className}`}
    >
      {/* Left: Square Checkbox + Title + Meta */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => !isDone && onComplete && onComplete(task.id)}
          disabled={isDone || completing}
          aria-label={isDone ? 'Task completed' : 'Mark task as complete'}
          className={`mt-0.5 sm:mt-0 w-4.5 h-4.5 rounded-[3px] border-[1.5px] border-[#241A16] flex items-center justify-center shrink-0 transition-colors ${
            isDone
              ? 'bg-[#241A16] text-white cursor-default'
              : 'bg-white hover:bg-[#FFF2E6] cursor-pointer'
          }`}
        >
          {completing ? (
            <Loader2 className="w-3 h-3 animate-spin text-[#F16524]" />
          ) : isDone ? (
            <Check className="w-3 h-3 stroke-[3]" />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-xs sm:text-sm font-semibold truncate ${
                isDone ? 'line-through text-neutral-400 font-normal' : 'text-[#241A16]'
              }`}
            >
              {task.title}
            </p>

            {task.priority && (
              <span className="rounded-[3px] border border-[#241A16] bg-white text-[#241A16] font-mono text-[8px] font-bold uppercase px-1 py-0.2 shrink-0">
                {task.priority}
              </span>
            )}

            {isOverdue && !isDone && (
              <span className="rounded-[3px] border border-[#241A16] bg-amber-100 text-amber-900 font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 shrink-0">
                Overdue
              </span>
            )}
            {isDone && (
              <span className="rounded-[3px] border border-[#241A16] bg-[#FAF8F5] text-neutral-600 font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 shrink-0">
                Done
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-neutral-500 truncate">
            <span className="rounded-[3px] border border-[#241A16] bg-[#FAF8F5] px-1 py-0.2 text-[9px] font-bold uppercase text-[#241A16] shrink-0">
              {isQuiz ? 'QUIZ' : 'LESSON'}
            </span>
            {task.course_title && (
              <span className="truncate text-neutral-600">
                {task.course_title}
              </span>
            )}
            {task.module_title && (
              <>
                <span>•</span>
                <span className="truncate hidden sm:inline text-neutral-500">
                  {task.module_title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Outlined Duration Badge + Action Button */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#241A16]">
          <Clock className="w-3 h-3 text-[#F16524]" />
          <span>{task.estimated_minutes || 15} MIN</span>
        </div>

        {linkTarget && (
          <Link
            to={linkTarget}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-[4px] border-[1.5px] border-[#241A16] font-mono text-xs font-bold uppercase transition-all ${
              isDone
                ? 'bg-[#FAF8F5] text-neutral-600 hover:text-[#241A16] hover:bg-white'
                : 'bg-white text-[#241A16] shadow-[2px_2px_0_#241A16] hover:bg-[#F16524] hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
            }`}
          >
            <span>{isDone ? 'Review' : 'Start'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
