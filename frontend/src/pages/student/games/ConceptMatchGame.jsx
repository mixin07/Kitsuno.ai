import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Puzzle, Clock, ArrowLeft, RotateCcw, Trophy, Award, CheckCircle2 } from 'lucide-react'
import gameService from '../../../services/gameService'

export default function ConceptMatchGame() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [error, setError] = useState(null)

  // Game state
  const [terms, setTerms] = useState([])
  const [definitions, setDefinitions] = useState([])
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [selectedDef, setSelectedDef] = useState(null)
  const [matchedPairs, setMatchedPairs] = useState(new Set())
  const [mismatchPair, setMismatchPair] = useState(null)
  const [moves, setMoves] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gameState, setGameState] = useState('ready') // ready, playing, finished

  // Results
  const [submitting, setSubmitting] = useState(false)
  const [resultData, setResultData] = useState(null)

  const timerRef = useRef(null)

  // Shuffle helper
  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5)

  const fetchGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gameService.getGameDetail('concept-match')
      setGameData(data)
      setSessionToken(data.session_token)

      const pairs = data.content.pairs || []
      setTerms(pairs.map((p) => ({ id: p.id, term: p.term })))
      setDefinitions(shuffle(pairs.map((p) => ({ id: p.id, definition: p.definition }))))
      setMatchedPairs(new Set())
      setSelectedTerm(null)
      setSelectedDef(null)
      setMismatchPair(null)
      setMoves(0)
      setElapsedTime(0)
      setGameState('ready')
      setResultData(null)
    } catch (err) {
      console.error('Failed to load Concept Match:', err)
      setError(err?.response?.data?.detail || 'Failed to initialize game.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGame()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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

  // Handle Term Click
  const handleTermClick = (item) => {
    if (matchedPairs.has(item.id) || gameState !== 'playing') return
    setSelectedTerm(item.id)

    if (selectedDef) {
      checkMatch(item.id, selectedDef)
    }
  }

  // Handle Definition Click
  const handleDefClick = (item) => {
    if (matchedPairs.has(item.id) || gameState !== 'playing') return
    setSelectedDef(item.id)

    if (selectedTerm) {
      checkMatch(selectedTerm, item.id)
    }
  }

  const checkMatch = (termId, defId) => {
    setMoves((m) => m + 1)

    if (termId === defId) {
      // Correct Match!
      const nextMatched = new Set(matchedPairs)
      nextMatched.add(termId)
      setMatchedPairs(nextMatched)
      setSelectedTerm(null)
      setSelectedDef(null)

      // Check if all matched
      if (nextMatched.size === terms.length) {
        handleFinishGame(nextMatched.size, moves + 1)
      }
    } else {
      // Mismatch
      setMismatchPair({ termId, defId })
      setTimeout(() => {
        setMismatchPair(null)
        setSelectedTerm(null)
        setSelectedDef(null)
      }, 700)
    }
  }

  const handleFinishGame = async (matchedCount, finalMoves) => {
    setGameState('finished')
    if (timerRef.current) clearInterval(timerRef.current)

    // Calculate score: 1000 base - (moves penalty) - (time penalty)
    const base = 1000
    const movePenalty = Math.max(0, (finalMoves - matchedCount) * 40)
    const timePenalty = elapsedTime * 2
    const score = Math.max(200, base - movePenalty - timePenalty)

    try {
      setSubmitting(true)
      const res = await gameService.completeGame('concept-match', {
        score,
        timeSpentSeconds: elapsedTime,
        sessionToken,
      })
      setResultData(res)
    } catch (err) {
      console.error('Failed to submit game result:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm text-[var(--ks-text-muted)]">Assembling concept puzzle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-semibold text-sm">Failed to load game</p>
          <p className="text-xs mt-1 text-rose-700">{error}</p>
          <button
            onClick={fetchGame}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/play"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Play & Learn
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
          Puzzle Mode
        </span>
      </div>

      {gameState === 'ready' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-600 shadow-inner">
            <Puzzle className="h-8 w-8 fill-purple-500/20" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--ks-text)]">
              Concept Match
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)]">
              {gameData.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-center">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Pairs</p>
              <p className="font-semibold text-xs text-[var(--ks-text)]">{terms.length} Concepts</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-center">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Time Target</p>
              <p className="font-semibold text-xs text-[var(--ks-text)]">~2 Minutes</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-center sm:col-span-1 col-span-2">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Reward</p>
              <p className="font-semibold text-xs text-purple-600">+{gameData.xp_reward} XP</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <Puzzle className="h-4 w-4" />
              Begin Matching
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 space-y-6 shadow-sm">
          {/* Top HUD */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--ks-border)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ks-bg-soft)] border border-[var(--ks-border)]">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-mono text-sm font-bold text-[var(--ks-text)]">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ks-bg-soft)] border border-[var(--ks-border)]">
                <span className="text-xs text-[var(--ks-text-subtle)] uppercase font-bold">Moves:</span>
                <span className="font-mono text-sm font-bold text-[var(--ks-text)]">{moves}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ks-text-muted)] font-medium">
                Matched {matchedPairs.size} / {terms.length}
              </span>
              <div className="w-24 bg-[var(--ks-border)] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${(matchedPairs.size / terms.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dual Columns: Terms & Definitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Terms */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] px-1">
                Technical Concepts
              </p>
              <div className="space-y-2">
                {terms.map((item) => {
                  const isMatched = matchedPairs.has(item.id)
                  const isSelected = selectedTerm === item.id
                  const isMismatch = mismatchPair?.termId === item.id

                  let cardStyle = 'border-[var(--ks-border)] bg-[var(--ks-bg-soft)] hover:bg-[var(--ks-surface-hover)] text-[var(--ks-text)] cursor-pointer'

                  if (isMatched) {
                    cardStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 opacity-60 cursor-default'
                  } else if (isMismatch) {
                    cardStyle = 'border-rose-500 bg-rose-500/15 text-rose-800 animate-shake'
                  } else if (isSelected) {
                    cardStyle = 'border-purple-600 bg-purple-500/15 text-purple-900 shadow-sm ring-1 ring-purple-600'
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTermClick(item)}
                      disabled={isMatched}
                      className={`w-full p-3.5 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{item.term}</span>
                      {isMatched && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Definitions */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] px-1">
                Definitions & Explanations
              </p>
              <div className="space-y-2">
                {definitions.map((item) => {
                  const isMatched = matchedPairs.has(item.id)
                  const isSelected = selectedDef === item.id
                  const isMismatch = mismatchPair?.defId === item.id

                  let cardStyle = 'border-[var(--ks-border)] bg-[var(--ks-bg-soft)] hover:bg-[var(--ks-surface-hover)] text-[var(--ks-text)] cursor-pointer'

                  if (isMatched) {
                    cardStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 opacity-60 cursor-default'
                  } else if (isMismatch) {
                    cardStyle = 'border-rose-500 bg-rose-500/15 text-rose-800 animate-shake'
                  } else if (isSelected) {
                    cardStyle = 'border-purple-600 bg-purple-500/15 text-purple-900 shadow-sm ring-1 ring-purple-600'
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleDefClick(item)}
                      disabled={isMatched}
                      className={`w-full p-3.5 rounded-lg border text-left text-xs leading-relaxed transition-all flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{item.definition}</span>
                      {isMatched && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINISHED / RESULTS */}
      {gameState === 'finished' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-600 shadow-inner">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ks-text)]">
              All Concepts Paired!
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)]">
              You successfully connected all core web and software terms with their definitions.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)]">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Total Moves</p>
              <p className="font-mono font-bold text-lg text-[var(--ks-text)]">{moves}</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)]">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Time Elapsed</p>
              <p className="font-mono font-bold text-lg text-purple-600">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)]">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">Score</p>
              <p className="font-mono font-bold text-lg text-[var(--ks-text)]">
                {resultData?.score ?? 800}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)]">
              <p className="text-[10px] uppercase font-bold text-[var(--ks-text-subtle)]">XP Earned</p>
              <p className="font-mono font-bold text-lg text-[var(--ks-orange)]">
                {submitting ? '...' : `+${resultData?.xp_awarded ?? 0} XP`}
              </p>
            </div>
          </div>

          {resultData?.is_new_high_score && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-semibold">
              <Award className="h-4 w-4 text-amber-600" />
              🎉 New High Score! ({resultData.high_score} pts)
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={fetchGame}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-xs font-semibold text-[var(--ks-text)] hover:bg-[var(--ks-surface-hover)] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Play Again
            </button>
            <button
              onClick={() => navigate('/student/play')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-sm"
            >
              Back to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
