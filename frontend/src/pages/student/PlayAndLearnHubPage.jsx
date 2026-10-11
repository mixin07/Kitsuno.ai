import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Puzzle, Bug, Layers, Trophy, Flame, Play, Clock, Sparkles, Target, Brain, Code, Type } from 'lucide-react'
import gameService from '../../services/gameService'
import gamificationService from '../../services/gamificationService'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <div className="flex items-center gap-1.5 ks-eyebrow">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>GAMIFIED LEARNING</span>
          </div>
          <h1 className="mt-1 ks-page-title">
            Play &amp; Learn
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
            Sharpen your web engineering skills with interactive educational games, rapid recall, and code puzzles.
          </p>
        </div>

        {gamification && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#241A16] bg-white text-xs font-mono font-bold text-[#241A16] shadow-[1px_1px_0_#241A16]">
              <Flame className="h-4 w-4 text-[#F16524] fill-[#F16524]" />
              <span>{gamification.streak?.current_streak ?? 0} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#241A16] bg-[#FFF2E6] text-xs font-mono font-bold text-[#F16524] shadow-[1px_1px_0_#241A16]">
              <Sparkles className="h-4 w-4 text-[#F16524]" />
              <span>{gamification.total_xp ?? 0} XP (LV {gamification.current_level ?? 1})</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NeoMetricCard
          label="Available Games"
          value={loading ? 5 : (games.length || 5)}
          description="Educational modules"
          icon={Puzzle}
        />
        <NeoMetricCard
          label="Total Sessions"
          value={totalPlayed}
          description="Mini-game runs"
          icon={Play}
        />
        <NeoMetricCard
          label="Best Combined"
          value={`${totalHighScore} pts`}
          valueColor="text-amber-700"
          description="High score tally"
          icon={Trophy}
          iconColor="text-amber-600"
        />
        <NeoMetricCard
          label="Rewards"
          value="+30 to +45 XP"
          valueColor="text-emerald-700"
          description="Per completion"
          icon={Sparkles}
        />
      </div>

      {/* Games Catalog */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
          <p className="text-xs font-mono text-neutral-500">Loading educational games...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border-[1.5px] border-rose-300 bg-rose-50 p-6 text-rose-800 shadow-[1px_1.5px_0_rgba(185,28,28,0.2)]">
          <p className="font-bold text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="ks-neo-btn-primary mt-3 px-3 py-1.5 text-xs font-bold"
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
                className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] hover:shadow-[5px_5px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all group p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar of card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-md border border-[#241A16] ${game.color} shadow-[1px_1px_0_#241A16]`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="ks-neo-card-title group-hover:text-[#F16524] transition-colors">
                            {game.title}
                          </h2>
                          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[#241A16] bg-[#FAF8F5] text-neutral-600">
                            {game.badge}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5">
                          {game.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-[4px] border border-emerald-300 shadow-[1px_1px_0_rgba(16,185,129,0.3)]">
                      +{game.xp_reward} XP
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                {/* Bottom stats & CTA */}
                <div className="pt-3 border-t border-[rgba(36,26,22,0.12)] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {game.estimated_time}
                    </span>
                    {game.high_score > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <Trophy className="h-3.5 w-3.5 text-amber-600" />
                        Best: {game.high_score}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/student/play/${game.id}`}
                    className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                  >
                    <span>Play Now</span>
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
