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
      <div className="space-y-5 md:space-y-6 w-full max-w-3xl mx-auto pb-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent" />
        <p className="ks-muted text-xs">Analyzing code test cases...</p>
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

  const challenge = challenges[currentIdx]

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
              MINI-GAME · CODE DEBUGGING
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">💻</span>
              <h1 className="ks-page-title text-2xl sm:text-3xl text-[#241A16]">Code Challenge</h1>
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
            <div className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16]">
              <span>
                Challenge {currentIdx + 1} / {challenges.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: Ready */}
      {gameState === 'ready' && (
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-[8px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] flex items-center justify-center text-[#F16524] shadow-[2px_2px_0_#241A16]">
            <Code className="h-7 w-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">Debug Real Code Snippets</h2>
            <p className="ks-muted text-xs sm:text-sm leading-relaxed">
              Analyze realistic broken code snippets, spot runtime/syntax errors, and select the correct production refactor.
            </p>
          </div>

          <div className="rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FFFAF4] p-4 max-w-sm mx-auto text-left space-y-2 shadow-[1px_1.5px_0_rgba(36,26,22,0.06)]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              Challenge Details
            </p>
            <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
              <li>{challenges.length} targeted code debugging scenarios</li>
              <li>Inspect syntax errors, closures, and async issues</li>
              <li>Earn up to +{gameData?.xp_reward || 45} verified XP</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="ks-neo-btn-primary px-6 py-2.5 text-xs sm:text-sm"
          >
            Start Code Challenge
          </button>
        </div>
      )}

      {/* STATE 2: Playing */}
      {gameState === 'playing' && challenge && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[#FAF8F5] border-[1.5px] border-[#241A16] overflow-hidden p-0.5">
            <div
              className="bg-[#F16524] h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / challenges.length) * 100}%` }}
            />
          </div>

          <div className="ks-neo-card p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="ks-eyebrow block">
                  Bug #{currentIdx + 1}: {challenge.title}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[4px] bg-[#FAF8F5] border border-[#241A16] text-[#241A16]">
                  {challenge.language || 'javascript'}
                </span>
              </div>
              <p className="ks-muted text-xs leading-relaxed">
                {challenge.bug_description}
              </p>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-[8px] overflow-hidden border-[1.5px] border-[#241A16] bg-[#1a1614] shadow-[2px_2px_0_#241A16]">
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
              <p className="text-xs font-bold text-[#241A16]">
                Select the correct refactor:
              </p>
              {challenge.options?.map((opt, idx) => {
                const isSelected = selectedOption === idx

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 rounded-[6px] border-[1.5px] text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#241A16] bg-[#FFF2E6] text-[#241A16] font-bold shadow-[2px_2px_0_#241A16]'
                        : 'border-[rgba(36,26,22,0.2)] bg-white text-[#241A16] hover:border-[#241A16] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="h-5 w-5 rounded-[4px] border border-[#241A16] flex items-center justify-center text-[10px] font-mono font-bold bg-[#FAF8F5] shrink-0 ml-2">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Next challenge button */}
            {isAnswered && (
              <div className="pt-4 border-t border-[rgba(36,26,22,0.15)] flex justify-end">
                <button
                  onClick={handleNextChallenge}
                  className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
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
        <div className="ks-neo-card p-6 sm:p-8 text-center space-y-6">
          {submitting ? (
            <div className="py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F16524] border-t-transparent mx-auto" />
              <p className="ks-muted text-xs">Verifying test cases &amp; awarding XP...</p>
            </div>
          ) : resultData ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[2px_2px_0_#241A16]">
                <Trophy className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">Challenge Complete!</h2>
                <p className="ks-muted text-xs">
                  All test cases evaluated against server assertions.
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
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Tests Passed</p>
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
              <p className="text-xs text-rose-600">Failed to submit challenge results.</p>
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
