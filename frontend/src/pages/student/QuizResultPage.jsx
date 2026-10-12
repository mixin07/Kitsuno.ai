import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../services/api.js'
import { getAttemptDetail } from '../../services/quizService.js'
import StateMessage from '../../components/StateMessage.jsx'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

export default function QuizResultPage() {
  const { attemptId } = useParams()
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('courseId')
  const lessonId = searchParams.get('lessonId')

  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getAttemptDetail(attemptId)
        if (!active) return
        setResult(data)
      } catch (err) {
        if (!active) return
        setError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [attemptId])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading results..." />
  }

  if (error && !result) {
    return (
      <StateMessage variant="error" title="Result not available">
        {error}
      </StateMessage>
    )
  }

  const correctCount = result.answers.filter((answer) => answer.is_correct).length
  const incorrectCount = result.answers.length - correctCount
  const passThreshold = 60
  const passed = result.percentage >= passThreshold
  const backToLesson = courseId && lessonId ? `/courses/${courseId}/lessons/${lessonId}` : null

  return (
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {backToLesson ? (
        <Link
          to={backToLesson}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#F16524] hover:text-[#241A16] transition-colors"
        >
          ← Back to lesson
        </Link>
      ) : (
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#F16524] hover:text-[#241A16] transition-colors"
        >
          ← Back to My Learning
        </Link>
      )}

      {/* Summary Score Card */}
      <div className="ks-neo-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="ks-page-eyebrow">QUIZ EVALUATION</span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>
            <h1 className="ks-page-title mt-1">{result.quiz_title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-[4px] border border-[#241A16] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {passed ? 'PASSED (≥ 60%)' : 'NEEDS PRACTICE'}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                • {result.completed_at ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`ks-metric-number text-4xl sm:text-5xl font-normal tracking-tight ${
                passed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.percentage}%
            </p>
            <p className="mt-1 text-xs font-mono text-neutral-500">
              {result.score} / {result.total_points} points
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <NeoMetricCard
            label="Correct"
            value={correctCount}
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            valueColor="text-emerald-700"
            hint="Accurate answers"
          />
          <NeoMetricCard
            label="Incorrect"
            value={incorrectCount}
            icon={XCircle}
            iconColor="text-rose-700"
            valueColor="text-rose-700"
            hint="Missed answers"
          />
          <NeoMetricCard
            label="Total Questions"
            value={result.answers.length}
            icon={HelpCircle}
            valueColor="text-[#241A16]"
            hint="Quiz length"
          />
        </div>
      </div>

      {/* Answer Breakdown */}
      <div className="space-y-3">
        <h2 className="ks-section-title">Question Review</h2>
        {result.answers.map((answer, index) => (
          <div
            key={answer.id}
            className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white p-5 shadow-[2px_2px_0_#241A16] space-y-2"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="ks-card-title text-sm sm:text-base text-[#241A16]">
                <span className="text-neutral-400 font-mono text-xs mr-1.5">Q{index + 1}.</span> {answer.question_text}
              </p>
              <span
                className={`shrink-0 rounded-[4px] border border-[#241A16] px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  answer.is_correct
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {answer.is_correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p className="text-xs text-neutral-700">
              Your answer:{' '}
              <span className="font-semibold text-[#241A16]">{answer.selected_option_text ?? 'Not answered'}</span>
            </p>
            {!answer.is_correct && answer.correct_option_text && (
              <p className="text-xs font-medium text-emerald-700">
                Correct answer: <span className="font-bold">{answer.correct_option_text}</span>
              </p>
            )}
            <p className="pt-1 text-[11px] font-mono text-neutral-500 border-t border-[rgba(36,26,22,0.1)]">
              +{answer.points_earned} point{answer.points_earned !== 1 && 's'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {backToLesson && (
          <Link
            to={backToLesson}
            className="ks-neo-btn-primary px-5 py-2.5 text-xs"
          >
            Return to Lesson
          </Link>
        )}
        {result.quiz_id && (
          <Link
            to={`/student/quiz/${result.quiz_id}?courseId=${courseId || ''}&lessonId=${lessonId || ''}`}
            className="ks-neo-btn-secondary px-5 py-2.5 text-xs"
          >
            Retake Quiz
          </Link>
        )}
      </div>
    </div>
  )
}