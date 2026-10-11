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
      <div className="space-y-5 md:space-y-6 w-full max-w-4xl mx-auto pb-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
        <p className="ks-muted text-xs">Shuffling concepts &amp; definitions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5 md:space-y-6 w-full max-w-lg mx-auto pb-8 text-center pt-8">
        <div className="ks-neo-card p-6 text-center space-y-3">
          <p className="font-semibold text-xs text-rose-700">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchGame}
              className="ks-neo-btn-primary px-4 py-2 text-xs"
            >
              Retry
            </button>
            <Link
              to="/student/play"
              className="ks-neo-btn-secondary px-4 py-2 text-xs"
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
    <div className="space-y-5 md:space-y-6 w-full max-w-4xl mx-auto pb-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b-[1.5px] border-[#241A16]">
        <div className="flex items-center gap-3">
          <Link
            to="/student/play"
            className="ks-neo-btn-secondary p-2 inline-flex items-center justify-center"
            title="Back to Play & Learn"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="ks-eyebrow block">
              MINI-GAME · MEMORY MATRIX
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">🧠</span>
              <h1 className="ks-page-title text-2xl sm:text-3xl text-[#241A16]">Memory Match</h1>
              {gameData?.content?.topic && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1px_1px_0_#241A16]">
                  {gameData.content.topic}
                </span>
              )}
            </div>
            {gameData?.course_title && (
              <p className="ks-muted text-xs flex items-center gap-1 mt-0.5">
                <BookOpen className="h-3 w-3 text-[#F16524]" />
                <span>{gameData.course_title}</span>
              </p>
            )}
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-2.5 text-xs font-mono font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16]">
              <Clock className="h-3.5 w-3.5 text-[#F16524]" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-neutral-600 shadow-[1.5px_1.5px_0_#241A16]">
              <span>{moves} moves</span>
            </div>
            <div className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1.5px_1.5px_0_#241A16] font-bold">
              <span>
                {matchedPairs.size} / {totalPairs} Pairs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] flex items-center justify-center text-[#F16524] shadow-[2px_2px_0_#241A16]">
            <Layers className="h-7 w-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">Test Your Technical Memory</h2>
            <p className="ks-muted text-xs sm:text-sm leading-relaxed">
              Find and match 6 pairs of web dev concepts with their exact technical definitions across a 12-card grid.
              Clear the board in minimum moves for highest rewards!
            </p>
          </div>

          <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FFFAF4] p-4 max-w-sm mx-auto text-left space-y-2 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              Instructions
            </p>
            <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
              <li>Click any card to flip and reveal its content</li>
              <li>Pair technical terms with their precise definitions</li>
              <li>Matched pairs stay confirmed; mismatches flip back</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="ks-neo-btn-primary px-6 py-2.5 text-xs sm:text-sm"
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
                  className={`h-28 sm:h-32 p-3 rounded-[6px] border-[1.5px] text-xs sm:text-sm font-medium transition-all flex items-center justify-center text-center select-none ${
                    isMatched
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-none'
                      : isFlipped
                      ? 'border-[#241A16] bg-[#FFF2E6] text-[#241A16] shadow-[2px_2px_0_#241A16]'
                      : 'border-[#241A16] bg-white hover:bg-[#FAF8F5] text-transparent shadow-[2px_2px_0_#241A16] cursor-pointer'
                  }`}
                >
                  {isMatched || isFlipped ? (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-white border border-[#241A16] text-[#241A16] inline-block">
                        {card.type === 'concept' ? 'Term' : 'Definition'}
                      </span>
                      <p className="line-clamp-3 text-xs leading-snug font-normal text-[#241A16]">{card.text}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-400">
                      <Layers className="h-5 w-5 opacity-60 text-[#241A16]" />
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#241A16] font-bold">Kitsuno</span>
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
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent mx-auto" />
              <p className="ks-muted text-xs">Verifying match results &amp; recording XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[2px_2px_0_#241A16]">
                <Trophy className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">Board Cleared!</h2>
                <p className="ks-muted text-xs">
                  All technical concepts matched in {moves} moves and {formatTime(elapsedTime)}.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Score</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">{resultData.score}</p>
                </div>
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Moves</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#F16524] mt-0.5">{moves}</p>
                </div>
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Time</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">{formatTime(elapsedTime)}</p>
                </div>
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">XP Earned</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-emerald-700 mt-0.5">+{resultData.xp_awarded} XP</p>
                </div>
              </div>

              {resultData.is_new_high_score && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] text-xs font-mono font-bold shadow-[1.5px_1.5px_0_#241A16]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F16524]" />
                  <span>New Personal High Score!</span>
                </div>
              )}

              {resultData.unlocked_achievements?.length > 0 && (
                <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] p-3 max-w-sm mx-auto text-xs text-[#241A16] space-y-1 shadow-[1.5px_1.5px_0_#241A16]">
                  <p className="font-bold flex items-center justify-center gap-1 text-[#F16524]">
                    <Award className="h-4 w-4" />
                    <span>Achievement Unlocked!</span>
                  </p>
                  <p className="font-mono text-[11px]">{resultData.unlocked_achievements.join(', ')}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={fetchGame}
                  className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Play Again</span>
                </button>
                <Link
                  to="/student/play"
                  className="ks-neo-btn-secondary px-4 py-2 text-xs"
                >
                  Back to Hub
                </Link>
              </div>
            </>
          ) : (
            <div className="py-6 space-y-3">
              <p className="text-xs text-rose-600">Failed to complete session.</p>
              <button onClick={fetchGame} className="ks-neo-btn-primary px-4 py-2 text-xs">
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
