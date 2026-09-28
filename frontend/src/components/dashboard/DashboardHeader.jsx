import { Link } from 'react-router-dom'
import { BookOpen, Zap } from 'lucide-react'

function getGreeting(name) {
  const hour = new Date().getHours()
  let prefix = 'Good morning'
  if (hour >= 12 && hour < 17) prefix = 'Good afternoon'
  else if (hour >= 17) prefix = 'Good evening'
  return `${prefix}, ${name || 'Learner'}`
}

export default function DashboardHeader({ user, gamification }) {
  const levelInfo = gamification?.level_info
  const level = levelInfo?.current_level ?? 1
  const xpIntoLevel = levelInfo?.xp_into_level ?? 0
  const xpRequired = levelInfo?.xp_required_for_next_level ?? 100
  const progressPct = Math.min(100, Math.max(0, Math.round(levelInfo?.progress_percentage ?? 0)))

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[var(--ks-border)]">
      <div>
        <div className="mb-1">
          <span className="ks-eyebrow">STUDENT DASHBOARD</span>
        </div>
        <h1 className="ks-page-title text-2xl md:text-3xl font-serif">
          {getGreeting(user?.name)}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-[var(--ks-text-muted)] max-w-xl">
          Continue where you left off.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Level & Next-Level XP Progress */}
        <div
          className="inline-flex items-center gap-2 sm:gap-2.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs shadow-2xs"
          title={`Level ${level}: ${xpIntoLevel} / ${xpRequired} XP to Level ${level + 1}`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-[var(--ks-text)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[rgba(241,101,36,0.12)] text-[var(--ks-orange)]">
              <Zap className="h-3.5 w-3.5 fill-[var(--ks-orange)]" />
            </span>
            <span>Level {level}</span>
          </div>

          <span className="text-[var(--ks-border)]" aria-hidden="true">|</span>

          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[var(--ks-surface-soft)] border border-[var(--ks-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--ks-orange)] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--ks-text-muted)] whitespace-nowrap">
              {xpIntoLevel}/{xpRequired} XP to Lv {level + 1}
            </span>
          </div>
        </div>

        {/* Browse Catalog CTA */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ks-orange)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#E0520D] shadow-2xs"
        >
          <BookOpen className="h-3.5 w-3.5 text-white" />
          <span>Browse Catalog →</span>
        </Link>
      </div>
    </div>
  )
}
