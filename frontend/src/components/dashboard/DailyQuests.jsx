import { BookOpen, Award, Sparkles, CheckCircle2, Calendar } from 'lucide-react'

export default function DailyQuests({ gamification }) {
  const backendQuests = gamification?.quests || []

  // Map icons for known quest IDs
  const getQuestIcon = (id) => {
    if (id.includes('lesson')) return BookOpen
    if (id.includes('quiz')) return Award
    if (id.includes('ai')) return Sparkles
    return Calendar
  }

  // Fallback defaults if gamification not loaded yet
  const displayQuests = backendQuests.length > 0 ? backendQuests : [
    { id: 'daily_lesson', title: 'Complete 1 Lesson', period: 'daily', current_count: 0, target_count: 1, xp_reward: 50, completed: false },
    { id: 'daily_quiz', title: 'Finish 1 Quiz', period: 'daily', current_count: 0, target_count: 1, xp_reward: 75, completed: false },
    { id: 'daily_ai', title: 'Ask Kitsuno AI a doubt', period: 'daily', current_count: 0, target_count: 1, xp_reward: 25, completed: false },
    { id: 'weekly_lessons', title: 'Complete 3 Lessons this week', period: 'weekly', current_count: 0, target_count: 3, xp_reward: 200, completed: false },
  ]

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
        <div>
          <h3 className="ks-panel-title text-base font-serif">
            Active Quests
          </h3>
          <p className="text-[11px] text-[var(--ks-text-muted)]">
            Real-time daily & weekly learning goals
          </p>
        </div>
        <span className="text-[10px] font-bold text-[var(--ks-orange)] uppercase tracking-wider bg-[var(--ks-orange)]/10 px-2.5 py-0.5 rounded-full">
          LIVE ENGINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayQuests.map((quest) => {
          const Icon = getQuestIcon(quest.id)
          const isDone = quest.completed || quest.current_count >= quest.target_count
          const pct = Math.round((quest.current_count / quest.target_count) * 100)

          return (
            <div
              key={quest.id}
              className={`p-3 rounded-md border transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-[var(--ks-border)] bg-[var(--ks-surface-soft)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)]'} shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block leading-tight ${isDone ? 'line-through text-[var(--ks-text-muted)]' : 'text-[var(--ks-text)]'}`}>
                      {quest.title}
                    </span>
                    <span className="text-[9.5px] uppercase font-bold text-[var(--ks-text-subtle)] tracking-wider">
                      {quest.period}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-[var(--ks-orange)] bg-[var(--ks-surface)] px-2 py-0.5 rounded border border-[var(--ks-border)]">
                    +{quest.xp_reward} XP
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-[var(--ks-text-subtle)] font-medium">
                      {quest.current_count}/{quest.target_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-[var(--ks-border)] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDone ? 'bg-emerald-600' : 'bg-[var(--ks-orange)]'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
