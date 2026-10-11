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
      <div className="space-y-5 md:space-y-6 w-full max-w-3xl mx-auto pb-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
        <p className="ks-muted text-xs">Loading rapid recall questions...</p>
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

  const currQuestion = questions[currentIdx]

  return (
    <div className="space-y-5 md:space-y-6 w-full max-w-3xl mx-auto pb-8">
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
              MINI-GAME · RAPID SPRINT
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">⚡</span>
              <h1 className="ks-page-title text-2xl sm:text-3xl text-[#241A16]">Speed Recall</h1>
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
            {combo >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1.5px_1.5px_0_#241A16]">
                <Flame className="h-3.5 w-3.5 fill-[#F16524] text-[#F16524]" />
                <span>
                  {combo}x Combo ({combo >= 5 ? '3x' : combo >= 3 ? '2x' : '1x'} pts)
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border-[1.5px] text-xs font-mono font-bold ${
                timeLeft <= 10
                  ? 'border-[#241A16] bg-rose-50 text-rose-700 shadow-[1.5px_1.5px_0_#241A16]'
                  : 'border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-[#F16524]" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready Screen */}
      {gameState === 'ready' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] flex items-center justify-center text-[#F16524] shadow-[2px_2px_0_#241A16]">
            <Zap className="h-7 w-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">Rapid Recall Under Pressure</h2>
            <p className="ks-muted text-xs sm:text-sm leading-relaxed">
              60 seconds, rapid concept recognition, and combo streak multipliers up to 3x!
              Achieve high accuracy to maximize XP and boost retention.
            </p>
          </div>

          <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FFFAF4] p-4 max-w-sm mx-auto text-left space-y-2 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              Multipliers
            </p>
            <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
              <li>1x - 2x streak: 100 pts per answer</li>
              <li>3x - 4x streak: 200 pts (2x multiplier)</li>
              <li>5x+ streak: 300 pts (3x multiplier)</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="ks-neo-btn-primary px-6 py-2.5 text-xs sm:text-sm"
          >
            Start 60s Round
          </button>
        </div>
      )}

      {/* STATE 2: Playing Screen */}
      {gameState === 'playing' && currQuestion && (
        <div className="space-y-4">
          {/* Time Remaining Bar */}
          <div className="w-full h-2 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-rose-500' : 'bg-[#F16524]'
              }`}
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>

          <div className="ks-neo-card p-6 space-y-6">
            <div className="space-y-1.5">
              <span className="ks-eyebrow block">
                Rapid Question {currentIdx + 1}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] leading-relaxed">
                {currQuestion.question}
              </h3>
            </div>

            {/* Rapid Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currQuestion.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="text-left p-4 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.2)] bg-white hover:border-[#241A16] hover:bg-[#FAF8F5] text-xs sm:text-sm font-semibold text-[#241A16] transition-all flex items-center justify-between cursor-pointer shadow-[1.5px_1.5px_0_rgba(36,26,22,0.06)] active:translate-y-0.5"
                >
                  <span>{opt}</span>
                  <span className="h-6 w-6 rounded-[4px] border border-[#241A16] flex items-center justify-center text-xs font-mono font-bold bg-[#FAF8F5] ml-2 shrink-0">
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
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent mx-auto" />
              <p className="ks-muted text-xs">Verifying rapid responses &amp; recording XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[2px_2px_0_#241A16]">
                <Trophy className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">Round Finished!</h2>
                <p className="ks-muted text-xs">
                  Speed round validated with max combo of {maxCombo}x.
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
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Max Combo</p>
                  <p className="ks-metric-number text-xl sm:text-2xl text-[#241A16] mt-0.5">{maxCombo}x</p>
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
