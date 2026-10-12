import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react'
import PlanHealthBadge from './PlanHealthBadge.jsx'
import NeoTaskRow from '../../../components/NeoTaskRow.jsx'
import { getStudyPlan } from '../../../services/studyPlanService.js'

export default function AllPlansTab({
  plans,
  loading,
  onOpenCreatePlan,
  onOpenReschedule,
  onDeletePlan,
  onTaskCompleted,
}) {
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null)
  const [loadingDetailId, setLoadingDetailId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const handleToggleDetails = async (plan) => {
    if (selectedPlanDetail && selectedPlanDetail.id === plan.id) {
      setSelectedPlanDetail(null)
      return
    }

    setLoadingDetailId(plan.id)
    try {
      const detail = await getStudyPlan(plan.id)
      setSelectedPlanDetail(detail)
    } catch (err) {
      console.error('Failed to load plan detail', err)
    } finally {
      setLoadingDetailId(null)
    }
  }

  const handleDelete = async (plan) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the study plan for "${plan.course_title}"?\n\nNote: This will NOT delete your course enrollment or completed lesson progress.`
      )
    ) {
      return
    }

    setDeletingId(plan.id)
    try {
      await onDeletePlan(plan.id)
      if (selectedPlanDetail?.id === plan.id) {
        setSelectedPlanDetail(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleComplete = async (taskId) => {
    setCompletingTaskId(taskId)
    try {
      await onTaskCompleted(taskId)
      if (selectedPlanDetail) {
        const updatedDetail = await getStudyPlan(selectedPlanDetail.id)
        setSelectedPlanDetail(updatedDetail)
      }
    } finally {
      setCompletingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#241A16]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F16524] mb-3" />
        <p className="font-mono text-xs font-bold uppercase tracking-wider">Loading your study plans...</p>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-[8px] bg-white border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] max-w-lg mx-auto my-6">
        <div className="w-12 h-12 mx-auto rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] flex items-center justify-center text-[#F16524] mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-2xl font-normal text-[#241A16]">
          No active study plans
        </h3>
        <p className="font-mono text-xs text-neutral-600 max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
          Pick any enrolled course to generate an automated timeline with daily lesson goals and structured milestones.
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16]">
          All Study Plans ({plans.length})
        </h2>
        <button
          type="button"
          onClick={onOpenCreatePlan}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#d95318] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {plans.map((plan) => {
          const isDetailOpen = selectedPlanDetail?.id === plan.id
          const isLoadingDetail = loadingDetailId === plan.id
          const isDeleting = deletingId === plan.id

          const total = plan.total_task_count || 0
          const completed = plan.completed_task_count || 0
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <div
              key={plan.id}
              className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] overflow-hidden transition-all"
            >
              {/* Plan Card Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] flex items-center justify-center text-[#F16524] shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlanHealthBadge status={plan.status} health={plan.health} />
                        {plan.overdue_task_count > 0 && (
                          <span className="rounded-[3px] border border-[#241A16] bg-amber-100 text-amber-900 font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{plan.overdue_task_count} overdue</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-normal text-[#241A16] mt-1.5 truncate">
                        {plan.course_title}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-xs text-neutral-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#F16524]" />
                          <span>Target: {plan.target_date}</span>
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#F16524]" />
                          <span>{plan.daily_study_minutes} min / day</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onOpenReschedule(plan)}
                      className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Reschedule plan pace or target date"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#F16524]" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-neutral-600 hover:text-rose-700 hover:bg-rose-50 shadow-[2px_2px_0_#241A16] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      title="Delete study plan"
                      aria-label="Delete study plan"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar and metrics */}
                <div className="pt-3 border-t-[1.5px] border-[#241A16]/15">
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="font-bold text-[#241A16]">
                      {completed} OF {total} TASKS COMPLETED
                    </span>
                    <span className="font-bold text-[#F16524]">{pct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-[4px] bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden">
                    <div
                      className="h-full bg-[#F16524] border-r-[1.5px] border-[#241A16] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Expand / Collapse Tasks button */}
                <div className="flex justify-between items-center pt-1 text-xs">
                  <Link
                    to={`/courses/${plan.course_id}`}
                    className="font-mono text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Course Curriculum</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleDetails(plan)}
                    disabled={isLoadingDetail}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#241A16] bg-[#FAF8F5] font-mono text-xs font-bold uppercase text-[#241A16] hover:bg-white shadow-[1px_1px_0_#241A16] transition-all cursor-pointer"
                  >
                    {isLoadingDetail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F16524]" />
                        <span>Loading tasks...</span>
                      </>
                    ) : isDetailOpen ? (
                      <>
                        <span>Hide Milestones</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>View Milestones ({total})</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Task Milestones Drawer */}
              {isDetailOpen && selectedPlanDetail && (
                <div className="border-t-2 border-[#241A16] bg-[#FFFAF4] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b-[1.5px] border-[#241A16]/20 pb-2">
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524]">
                      PLAN MILESTONE TASKS ({selectedPlanDetail.tasks?.length || 0})
                    </h4>
                    <span className="font-mono text-[11px] text-neutral-500">
                      Chronological schedule
                    </span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedPlanDetail.tasks?.map((task) => (
                      <NeoTaskRow
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        completing={completingTaskId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
