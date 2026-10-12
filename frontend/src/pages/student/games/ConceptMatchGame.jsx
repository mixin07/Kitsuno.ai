import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Puzzle, Clock, ArrowLeft, RotateCcw, Trophy, Award, CheckCircle2, BookOpen } from 'lucide-react'
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
      <div className="space-y-5 md:space-y-6 w-full max-w-4xl mx-auto pb-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
        <p className="ks-muted text-xs">Assembling concept puzzle...</p>
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
              MINI-GAME · PUZZLE MATCH
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">🧩</span>
              <h1 className="ks-page-title text-2xl sm:text-3xl text-[#241A16]">Concept Match</h1>
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
      </div>

      {gameState === 'ready' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] flex items-center justify-center text-[#F16524] shadow-[2px_2px_0_#241A16]">
            <Puzzle className="h-7 w-7" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#241A16]">
              Concept Match
            </h1>
            <p className="ks-muted text-xs sm:text-sm">
              {gameData.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-center shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Pairs</p>
              <p className="ks-metric-number text-lg text-[#241A16] mt-0.5">{terms.length} Concepts</p>
            </div>
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-center shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Target</p>
              <p className="ks-metric-number text-lg text-[#241A16] mt-0.5">~2 Minutes</p>
            </div>
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-center sm:col-span-1 col-span-2 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Reward</p>
              <p className="ks-metric-number text-lg text-[#F16524] mt-0.5">+{gameData.xp_reward} XP</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStart}
              className="ks-neo-btn-primary px-8 py-2.5 text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Puzzle className="h-4 w-4" />
              <span>Begin Matching</span>
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="ks-neo-card p-6 space-y-6">
          {/* Top HUD */}
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(36,26,22,0.15)] flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]">
                <Clock className="h-3.5 w-3.5 text-[#F16524]" />
                <span className="font-mono text-xs font-bold text-[#241A16]">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">Moves:</span>
                <span className="font-mono text-xs font-bold text-[#241A16]">{moves}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-neutral-600">
                Matched {matchedPairs.size} / {terms.length}
              </span>
              <div className="w-24 h-2 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
                <div
                  className="h-full bg-[#F16524] rounded-full transition-all duration-300"
                  style={{ width: `${(matchedPairs.size / terms.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dual Columns: Terms & Definitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Terms */}
            <div className="space-y-2">
              <span className="ks-eyebrow block px-1">
                Technical Concepts
              </span>
              <div className="space-y-2">
                {terms.map((item) => {
                  const isMatched = matchedPairs.has(item.id)
                  const isSelected = selectedTerm === item.id
                  const isMismatch = mismatchPair?.termId === item.id

                  let cardStyle = 'border-[rgba(36,26,22,0.2)] bg-white hover:border-[#241A16] hover:bg-[#FAF8F5] text-[#241A16] cursor-pointer shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]'

                  if (isMatched) {
                    cardStyle = 'border-emerald-600 bg-emerald-50 text-emerald-900 opacity-60 cursor-default'
                  } else if (isMismatch) {
                    cardStyle = 'border-rose-500 bg-rose-50 text-rose-800 animate-shake shadow-[1.5px_1.5px_0_#241A16]'
                  } else if (isSelected) {
                    cardStyle = 'border-[#241A16] bg-[#FFF2E6] text-[#241A16] font-bold shadow-[2px_2px_0_#241A16]'
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTermClick(item)}
                      disabled={isMatched}
                      className={`w-full p-3.5 rounded-[6px] border-[1.5px] text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{item.term}</span>
                      {isMatched && <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Definitions */}
            <div className="space-y-2">
              <span className="ks-eyebrow block px-1">
                Definitions &amp; Explanations
              </span>
              <div className="space-y-2">
                {definitions.map((item) => {
                  const isMatched = matchedPairs.has(item.id)
                  const isSelected = selectedDef === item.id
                  const isMismatch = mismatchPair?.defId === item.id

                  let cardStyle = 'border-[rgba(36,26,22,0.2)] bg-white hover:border-[#241A16] hover:bg-[#FAF8F5] text-[#241A16] cursor-pointer shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]'

                  if (isMatched) {
                    cardStyle = 'border-emerald-600 bg-emerald-50 text-emerald-900 opacity-60 cursor-default'
                  } else if (isMismatch) {
                    cardStyle = 'border-rose-500 bg-rose-50 text-rose-800 animate-shake shadow-[1.5px_1.5px_0_#241A16]'
                  } else if (isSelected) {
                    cardStyle = 'border-[#241A16] bg-[#FFF2E6] text-[#241A16] font-bold shadow-[2px_2px_0_#241A16]'
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleDefClick(item)}
                      disabled={isMatched}
                      className={`w-full p-3.5 rounded-[6px] border-[1.5px] text-left text-xs leading-relaxed transition-all flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{item.definition}</span>
                      {isMatched && <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 ml-2" />}
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
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[2px_2px_0_#241A16]">
            <Trophy className="h-7 w-7" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#241A16]">
              All Concepts Paired!
            </h2>
            <p className="ks-muted text-xs sm:text-sm">
              You successfully connected all core web and software terms with their definitions.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Total Moves</p>
              <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">{moves}</p>
            </div>
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Time Elapsed</p>
              <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">Score</p>
              <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">
                {resultData?.score ?? 800}
              </p>
            </div>
            <div className="p-3 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
              <p className="text-[10px] font-mono font-bold uppercase text-neutral-500">XP Earned</p>
              <p className="ks-metric-number text-xl sm:text-2xl text-emerald-700 mt-0.5">
                {submitting ? '...' : `+${resultData?.xp_awarded ?? 0} XP`}
              </p>
            </div>
          </div>

          {resultData?.is_new_high_score && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] text-[#F16524] text-xs font-mono font-bold shadow-[1.5px_1.5px_0_#241A16]">
              <Award className="h-4 w-4 text-[#F16524]" />
              🎉 New High Score! ({resultData.high_score} pts)
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={fetchGame}
              className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Play Again
            </button>
            <button
              onClick={() => navigate('/student/play')}
              className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              Back to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
