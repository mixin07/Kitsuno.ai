import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Code,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  ChevronRight,
  Terminal,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import gameService from '../../../services/gameService'

export default function CodeChallengeGame() {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null

  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [error, setError] = useState(null)

  // Game state
  const [challenges, setChallenges] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'finished'
  const [challengeSolutions, setChallengeSolutions] = useState([])
  const [elapsedTime, setElapsedTime] = useState(0)

  // Results
  const [submitting, setSubmitting] = useState(false)
  const [resultData, setResultData] = useState(null)

  const timerRef = useRef(null)

  const fetchGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gameService.startGame('code-challenge', { courseId })
      setGameData(data)
      setSessionToken(data.session_token)
      setChallenges(data.content?.challenges || [])
      setCurrentIdx(0)
      setSelectedOption(null)
      setIsAnswered(false)
      setChallengeSolutions([])
      setElapsedTime(0)
      setGameState('ready')
      setResultData(null)
    } catch (err) {
      console.error('Failed to load Code Challenge:', err)
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to initialize Code Challenge session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      try {
        setError(null)
        const data = await gameService.startGame('code-challenge', { courseId })
        if (!isMounted) return
        setGameData(data)
        setSessionToken(data.session_token)
        setChallenges(data.content?.challenges || [])
        setCurrentIdx(0)
        setSelectedOption(null)
        setIsAnswered(false)
        setChallengeSolutions([])
        setElapsedTime(0)
        setGameState('ready')
        setResultData(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load Code Challenge:', err)
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Unable to initialize Code Challenge session.')
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

  const handleOptionClick = (idx) => {
    if (isAnswered || gameState !== 'playing') return

    const challenge = challenges[currentIdx]
    setSelectedOption(idx)
    setIsAnswered(true)

    const updatedSolutions = [
      ...challengeSolutions,
      {
        challenge_id: challenge.id,
        selected_index: idx,
      },
    ]
    setChallengeSolutions(updatedSolutions)
  }

  const handleNextChallenge = () => {
    if (currentIdx + 1 < challenges.length) {
      setCurrentIdx((i) => i + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      handleFinishGame()
    }
  }

  const handleFinishGame = async () => {
    setGameState('finished')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      setSubmitting(true)
      const res = await gameService.completeGame('code-challenge', {
        sessionToken,
        courseId,
        timeSpentSeconds: elapsedTime,
        challengeSolutions,
      })
      setResultData(res)
    } catch (err) {
      console.error('Failed to submit Code Challenge result:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-xs text-[var(--ks-text-muted)]">Analyzing code test cases...</p>
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

  const challenge = challenges[currentIdx]

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
              <span className="text-lg">💻</span>
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--ks-text)]">Code Challenge</h1>
              {gameData?.content?.topic && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-700">
                  {gameData.content.topic}
                </span>
              )}
            </div>
            {gameData?.course_title && (
              <p className="text-xs text-[var(--ks-text-muted)] flex items-center gap-1 mt-0.5">
                <BookOpen className="h-3 w-3 text-purple-500" />
                <span>{gameData.course_title}</span>
              </p>
            )}
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <div className="px-3 py-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)]">
              <span>
                Challenge {currentIdx + 1} / {challenges.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready */}
      {gameState === 'ready' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Code className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-2xl text-[var(--ks-text)]">Debug Real Code Snippets</h2>
            <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] leading-relaxed">
              Analyze realistic broken code snippets, spot runtime/syntax errors, and select the correct production refactor.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 max-w-sm mx-auto text-left space-y-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
              Challenge Details
            </p>
            <ul className="text-xs text-[var(--ks-text-muted)] space-y-1.5 list-disc list-inside">
              <li>{challenges.length} targeted code debugging scenarios</li>
              <li>Inspect syntax errors, closures, and async issues</li>
              <li>Earn up to +{gameData?.xp_reward || 45} verified XP</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all shadow-sm hover:shadow"
          >
            Start Code Challenge
          </button>
        </div>
      )}

      {/* STATE 2: Playing */}
      {gameState === 'playing' && challenge && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="w-full bg-[var(--ks-surface-soft)] rounded-full h-1.5 overflow-hidden border border-[var(--ks-border)]">
            <div
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / challenges.length) * 100}%` }}
            />
          </div>

          <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 space-y-5 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                  Bug #{currentIdx + 1}: {challenge.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--ks-surface-soft)] border border-[var(--ks-border)] text-[var(--ks-text-subtle)]">
                  {challenge.language || 'javascript'}
                </span>
              </div>
              <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                {challenge.bug_description}
              </p>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-xl overflow-hidden border border-[#2b2520] bg-[#1a1614] shadow-inner">
              <div className="px-4 py-2 border-b border-[#2b2520] bg-[#141110] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                  <Terminal className="h-3 w-3" />
                  <span>snippet.{challenge.language === 'css' ? 'css' : 'js'}</span>
                </div>
              </div>
              <pre className="p-4 font-mono text-xs text-stone-200 overflow-x-auto leading-relaxed whitespace-pre">
                <code>{challenge.broken_code}</code>
              </pre>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[var(--ks-text)]">
                Select the correct refactor:
              </p>
              {challenge.options?.map((opt, idx) => {
                const isSelected = selectedOption === idx
                let btnStyle =
                  'border-[var(--ks-border)] bg-[var(--ks-surface-soft)] hover:border-purple-400 hover:bg-[var(--ks-surface)] text-[var(--ks-text)]'

                if (isSelected) {
                  btnStyle = 'border-purple-500 bg-purple-50 text-purple-900 font-semibold'
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    <span className="h-5 w-5 rounded-full border border-[var(--ks-border)] flex items-center justify-center text-[10px] font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Next challenge button */}
            {isAnswered && (
              <div className="pt-4 border-t border-[var(--ks-border)] flex justify-end">
                <button
                  onClick={handleNextChallenge}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all"
                >
                  <span>
                    {currentIdx + 1 === challenges.length ? 'Submit Challenge' : 'Next Scenario'}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: Results */}
      {gameState === 'finished' && (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 text-center space-y-6 shadow-xs">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mx-auto" />
              <p className="text-xs text-[var(--ks-text-muted)]">Verifying test cases & awarding XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[var(--ks-text)]">Challenge Complete!</h2>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  All test cases evaluated against server assertions.
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
                  <p className="text-xl font-mono font-bold text-purple-600">{resultData.accuracy}%</p>
                </div>
                <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">Tests Passed</p>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
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
              <p className="text-xs text-rose-600">Failed to submit challenge results.</p>
              <button
                onClick={fetchGame}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold"
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
