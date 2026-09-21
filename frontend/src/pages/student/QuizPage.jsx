import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { getQuiz, startQuizAttempt, submitQuizAttempt } from '../../services/quizService.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function QuizPage() {
  const { quizId } = useParams()
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('courseId')
  const lessonId = searchParams.get('lessonId')
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getQuiz(quizId)
        if (!active) return
        setQuiz(data)
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
  }, [quizId])

  async function handleStart() {
    setIsStarting(true)
    setError('')
    try {
      const result = await startQuizAttempt(quizId)
      setAttempt(result)
      setAnswers({})
      setCurrentStep(0)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsStarting(false)
    }
  }

  function handleSelect(questionId, optionId) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function handleOptionKeyDown(event, questionId, optionId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect(questionId, optionId)
    }
  }

  async function handleSubmit() {
    setShowConfirm(false)
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const payload = quiz.questions.map((q) => ({
        question_id: q.id,
        selected_option_id: answers[q.id] ?? null,
      }))
      const result = await submitQuizAttempt(attempt.id, payload)
      const params = new URLSearchParams()
      if (courseId) params.set('courseId', courseId)
      if (lessonId) params.set('lessonId', lessonId)
      navigate(`/student/quiz/${quizId}/result/${result.id}?${params.toString()}`)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading quiz..." />
  }
  if (error && !quiz) {
    return (
      <StateMessage variant="error" title="Quiz not available">
        {error}
      </StateMessage>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz?.questions?.length ?? 0

  return (
    <section className="space-y-6">
      {courseId && lessonId && (
        <a
          href={`/courses/${courseId}/lessons/${lessonId}`}
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to lesson
        </a>
      )}

      {!attempt ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ks-text)]">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--ks-text-muted)]">{quiz.description}</p>
            )}
          </div>
          <p className="text-sm text-[var(--ks-text-muted)]">
            {quiz.questions.length} question{quiz.questions.length !== 1 && 's'} — {quiz.total_points} point{quiz.total_points !== 1 && 's'} total
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="rounded-lg bg-[var(--ks-orange)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--ks-text)]">{quiz.title}</h1>
              <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            <div className="flex gap-1">
              {quiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                    i === currentStep
                      ? 'bg-[var(--ks-orange)] text-white'
                      : answers[q.id] != null
                        ? 'border border-[var(--ks-orange)]/40 bg-[var(--ks-orange)]/10 text-[var(--ks-orange)]'
                        : 'border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)] hover:border-[var(--ks-orange)]/40'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {quiz.questions.map((q, i) => {
            if (i !== currentStep) return null
            return (
              <div key={q.id} className="space-y-4">
                <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-[var(--ks-text)]">
                      <span className="text-[var(--ks-text-muted)]">Q{i + 1}.</span> {q.question_text}
                    </p>
                    <span className="shrink-0 rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ks-text-muted)]">
                      {q.points} pt{q.points !== 1 && 's'}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                          answers[q.id] === opt.id
                            ? 'border-[var(--ks-orange)]/60 bg-[var(--ks-orange)]/10 text-[var(--ks-text)] font-medium'
                            : 'border-[var(--ks-border)] bg-[var(--ks-bg-soft)]/40 text-[var(--ks-text)] hover:border-[var(--ks-orange)]/40'
                        }`}
                        tabIndex={0}
                        role="radio"
                        aria-checked={answers[q.id] === opt.id}
                        onKeyDown={(e) => handleOptionKeyDown(e, q.id, opt.id)}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            answers[q.id] === opt.id ? 'border-[var(--ks-orange)]' : 'border-[var(--ks-border)]'
                          }`}
                        >
                          {answers[q.id] === opt.id && (
                            <span className="h-2 w-2 rounded-full bg-[var(--ks-orange)]" />
                          )}
                        </span>
                        {opt.option_text}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-sm font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/40 hover:bg-[var(--ks-bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  {currentStep < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((s) => s + 1)}
                      className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-sm font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/40 hover:bg-[var(--ks-bg-soft)]"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {submitError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
            >
              {submitError}
            </p>
          )}

          <ConfirmDialog
            open={showConfirm}
            title="Submit Quiz"
            message={`You have answered ${answeredCount} of ${totalQuestions} questions. Submit your quiz?`}
            confirmLabel={isSubmitting ? 'Submitting...' : 'Submit'}
            error={submitError}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmit}
            onCancel={() => setShowConfirm(false)}
          />
        </div>
      )}
    </section>
  )
}