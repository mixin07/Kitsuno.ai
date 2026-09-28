import { Link } from 'react-router-dom'
import { Target, Layers, Code, Type, Zap, ArrowRight } from 'lucide-react'

export default function PlayAndLearnPreview() {
  const games = [
    {
      id: 'quiz-rush',
      title: 'Quiz Rush',
      subtitle: 'Curriculum sprint quiz',
      icon: Target,
      color: 'text-rose-600 bg-rose-500/10',
      reward: '+50 XP',
    },
    {
      id: 'memory-match',
      title: 'Memory Match',
      subtitle: 'Flip & pair concept cards',
      icon: Layers,
      color: 'text-sky-600 bg-sky-500/10',
      reward: '+35 XP',
    },
    {
      id: 'code-challenge',
      title: 'Code Challenge',
      subtitle: 'Spot bugs & refactor code',
      icon: Code,
      color: 'text-purple-600 bg-purple-500/10',
      reward: '+45 XP',
    },
    {
      id: 'word-scramble',
      title: 'Word Scramble',
      subtitle: 'Decipher tech vocabulary',
      icon: Type,
      color: 'text-emerald-600 bg-emerald-500/10',
      reward: '+40 XP',
    },
    {
      id: 'speed-recall',
      title: 'Speed Recall',
      subtitle: '60s recall with combos',
      icon: Zap,
      color: 'text-amber-600 bg-amber-500/10',
      reward: '+40 XP',
    },
  ]

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm">🎮</span>
            <h2 className="ks-section-title font-serif text-lg">
              Play &amp; Learn
            </h2>
          </div>
          <p className="text-[11px] text-[var(--ks-text-muted)]">
            Interactive educational games for concept reinforcement
          </p>
        </div>
        <Link
          to="/student/play"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ks-orange)] hover:text-[var(--ks-orange-hover)] transition-colors"
        >
          <span>View All Games</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scroll-smooth -mx-1 px-1">
        {games.map((game) => {
          const Icon = game.icon
          return (
            <Link
              key={game.id}
              to={`/student/play/${game.id}`}
              className="group relative rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3.5 space-y-2.5 hover:border-[var(--ks-orange)]/60 hover:bg-[var(--ks-surface)] transition-all block min-w-[145px] max-w-[165px] shrink-0 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${game.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  {game.reward}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-[var(--ks-text)] group-hover:text-[var(--ks-orange)] transition-colors truncate">
                    {game.title}
                  </h3>
                  <ArrowRight className="h-3 w-3 text-[var(--ks-text-subtle)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </div>
                <p className="text-[10.5px] text-[var(--ks-text-muted)] leading-tight mt-1 line-clamp-1">
                  {game.subtitle}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
