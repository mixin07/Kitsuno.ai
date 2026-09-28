import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Zap,
  Clock,
  Flame,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import gameService from '../../../services/gameService'

export default function SpeedRecallGame() {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null

  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [error, setError] = useState(null)

  // Game state
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'finished'
  const [timeLeft, setTimeLeft] = useState(60)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [answersRecord, setAnswersRecord] = useState([])

  // Results
  const [submitting, setSubmitting] = useState(false)
  const [resultData, setResultData] = useState(null)

  const timerRef = useRef(null)

  const fetchGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gameService.startGame('speed-recall', { courseId })
      setGameData(data)
      setSessionToken(data.session_token)
      setQuestions(data.content?.questions || [])
      setTimeLeft(data.content?.duration_seconds || 60)
      setGameState('ready')
      setCurrentIdx(0)
      setScore(0)
      setCombo(0)
      setMaxCombo(0)
      setAnswersRecord([])
      setResultData(null)
    } catch (err) {
      console.error('Failed to load Speed Recall:', err)
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to initialize Speed Recall session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      try {
        setError(null)
        const data = await gameService.startGame('speed-recall', { courseId })
        if (!isMounted) return
        setGameData(data)
        setSessionToken(data.session_token)
        setQuestions(data.content?.questions || [])
        setTimeLeft(data.content?.duration_seconds || 60)
        setGameState('ready')
        setCurrentIdx(0)
        setScore(0)
        setCombo(0)
        setMaxCombo(0)
        setAnswersRecord([])
        setResultData(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load Speed Recall:', err)
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Unable to initialize Speed Recall session.')
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

  const finishGame = async (currentAnswers, currentScore) => {
    setGameState('finished')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      setSubmitting(true)
      const duration = (gameData?.content?.duration_seconds || 60) - timeLeft
      const res = await gameService.completeGame('speed-recall', {
        sessionToken,
        courseId,
        score: currentScore ?? score,
        timeSpentSeconds: duration > 0 ? duration : 60,
        answers: currentAnswers || answersRecord,
      })
      setResultData(res)
    } catch (err) {
      console.error('Failed to submit Speed Recall result:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const finishGameRef = useRef(finishGame)
  useEffect(() => {
    finishGameRef.current = finishGame
  })

  // Timer loop - properly decoupled from render recursion
  useEffect(() => {
    if (gameState !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          finishGameRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  const handleStart = () => {
    setGameState('playing')
  }

  const handleSelectOption = (idx) => {
    if (gameState !== 'playing') return

    const currQ = questions[currentIdx]
    const updatedAnswers = [
      ...answersRecord,
      {
        question_id: currQ.id,
        selected_index: idx,
      },
    ]
    setAnswersRecord(updatedAnswers)

    // Local combo counter
    const nextCombo = combo + 1
    setCombo(nextCombo)
    if (nextCombo > maxCombo) {
      setMaxCombo(nextCombo)
    }
    const multiplier = nextCombo >= 5 ? 3 : nextCombo >= 3 ? 2 : 1
    const newScore = score + 100 * multiplier
    setScore(newScore)

    // Advance to next question or loop back for rapid-fire
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      // Loop or finish
      finishGame(updatedAnswers, newScore)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="text-xs text-[var(--ks-text-muted)]">Loading rapid recall questions...</p>
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

  const currQuestion = questions[currentIdx]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
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
              <span className="text-lg">⚡</span>
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--ks-text)]">Speed Recall</h1>
              {gameData?.content?.topic && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700">
                  {gameData.content.topic}
                </span>
              )}
            </div>
            {gameData?.course_title && (
              <p className="text-xs text-[var(--ks-text-muted)] flex items-center gap-1 mt-0.5">
                <BookOpen className="h-3 w-3 text-amber-500" />
                <span>{gameData.course_title}</span>
              </p>
            )}
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            {combo >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 animate-pulse">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>
                  {combo}x Combo ({combo >= 5 ? '3x' : combo >= 3 ? '2x' : '1x'} pts)
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                timeLeft <= 10
                  ? 'border-rose-400 bg-rose-50 text-rose-600 animate-pulse'
                  : 'border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Zap className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-2xl text-[var(--ks-text)]">Rapid Recall Under Pressure</h2>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] leading-relaxed">
              60 seconds, rapid concept recognition, and combo streak multipliers up to 3x!
              Achieve 100% accuracy to unlock the prestigious Speed Demon badge.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 max-w-sm mx-auto text-left space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
              Multipliers
            </p>
            <ul className="text-xs text-[var(--ks-text-muted)] space-y-1.5 list-disc list-inside">
              <li>1x - 2x streak: 100 pts per answer</li>
              <li>3x - 4x streak: 200 pts (2x multiplier)</li>
              <li>5x+ streak: 300 pts (3x multiplier)</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-all shadow-sm hover:shadow"
          >
            Start 60s Round
          </button>
        </div>
      )}

      {/* STATE 2: Playing Screen */}
      {gameState === 'playing' && currQuestion && (
        <div className="space-y-5">
          {/* Time Remaining Bar */}
          <div className="w-full bg-[var(--ks-surface-soft)] rounded-full h-1.5 overflow-hidden border border-[var(--ks-border)]">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>

          <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 space-y-6 shadow-xs">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Rapid Question {currentIdx + 1}
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-[var(--ks-text)] leading-relaxed">
                {currQuestion.question}
              </h3>
            </div>

            {/* Rapid Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currQuestion.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="text-left p-4 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] hover:border-amber-400 hover:bg-[var(--ks-surface)] text-sm text-[var(--ks-text)] transition-all flex items-center justify-between"
                >
                  <span>{opt}</span>
                  <span className="h-6 w-6 rounded-full border border-[var(--ks-border)] flex items-center justify-center text-xs font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: Results Screen */}
      {gameState === 'finished' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto" />
              <p className="text-xs text-[var(--ks-text-muted)]">Verifying rapid responses & recording XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[var(--ks-text)]">Round Finished!</h2>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Speed round validated with max combo of {maxCombo}x.
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
                  <p className="text-xl font-mono font-bold text-amber-600">{resultData.accuracy}%</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Max Combo</p>
                  <p className="text-xl font-mono font-bold text-[var(--ks-text)]">{maxCombo}x</p>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
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
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
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
