import { Rocket, Target, Flame, GraduationCap, Award, Lock, CheckCircle2 } from 'lucide-react'

export default function AchievementsSection({ gamification }) {
  const backendAchievements = gamification?.achievements || []

  const getAchievementIcon = (id) => {
    if (id === 'FIRST_LESSON') return Rocket
    if (id === 'QUIZ_MASTER') return Target
    if (id === 'STREAK_7') return Flame
    if (id === 'COURSE_COMPLETE') return GraduationCap
    return Award
  }

  const unlockedCount = backendAchievements.filter((a) => a.unlocked).length

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--ks-border)]">
        <h3 className="ks-panel-title font-serif text-base">
          Achievements
        </h3>
        <span className="text-[10px] text-[var(--ks-text-subtle)] font-medium">
          {unlockedCount} of {backendAchievements.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {backendAchievements.map((item) => {
          const Icon = getAchievementIcon(item.id)
          const isUnlocked = item.unlocked

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-md border flex items-start gap-2 transition-all ${
                isUnlocked
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-[var(--ks-border)] bg-[var(--ks-surface-soft)] opacity-60'
              }`}
            >
              <div
                className={`p-1.5 rounded ${
                  isUnlocked
                    ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] font-bold'
                    : 'bg-[var(--ks-border)] text-[var(--ks-text-subtle)]'
                } shrink-0`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-xs text-[var(--ks-text)] truncate">
                    {item.title}
                  </h4>
                  {isUnlocked ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="h-3 w-3 text-[var(--ks-text-subtle)] shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[var(--ks-text-muted)] truncate mt-0.5" title={item.description}>
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
