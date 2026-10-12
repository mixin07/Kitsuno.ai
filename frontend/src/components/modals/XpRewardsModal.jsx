import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, X, Calendar, Target, Clock, ArrowRight } from 'lucide-react'
import { getXpSummary } from '../../services/headerStatsService.js'
import NeoMetricCard from '../NeoMetricCard.jsx'

export default function XpRewardsModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [xpData, setXpData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setIsLoading(true)
    setError('')

    getXpSummary()
      .then((data) => {
        if (active) setXpData(data)
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.detail || 'Unable to load XP summary')
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

  const totalXp = xpData?.total_xp ?? 0
  const level = xpData?.current_level ?? 1
  const xpToday = xpData?.xp_earned_today ?? 0
  const xpWeek = xpData?.xp_earned_this_week ?? 0
  const xpRemaining = xpData?.xp_remaining_to_next_level ?? 0
  const xpIntoLevel = xpData?.xp_into_level ?? 0
  const xpReq = xpData?.xp_required_for_next_level ?? 100
  const progressPct = Math.min(100, Math.max(0, Math.round(xpData?.progress_percentage ?? 0)))

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
        aria-labelledby="xp-modal-title"
        className="relative w-full max-w-lg rounded-[8px] border-[1.5px] border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] p-4 sm:p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col text-[#241A16]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b-[1.5px] border-[#241A16]/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FFF2E6] text-[#F16524] border border-[#241A16] shadow-[1px_1px_0_#241A16]">
              <Zap className="h-5 w-5 fill-[#F16524]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                GAMIFICATION &amp; REWARDS
              </span>
              <h2 id="xp-modal-title" className="text-xl sm:text-2xl font-serif font-normal text-[#241A16]">
                XP &amp; Rewards
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
            <div className="py-12 text-center text-xs text-neutral-500">
              <div className="h-6 w-6 border-2 border-[#F16524] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading XP breakdown...
            </div>
          ) : error ? (
            <div className="p-4 rounded-md border border-rose-300 bg-rose-50 text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <>
              {/* Total XP & Next Level Bar */}
              <div className="rounded-md border-[1.5px] border-[#241A16] bg-white p-4 space-y-3 shadow-[1.5px_2px_0_#241A16]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 tracking-wider">
                      Total XP Earned
                    </span>
                    <div className="text-3xl font-normal font-serif text-[#F16524] mt-0.5 flex items-center gap-1.5">
                      <Zap className="h-6 w-6 fill-[#F16524]" />
                      <span>{totalXp} XP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#FFF2E6] text-[#F16524] border border-[#241A16] text-xs font-mono font-bold">
                      Level {level}
                    </span>
                    <p className="text-[10px] font-mono text-neutral-500 mt-1">
                      {xpRemaining} XP to Lv {level + 1}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-600">
                    <span>Level {level}</span>
                    <span className="font-bold text-[#241A16]">
                      {xpIntoLevel} / {xpReq} XP ({progressPct}%)
                    </span>
                    <span>Level {level + 1}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-[#F16524] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Time Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <NeoMetricCard
                  label="Today"
                  value={`+${xpToday}`}
                  icon={Clock}
                  hint="XP earned"
                />
                <NeoMetricCard
                  label="This Week"
                  value={`+${xpWeek}`}
                  icon={Calendar}
                  hint="XP earned"
                />
                <NeoMetricCard
                  label="Remaining"
                  value={xpRemaining}
                  icon={Target}
                  iconColor="text-[#F16524]"
                  valueColor="text-[#F16524]"
                  hint={`to Level ${level + 1}`}
                />
              </div>

              {/* Recent XP History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241A16]">Recent XP Activity</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {xpData?.recent_history?.length || 0} entries
                  </span>
                </div>

                {xpData?.recent_history?.length > 0 ? (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                    {xpData.recent_history.map((log) => {
                      const dateStr = new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-md border-[1.5px] border-[rgba(36,26,22,0.15)] bg-white hover:border-[#241A16] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#FFF2E6] text-[#F16524] border border-[#241A16] font-bold font-mono text-xs shrink-0">
                              +{log.xp_earned}
                            </span>
                            <div className="min-w-0 truncate">
                              <p className="font-bold text-[#241A16] truncate">{log.description}</p>
                              <p className="text-[10px] font-mono text-neutral-500 truncate">{dateStr}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-neutral-600 bg-[#FAF8F5] border border-[rgba(36,26,22,0.2)] px-1.5 py-0.5 rounded-[4px] uppercase">
                            {log.event_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-md border border-dashed border-[rgba(36,26,22,0.2)] text-center text-xs text-neutral-500">
                    No XP activity logged yet. Complete lessons or quizzes to earn XP!
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
            <span>Earn More XP</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
