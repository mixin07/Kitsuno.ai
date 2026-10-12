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
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {courseId && lessonId && (
        <a
          href={`/courses/${courseId}/lessons/${lessonId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#F16524] hover:text-[#241A16] transition-colors"
        >
          ← Back to lesson
        </a>
      )}

      {!attempt ? (
        <div className="ks-neo-card p-6 sm:p-8 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="ks-page-eyebrow">QUIZ ASSESSMENT</span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>
            <h1 className="ks-page-title mt-1">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{quiz.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-[rgba(36,26,22,0.12)] font-mono text-xs text-neutral-500">
            <span>{quiz.questions.length} question{quiz.questions.length !== 1 && 's'}</span>
            <span>•</span>
            <span>{quiz.total_points} total point{quiz.total_points !== 1 && 's'}</span>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-[6px] border-[1.5px] border-rose-600 bg-rose-50 px-4 py-3 font-mono text-xs text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="ks-neo-btn-primary px-6 py-2.5 text-xs"
          >
            {isStarting ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
            <div>
              <div className="flex items-center gap-2">
                <span className="ks-page-eyebrow">QUIZ ASSESSMENT</span>
                <span className="w-1.5 h-1.5 bg-[#F16524]" />
              </div>
              <h1 className="ks-page-title text-xl sm:text-2xl mt-0.5">{quiz.title}</h1>
              <p className="mt-1 text-xs font-mono text-neutral-500">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {quiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-[6px] font-mono text-xs font-bold transition cursor-pointer ${
                    i === currentStep
                      ? 'bg-[#F16524] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                      : answers[q.id] != null
                        ? 'border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524]'
                        : 'border-[1.5px] border-[rgba(36,26,22,0.2)] bg-white text-neutral-600 hover:border-[#241A16]'
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
                <div className="ks-neo-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="ks-card-title text-base sm:text-lg text-[#241A16]">
                      <span className="text-neutral-400 font-mono text-sm mr-2">Q{i + 1}.</span> {q.question_text}
                    </p>
                    <span className="shrink-0 rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-700">
                      {q.points} pt{q.points !== 1 && 's'}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-4 py-3 text-xs sm:text-sm transition ${
                          answers[q.id] === opt.id
                            ? 'border-[#241A16] bg-[#F16524]/10 text-[#241A16] font-semibold shadow-[1px_2px_0_#241A16]'
                            : 'border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] text-[#241A16] hover:border-[#241A16] hover:bg-white'
                        }`}
                        tabIndex={0}
                        role="radio"
                        aria-checked={answers[q.id] === opt.id}
                        onKeyDown={(e) => handleOptionKeyDown(e, q.id, opt.id)}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                            answers[q.id] === opt.id ? 'border-[#241A16] bg-white' : 'border-[rgba(36,26,22,0.3)]'
                          }`}
                        >
                          {answers[q.id] === opt.id && (
                            <span className="h-2 w-2 rounded-full bg-[#F16524]" />
                          )}
                        </span>
                        <span>{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="ks-neo-btn-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  {currentStep < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((s) => s + 1)}
                      className="ks-neo-btn-secondary px-4 py-2 text-xs"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      className="rounded-md border-[1.5px] border-[#241A16] bg-emerald-600 px-6 py-2 text-xs font-mono font-bold uppercase text-white shadow-[2px_3px_0_#241A16] hover:bg-emerald-700 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
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
              className="rounded-md border-[1.5px] border-rose-600 bg-rose-50 px-4 py-3 font-mono text-xs text-rose-700"
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
    </div>
  )
}