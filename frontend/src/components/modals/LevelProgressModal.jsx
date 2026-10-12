import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, X, CheckCircle2, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { getLevelDetails } from '../../services/headerStatsService.js'

export default function LevelProgressModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [levelData, setLevelData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setIsLoading(true)
    setError('')

    getLevelDetails()
      .then((data) => {
        if (active) setLevelData(data)
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.detail || 'Unable to load level details')
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

  const currentLevel = levelData?.current_level ?? 1
  const totalXp = levelData?.total_xp ?? 0
  const xpIntoLevel = levelData?.xp_into_level ?? 0
  const xpReq = levelData?.xp_required_for_next_level ?? 100
  const xpRemaining = levelData?.xp_remaining_to_next_level ?? 0
  const progressPct = Math.min(100, Math.max(0, Math.round(levelData?.progress_percentage ?? 0)))
  const nextLevel = levelData?.next_level ?? (currentLevel + 1)
  const timeline = levelData?.levels_timeline ?? []

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
        aria-labelledby="level-modal-title"
        className="relative w-full max-w-lg rounded-[8px] border-[1.5px] border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] p-4 sm:p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col text-[#241A16]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b-[1.5px] border-[#241A16]/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FFF2E6] text-[#F16524] border border-[#241A16] shadow-[1px_1px_0_#241A16]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                STUDY RANK &amp; MASTERY
              </span>
              <h2 id="level-modal-title" className="text-xl sm:text-2xl font-serif font-normal text-[#241A16]">
                Level Progress
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
              Loading level progression...
            </div>
          ) : error ? (
            <div className="p-4 rounded-md border border-rose-300 bg-rose-50 text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <>
              {/* Current Standing Card */}
              <div className="rounded-[8px] border-2 border-[#241A16] bg-white p-4 space-y-3 shadow-[3px_3px_0_#241A16]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 tracking-wider">
                      Current Standing
                    </span>
                    <div className="text-2xl font-normal font-serif text-[#241A16] mt-0.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#FFF2E6] text-[#F16524] border border-[#241A16] text-xs font-mono font-bold">
                        Level {currentLevel}
                      </span>
                      <span className="text-sm font-semibold text-neutral-600">
                        {timeline.find((t) => t.is_current)?.title || 'Scholar'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-normal font-serif text-[#F16524]">{totalXp} XP</span>
                    <p className="text-[10px] font-mono text-neutral-400 mt-0.5">Total Lifetime</p>
                  </div>
                </div>

                {/* Progress bar to next level */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-600">
                    <span>Level {currentLevel}</span>
                    <span className="font-bold text-[#241A16]">
                      {xpIntoLevel} / {xpReq} XP ({progressPct}%)
                    </span>
                    <span>Level {nextLevel}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-[#F16524] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 text-right pt-0.5">
                    {xpRemaining} XP remaining to unlock Level {nextLevel}
                  </p>
                </div>
              </div>

              {/* Visual Level Progression Timeline */}
              <div className="rounded-md border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-4 space-y-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                <div className="flex items-center justify-between pb-1 border-b border-[rgba(36,26,22,0.12)]">
                  <span className="text-xs font-bold text-[#241A16]">Level Progression Path</span>
                  <span className="text-[10px] font-mono text-neutral-400">50 · L · (L - 1) formula</span>
                </div>

                <div className="space-y-2">
                  {timeline.map((tier) => {
                    const isPassed = tier.is_unlocked && !tier.is_current
                    const isCurrent = tier.is_current
                    const isLocked = !tier.is_unlocked

                    return (
                      <div
                        key={tier.level}
                        className={`flex items-center justify-between p-2.5 rounded-md border-[1.5px] transition-all text-xs ${
                          isCurrent
                            ? 'bg-[#FFF2E6] border-[#241A16] shadow-[1px_1.5px_0_#241A16]'
                            : isPassed
                              ? 'bg-white border-[rgba(36,26,22,0.2)]'
                              : 'bg-[#FAF8F5] border-[rgba(36,26,22,0.1)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-[4px] font-bold font-mono text-xs border ${
                              isCurrent
                                ? 'bg-[#F16524] text-white border-[#241A16]'
                                : isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border-[#241A16]'
                                  : 'bg-[#FAF8F5] text-neutral-400 border-[rgba(36,26,22,0.2)]'
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : isLocked ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              tier.level
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#241A16]">
                                Level {tier.level}
                              </span>
                              <span className="text-[11px] text-neutral-600">· {tier.title}</span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[#F16524] text-white text-[9px] font-mono font-bold uppercase tracking-wider border border-[#241A16]">
                                  <Sparkles className="h-2.5 w-2.5" /> Current
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400">
                              Requires {tier.xp_threshold} cumulative XP
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isCurrent
                              ? 'text-[#F16524]'
                              : isPassed
                                ? 'text-emerald-700'
                                : 'text-neutral-400'
                          }`}
                        >
                          {isCurrent
                            ? `${progressPct}%`
                            : isPassed
                              ? 'Unlocked'
                              : `${tier.xp_threshold} XP`}
                        </span>
                      </div>
                    )
                  })}
                </div>
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
            <span>Progress to Next Level</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
