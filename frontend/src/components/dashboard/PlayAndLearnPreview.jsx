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
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full">
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b-[1.5px] border-[#241A16]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                CONCEPT REINFORCEMENT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base">🎮</span>
              <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
                Play &amp; Learn
              </h3>
            </div>
          </div>
          <Link
            to="/student/play"
            className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>All Games</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="mt-2.5 text-xs text-[var(--ks-text-muted)] leading-relaxed font-normal">
          Reinforce web development concepts through rapid quiz sprints, memory card pairs, and code syntax challenges.
        </p>
      </div>

      <div className="space-y-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8F3215] block">
          MINIGAME CHALLENGES
        </span>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scroll-smooth -mx-1 px-1">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <Link
                key={game.id}
                to={`/student/play/${game.id}`}
                className="p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all space-y-1.5 block min-w-[130px] max-w-[150px] shrink-0"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-[4px] border-[1.5px] border-[#241A16] ${game.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[9.5px] font-bold text-[#241A16] bg-[#FFF2E6] px-1.5 py-0.5 rounded-[4px] border border-[#241A16]/30">
                    {game.reward}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-[#241A16] line-clamp-1">
                    {game.title}
                  </h4>
                  <p className="text-[10px] text-[var(--ks-text-muted)] mt-0.5 line-clamp-1 font-normal">
                    {game.subtitle}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
