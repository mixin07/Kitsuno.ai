import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Loader2,
  Calendar,
  Compass,
} from 'lucide-react'
import PlanHealthBadge from './PlanHealthBadge.jsx'
import NeoTaskRow from '../../../components/NeoTaskRow.jsx'

export default function TodayFocusTab({
  todayPlan,
  plans = [],
  loading,
  onTaskCompleted,
  onOpenReschedule,
  onOpenCreatePlan,
  hasPlans,
}) {
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const handleComplete = async (taskId) => {
    setCompletingTaskId(taskId)
    try {
      await onTaskCompleted(taskId)
    } finally {
      setCompletingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#241A16]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F16524] mb-3" />
        <p className="font-mono text-xs font-bold uppercase tracking-wider">Loading your study focus for today...</p>
      </div>
    )
  }

  if (!hasPlans) {
    return (
      <div className="text-center py-12 px-6 rounded-[8px] bg-white border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] max-w-lg mx-auto my-6">
        <div className="w-12 h-12 mx-auto rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] flex items-center justify-center text-[#F16524] mb-4">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-2xl font-normal text-[#241A16]">
          No active study plans
        </h3>
        <p className="font-mono text-xs text-neutral-600 max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
          Turn your courses into a focused daily routine. Paced daily lesson goals keep your learning milestones on track.
        </p>
        <button
          type="button"
          onClick={onOpenCreatePlan}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#241A16] hover:bg-[#d95318] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create Study Plan</span>
        </button>
      </div>
    )
  }

  const tasks = todayPlan?.tasks || []
  const overdueTasks = todayPlan?.overdue_tasks || []
  const completedToday = tasks.filter((t) => t.status === 'COMPLETED').length
  const totalToday = tasks.length
  const percentCompleted =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  const plannedMinutes = todayPlan?.planned_minutes || 0
  const completedMinutes = todayPlan?.completed_minutes || 0

  const activePlans = plans.filter((p) => p.status === 'ACTIVE')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* PRIMARY WORKSPACE (8 cols on desktop) */}
      <div className="lg:col-span-8 space-y-5">
        {/* Today's Progress Summary */}
        <div className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] block">
                TODAY'S PROGRESS
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] leading-tight mt-0.5">
                {completedToday} / {totalToday} tasks complete
              </h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2.5 py-1 text-[#241A16]">
                <Clock className="w-3.5 h-3.5 text-[#F16524]" />
                <span className="font-bold">
                  {completedMinutes} / {plannedMinutes} MIN
                </span>
              </div>
              <span className="rounded-[4px] border border-[#241A16] bg-[#FFF2E6] text-[#F16524] px-2 py-1 font-bold text-xs">
                {percentCompleted}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-[4px] bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden">
            <div
              className="h-full bg-[#F16524] border-r-[1.5px] border-[#241A16] transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>

        {/* Overdue Area */}
        {overdueTasks.length > 0 ? (
          <div className="p-4 sm:p-5 rounded-[8px] bg-[#FFFBF0] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-[#241A16]/20 pb-3">
              <div className="flex items-center gap-2.5 text-[#241A16]">
                <div className="p-1.5 rounded-[4px] bg-amber-200 border border-[#241A16] text-[#241A16] shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-900" />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    OVERDUE
                  </span>
                  <h4 className="font-serif text-base font-normal text-[#241A16]">
                    {overdueTasks.length} {overdueTasks.length === 1 ? 'task needs' : 'tasks need'} attention
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenReschedule}
                className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#F16524]" />
                <span>Reschedule</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {overdueTasks.map((task) => (
                <NeoTaskRow
                  key={task.id}
                  task={task}
                  isOverdue
                  onComplete={handleComplete}
                  completing={completingTaskId === task.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-[6px] bg-white border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-[3px] border border-[#241A16] bg-[#241A16] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-mono text-xs font-bold text-[#241A16]">
                NO OVERDUE TASKS
              </span>
              <span className="font-mono text-[11px] text-neutral-500 hidden sm:inline">
                • Zero backlog on your study schedule
              </span>
            </div>
            <span className="font-mono text-[9px] font-bold uppercase text-[#241A16] bg-[#FAF8F5] px-2 py-0.5 rounded-[3px] border border-[#241A16]">
              ON PACE
            </span>
          </div>
        )}

        {/* Today's Tasks List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524]">
              SCHEDULED FOR TODAY ({tasks.length})
            </span>
            <span className="font-mono text-xs text-neutral-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 rounded-[8px] bg-white border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-[6px] bg-[#FAF8F5] text-[#241A16] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#F16524]" />
              </div>
              <h4 className="font-serif text-lg font-normal text-[#241A16]">
                All Caught Up for Today!
              </h4>
              <p className="font-mono text-xs text-neutral-600 max-w-sm mx-auto">
                No pending tasks scheduled for today. You can review past notes or explore upcoming curriculum anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <NeoTaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  completing={completingTaskId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECONDARY RAIL (4 cols on desktop) */}
      <div className="lg:col-span-4 space-y-5">
        {/* Active Plans Health Rail */}
        <div className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b-2 border-[#241A16] pb-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524]">
              <Compass className="w-3.5 h-3.5" />
              <span>PLAN HEALTH & PACING</span>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-[3px] border border-[#241A16] bg-[#FAF8F5] text-[#241A16]">
              {activePlans.length} ACTIVE
            </span>
          </div>

          {activePlans.length === 0 ? (
            <p className="font-mono text-xs text-neutral-500 italic py-2">
              No active study plans enrolled.
            </p>
          ) : (
            <div className="space-y-3">
              {activePlans.map((plan) => {
                const total = plan.total_task_count || 0
                const completed = plan.completed_task_count || 0
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFFAF4] shadow-[2px_2px_0_#241A16] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-normal text-[#241A16] truncate max-w-[180px]">
                        {plan.course_title}
                      </h4>
                      <PlanHealthBadge status={plan.status} health={plan.health} />
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] text-neutral-600">
                      <span>Target: {plan.target_date}</span>
                      <span className="font-bold text-[#241A16]">{pct}%</span>
                    </div>

                    <div className="w-full h-2 rounded-[3px] bg-white border border-[#241A16] overflow-hidden">
                      <div
                        className="h-full bg-[#F16524] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Study Habit Overview */}
        <div className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] p-4 sm:p-5 space-y-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] block">
            STUDY HABIT GOAL
          </span>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-serif font-normal text-[#241A16] block">
                {plannedMinutes} min / day
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                Paced daily commitment
              </span>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-[#FFF2E6] text-[#F16524] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-[11px] text-neutral-600 leading-relaxed pt-2.5 border-t-[1.5px] border-[#241A16]/20">
            Consistency beats intensity. Completing 1 to 2 tasks per day sustains your streak and ensures optimal concept retention.
          </p>
        </div>

        {/* Kitsuno AI Study Companion Banner */}
        <div className="p-4 sm:p-5 rounded-[8px] border-2 border-[#241A16] bg-[#FFF9F5] shadow-[3px_3px_0_#241A16] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#241A16]">
            <Sparkles className="w-4 h-4 text-[#F16524] shrink-0" />
            <span className="font-mono text-xs uppercase tracking-wide">Need study assistance?</span>
          </div>
          <p className="font-mono text-xs text-neutral-600 leading-relaxed">
            Stuck on a lesson or want customized study notes for today's milestone? Ask Kitsuno AI anytime.
          </p>
          <Link
            to="/ai-chat?prompt=Help me prepare study notes for today's scheduled lesson"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#F16524] hover:text-white transition-all"
          >
            <span>Ask Kitsuno AI →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
