import { useEffect, useState } from 'react'
import {
  BrainCircuit,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  RotateCcw,
} from 'lucide-react'
import {
  checkQuestionAnswer,
  getQuestionBankStats,
  listQuestionBank,
} from '../../services/practiceService.js'
import { getApiErrorMessage } from '../../services/api.js'
import StateMessage from '../../components/StateMessage.jsx'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ANSWERED, UNANSWERED

  // Question interaction state: questionId -> { selectedOptionId, result: { is_correct, correct_option_id, explanation }, isChecking }
  const [practiceStates, setPracticeStates] = useState({})

  async function loadData() {
    setIsLoading(true)
    setError('')
    try {
      const [qList, statsData] = await Promise.all([
        listQuestionBank({
          courseId: selectedCourseId !== 'ALL' ? Number(selectedCourseId) : null,
          search: searchQuery,
          status: statusFilter,
        }),
        getQuestionBankStats(),
      ])
      setQuestions(qList)
      setStats(statsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, statusFilter])

  function handleSearchSubmit(e) {
    e.preventDefault()
    loadData()
  }

  // Extract unique course list from questions (or keep from initial load)
  const [availableCourses, setAvailableCourses] = useState([])
  useEffect(() => {
    if (questions.length > 0 && availableCourses.length === 0) {
      const map = new Map()
      questions.forEach((q) => {
        if (!map.has(q.course_id)) {
          map.set(q.course_id, q.course_title)
        }
      })
      setAvailableCourses(Array.from(map.entries()).map(([id, title]) => ({ id, title })))
    }
  }, [questions, availableCourses.length])

  function handleSelectOption(questionId, optionId) {
    // If already checked, allow switching only if user clicks Try Again
    const current = practiceStates[questionId]
    if (current?.result) return

    setPracticeStates((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        selectedOptionId: optionId,
      },
    }))
  }

  async function handleCheckAnswer(questionId) {
    const current = practiceStates[questionId]
    if (!current?.selectedOptionId) return

    setPracticeStates((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isChecking: true,
      },
    }))

    try {
      const checkRes = await checkQuestionAnswer(questionId, current.selectedOptionId)
      setPracticeStates((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isChecking: false,
          result: checkRes,
        },
      }))

      // Refresh stats in background
      getQuestionBankStats().then((s) => setStats(s)).catch(() => {})
    } catch (err) {
      setPracticeStates((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isChecking: false,
          checkError: getApiErrorMessage(err),
        },
      }))
    }
  }

  function handleResetQuestion(questionId) {
    setPracticeStates((prev) => {
      const copy = { ...prev }
      delete copy[questionId]
      return copy
    })
  }

  return (
    <section className="space-y-6 max-w-[1360px] mx-auto">
      {/* 1. HEADER */}
      <div className="pb-4 border-b border-[rgba(36,26,22,0.12)]">
        <span className="ks-eyebrow">PRACTICE & MASTERY</span>
        <h1 className="mt-1 ks-page-title">Question Bank</h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-xl">
          Practice individual multiple-choice questions from the 180 questions across the curriculum. Receive instant feedback and track your practice accuracy.
        </p>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NeoMetricCard
          label="Practiced"
          value={stats?.questions_practiced || 0}
          description="Unique questions answered"
          icon={BrainCircuit}
        />
        <NeoMetricCard
          label="Correct"
          value={stats?.correct || 0}
          valueColor="text-emerald-700"
          description="Right answers"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <NeoMetricCard
          label="Incorrect"
          value={stats?.incorrect || 0}
          valueColor="text-rose-700"
          description="Needs review"
          icon={XCircle}
          iconColor="text-rose-500"
        />
        <NeoMetricCard
          label="Accuracy"
          value={`${stats?.accuracy_percentage || 0}%`}
          valueColor="text-amber-700"
          description={stats?.questions_practiced === 0 ? 'No practice yet' : 'Overall accuracy'}
          icon={Target}
          iconColor="text-amber-500"
        />
      </div>

      {/* 3. FILTERS & SEARCH */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-4 space-y-3"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question keywords or concept..."
              className="w-full h-9 rounded-[6px] border-2 border-[#241A16] bg-white pl-9 pr-3 text-xs text-[#241A16] placeholder-neutral-400 outline-none transition focus:border-[#F16524]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'UNANSWERED', 'ANSWERED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-[10px] font-bold uppercase transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#F16524] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                    : 'bg-white text-neutral-600 hover:text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                }`}
              >
                {st === 'ALL'
                  ? 'All Questions'
                  : st === 'UNANSWERED'
                  ? 'Unanswered'
                  : 'Answered'}
              </button>
            ))}
          </div>

          {/* Course Dropdown */}
          <div className="flex items-center gap-1.5 border-2 border-[#241A16] bg-white px-2.5 py-1.5 rounded-[6px] text-xs shadow-[2px_2px_0_#241A16]">
            <Filter className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-[#241A16] font-mono text-xs outline-none cursor-pointer"
            >
              <option value="ALL">All Courses</option>
              {availableCourses.map((c) => (
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
            Found <strong className="text-[#241A16]">{questions.length}</strong> questions matching criteria
          </span>
          {(searchQuery || selectedCourseId !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCourseId('ALL')
                setStatusFilter('ALL')
              }}
              className="text-[#F16524] font-bold hover:underline cursor-pointer uppercase text-[10px]"
            >
              Reset filters
            </button>
          )}
        </div>
      </form>

      {/* 4. QUESTIONS FEED */}
      {isLoading ? (
        <StateMessage variant="loading" title="Loading questions..." />
      ) : error ? (
        <StateMessage variant="error" title="Unable to load Question Bank">
          {error}
        </StateMessage>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-[rgba(36,26,22,0.22)] bg-white p-12 text-center space-y-2">
          <HelpCircle className="mx-auto h-8 w-8 text-neutral-400" />
          <h3 className="font-serif text-xl font-normal text-[#241A16]">No Matching Questions Found</h3>
          <p className="text-xs text-neutral-600">
            Try adjusting your search keywords or switching filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const pState = practiceStates[q.id] || {}
            const selectedOptId = pState.selectedOptionId ?? (q.last_selected_option_id || null)
            const result = pState.result
            const isChecking = pState.isChecking

            return (
              <div
                key={q.id}
                className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-5 space-y-4"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-[4px] border border-[#241A16] bg-[#F16524]/10 text-[#F16524] px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                      {q.course_title}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 truncate max-w-xs">
                      {q.module_title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-700">
                      {q.points} pt{q.points !== 1 ? 's' : ''}
                    </span>
                    {q.has_practiced && (
                      <span className="rounded-[4px] border border-[#241A16] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                        Practiced
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <p className="font-serif text-base sm:text-lg font-normal text-[#241A16] leading-relaxed">
                  <span className="text-neutral-400 font-mono text-sm mr-1.5">Q{idx + 1}.</span> {q.question_text}
                </p>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = selectedOptId === opt.id
                    let optionStyle =
                      'border-[1.5px] border-[#241A16] bg-[#FAF8F5] text-[#241A16] hover:bg-white shadow-[1px_1px_0_#241A16]'

                    if (result) {
                      if (opt.id === result.correct_option_id) {
                        optionStyle =
                          'border-2 border-[#241A16] bg-emerald-50 text-emerald-950 font-semibold shadow-[2px_2px_0_#241A16]'
                      } else if (isSelected && !result.is_correct) {
                        optionStyle =
                          'border-2 border-[#241A16] bg-rose-50 text-rose-950 font-semibold shadow-[2px_2px_0_#241A16]'
                      } else {
                        optionStyle =
                          'border-[1.5px] border-[#241A16]/30 bg-[#FAF8F5]/60 opacity-60 text-neutral-500'
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'border-2 border-[#241A16] bg-[#FFF2E6] text-[#241A16] font-semibold shadow-[2px_2px_0_#241A16]'
                    }

                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`flex items-center gap-3 rounded-[6px] px-4 py-2.5 text-xs transition-all cursor-pointer ${optionStyle}`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[#241A16] ${
                            isSelected ? 'bg-[#241A16] text-white' : 'bg-white'
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />}
                        </span>
                        <span className="flex-1">{opt.option_text}</span>
                        {result && opt.id === result.correct_option_id && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                        )}
                        {result && isSelected && !result.is_correct && (
                          <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                      </label>
                    )
                  })}
                </div>

                {/* Feedback Banner if checked */}
                {result && (
                  <div
                    className={`p-3 rounded-md border-[1.5px] border-[#241A16] text-xs font-medium flex items-center justify-between gap-2 shadow-[1px_2px_0_#241A16] ${
                      result.is_correct
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    <span>{result.explanation}</span>
                    <button
                      type="button"
                      onClick={() => handleResetQuestion(q.id)}
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase underline shrink-0 cursor-pointer text-[#241A16]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Try Again</span>
                    </button>
                  </div>
                )}

                {/* Footer action button */}
                {!result && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleCheckAnswer(q.id)}
                      disabled={!selectedOptId || isChecking}
                      className="ks-neo-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isChecking ? 'Checking...' : 'Check Answer'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
