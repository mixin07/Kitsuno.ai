import { useState, useEffect } from 'react'
import {
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  CalendarDays,
} from 'lucide-react'
import { rescheduleStudyPlan } from '../../../services/studyPlanService.js'

function getTomorrowDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const DAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 0, label: 'Sun', full: 'Sunday' },
]

const TIME_PRESETS = [15, 30, 45, 60]

export default function ReschedulePlanModal({
  isOpen,
  onClose,
  plan,
  onPlanRescheduled,
}) {
  const [newTargetDate, setNewTargetDate] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(30)
  const [preferredDays, setPreferredDays] = useState([1, 2, 3, 4, 5])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const minDate = getTomorrowDate()

  useEffect(() => {
    if (!isOpen || !plan) return

    setDailyMinutes(plan.daily_study_minutes || 30)
    setPreferredDays(
      Array.isArray(plan.preferred_days_of_week) && plan.preferred_days_of_week.length > 0
        ? plan.preferred_days_of_week
        : [1, 2, 3, 4, 5]
    )

    const curTarget = plan.target_date ? new Date(plan.target_date) : null
    const tomorrow = new Date(Date.now() + 86400000)
    if (curTarget && curTarget > tomorrow) {
      setNewTargetDate(plan.target_date)
    } else {
      const future = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      setNewTargetDate(future)
    }
  }, [isOpen, plan])

  if (!isOpen || !plan) return null

  const toggleDay = (dayValue) => {
    if (preferredDays.includes(dayValue)) {
      if (preferredDays.length === 1) return
      setPreferredDays(preferredDays.filter((d) => d !== dayValue))
    } else {
      setPreferredDays([...preferredDays, dayValue])
    }
  }

  const remainingTasks = (plan.total_task_count || 0) - (plan.completed_task_count || 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newTargetDate) {
      setError('Please select a target completion date.')
      return
    }
    if (new Date(newTargetDate) <= new Date()) {
      setError('Target date must be in the future.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const updated = await rescheduleStudyPlan(plan.id, {
        new_target_date: newTargetDate,
        daily_study_minutes: Number(dailyMinutes),
        preferred_days_of_week: preferredDays,
      })
      onPlanRescheduled(updated)
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to reschedule plan. Please verify the target date and pacing.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F0E04]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-modal-title"
        className="relative w-full max-w-lg rounded-[8px] border-2 border-[#241A16] bg-white shadow-[5px_5px_0_#241A16] p-5 sm:p-6 overflow-hidden z-10 max-h-[92vh] flex flex-col text-[#241A16]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#241A16]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#FFF2E6] text-[#F16524] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] block">
                PACING RECALIBRATION
              </span>
              <h2 id="reschedule-modal-title" className="font-serif text-2xl font-normal text-[#241A16] mt-0.5">
                Reschedule Plan
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-600 hover:text-[#241A16] hover:bg-[#FAF8F5] rounded-[4px] border border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
          {error && (
            <div className="p-3 rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] text-[#241A16] font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#F16524]" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-3.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFFAF4] shadow-[2px_2px_0_#241A16] text-xs flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                COURSE: {plan.course_title}
              </p>
              <p className="font-serif text-base font-normal text-[#241A16] mt-0.5">
                {remainingTasks} tasks remaining to schedule
              </p>
            </div>
            {plan.overdue_task_count > 0 && (
              <span className="rounded-[3px] border border-[#241A16] bg-amber-100 text-amber-900 font-mono text-[9px] font-bold uppercase px-2 py-0.5">
                {plan.overdue_task_count} overdue
              </span>
            )}
          </div>

          {/* 1. New Target Date */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
              New Target Completion Date
            </label>
            <input
              type="date"
              min={minDate}
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white font-mono text-xs font-bold text-[#241A16] shadow-[2px_2px_0_#241A16] focus:outline-none focus:ring-1 focus:ring-[#F16524]"
            />
          </div>

          {/* 2. Daily Study Minutes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
                Daily Study Commitment
              </label>
              <span className="font-mono text-xs font-bold text-[#F16524]">
                {dailyMinutes} MIN / DAY
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDailyMinutes(preset)}
                  className={`py-2 rounded-[6px] font-mono text-xs font-bold uppercase border-[1.5px] border-[#241A16] transition-all cursor-pointer ${
                    dailyMinutes === preset
                      ? 'bg-[#FFF2E6] text-[#241A16] shadow-[2px_2px_0_#241A16]'
                      : 'bg-white text-neutral-600 shadow-[1px_1px_0_#241A16] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </div>

          {/* 3. Preferred Study Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
                Study Days
              </label>
              <span className="font-mono text-[10px] text-neutral-500">
                {preferredDays.length} DAYS / WEEK
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d) => {
                const isSelected = preferredDays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`py-2 rounded-[6px] font-mono text-xs font-bold uppercase border-[1.5px] border-[#241A16] flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F16524] text-white shadow-[2px_2px_0_#241A16]'
                        : 'bg-white text-[#241A16] shadow-[1px_1px_0_#241A16] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Redistribution Preview Note */}
          <div className="p-3.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFFAF4] shadow-[2px_2px_0_#241A16] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#241A16]">
              <CalendarDays className="w-3.5 h-3.5 text-[#F16524]" />
              <span className="font-mono text-xs uppercase tracking-wide">Redistribution Behavior</span>
            </div>
            <p className="font-mono text-[11px] text-neutral-600 leading-relaxed">
              Rescheduling will automatically redistribute all pending and overdue tasks across your new target timeline starting from tomorrow. Completed tasks remain completely safe.
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t-2 border-[#241A16] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#241A16] hover:bg-[#d95318] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rescheduling...</span>
              </span>
            ) : (
              <span>Reschedule Plan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
