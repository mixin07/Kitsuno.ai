import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Trophy,
} from 'lucide-react'
import { getQuizHubSummary } from '../../services/practiceService.js'
import { getApiErrorMessage } from '../../services/api.js'
import StateMessage from '../../components/StateMessage.jsx'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

export default function QuizHubPage() {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, NOT_ATTEMPTED, IN_PROGRESS, COMPLETED
  const [selectedCourse, setSelectedCourse] = useState('ALL')

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getQuizHubSummary()
        if (active) setSummary(data)
      } catch (err) {
        if (active) setError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Unique courses for filter dropdown
  const coursesList = useMemo(() => {
    if (!summary?.quizzes) return []
    const map = new Map()
    summary.quizzes.forEach((q) => {
      if (!map.has(q.course_id)) {
        map.set(q.course_id, q.course_title)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [summary])

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    if (!summary?.quizzes) return []
    return summary.quizzes.filter((quiz) => {
      const qTitle = (quiz?.title || '').toLowerCase()
      const qCourse = (quiz?.course_title || '').toLowerCase()
      const qLesson = (quiz?.lesson_title || '').toLowerCase()
      const query = searchQuery.trim().toLowerCase()

      const matchSearch =
        !query ||
        qTitle.includes(query) ||
        qCourse.includes(query) ||
        qLesson.includes(query)

      const matchStatus =
        statusFilter === 'ALL' || quiz.status === statusFilter

      const matchCourse =
        selectedCourse === 'ALL' || String(quiz.course_id) === String(selectedCourse)

      return matchSearch && matchStatus && matchCourse
    })
  }, [summary, searchQuery, statusFilter, selectedCourse])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading Quiz Hub..." />
  }

  if (error) {
    return (
      <StateMessage variant="error" title="Unable to load Quiz Hub">
        {error}
      </StateMessage>
    )
  }

  return (
    <section className="space-y-6 max-w-[1360px] mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="pb-4 border-b border-[rgba(36,26,22,0.12)]">
        <span className="ks-page-eyebrow block">PRACTICE &amp; MASTERY</span>
        <h1 className="ks-page-title mt-1">Quiz Hub</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6F625B] max-w-xl">
          Test your knowledge across all 36 quizzes in the Kitsuno curriculum. Track completion, review previous scores, and retake assessments anytime.
        </p>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NeoMetricCard
          label="Total Quizzes"
          value={summary?.total_quizzes || 36}
          description="Platform assessments"
          icon={ClipboardCheck}
        />
        <NeoMetricCard
          label="Completed"
          value={summary?.completed_quizzes || 0}
          valueColor="text-emerald-700"
          description="Quizzes finished"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <NeoMetricCard
          label="Mastered"
          value={summary?.passed_quizzes || 0}
          valueColor="text-amber-700"
          description="Passed (≥ 60% score)"
          icon={Trophy}
          iconColor="text-amber-500"
        />
        <NeoMetricCard
          label="In Progress"
          value={summary?.in_progress_quizzes || 0}
          valueColor="text-[#F16524]"
          description="Active attempts"
          icon={Clock}
        />
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quiz title, course, or lesson..."
              className="w-full h-9 rounded-[6px] border-2 border-[#241A16] bg-white pl-9 pr-3 text-xs text-[#241A16] placeholder-neutral-400 shadow-[2px_2px_0_#241A16] outline-none transition focus:border-[#F16524]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'NOT_ATTEMPTED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[6px] font-mono text-[10px] font-bold uppercase transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#F16524] text-white border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16]'
                    : 'bg-white text-neutral-600 hover:text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                }`}
              >
                {st === 'ALL'
                  ? 'All Quizzes'
                  : st === 'NOT_ATTEMPTED'
                  ? 'Not Attempted'
                  : st === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'Completed'}
              </button>
            ))}
          </div>

          {/* Course Dropdown */}
          <div className="flex items-center gap-1.5 border-2 border-[#241A16] bg-white px-2.5 py-1.5 rounded-[6px] text-xs shadow-[2px_2px_0_#241A16]">
            <Filter className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent text-[#241A16] font-mono text-xs outline-none cursor-pointer"
            >
              <option value="ALL">All Courses</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-[rgba(36,26,22,0.1)]">
          <span>
            Showing <strong className="text-[#241A16]">{filteredQuizzes.length}</strong> of <strong className="text-[#241A16]">{summary?.total_quizzes || 0}</strong> quizzes
          </span>
          {(searchQuery || statusFilter !== 'ALL' || selectedCourse !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('ALL')
                setSelectedCourse('ALL')
              }}
              className="text-[#F16524] font-bold hover:underline cursor-pointer uppercase text-[10px]"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 4. QUIZ CARDS GRID */}
      {filteredQuizzes.length === 0 ? (
        <div className="rounded-[8px] border-2 border-[#241A16] bg-white p-12 text-center shadow-[4px_4px_0_#241A16] space-y-2">
          <ClipboardCheck className="mx-auto h-8 w-8 text-neutral-400" />
          <h3 className="font-serif text-xl font-normal text-[#241A16]">No Quizzes Found</h3>
          <p className="text-xs text-neutral-600">
            Try adjusting your search query or filter selection.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => {
            const isCompleted = quiz.status === 'COMPLETED'
            const isInProgress = quiz.status === 'IN_PROGRESS'

            return (
              <div
                key={quiz.id}
                className="group flex flex-col justify-between bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] hover:shadow-[5px_5px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all p-5 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top metadata tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-[4px] border border-[#241A16] bg-[#F16524]/10 text-[#F16524] px-2 py-0.5 font-mono text-[10px] font-bold uppercase truncate">
                      {quiz.course_title}
                    </span>

                    {/* Status Pill */}
                    {isCompleted ? (
                      <span className="rounded-[4px] border border-[#241A16] bg-emerald-50 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="rounded-[4px] border border-[#241A16] bg-amber-50 text-amber-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="rounded-[4px] border border-[rgba(36,26,22,0.25)] bg-[#FAF8F5] text-neutral-600 px-2 py-0.5 font-mono text-[10px] font-medium uppercase inline-flex items-center gap-1">
                        <span>Not Attempted</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Lesson */}
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#241A16] leading-snug group-hover:text-[#F16524] transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 shrink-0 text-neutral-400" />
                      <span className="truncate">{quiz.lesson_title}</span>
                    </p>
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 pt-2 border-t border-[rgba(36,26,22,0.12)] font-mono text-[11px]">
                    <span><strong>{quiz.question_count}</strong> Questions</span>
                    <span>•</span>
                    <span><strong>{quiz.total_points}</strong> Pts</span>
                    {quiz.attempt_count > 0 && (
                      <>
                        <span>•</span>
                        <span><strong>{quiz.attempt_count}</strong> {quiz.attempt_count === 1 ? 'Attempt' : 'Attempts'}</span>
                      </>
                    )}
                  </div>

                  {/* Score pill if completed */}
                  {isCompleted && (
                    <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#FAF8F5] border-[1.5px] border-[#241A16] text-xs font-mono">
                      <span className="text-neutral-500 text-[11px]">Best Score:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#241A16]">
                          {quiz.best_score} / {quiz.total_points} ({quiz.best_percentage}%)
                        </span>
                        {quiz.passed ? (
                          <span className="rounded-[4px] border border-[#241A16] text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5">
                            PASSED
                          </span>
                        ) : (
                          <span className="rounded-[4px] border border-[#241A16] text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5">
                            RETAKE
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[rgba(36,26,22,0.12)] flex items-center gap-2">
                  {!isCompleted ? (
                    <Link
                      to={`/student/quiz/${quiz.id}?courseId=${quiz.course_id}&lessonId=${quiz.lesson_id}`}
                      className="ks-neo-btn-primary flex-1 justify-center py-2 text-xs"
                    >
                      <span>{isInProgress ? 'Continue Quiz' : 'Start Quiz'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/student/quiz/${quiz.id}?courseId=${quiz.course_id}&lessonId=${quiz.lesson_id}`}
                        className="ks-neo-btn-secondary flex-1 justify-center py-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 text-[#F16524]" />
                        <span>Retake</span>
                      </Link>

                      {quiz.last_attempt_id && (
                        <Link
                          to={`/student/quiz/${quiz.id}/result/${quiz.last_attempt_id}?courseId=${quiz.course_id}&lessonId=${quiz.lesson_id}`}
                          className="ks-neo-btn-secondary px-3 py-2 text-xs"
                        >
                          <span>Review</span>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
