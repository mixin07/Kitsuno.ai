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

  // Segmented XP calculation (10 blocks)
  const totalSegments = 10
  const filledSegments = Math.min(
    totalSegments,
    Math.max(0, Math.round((progressPct / 100) * totalSegments))
  )

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
      {/* 1. EDITORIAL GREETING & CLEAN LABELED EYEBROW */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#F16524]">
            STUDENT DASHBOARD
          </span>
          <span className="w-1.5 h-1.5 bg-[#F16524]" />
        </div>

        <h1 className="ks-page-title text-2xl sm:text-3xl font-serif text-[#241A16] font-normal tracking-tight leading-tight">
          {getGreeting(user?.name)}
        </h1>

        <p className="text-xs text-[var(--ks-text-muted)] font-normal">
          Continue where you left off.
        </p>
      </div>

      {/* 2. NEO-BRUTALIST LEVEL / XP PANEL + BROWSE CATALOG CTA */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Compact Brutalist Level / XP Panel: White surface, 1.5px dark border, 2.5px hard shadow */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-level-modal'))}
          className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white px-3 py-2 shadow-[2.5px_2.5px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[3px_3px_0_#241A16] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer text-left w-56 space-y-1.5"
          title={`Click to inspect Level details (Level ${level}: ${xpIntoLevel} / ${xpRequired} XP)`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#241A16]">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#F16524] fill-[#F16524]" />
              <span className="tracking-wide">LEVEL {level}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#F16524]">
              {progressPct}%
            </span>
          </div>

          {/* 10-Segment Progress Bar */}
          <div className="ks-xp-bar">
            {Array.from({ length: totalSegments }).map((_, i) => (
              <div
                key={i}
                className={`ks-xp-bar-segment ${
                  i < filledSegments ? 'filled' : ''
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-[#241A16] font-medium font-mono leading-none">
            <span>{xpIntoLevel} / {xpRequired} XP</span>
            <span className="text-[#8F3215] font-bold">→ Lv {level + 1}</span>
          </div>
        </button>

        {/* Browse Catalog CTA in Tactile Button */}
        <Link
          to="/courses"
          className="ks-neo-btn-primary"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Browse Catalog →</span>
        </Link>
      </div>
    </div>
  )
}
