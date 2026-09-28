import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Puzzle, Bug, Layers, Trophy, Flame, Play, Clock, Sparkles, Target, Brain, Code, Type } from 'lucide-react'
import gameService from '../../services/gameService'
import gamificationService from '../../services/gamificationService'

const ICON_MAP = {
  Target: Target,
  Brain: Brain,
  Code: Code,
  Type: Type,
  Zap: Zap,
  Layers: Layers,
  Puzzle: Puzzle,
  Bug: Bug,
}

export default function PlayAndLearnHubPage() {
  const [games, setGames] = useState([])
  const [gamification, setGamification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [gamesData, gamData] = await Promise.all([
        gameService.getGames(),
        gamificationService.getMyGamification().catch(() => null),
      ])
      setGames(gamesData)
      setGamification(gamData)
    } catch (err) {
      console.error('Failed to load Play & Learn games:', err)
      setError('Unable to load educational games. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalPlayed = games.reduce((acc, g) => acc + (g.total_played || 0), 0)
  const totalHighScore = games.reduce((acc, g) => acc + (g.high_score || 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--ks-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <h1 className="ks-page-title font-serif text-2xl sm:text-3xl text-[var(--ks-text)]">
              Play & Learn
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] mt-1">
            Sharpen your web engineering skills with interactive educational games, rapid recall, and code puzzles.
          </p>
        </div>

        {gamification && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-xs font-semibold text-[var(--ks-text)]">
              <Flame className="h-4 w-4 text-rose-500 fill-rose-500" />
              <span>{gamification.streak?.current_streak ?? 0} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-xs font-semibold text-[var(--ks-text)]">
              <Sparkles className="h-4 w-4 text-[var(--ks-orange)]" />
              <span>{gamification.total_xp ?? 0} XP (LV {gamification.current_level ?? 1})</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Available Games</p>
          <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{loading ? 5 : (games.length || 5)}</p>
        </div>
        <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Total Sessions</p>
          <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{totalPlayed}</p>
        </div>
        <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Combined High Score</p>
          <p className="text-xl font-mono font-bold text-amber-600">{totalHighScore} pts</p>
        </div>
        <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Rewards</p>
          <p className="text-xl font-mono font-bold text-emerald-600">+30 to +45 XP</p>
        </div>
      </div>

      {/* Games Catalog */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ks-orange)] border-t-transparent" />
          <p className="text-xs text-[var(--ks-text-muted)]">Loading educational games...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => {
            const IconComponent = ICON_MAP[game.icon] || Zap

            return (
              <div
                key={game.id}
                className="group rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-4 hover:border-[var(--ks-orange)]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar of card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${game.color} shadow-xs`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-lg font-normal text-[var(--ks-text)] group-hover:text-[var(--ks-orange)] transition-colors">
                            {game.title}
                          </h2>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-[var(--ks-text-subtle)]">
                            {game.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ks-text-muted)] mt-0.5">
                          {game.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      +{game.xp_reward} XP
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                    {game.description}
                  </p>
                </div>

                {/* Bottom stats & CTA */}
                <div className="pt-3 border-t border-[var(--ks-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[var(--ks-text-subtle)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {game.estimated_time}
                    </span>
                    {game.high_score > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Best: {game.high_score}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/student/play/${game.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-orange)] focus-visible:ring-offset-2 active:bg-[var(--ks-orange-deep)] transition-all shadow-xs group-hover:translate-x-0.5"
                  >
                    <span className="text-white font-semibold">Play Now</span>
                    <Play className="h-3 w-3 fill-current text-white shrink-0" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
