import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Layers,
  Clock,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import gameService from '../../../services/gameService'

export default function MemoryMatchGame() {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null

  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [error, setError] = useState(null)

  // Game state
  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [matchedPairs, setMatchedPairs] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'finished'

  // Results
  const [submitting, setSubmitting] = useState(false)
  const [resultData, setResultData] = useState(null)

  const timerRef = useRef(null)

  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5)

  const fetchGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gameService.startGame('memory-match', { courseId })
      setGameData(data)
      setSessionToken(data.session_token)

      // The server provides 12 cards (6 pairs: concepts and meanings)
      const baseCards = data.content?.cards || []
      setCards(shuffle(baseCards))
      setFlippedIndices([])
      setMatchedPairs(new Set())
      setMoves(0)
      setElapsedTime(0)
      setGameState('ready')
      setResultData(null)
    } catch (err) {
      console.error('Failed to load Memory Match:', err)
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to initialize Memory Match session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      try {
        setError(null)
        const data = await gameService.startGame('memory-match', { courseId })
        if (!isMounted) return
        setGameData(data)
        setSessionToken(data.session_token)

        const baseCards = data.content?.cards || []
        setCards(shuffle(baseCards))
        setFlippedIndices([])
        setMatchedPairs(new Set())
        setMoves(0)
        setElapsedTime(0)
        setGameState('ready')
        setResultData(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load Memory Match:', err)
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Unable to initialize Memory Match session.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    init()
    return () => {
      isMounted = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [courseId])

  // Timer loop
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  const handleStart = () => {
    setGameState('playing')
  }

  const handleCardClick = (idx) => {
    if (
      gameState !== 'playing' ||
      flippedIndices.length >= 2 ||
      flippedIndices.includes(idx) ||
      matchedPairs.has(cards[idx]?.pair_id)
    ) {
      return
    }

    const nextFlipped = [...flippedIndices, idx]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1)
      const [firstIdx, secondIdx] = nextFlipped
      const firstCard = cards[firstIdx]
      const secondCard = cards[secondIdx]

      if (firstCard.pair_id === secondCard.pair_id && firstCard.type !== secondCard.type) {
        // Matched concept with meaning!
        const nextMatched = new Set(matchedPairs)
        nextMatched.add(firstCard.pair_id)
        setMatchedPairs(nextMatched)
        setFlippedIndices([])

        // Check if all pairs are matched
        const totalPairs = gameData?.content?.total_pairs || 6
        if (nextMatched.size >= totalPairs) {
          handleFinishGame(nextMatched)
        }
      } else {
        // Mismatch: flip back after 900ms
        setTimeout(() => {
          setFlippedIndices([])
        }, 900)
      }
    }
  }

  const handleFinishGame = async (finalMatched) => {
    setGameState('finished')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      setSubmitting(true)
      const res = await gameService.completeGame('memory-match', {
        sessionToken,
        courseId,
        timeSpentSeconds: elapsedTime,
        matchedPairs: Array.from(finalMatched),
      })
      setResultData(res)
    } catch (err) {
      console.error('Failed to submit Memory Match result:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainder = secs % 60
    return `${mins}:${remainder.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="text-xs text-[var(--ks-text-muted)]">Shuffling concepts & definitions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 space-y-3">
          <p className="font-semibold text-sm">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchGame}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Retry
            </button>
            <Link
              to="/student/play"
              className="px-4 py-2 rounded-lg border border-rose-300 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50"
            >
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalPairs = gameData?.content?.total_pairs || 6

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--ks-border)]">
        <div className="flex items-center gap-3">
          <Link
            to="/student/play"
            className="p-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] transition-colors"
            title="Back to Play & Learn"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--ks-text)]">Memory Match</h1>
              {gameData?.content?.topic && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-700">
                  {gameData.content.topic}
                </span>
              )}
            </div>
            {gameData?.course_title && (
              <p className="text-xs text-[var(--ks-text-muted)] flex items-center gap-1 mt-0.5">
                <BookOpen className="h-3 w-3 text-sky-500" />
                <span>{gameData.course_title}</span>
              </p>
            )}
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)]">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)]">
              <span>{moves} moves</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-700">
              <span>
                {matchedPairs.size} / {totalPairs} Pairs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600">
            <Layers className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-2xl text-[var(--ks-text)]">Test Your Technical Memory</h2>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] leading-relaxed">
              Find and match 6 pairs of web dev concepts with their exact technical definitions across a 12-card grid.
              Clear the board in minimum moves for highest rewards!
            </p>
          </div>

          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 max-w-sm mx-auto text-left space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
              Instructions
            </p>
            <ul className="text-xs text-[var(--ks-text-muted)] space-y-1.5 list-disc list-inside">
              <li>Click any card to flip and reveal its content</li>
              <li>Pair technical terms (e.g. &lt;article&gt;) with definitions</li>
              <li>Matched pairs remain highlighted; mismatches flip back</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-all shadow-sm hover:shadow"
          >
            Start Memory Match
          </button>
        </div>
      )}

      {/* STATE 2: Playing Grid */}
      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx)
              const isMatched = matchedPairs.has(card.pair_id)

              return (
                <button
                  key={card.card_id || idx}
                  onClick={() => handleCardClick(idx)}
                  disabled={isMatched || isFlipped}
                  className={`h-28 sm:h-32 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all transform flex items-center justify-center text-center select-none ${
                    isMatched
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 scale-95 shadow-none'
                      : isFlipped
                      ? 'border-sky-500 bg-[var(--ks-surface)] text-[var(--ks-text)] shadow-sm'
                      : 'border-[var(--ks-border)] bg-[var(--ks-surface-soft)] hover:border-sky-400 hover:bg-[var(--ks-surface)] text-transparent cursor-pointer'
                  }`}
                >
                  {isMatched || isFlipped ? (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ks-bg-soft)] border border-[var(--ks-border)] text-[var(--ks-text-subtle)]">
                        {card.type === 'concept' ? 'Term' : 'Definition'}
                      </span>
                      <p className="line-clamp-3 text-xs leading-snug">{card.text}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[var(--ks-text-subtle)]">
                      <Layers className="h-5 w-5 opacity-40" />
                      <span className="text-[10px] uppercase font-mono tracking-widest opacity-50">Kitsuno</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* STATE 3: Finished / Results */}
      {gameState === 'finished' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mx-auto" />
              <p className="text-xs text-[var(--ks-text-muted)]">Verifying match results & recording XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[var(--ks-text)]">Board Cleared!</h2>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  All technical concepts matched in {moves} moves and {formatTime(elapsedTime)}.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Score</p>
                  <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{resultData.score}</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Moves</p>
                  <p className="text-xl font-mono font-bold text-sky-600">{moves}</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Time</p>
                  <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{formatTime(elapsedTime)}</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">XP Earned</p>
                  <p className="text-xl font-mono font-bold text-emerald-600">+{resultData.xp_awarded} XP</p>
                </div>
              </div>

              {resultData.is_new_high_score && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>New Personal High Score!</span>
                </div>
              )}

              {resultData.unlocked_achievements?.length > 0 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 max-w-sm mx-auto text-xs text-purple-800 space-y-1">
                  <p className="font-bold flex items-center justify-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>Achievement Unlocked!</span>
                  </p>
                  <p>{resultData.unlocked_achievements.join(', ')}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={fetchGame}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Play Again</span>
                </button>
                <Link
                  to="/student/play"
                  className="px-4 py-2 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)] text-xs font-semibold hover:bg-[var(--ks-surface-soft)] transition-colors"
                >
                  Back to Hub
                </Link>
              </div>
            </>
          ) : (
            <div className="py-6 space-y-3">
              <p className="text-xs text-rose-600">Failed to complete session.</p>
              <button onClick={fetchGame} className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold">
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
