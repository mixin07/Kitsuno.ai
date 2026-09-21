import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { getAttemptDetail } from '../../services/quizService.js'
import StateMessage from '../../components/StateMessage.jsx'

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
    <section className="space-y-8">
      {backToLesson ? (
        <Link
          to={backToLesson}
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to lesson
        </Link>
      ) : (
        <Link
          to="/student"
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to My Learning
        </Link>
      )}

      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--ks-text)]">{result.quiz_title}</h1>
            <p className="mt-1 text-sm text-[var(--ks-text-muted)]">
              {passed ? 'Quiz passed' : 'Quiz not passed'} —{' '}
              {result.completed_at ? 'completed' : 'in progress'}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-4xl font-bold tracking-tight ${
                passed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {result.percentage}%
            </p>
            <p className="mt-1 text-sm text-[var(--ks-text-muted)]">
              {result.score} / {result.total_points} points
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
            <p className="mt-1 text-xs text-[var(--ks-text-muted)]">Correct</p>
          </div>
          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] p-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{incorrectCount}</p>
            <p className="mt-1 text-xs text-[var(--ks-text-muted)]">Incorrect</p>
          </div>
          <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--ks-text)]">{result.answers.length}</p>
            <p className="mt-1 text-xs text-[var(--ks-text-muted)]">Total questions</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {result.answers.map((answer, index) => (
          <div
            key={answer.id}
            className={`rounded-xl border p-5 ${
              answer.is_correct
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-rose-500/40 bg-rose-500/5'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-[var(--ks-text)]">
                <span className="text-[var(--ks-text-muted)]">Q{index + 1}.</span> {answer.question_text}
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  answer.is_correct
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'bg-rose-500/15 text-rose-700'
                }`}
              >
                {answer.is_correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--ks-text)]">
              Your answer:{' '}
              <span className="font-medium">{answer.selected_option_text ?? 'Not answered'}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
              +{answer.points_earned} point{answer.points_earned !== 1 && 's'}
            </p>
          </div>
        ))}
      </div>

      {backToLesson && (
        <div>
          <Link
            to={backToLesson}
            className="inline-block rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
          >
            Return to Lesson
          </Link>
        </div>
      )}
    </section>
  )
}