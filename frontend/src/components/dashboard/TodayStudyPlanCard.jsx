import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Clock,
  Check,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { getTodayPlan, completeTask } from '../../services/studyPlanService.js'

export default function TodayStudyPlanCard() {
  const [todayPlan, setTodayPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const fetchToday = async () => {
    try {
      const data = await getTodayPlan()
      setTodayPlan(data)
    } catch {
      // Gracefully handle if student has no plans or error
      setTodayPlan(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToday()
  }, [])

  const handleComplete = async (taskId) => {
    setCompletingTaskId(taskId)
    try {
      await completeTask(taskId)
      await fetchToday()
    } catch (err) {
      console.error('Failed to complete study task:', err)
    } finally {
      setCompletingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="ks-neo-card-static p-5">
        <div className="flex items-center gap-2 text-xs text-[#6F625B]">
          <Loader2 className="w-4 h-4 animate-spin text-[#F16524]" />
          <span>Loading today's study plan...</span>
        </div>
      </div>
    )
  }

  const tasks = todayPlan?.tasks || []
  const overdueTasks = todayPlan?.overdue_tasks || []
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const hasNoTasksToday = totalCount === 0 && overdueTasks.length === 0

  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full relative">
      {/* 1. Header with Clean Eyebrow */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b-[1.5px] border-[#241A16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#F16524] border-[1.5px] border-[#241A16] flex items-center justify-center text-white shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                  TODAY'S SCHEDULE
                </span>
                <span className="w-1.5 h-1.5 bg-[#F16524]" />
              </div>
              <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight mt-0.5">
                Today's Focus
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalCount > 0 && (
              <span className="text-[10px] font-bold text-[#241A16] bg-[#FFF2E6] px-2 py-0.5 rounded-[4px] border border-[#241A16] hidden sm:inline-block font-mono">
                {todayPlan?.planned_minutes || 0}m planned
              </span>
            )}
            <Link
              to="/student/study-plan"
              className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1"
            >
              <span>Full Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Overdue alert if applicable */}
        {overdueTasks.length > 0 && (
          <div className="mt-2.5 p-2 rounded-[6px] bg-[#FDF0ED] border-[1.5px] border-[#B83A20] text-xs text-[#B83A20] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#B83A20] shrink-0" />
              <span className="truncate">
                <strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</strong> from prior days.
              </span>
            </div>
            <Link
              to="/student/study-plan"
              className="text-[11px] font-bold text-[#B83A20] underline shrink-0 hover:text-red-950"
            >
              Catch Up
            </Link>
          </div>
        )}

        {/* Progress meter (when tasks exist) */}
        {totalCount > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--ks-text-muted)]">
              <span className="text-[#241A16] font-bold">Daily Goal Progress</span>
              <span className="text-[#F16524] font-bold font-mono">{completedCount}/{totalCount} Completed ({percent}%)</span>
            </div>
            <div className="w-full h-2 rounded-[4px] border-[1.5px] border-[#241A16] bg-white p-[1px] overflow-hidden">
              <div
                className="h-full bg-[#F16524] transition-all duration-300 rounded-[1px]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Structured Flat Tasks List */}
      <div className="flex-1 min-h-0">
        {hasNoTasksToday ? (
          <div className="py-3 text-center text-xs space-y-1 border-t-[1.5px] border-[#241A16]/10 pt-3">
            <p className="font-bold text-sm text-[#241A16]">All caught up for today!</p>
            <p className="text-xs text-[var(--ks-text-muted)]">
              Your paced daily study schedule is currently on track.
            </p>
            <div className="pt-1.5">
              <Link
                to="/student/study-plan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F16524] hover:underline"
              >
                <span>Customize your schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task) => {
              const isDone = task.status === 'COMPLETED'
              const isQuiz = task.task_type === 'QUIZ'
              const linkTarget = isQuiz
                ? `/student/quiz/${task.quiz_id}`
                : `/courses/${task.course_id}/lessons/${task.lesson_id}`

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2 rounded-[6px] border-[1.5px] transition-all ${
                    isDone
                      ? 'opacity-70 bg-[#F9F7F4] border-[#241A16]/20'
                      : 'bg-white border-[#241A16]/30 hover:border-[#241A16]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => !isDone && handleComplete(task.id)}
                      disabled={isDone || completingTaskId === task.id}
                      aria-label={isDone ? 'Task completed' : 'Mark task completed'}
                      className={`ks-quest-checkbox ${
                        isDone ? 'ks-quest-checkbox--checked' : 'hover:border-[#F16524] cursor-pointer'
                      }`}
                    >
                      {completingTaskId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#F16524]" />
                      ) : isDone ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : null}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate text-xs ${
                          isDone ? 'line-through text-[var(--ks-text-muted)]' : 'text-[#241A16]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--ks-text-subtle)] mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5 text-[#F16524]" />
                          <span>{task.estimated_minutes}m</span>
                        </span>
                        {task.module_title && (
                          <span className="truncate max-w-[140px] sm:max-w-[200px]">
                            • {task.module_title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={linkTarget}
                    className="text-[11px] font-bold text-[#241A16] shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-[#241A16] bg-white hover:bg-[#F16524] hover:text-white transition-colors"
                  >
                    <span>{isDone ? 'Review' : 'Start'}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )
            })}
            {tasks.length > 3 && (
              <p className="text-[11px] text-center text-[var(--ks-text-subtle)] pt-0.5 font-medium">
                +{tasks.length - 3} more task{tasks.length - 3 > 1 ? 's' : ''} on today's calendar
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
