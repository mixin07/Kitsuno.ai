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
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-xs text-[var(--ks-text-muted)]">Scrambling engineering terminology...</p>
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

  const currentWord = words[currentIdx]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
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
              <span className="text-lg">🔤</span>
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--ks-text)]">Word Scramble</h1>
              {gameData?.content?.topic && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                  {gameData.content.topic}
                </span>
              )}
            </div>
            {gameData?.course_title && (
              <p className="text-xs text-[var(--ks-text-muted)] flex items-center gap-1 mt-0.5">
                <BookOpen className="h-3 w-3 text-emerald-500" />
                <span>{gameData.course_title}</span>
              </p>
            )}
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)]">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)]">
              <span>
                Word {currentIdx + 1} / {words.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Type className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-2xl text-[var(--ks-text)]">Decipher Technical Terms</h2>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] leading-relaxed">
              Unscramble {words.length} core programming keywords and concepts from your enrolled curriculum.
              Smart hints are available if you get stuck!
            </p>
          </div>

          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 max-w-sm mx-auto text-left space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
              Instructions
            </p>
            <ul className="text-xs text-[var(--ks-text-muted)] space-y-1.5 list-disc list-inside">
              <li>Examine the scrambled letters and hint</li>
              <li>Type the unscrambled term in the input box</li>
              <li>Press Enter to lock in and advance to the next word</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow"
          >
            Start Word Scramble
          </button>
        </div>
      )}

      {/* STATE 2: Playing Screen */}
      {gameState === 'playing' && currentWord && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="w-full bg-[var(--ks-surface-soft)] rounded-full h-1.5 overflow-hidden border border-[var(--ks-border)]">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
            />
          </div>

          <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 space-y-6 shadow-xs text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                Category: {currentWord.category || 'Web Development'}
              </span>
              <p className="text-xs text-[var(--ks-text-muted)]">
                Unscramble this {currentWord.length}-letter term
              </p>
            </div>

            {/* Scrambled Letters Display */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {currentWord.scrambled.split('').map((letter, idx) => (
                <div
                  key={idx}
                  className="w-11 h-12 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] flex items-center justify-center text-xl font-bold font-mono text-[var(--ks-text)] shadow-xs select-none"
                >
                  {letter}
                </div>
              ))}
            </div>

            {/* Hint Box */}
            <div className="max-w-md mx-auto">
              {showHint ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2 text-left">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>{currentWord.hint}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--ks-orange)] hover:underline"
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
                placeholder="Type your answer here..."
                maxLength={currentWord.length + 5}
                className="w-full px-4 py-3 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] focus:bg-[var(--ks-surface)] focus:border-emerald-500 focus:outline-none text-center font-mono font-bold text-lg uppercase tracking-wider text-[var(--ks-text)]"
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
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
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
              <p className="text-xs text-[var(--ks-text-muted)]">Verifying technical terminology & awarding XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[var(--ks-text)]">Vocabulary Deciphered!</h2>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Your vocabulary answers were checked against server dictionaries.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Score</p>
                  <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{resultData.score}</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Accuracy</p>
                  <p className="text-xl font-mono font-bold text-emerald-600">{resultData.accuracy}%</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Words Solved</p>
                  <p className="text-xl font-mono font-bold text-[var(--ks-text)]">
                    {resultData.correct_count} / {resultData.questions_count}
                  </p>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
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
              <button
                onClick={fetchGame}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
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
