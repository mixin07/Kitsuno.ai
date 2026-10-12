import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Type,
  Clock,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  ChevronRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from 'lucide-react'
import gameService from '../../../services/gameService'

export default function WordScrambleGame() {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null

  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [error, setError] = useState(null)

  // Game state
  const [words, setWords] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'finished'
  const [scrambledAnswers, setScrambledAnswers] = useState([])
  const [elapsedTime, setElapsedTime] = useState(0)

  // Results
  const [submitting, setSubmitting] = useState(false)
  const [resultData, setResultData] = useState(null)

  const timerRef = useRef(null)
  const inputRef = useRef(null)

  const fetchGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gameService.startGame('word-scramble', { courseId })
      setGameData(data)
      setSessionToken(data.session_token)
      setWords(data.content?.words || [])
      setCurrentIdx(0)
      setUserInput('')
      setShowHint(false)
      setScrambledAnswers([])
      setElapsedTime(0)
      setGameState('ready')
      setResultData(null)
    } catch (err) {
      console.error('Failed to load Word Scramble:', err)
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to initialize Word Scramble session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      try {
        setError(null)
        const data = await gameService.startGame('word-scramble', { courseId })
        if (!isMounted) return
        setGameData(data)
        setSessionToken(data.session_token)
        setWords(data.content?.words || [])
        setCurrentIdx(0)
        setUserInput('')
        setShowHint(false)
        setScrambledAnswers([])
        setElapsedTime(0)
        setGameState('ready')
        setResultData(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load Word Scramble:', err)
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Unable to initialize Word Scramble session.')
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

  // Focus input when moving to a new word in playing state
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [gameState, currentIdx])

  const handleStart = () => {
    setGameState('playing')
  }

  const handleNextWord = (e) => {
    if (e) e.preventDefault()
    if (!userInput.trim()) return

    const currentWord = words[currentIdx]
    const updatedAnswers = [
      ...scrambledAnswers,
      {
        term_id: currentWord.id,
        answer: userInput.trim().toUpperCase(),
      },
    ]
    setScrambledAnswers(updatedAnswers)
    setUserInput('')
    setShowHint(false)

    if (currentIdx + 1 < words.length) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      finishGame(updatedAnswers)
    }
  }

  const finishGame = async (finalAnswers) => {
    setGameState('finished')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      setSubmitting(true)
      const res = await gameService.completeGame('word-scramble', {
        sessionToken,
        courseId,
        timeSpentSeconds: elapsedTime,
        scrambledAnswers: finalAnswers,
      })
      setResultData(res)
    } catch (err) {
      console.error('Failed to submit Word Scramble result:', err)
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
      <div className="space-y-5 md:space-y-6 w-full max-w-2xl mx-auto pb-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
        <p className="ks-muted text-xs">Scrambling engineering terminology...</p>
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

  const currentWord = words[currentIdx]

  return (
    <div className="space-y-5 md:space-y-6 w-full max-w-2xl mx-auto pb-8">
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
              MINI-GAME · WORD SCRAMBLE
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">🔤</span>
              <h1 className="ks-page-title text-2xl sm:text-3xl text-[#241A16]">Word Scramble</h1>
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
              <span>
                Word {currentIdx + 1} / {words.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] flex items-center justify-center text-[#F16524] shadow-[2px_2px_0_#241A16]">
            <Type className="h-7 w-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">Decipher Technical Terms</h2>
            <p className="ks-muted text-xs sm:text-sm leading-relaxed">
              Unscramble {words.length} core programming keywords and concepts from your enrolled curriculum.
              Smart hints are available if you get stuck!
            </p>
          </div>

          <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FFFAF4] p-4 max-w-sm mx-auto text-left space-y-2 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              Instructions
            </p>
            <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
              <li>Examine the scrambled letters and hint</li>
              <li>Type the unscrambled term in the input box</li>
              <li>Press Enter to lock in and advance to the next word</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="ks-neo-btn-primary px-6 py-2.5 text-xs sm:text-sm"
          >
            Start Word Scramble
          </button>
        </div>
      )}

      {/* STATE 2: Playing Screen */}
      {gameState === 'playing' && currentWord && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
            <div
              className="bg-[#F16524] h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
            />
          </div>

          <div className="ks-neo-card p-6 space-y-6 text-center">
            <div className="space-y-1">
              <span className="ks-eyebrow block">
                Category: {currentWord.category || 'Web Development'}
              </span>
              <p className="ks-muted text-xs">
                Unscramble this {currentWord.length}-letter term
              </p>
            </div>

            {/* Scrambled Letters Display */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-3">
              {currentWord.scrambled.split('').map((letter, idx) => (
                <div
                  key={idx}
                  className="w-11 h-12 rounded-[6px] border-[1.5px] border-[#241A16] bg-white flex items-center justify-center text-xl font-bold font-mono text-[#241A16] shadow-[2px_2px_0_#241A16] select-none"
                >
                  {letter}
                </div>
              ))}
            </div>

            {/* Hint Box */}
            <div className="max-w-md mx-auto">
              {showHint ? (
                <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFFAF4] p-3 text-xs text-[#241A16] flex items-start gap-2 text-left shadow-[1.5px_1.5px_0_#241A16]">
                  <Lightbulb className="h-4 w-4 shrink-0 text-[#F16524] mt-0.5" />
                  <p>{currentWord.hint}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#F16524] font-bold hover:underline cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Need a hint?</span>
                </button>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleNextWord} className="max-w-sm mx-auto space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                placeholder="TYPE YOUR ANSWER..."
                maxLength={currentWord.length + 5}
                className="w-full px-4 py-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white focus:bg-white focus:border-[#F16524] focus:outline-none text-center font-mono font-bold text-base uppercase tracking-wider text-[#241A16] shadow-[1.5px_1.5px_0_#241A16]"
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="ks-neo-btn-primary w-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{currentIdx + 1 === words.length ? 'Submit All Words' : 'Lock In & Next Word'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STATE 3: Results */}
      {gameState === 'finished' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent mx-auto" />
              <p className="ks-muted text-xs">Verifying technical terminology &amp; awarding XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[2px_2px_0_#241A16]">
                <Trophy className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">Vocabulary Deciphered!</h2>
                <p className="ks-muted text-xs">
                  Your vocabulary answers were checked against server dictionaries.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Score</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">{resultData.score}</p>
                </div>
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Accuracy</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#F16524] mt-0.5">{resultData.accuracy}%</p>
                </div>
                <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white p-3 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Words Solved</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">
                    {resultData.correct_count} / {resultData.questions_count}
                  </p>
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
              <button
                onClick={fetchGame}
                className="ks-neo-btn-primary px-4 py-2 text-xs"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
