import { useEffect, useMemo, useState } from 'react'
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'
import {
  createMockExam,
  getMockExamResult,
  getMockExamSession,
  listMockExams,
  submitMockExam,
} from '../../services/practiceService.js'
import { listCourses } from '../../services/courseService.js'
import { getApiErrorMessage } from '../../services/api.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function MockExamsPage() {
  const [courses, setCourses] = useState([])
  const [examHistory, setExamHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Creation config modal/state
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('ALL')
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(10)
  const [isLaunching, setIsLaunching] = useState(false)
  const [launchError, setLaunchError] = useState('')

  // Active Exam state
  const [activeSession, setActiveSession] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [studentAnswers, setStudentAnswers] = useState({}) // questionId -> optionId
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Completed Review state
  const [examResult, setExamResult] = useState(null)

  // 1. Initial Load: past history & courses
  async function loadInitial() {
    setIsLoading(true)
    setError('')
    try {
      const [historyData, courseList] = await Promise.all([
        listMockExams(),
        listCourses().catch(() => []),
      ])
      setExamHistory(historyData)
      setCourses(Array.isArray(courseList) ? courseList : courseList?.items ?? [])

      // Check if there was an active session in localStorage
      const savedSessionId = localStorage.getItem('active_mock_exam_session_id')
      if (savedSessionId) {
        try {
          const session = await getMockExamSession(savedSessionId)
          if (session.status === 'IN_PROGRESS') {
            loadExamSession(session)
          } else {
            localStorage.removeItem('active_mock_exam_session_id')
          }
        } catch {
          localStorage.removeItem('active_mock_exam_session_id')
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadExamSession(session) {
    setActiveSession(session)
    setExamResult(null)
    setCurrentQuestionIndex(0)
    localStorage.setItem('active_mock_exam_session_id', String(session.id))

    // Pre-populate any previously picked answers
    const answersMap = {}
    session.questions.forEach((q) => {
      if (q.selected_option_id) answersMap[q.id] = q.selected_option_id
    })
    setStudentAnswers(answersMap)

    // Calculate time left
    const totalSeconds = session.duration_minutes * 60
    const elapsed = session.time_spent_seconds || 0
    const remaining = Math.max(0, totalSeconds - elapsed)
    setSecondsRemaining(remaining)
  }

  // Countdown timer effect
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'IN_PROGRESS' || examResult) return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, examResult])

  async function handleAutoSubmit() {
    if (isSubmitting || examResult) return
    handleSubmitExam()
  }

  // Launch New Exam
  async function handleStartExam() {
    setIsLaunching(true)
    setLaunchError('')
    try {
      const payload = {
        course_id: selectedCourseId !== 'ALL' ? Number(selectedCourseId) : null,
        question_count: Number(selectedQuestionCount),
        duration_minutes: Number(selectedDuration),
      }
      const newSession = await createMockExam(payload)
      setIsConfigOpen(false)
      loadExamSession(newSession)
    } catch (err) {
      setLaunchError(getApiErrorMessage(err))
    } finally {
      setIsLaunching(false)
    }
  }

  function handleSelectOption(questionId, optionId) {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  async function handleSubmitExam() {
    if (!activeSession) return
    setShowSubmitConfirm(false)
    setIsSubmitting(true)
    setSubmitError('')

    const answersPayload = activeSession.questions.map((q) => ({
      question_id: q.id,
      selected_option_id: studentAnswers[q.id] ?? null,
    }))

    try {
      const result = await submitMockExam(activeSession.id, answersPayload)
      setExamResult(result)
      setActiveSession(null)
      localStorage.removeItem('active_mock_exam_session_id')

      // Refresh exam history
      listMockExams().then((h) => setExamHistory(h)).catch(() => {})
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReviewPrevious(sessionId) {
    setIsLoading(true)
    try {
      const result = await getMockExamResult(sessionId)
      setExamResult(result)
      setActiveSession(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  function handleExitToDashboard() {
    setActiveSession(null)
    setExamResult(null)
    localStorage.removeItem('active_mock_exam_session_id')
    loadInitial()
  }

  // Format MM:SS timer
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60)
    const secs = secondsRemaining % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [secondsRemaining])

  // Question validation limits for selected course
  const maxAvailableQuestions = useMemo(() => {
    if (selectedCourseId === 'ALL') return 180
    // Every single course has at least 15 questions, up to 25
    return 15
  }, [selectedCourseId])

  // ==========================================
  // RENDER: 1. ACTIVE EXAM VIEW
  // ==========================================
  if (activeSession) {
    const questions = activeSession.questions || []
    const currentQuestion = questions[currentQuestionIndex]
    const answeredCount = Object.keys(studentAnswers).length
    const isUrgent = secondsRemaining < 120

    return (
      <section className="space-y-6 max-w-[1000px] mx-auto">
        {/* Sticky Exam Bar */}
        <div className="sticky top-16 z-10 ks-neo-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="ks-page-eyebrow">
                SIMULATION IN PROGRESS
              </span>
              <h2 className="ks-neo-card-title">
                {activeSession.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-[1.5px] font-mono text-xs font-bold ${
                  isUrgent
                    ? 'border-rose-600 bg-rose-100 text-rose-800 animate-pulse'
                    : 'border-[#241A16] bg-[#FAF8F5] text-[#241A16]'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>

              {/* Submit Action */}
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="rounded-md border-[1.5px] border-[#241A16] bg-emerald-600 px-4 py-1.5 text-xs font-mono font-bold uppercase text-white shadow-[1px_2px_0_#241A16] hover:bg-emerald-700 active:translate-x-[1px] active:translate-y-[1px] transition cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Question Nav Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t-2 border-[#241A16]">
            {questions.map((q, idx) => {
              const isAnswered = studentAnswers[q.id] != null
              const isCurrent = idx === currentQuestionIndex
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-7 w-7 rounded-[4px] font-mono text-xs font-bold border-[1.5px] border-[#241A16] transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[#F16524] text-white shadow-[2px_2px_0_#241A16]'
                      : isAnswered
                      ? 'bg-[#FFF2E6] text-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                      : 'bg-white text-neutral-600 shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Current Question Body */}
        {currentQuestion && (
          <div className="ks-neo-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(36,26,22,0.12)]">
              <span className="text-xs font-mono font-semibold text-neutral-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-700">
                {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>

            <p className="font-serif text-lg sm:text-xl font-normal text-[#241A16] leading-relaxed">
              {currentQuestion.question_text}
            </p>

            {/* Options */}
            <div className="space-y-2.5 pt-1">
              {currentQuestion.options.map((opt) => {
                const isSelected = studentAnswers[currentQuestion.id] === opt.id
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`flex items-center gap-3 rounded-[6px] border-[1.5px] border-[#241A16] px-4 py-3 text-xs sm:text-sm transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF2E6] text-[#241A16] font-semibold shadow-[2px_2px_0_#241A16]'
                        : 'bg-white text-[#241A16] shadow-[1px_1px_0_#241A16] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[#241A16] transition-colors ${
                        isSelected ? 'bg-[#241A16] text-white' : 'bg-white'
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-[1px] bg-white" />}
                    </span>
                    <span className="flex-1">{opt.option_text}</span>
                  </label>
                )
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(36,26,22,0.12)]">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                className="ks-neo-btn-secondary px-4 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                  className="ks-neo-btn-secondary px-5 py-2 text-xs"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="rounded-md border-[1.5px] border-[#241A16] bg-emerald-600 px-6 py-2 text-xs font-mono font-bold uppercase text-white shadow-[2px_3px_0_#241A16] hover:bg-emerald-700 active:translate-x-[1px] active:translate-y-[1px] transition cursor-pointer"
                >
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        <ConfirmDialog
          open={showSubmitConfirm}
          title="Submit Mock Exam"
          message={`You have answered ${answeredCount} of ${questions.length} questions. Are you ready to submit your exam for scoring?`}
          confirmLabel={isSubmitting ? 'Evaluating...' : 'Yes, Submit Exam'}
          error={submitError}
          isSubmitting={isSubmitting}
          onConfirm={handleSubmitExam}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      </section>
    )
  }

  // ==========================================
  // RENDER: 2. EXAM RESULTS & REVIEW VIEW
  // ==========================================
  if (examResult) {
    const passed = examResult.passed
    return (
      <section className="space-y-6 max-w-[1000px] mx-auto">
        {/* Result Banner */}
        <div className="ks-neo-card p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="ks-page-eyebrow">
                SIMULATION COMPLETE
              </span>
              <h1 className="ks-page-title">
                {examResult.title}
              </h1>
              <p className="text-xs font-mono text-neutral-500">
                Completed on {new Date(examResult.submitted_at || Date.now()).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block rounded-[4px] border border-[#241A16] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {passed ? 'PASSED (≥ 60%)' : 'NEEDS PRACTICE (< 60%)'}
              </span>
              <p
                className={`mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight ${
                  passed ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {examResult.score} / {examResult.total_points} pts ({examResult.percentage}%)
              </p>
            </div>
          </div>

          {/* Breakdown statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[rgba(36,26,22,0.12)]">
            <NeoMetricCard
              label="Correct"
              value={examResult.correct_count}
              icon={CheckCircle2}
              iconColor="text-emerald-700"
              valueColor="text-emerald-700"
              hint="Accurate answers"
            />
            <NeoMetricCard
              label="Incorrect"
              value={examResult.incorrect_count}
              icon={XCircle}
              iconColor="text-rose-700"
              valueColor="text-rose-700"
              hint="Needs review"
            />
            <NeoMetricCard
              label="Unanswered"
              value={examResult.unanswered_count}
              icon={HelpCircle}
              valueColor="text-neutral-700"
              hint="Skipped questions"
            />
            <NeoMetricCard
              label="Time Used"
              value={`${Math.floor(examResult.time_spent_seconds / 60)}m ${examResult.time_spent_seconds % 60}s`}
              icon={Clock}
              valueColor="text-[#241A16]"
              hint={`Allocated: ${examResult.duration_minutes || 10}m`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleExitToDashboard}
              className="ks-neo-btn-secondary px-4 py-2 text-xs"
            >
              ← Back to Mock Exams
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="ks-section-title">
            Detailed Answer Review
          </h2>

          {examResult.reviews.map((rev, idx) => (
            <div
              key={rev.question_id}
              className="ks-neo-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-neutral-500">
                  Q{idx + 1}. ({rev.points} pt{rev.points !== 1 ? 's' : ''})
                </span>
                {rev.is_correct ? (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Correct (+{rev.points_earned} pts)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-rose-100 text-rose-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                    <XCircle className="h-3.5 w-3.5" />
                    Incorrect (0 pts)
                  </span>
                )}
              </div>

              <p className="font-serif text-base font-normal text-[#241A16]">
                {rev.question_text}
              </p>

              {/* Options */}
              <div className="space-y-2 pt-1 text-xs">
                {rev.options.map((opt) => {
                  const isUserPick = rev.selected_option_id === opt.id
                  const isCorrect = rev.correct_option_id === opt.id

                  let optClass = 'border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] text-[#241A16]'
                  if (isCorrect) {
                    optClass = 'border-[#241A16] bg-emerald-50 text-emerald-950 font-semibold shadow-[1px_2px_0_rgba(16,185,129,0.3)]'
                  } else if (isUserPick && !rev.is_correct) {
                    optClass = 'border-[#241A16] bg-rose-50 text-rose-950 line-through'
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center justify-between rounded-md border-[1.5px] px-3.5 py-2.5 ${optClass}`}
                    >
                      <span>{opt.option_text}</span>
                      {isCorrect && (
                        <span className="rounded-[4px] border border-[#241A16] font-mono text-[9px] font-bold uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5">
                          Correct Answer
                        </span>
                      )}
                      {isUserPick && !isCorrect && (
                        <span className="rounded-[4px] border border-[#241A16] font-mono text-[9px] font-bold uppercase text-rose-800 bg-rose-100 px-1.5 py-0.5">
                          Your Choice
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ==========================================
  // RENDER: 3. DEFAULT MOCK EXAMS HUB
  // ==========================================
  return (
    <section className="space-y-6 max-w-[1360px] mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <span className="ks-page-eyebrow">EXAM SIMULATION</span>
          <h1 className="mt-1 ks-page-title">Mock Exams</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-xl">
            Simulate real timed assessment conditions using verified curriculum questions. Build speed, measure test readiness, and review every question.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsConfigOpen(true)
            setLaunchError('')
          }}
          className="ks-neo-btn-primary px-5 py-2.5 text-xs self-start sm:self-auto"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>Launch New Exam</span>
        </button>
      </div>

      {/* 2. CONFIGURATION MODAL / CARD */}
      {isConfigOpen && (
        <div className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[5px_5px_0_#241A16] p-6 space-y-5 animate-in fade-in duration-200">
          <div className="ks-neo-card-header">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F16524]" />
              <h2 className="ks-neo-card-title">
                Configure Mock Exam
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs font-mono font-bold text-neutral-500 hover:text-[#241A16] cursor-pointer"
            >
              Cancel ✕
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            {/* Course Selection */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600">Course Scope</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value)
                  if (e.target.value !== 'ALL' && selectedQuestionCount > 15) {
                    setSelectedQuestionCount(10)
                  }
                }}
                className="w-full h-9 rounded-[6px] border-2 border-[#241A16] bg-white px-3 font-mono text-xs text-[#241A16] shadow-[2px_2px_0_#241A16] outline-none focus:border-[#F16524]"
              >
                <option value="ALL">All Courses (Full Platform)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600">Question Count</label>
              <select
                value={selectedQuestionCount}
                onChange={(e) => setSelectedQuestionCount(Number(e.target.value))}
                className="w-full h-9 rounded-[6px] border-2 border-[#241A16] bg-white px-3 font-mono text-xs text-[#241A16] shadow-[2px_2px_0_#241A16] outline-none focus:border-[#F16524]"
              >
                <option value={10}>10 Questions</option>
                {maxAvailableQuestions >= 20 && <option value={20}>20 Questions</option>}
                {maxAvailableQuestions >= 30 && <option value={30}>30 Questions</option>}
              </select>
              {selectedCourseId !== 'ALL' && (
                <p className="text-[10px] font-mono text-neutral-400">
                  Subject exams are capped at available course questions.
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600">Time Limit</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full h-9 rounded-[6px] border-2 border-[#241A16] bg-white px-3 font-mono text-xs text-[#241A16] shadow-[2px_2px_0_#241A16] outline-none focus:border-[#F16524]"
              >
                <option value={10}>10 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          {launchError && (
            <div className="p-3 rounded-md bg-rose-50 border-[1.5px] border-rose-600 text-rose-700 font-mono text-xs">
              {launchError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="ks-neo-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLaunching}
              onClick={handleStartExam}
              className="ks-neo-btn-primary px-5 py-2 text-xs disabled:opacity-50"
            >
              {isLaunching ? 'Setting Up...' : 'Start Timed Exam →'}
            </button>
          </div>
        </div>
      )}

      {/* 3. PREVIOUS EXAM SESSIONS HISTORY */}
      <div className="space-y-4">
        <h2 className="ks-section-title">
          Previous Exam Attempts
        </h2>

        {isLoading ? (
          <StateMessage variant="loading" title="Loading exam history..." />
        ) : error ? (
          <StateMessage variant="error" title="Unable to load exams">
            {error}
          </StateMessage>
        ) : examHistory.length === 0 ? (
          <div className="rounded-[8px] border-2 border-[#241A16] bg-white p-12 text-center shadow-[4px_4px_0_#241A16] space-y-2">
            <GraduationCap className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="font-serif text-xl font-normal text-[#241A16]">No Mock Exams Taken Yet</h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              Launch your first mock exam above to simulate real exam conditions and test your retention.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examHistory.map((exam) => {
              const isSubmitted = exam.status === 'SUBMITTED'
              const passed = exam.passed

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] hover:shadow-[5px_5px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-[4px] border border-[#241A16] bg-[#F16524]/10 text-[#F16524] px-2 py-0.5 font-mono text-[10px] font-bold uppercase truncate">
                        {exam.course_title || 'All Courses'}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {new Date(exam.started_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-normal text-[#241A16]">
                        {exam.title}
                      </h3>
                      <p className="text-xs font-mono text-neutral-500 mt-0.5">
                        {exam.question_count} Questions · {exam.duration_minutes} min duration
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#FAF8F5] border-[1.5px] border-[#241A16] text-xs font-mono">
                      <span className="text-neutral-500 text-[11px]">Score:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#241A16]">
                          {exam.score} / {exam.total_points} ({exam.percentage}%)
                        </span>
                        {isSubmitted && (
                          <span
                            className={`rounded-[4px] border border-[#241A16] text-[9px] font-bold px-1.5 py-0.5 font-mono uppercase ${
                              passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {passed ? 'PASSED' : 'FAILED'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[rgba(36,26,22,0.12)] flex justify-end">
                    {isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => handleReviewPrevious(exam.id)}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[#F16524] hover:text-[#241A16] cursor-pointer"
                      >
                        <span>Review Answers</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const s = await getMockExamSession(exam.id)
                          loadExamSession(s)
                        }}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[#F16524] hover:text-[#241A16] cursor-pointer"
                      >
                        <span>Resume Exam</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
