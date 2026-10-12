import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  CalendarDays,
  ChevronDown,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { listMyEnrollments } from '../../../services/enrollmentService.js'
import { createStudyPlan } from '../../../services/studyPlanService.js'

function getTomorrowDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const DAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 0, label: 'Sun', full: 'Sunday' },
]

const TIME_PRESETS = [15, 30, 45, 60]

export default function CreatePlanModal({
  isOpen,
  onClose,
  onPlanCreated,
  existingPlanCourseIds = [],
}) {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [courseError, setCourseError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [targetDate, setTargetDate] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(30)
  const [preferredDays, setPreferredDays] = useState([1, 2, 3, 4, 5]) // Mon-Fri default

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Min date is tomorrow
  const minDate = getTomorrowDate()

  const fetchEnrolledCourses = useCallback(async () => {
    setLoadingCourses(true)
    setCourseError(null)
    try {
      const data = await listMyEnrollments()
      const items = Array.isArray(data) ? data : []
      const mapped = items
        .map((e) => ({
          id: e.course_id || e.course?.id,
          title: e.course?.title || e.course_title || `Course #${e.course_id}`,
          category: e.course?.category || '',
          progress: typeof e.progress === 'number' ? e.progress : 0,
          totalLessons: e.total_lessons || e.course?.total_lessons || 0,
          completedLessons: e.completed_lessons || 0,
        }))
        .filter((c) => Boolean(c.id))

      // Deduplicate by course id
      const unique = []
      const seen = new Set()
      for (const c of mapped) {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          unique.push(c)
        }
      }

      setCourses(unique)
      if (unique.length > 0) {
        setSelectedCourseId((prev) => {
          if (prev && unique.some((c) => c.id === Number(prev))) {
            return prev
          }
          const available = unique.find((c) => !existingPlanCourseIds.includes(c.id))
          return available ? available.id : unique[0].id
        })
      } else {
        setSelectedCourseId(null)
      }
    } catch (err) {
      setCourseError(
        err.response?.data?.detail || 'Failed to load enrolled courses'
      )
      setCourses([])
      setSelectedCourseId(null)
    } finally {
      setLoadingCourses(false)
    }
  }, [existingPlanCourseIds])

  useEffect(() => {
    if (!isOpen) return

    setIsDropdownOpen(false)
    fetchEnrolledCourses()

    const defaultTarget = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0]
    setTargetDate(defaultTarget)
    setSubmitError(null)

    return () => {
      setIsDropdownOpen(false)
    }
  }, [isOpen, fetchEnrolledCourses])

  // Handle outside click for custom dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isDropdownOpen])

  if (!isOpen) return null

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId))

  const toggleDay = (dayValue) => {
    if (preferredDays.includes(dayValue)) {
      if (preferredDays.length === 1) return // Keep at least one
      setPreferredDays(preferredDays.filter((d) => d !== dayValue))
    } else {
      setPreferredDays([...preferredDays, dayValue])
    }
  }

  // Calculate days & study sessions
  const calculateDays = () => {
    if (!targetDate) return { totalDays: 0, studyDays: 0 }
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(targetDate)
    end.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - start.getTime()
    const totalDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    let studyDays = 0
    const cur = new Date(start)
    cur.setDate(cur.getDate() + 1)
    while (cur <= end) {
      if (preferredDays.includes(cur.getDay())) {
        studyDays++
      }
      cur.setDate(cur.getDate() + 1)
    }

    return { totalDays, studyDays }
  }

  const { totalDays, studyDays } = calculateDays()

  const handleDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    if (!selectedCourseId) {
      setSubmitError('Select a course to continue.')
      return
    }
    if (!targetDate) {
      setSubmitError('Please select a target completion date.')
      return
    }
    if (new Date(targetDate) <= new Date()) {
      setSubmitError('Target date must be in the future.')
      return
    }
    if (preferredDays.length === 0) {
      setSubmitError('Please select at least one study day per week.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const plan = await createStudyPlan({
        course_id: Number(selectedCourseId),
        target_date: targetDate,
        daily_study_minutes: Number(dailyMinutes),
        preferred_days_of_week: preferredDays,
      })
      onPlanCreated(plan)
      onClose()
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail ||
          'Failed to create study plan. Please verify the target date and pacing.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F0E04]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-plan-title"
        className="relative w-full max-w-lg rounded-[8px] border-2 border-[#241A16] bg-white shadow-[5px_5px_0_#241A16] p-5 sm:p-6 overflow-hidden z-10 max-h-[92vh] flex flex-col text-[#241A16]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#241A16]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#FFF2E6] text-[#F16524] border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-[#F16524]/20" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] block">
                AI LEARNING PLANNER
              </span>
              <h2 id="create-plan-title" className="font-serif text-2xl font-normal text-[#241A16] mt-0.5">
                Create Study Plan
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-600 hover:text-[#241A16] hover:bg-[#FAF8F5] rounded-[4px] border border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
          {submitError && (
            <div className="p-3 rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] text-[#241A16] font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#F16524]" />
              <span>{submitError}</span>
            </div>
          )}

          {courseError && (
            <div className="p-3 rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16] text-[#241A16] font-mono text-xs">
              {courseError}
            </div>
          )}

          {/* 1. Target Course Selector */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
                Target Course
              </label>
              <span className="font-mono text-[10px] text-neutral-500">
                {loadingCourses
                  ? 'Checking enrollments...'
                  : `${courses.length} enrolled ${courses.length === 1 ? 'course' : 'courses'}`}
              </span>
            </div>

            <div className="relative">
              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                onKeyDown={handleDropdownKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                className={`w-full px-3.5 py-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-left flex items-center justify-between shadow-[2px_2px_0_#241A16] transition-all cursor-pointer ${
                  isDropdownOpen ? 'bg-[#FFFDF9] ring-2 ring-[#241A16]' : 'hover:bg-[#FAF8F5]'
                }`}
              >
                {selectedCourse ? (
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#241A16] truncate">
                        {selectedCourse.title}
                      </span>
                      {selectedCourse.category && (
                        <span className="font-mono text-[9px] font-bold uppercase text-neutral-600 bg-[#FAF8F5] px-1.5 py-0.2 rounded-[3px] border border-[#241A16] truncate shrink-0 hidden sm:inline">
                          {selectedCourse.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 mt-0.5">
                      <span className="font-bold text-[#F16524]">
                        {selectedCourse.progress}% COMPLETE
                      </span>
                      {existingPlanCourseIds.includes(selectedCourse.id) && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-bold">Active plan exists</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-neutral-500">
                    {loadingCourses ? 'Loading enrolled courses...' : 'Choose an enrolled course'}
                  </span>
                )}

                <ChevronDown
                  className={`w-4 h-4 text-[#241A16] shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#F16524]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu / Popover */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-1.5 rounded-[6px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] z-30 max-h-64 overflow-y-auto scrollbar-thin"
                >
                  {loadingCourses ? (
                    <div className="p-4 text-center font-mono text-xs text-[#241A16] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F16524]" />
                      <span>Loading enrolled courses...</span>
                    </div>
                  ) : courses.length === 0 ? (
                    /* CASE B — NO ENROLLED COURSES */
                    <div className="p-4 sm:p-5 text-center space-y-3">
                      <div className="w-10 h-10 mx-auto rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[2px_2px_0_#241A16] flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-normal text-[#241A16]">
                          No enrolled courses yet
                        </h3>
                        <p className="font-mono text-xs text-neutral-600 mt-1 max-w-xs mx-auto leading-relaxed">
                          Choose a course from the catalog before creating a Study Plan.
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            navigate('/courses')
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#d95318] transition-colors cursor-pointer"
                        >
                          <span>Explore Courses</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="pt-2 border-t-[1.5px] border-[#241A16]/20">
                        <button
                          type="button"
                          onClick={fetchEnrolledCourses}
                          className="font-mono text-[10px] text-neutral-600 hover:text-[#F16524] transition-colors underline cursor-pointer"
                        >
                          Already enrolled? Refresh your learning data.
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CASE A — ENROLLED COURSES LIST */
                    <div className="py-1">
                      {courses.map((course) => {
                        const isSelected = course.id === Number(selectedCourseId)
                        const hasPlan = existingPlanCourseIds.includes(course.id)
                        return (
                          <button
                            key={course.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedCourseId(course.id)
                              setIsDropdownOpen(false)
                              setSubmitError(null)
                            }}
                            className={`w-full px-3.5 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer border-b border-[#241A16]/10 last:border-b-0 ${
                              isSelected
                                ? 'bg-[#FFF2E6]'
                                : 'hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-[3px] border-[1.5px] border-[#241A16] flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-[#241A16] text-white'
                                    : 'bg-white'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-[1px] bg-white" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isSelected
                                      ? 'text-[#241A16]'
                                      : 'text-[#241A16]'
                                  }`}
                                >
                                  {course.title}
                                </span>
                                {course.category && (
                                  <span className="font-mono text-[9px] font-bold uppercase text-neutral-500 rounded-[3px] border border-[#241A16]/40 px-1 py-0.2 shrink-0 hidden sm:inline">
                                    {course.category}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-neutral-600">
                                <span className="font-bold text-[#241A16]">
                                  {course.progress}% COMPLETE
                                </span>
                                {hasPlan && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-800 font-bold">
                                      Active plan exists
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}

                      {/* Quick refresh in dropdown footer */}
                      <div className="px-3.5 py-2 border-t-2 border-[#241A16] flex items-center justify-between font-mono text-[10px] bg-[#FAF8F5]">
                        <span className="text-neutral-600">
                          {courses.length} enrolled {courses.length === 1 ? 'course' : 'courses'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            fetchEnrolledCourses()
                          }}
                          className="text-[#F16524] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Target Completion Date */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16] flex items-center justify-between">
              <span>Target Completion Date</span>
              <span className="text-neutral-500 font-normal">
                {totalDays} CALENDAR DAYS AWAY
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                min={minDate}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white font-mono text-xs font-bold text-[#241A16] shadow-[2px_2px_0_#241A16] focus:outline-none focus:ring-1 focus:ring-[#F16524]"
              />
            </div>
          </div>

          {/* 3. Daily Study Minutes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
                Daily Study Time
              </label>
              <span className="font-mono text-xs font-bold text-[#F16524]">
                {dailyMinutes} MIN / SESSION
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDailyMinutes(preset)}
                  className={`py-2 rounded-[6px] font-mono text-xs font-bold uppercase border-[1.5px] border-[#241A16] transition-all cursor-pointer ${
                    dailyMinutes === preset
                      ? 'bg-[#FFF2E6] text-[#241A16] shadow-[2px_2px_0_#241A16]'
                      : 'bg-white text-neutral-600 shadow-[1px_1px_0_#241A16] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </div>

          {/* 4. Preferred Study Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#241A16]">
                Active Study Days
              </label>
              <span className="font-mono text-[10px] text-neutral-500">
                {preferredDays.length} DAYS / WEEK
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d) => {
                const isSelected = preferredDays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`py-2 rounded-[6px] font-mono text-xs font-bold uppercase border-[1.5px] border-[#241A16] flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F16524] text-white shadow-[2px_2px_0_#241A16]'
                        : 'bg-white text-[#241A16] shadow-[1px_1px_0_#241A16] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Schedule Projection Summary */}
          <div className="p-3.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFFAF4] shadow-[2px_2px_0_#241A16] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#241A16]">
              <CalendarDays className="w-3.5 h-3.5 text-[#F16524]" />
              <span className="font-mono text-xs uppercase tracking-wide">Projected Milestone Pacing</span>
            </div>
            <p className="font-mono text-[11px] text-neutral-600 leading-relaxed">
              Your curriculum will be distributed across <strong>{studyDays} study sessions</strong> ({dailyMinutes}m each), fitting your target deadline without burnout.
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t-2 border-[#241A16] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedCourseId}
            className="px-5 py-2 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#241A16] hover:bg-[#d95318] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Plan...</span>
              </span>
            ) : (
              <span>Create Study Plan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
