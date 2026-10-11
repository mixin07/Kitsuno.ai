import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  X,
  Trophy,
  CheckCircle2,
  Clock,
  BookOpen,
  ClipboardCheck,
  Gamepad2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { getStreakDetails } from '../../services/headerStatsService.js'
import NeoMetricCard from '../NeoMetricCard.jsx'

export default function StreakDetailsModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [streakData, setStreakData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setIsLoading(true)
    setError('')

    getStreakDetails()
      .then((data) => {
        if (active) setStreakData(data)
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.detail || 'Unable to load streak details')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      active = false
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Generate 14-day history array
  const today = new Date()
  const past14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - (13 - i))
    const isoDate = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' })
    const dayNum = d.getDate()
    const isActive = streakData?.active_dates_past_14?.some(
      (ad) => (typeof ad === 'string' ? ad : ad?.split('T')[0]) === isoDate
    )
    const isToday = i === 13
    return { isoDate, dayName, dayNum, isActive, isToday }
  })

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
        aria-labelledby="streak-modal-title"
        className="relative w-full max-w-lg rounded-[8px] border-[1.5px] border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] p-4 sm:p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col text-[#241A16]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b-[1.5px] border-[#241A16]/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FFF2E6] text-[#F16524] border border-[#241A16] shadow-[1px_1px_0_#241A16]">
              <Flame className="h-5 w-5 fill-[#F16524]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                STUDY CONSISTENCY
              </span>
              <h2 id="streak-modal-title" className="text-xl sm:text-2xl font-serif font-normal text-[#241A16]">
                Study Streak
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-600 hover:text-[#241A16] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-thin">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#8F8177]">
              <div className="h-6 w-6 border-2 border-[#F06424] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading streak details...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <>
              {/* Stats Overview Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <NeoMetricCard
                  label="Current"
                  value={streakData?.current_streak ?? 0}
                  icon={Flame}
                  iconColor="text-[#F16524]"
                  valueColor="text-[#F16524]"
                  hint={streakData?.current_streak === 1 ? 'Day' : 'Days'}
                />
                <NeoMetricCard
                  label="Best Streak"
                  value={streakData?.longest_streak ?? 0}
                  icon={Trophy}
                  iconColor="text-amber-500"
                  valueColor="text-[#241A16]"
                  hint={streakData?.longest_streak === 1 ? 'Day' : 'Days'}
                />
                <NeoMetricCard
                  label="Today"
                  value={streakData?.is_active_today ? 'Saved' : 'Pending'}
                  icon={streakData?.is_active_today ? CheckCircle2 : Clock}
                  iconColor={streakData?.is_active_today ? 'text-emerald-700' : 'text-amber-700'}
                  valueColor={streakData?.is_active_today ? 'text-emerald-700' : 'text-amber-700'}
                  hint={streakData?.is_active_today ? 'Great job!' : 'Action needed'}
                />
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-md border-[1.5px] flex items-center gap-3 text-xs ${
                  streakData?.is_active_today
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-[#241A16] bg-[#FFF2E6] text-[#241A16]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#241A16] ${
                    streakData?.is_active_today ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-[#F16524]'
                  }`}
                >
                  {streakData?.is_active_today ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#241A16]">
                    {streakData?.is_active_today ? 'Streak Active Today' : 'Keep Your Streak Alive'}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {streakData?.today_status_message}
                  </p>
                </div>
              </div>

              {/* 14-Day Activity Bar */}
              <div className="rounded-md border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-4 space-y-2.5 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#241A16]">Past 14 Days Activity</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {streakData?.active_dates_past_14?.length || 0} active days
                  </span>
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
                  {past14Days.map((d, idx) => (
                    <div key={d.isoDate || idx} className="flex flex-col items-center gap-1">
                      <div
                        title={`${d.isoDate} ${d.isActive ? '(Active)' : '(No activity)'}`}
                        className={`h-7 w-7 rounded-[4px] flex items-center justify-center text-[10px] font-bold border transition-colors ${
                          d.isActive
                            ? 'bg-[#F16524] text-white border-[#241A16] shadow-[1px_1px_0_#241A16]'
                            : d.isToday
                              ? 'border-[#241A16] text-[#F16524] bg-white'
                              : 'bg-[#FAF8F5] border-[rgba(36,26,22,0.2)] text-neutral-400'
                        }`}
                      >
                        {d.isActive ? '🔥' : d.dayNum}
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">
                        {d.dayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributing Learning Activities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241A16]">Recent Streak Activity</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {streakData?.contributing_lessons_count ?? 0} lessons · {streakData?.contributing_quizzes_count ?? 0} quizzes
                  </span>
                </div>

                {streakData?.recent_activities?.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {streakData.recent_activities.map((act) => {
                      const Icon =
                        act.activity_type === 'QUIZ'
                          ? ClipboardCheck
                          : act.activity_type === 'GAME'
                            ? Gamepad2
                            : BookOpen
                      const dateStr = new Date(act.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })

                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-md border-[1.5px] border-[rgba(36,26,22,0.15)] bg-white hover:border-[#241A16] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-[4px] bg-[#FFF2E6] text-[#F16524] border border-[#241A16] shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="font-bold text-[#241A16] truncate">{act.title}</p>
                              <p className="text-[10px] font-mono text-neutral-500 truncate">
                                {act.course_title || act.activity_type} · {dateStr}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-mono font-bold text-[#F16524] bg-[#F16524]/10 border border-[#241A16] px-1.5 py-0.5 rounded-[4px]">
                            +{act.xp_earned} XP
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-md border border-dashed border-[rgba(36,26,22,0.2)] text-center text-xs text-neutral-500">
                    No learning activity logged in the past 14 days. Complete a lesson or quiz today to start!
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="pt-3.5 border-t border-[rgba(36,26,22,0.15)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ks-neo-btn-secondary px-4 py-2 text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/student/learning')
            }}
            className="ks-neo-btn-primary px-4 py-2 text-xs"
          >
            <span>Continue Learning</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
