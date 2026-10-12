import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  CheckCircle2,
  PlayCircle,
  Trash2,
  Compass,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  FileText,
  Download,
  Clock,
  Calendar,
  Layers,
  BookOpen,
  Award,
  Activity,
  X,
} from 'lucide-react'
import { listMyEnrollments, unenrollFromCourse } from '../../services/enrollmentService.js'
import { listCourses } from '../../services/courseService.js'
import { getStudentRecommendation } from '../../services/recommendationService.js'
import { getStudentAnalytics } from '../../services/analyticsService.js'
import {
  getSavedOverview,
  listSavedCourses,
  unsaveCourse,
  listSavedLessons,
  unsaveLesson,
  listSavedNotes,
  unsaveNote,
} from '../../services/savedService.js'
import { generateStudyNotesPDF } from '../../utils/pdfGenerator.js'
import StateMessage from '../../components/StateMessage.jsx'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LearningJourney from '../../components/dashboard/LearningJourney.jsx'
import { getCourseCover } from '../../utils/courseCovers.js'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

const ACTIVITY_LABELS = Object.freeze({
  ENROLLED: 'Enrolled',
  LESSON_STARTED: 'Lesson started',
  LESSON_COMPLETED: 'Lesson completed',
  QUIZ_COMPLETED: 'Quiz completed',
  COURSE_COMPLETED: 'Course completed',
  AI_CHAT: 'AI Study Session',
})

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [courseStatuses, setCourseStatuses] = useState({})
  const [savedCourses, setSavedCourses] = useState([])
  const [savedLessons, setSavedLessons] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Derived directly from URL query param — zero cascading renders, fully synced with browser history
  const statusFilter = searchParams.get('tab') || 'all'

  // 'courses' | 'lessons' | 'notes' (for 'saved' tab)
  const [savedSection, setSavedSection] = useState('courses')
  const [searchQuery, setSearchQuery] = useState('')

  function handleTabChange(tabKey) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tabKey === 'all') {
          next.delete('tab')
        } else {
          next.set('tab', tabKey)
        }
        return next
      },
      { replace: true }
    )
  }

  // Unenroll dialog state
  const [unenrollTarget, setUnenrollTarget] = useState(null)
  const [isUnenrolling, setIsUnenrolling] = useState(false)

  useEffect(() => {
    let active = true

    async function loadData() {
      setIsLoading(true)
      setError('')
      try {
        const [
          enrollRes,
          coursesRes,
          analyticsRes,
          recRes,
          savedCoursesRes,
          savedLessonsRes,
          savedNotesRes,
          savedOverviewRes,
        ] = await Promise.allSettled([
          listMyEnrollments(),
          listCourses(),
          getStudentAnalytics(),
          getStudentRecommendation(),
          listSavedCourses(),
          listSavedLessons(),
          listSavedNotes(),
          getSavedOverview(),
        ])

        if (!active) return

        if (enrollRes.status === 'fulfilled') {
          setEnrollments(enrollRes.value || [])
        } else if (enrollRes.status === 'rejected') {
          setError(enrollRes.reason?.message || 'Failed to load enrollments')
        }

        if (coursesRes.status === 'fulfilled') {
          const list = Array.isArray(coursesRes.value)
            ? coursesRes.value
            : coursesRes.value?.items ?? []
          setCourses(list)
        }

        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value || null)
        }

        if (recRes.status === 'fulfilled') {
          setRecommendation(recRes.value || null)
        }

        if (savedCoursesRes.status === 'fulfilled') {
          setSavedCourses(savedCoursesRes.value || [])
        }

        if (savedLessonsRes.status === 'fulfilled') {
          setSavedLessons(savedLessonsRes.value || [])
        }

        if (savedNotesRes.status === 'fulfilled') {
          setSavedNotes(savedNotesRes.value || [])
        }

        if (savedOverviewRes.status === 'fulfilled') {
          setCourseStatuses(savedOverviewRes.value?.course_statuses || {})
        }
      } catch (err) {
        if (active) setError(String(err?.message || 'Unable to load learning data'))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [reloadKey])

  // Active enrollment (primary active lesson to continue)
  const activeEnrollment = useMemo(() => {
    if (enrollments.length === 0) return null
    const inProgressWithNext = enrollments.find((e) => (e.progress ?? 0) < 100 && e.next_lesson)
    if (inProgressWithNext) return inProgressWithNext
    const anyInProgress = enrollments.find((e) => (e.progress ?? 0) < 100)
    if (anyInProgress) return anyInProgress
    return enrollments[0]
  }, [enrollments])

  // Other active enrollments (for quick switcher)
  const otherActiveEnrollments = useMemo(() => {
    if (!activeEnrollment) return []
    return enrollments.filter(
      (e) => e.course_id !== activeEnrollment.course_id && (e.progress ?? 0) < 100
    )
  }, [enrollments, activeEnrollment])

  // Real aggregate statistics
  const completedCount = useMemo(
    () => enrollments.filter((e) => (e.progress ?? 0) >= 100).length,
    [enrollments]
  )
  const inProgressCount = useMemo(
    () => enrollments.filter((e) => (e.progress ?? 0) < 100).length,
    [enrollments]
  )
  const planningCount = useMemo(
    () => Object.values(courseStatuses).filter((s) => s === 'PLANNING').length,
    [courseStatuses]
  )
  const wantToStudyCount = useMemo(
    () => Object.values(courseStatuses).filter((s) => s === 'WANT_TO_STUDY').length,
    [courseStatuses]
  )
  const totalSavedCount = savedCourses.length + savedLessons.length + savedNotes.length

  const totalLessonsCompleted = useMemo(() => {
    if (analytics?.summary?.lessons_completed !== undefined) {
      return analytics.summary.lessons_completed
    }
    return enrollments.reduce((sum, e) => sum + (e.completed_lessons || 0), 0)
  }, [analytics, enrollments])

  const overallProgress = useMemo(() => {
    if (analytics?.summary?.overall_progress !== undefined) {
      return analytics.summary.overall_progress
    }
    if (enrollments.length === 0) return 0
    const total = enrollments.reduce((sum, e) => sum + (e.total_lessons || 0), 0)
    const completed = enrollments.reduce((sum, e) => sum + (e.completed_lessons || 0), 0)
    if (total > 0) return Math.round((completed / total) * 100)
    const avg = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
    return Math.round(avg)
  }, [analytics, enrollments])

  // Filtered enrollments / courses for current tab
  const displayedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (statusFilter === 'planning') {
      const planningCourseIds = new Set(
        Object.entries(courseStatuses)
          .filter(([, st]) => st === 'PLANNING')
          .map(([id]) => Number(id))
      )
      return courses
        .filter((c) => planningCourseIds.has(c.id))
        .map((c) => {
          const enroll = enrollments.find((e) => e.course_id === c.id)
          return { course: c, enrollment: enroll, type: 'course' }
        })
        .filter((item) => !query || item.course.title?.toLowerCase().includes(query))
    }

    if (statusFilter === 'want_to_study') {
      const wantCourseIds = new Set(
        Object.entries(courseStatuses)
          .filter(([, st]) => st === 'WANT_TO_STUDY')
          .map(([id]) => Number(id))
      )
      return courses
        .filter((c) => wantCourseIds.has(c.id))
        .map((c) => {
          const enroll = enrollments.find((e) => e.course_id === c.id)
          return { course: c, enrollment: enroll, type: 'course' }
        })
        .filter((item) => !query || item.course.title?.toLowerCase().includes(query))
    }

    // Default: filter enrollments
    return enrollments
      .filter((e) => {
        const isCompleted = (e.progress ?? 0) >= 100
        if (statusFilter === 'in_progress' && isCompleted) return false
        if (statusFilter === 'completed' && !isCompleted) return false

        if (query) {
          const titleMatch = (e.course_title || e.course?.title || '').toLowerCase().includes(query)
          const nextLessonMatch = (e.next_lesson?.title || '').toLowerCase().includes(query)
          return titleMatch || nextLessonMatch
        }
        return true
      })
      .map((e) => {
        const course = courses.find((c) => c.id === e.course_id) || e.course
        return { course, enrollment: e, type: 'enrollment' }
      })
  }, [enrollments, courses, courseStatuses, statusFilter, searchQuery])

  // Handle unenroll
  async function handleConfirmUnenroll() {
    if (!unenrollTarget) return
    setIsUnenrolling(true)
    try {
      await unenrollFromCourse(unenrollTarget.course_id)
      setEnrollments((prev) => prev.filter((e) => e.course_id !== unenrollTarget.course_id))
      setUnenrollTarget(null)
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to unenroll')
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Handle remove saved items
  async function handleUnsaveCourse(courseId) {
    try {
      await unsaveCourse(courseId)
      setSavedCourses((prev) => prev.filter((item) => item.course_id !== courseId))
    } catch (err) {
      console.error('Failed to unsave course', err)
    }
  }

  async function handleUnsaveLesson(lessonId) {
    try {
      await unsaveLesson(lessonId)
      setSavedLessons((prev) => prev.filter((item) => item.lesson_id !== lessonId))
    } catch (err) {
      console.error('Failed to unsave lesson', err)
    }
  }

  async function handleUnsaveNote(lessonId) {
    try {
      await unsaveNote(lessonId)
      setSavedNotes((prev) => prev.filter((item) => item.lesson_id !== lessonId))
    } catch (err) {
      console.error('Failed to unsave note', err)
    }
  }

  function handleDownloadPDF(note) {
    generateStudyNotesPDF(note.content, {
      lessonTitle: note.lesson_title || note.topic,
      courseTitle: note.course_title,
    })
  }

  // Subtle loading skeleton matching exact page structure and Study Plan rhythm
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-16 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-[var(--ks-surface-soft)] rounded" />
            <div className="h-9 w-52 bg-[var(--ks-surface-soft)] rounded" />
            <div className="h-4 w-96 max-w-full bg-[var(--ks-surface-soft)] rounded" />
          </div>
          <div className="h-10 w-36 bg-[var(--ks-surface-soft)] rounded-xl" />
        </div>

        {/* Metric Strip Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-2"
            >
              <div className="h-3 w-20 bg-[var(--ks-surface-soft)] rounded" />
              <div className="h-8 w-14 bg-[var(--ks-surface-soft)] rounded" />
              <div className="h-3 w-24 bg-[var(--ks-surface-soft)] rounded" />
            </div>
          ))}
        </div>

        {/* Continue Learning Skeleton */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 md:p-6 space-y-3">
          <div className="h-3 w-32 bg-[var(--ks-surface-soft)] rounded" />
          <div className="h-7 w-64 bg-[var(--ks-surface-soft)] rounded" />
          <div className="h-3 w-80 bg-[var(--ks-surface-soft)] rounded" />
        </div>

        {/* Course Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] overflow-hidden"
            >
              <div className="h-32 bg-[var(--ks-surface-soft)]" />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-5 w-44 bg-[var(--ks-surface-soft)] rounded" />
                <div className="h-3 w-32 bg-[var(--ks-surface-soft)] rounded" />
                <div className="h-2 w-full bg-[var(--ks-surface-soft)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && enrollments.length === 0) {
    return (
      <StateMessage
        variant="error"
        title="Could not load My Learning"
        onRetry={() => setReloadKey((k) => k + 1)}
      >
        {error}
      </StateMessage>
    )
  }

  const recentActivities = analytics?.recent_activity || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7 text-[#241A16] pb-16">
      {/* 1. EDITORIAL PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b-[1.5px] border-[#241A16]/10">
        <div>
          <div className="ks-eyebrow flex items-center gap-1.5">
            {statusFilter === 'saved' ? (
              <>
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span>SAVED & BOOKMARKS</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>STUDENT SPACE</span>
              </>
            )}
          </div>
          <h1 className="ks-page-title mt-1">
            {statusFilter === 'saved' ? 'Saved Content' : 'My Learning'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F625B] mt-1 max-w-xl leading-relaxed">
            {statusFilter === 'saved'
              ? 'Access your bookmarked courses, saved lessons, and AI-generated study notes in one dedicated workspace.'
              : 'Manage your enrolled courses, resume active lessons, inspect progress, and organize your learning journey.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/courses"
            className="ks-neo-btn-primary"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Catalog →</span>
          </Link>
        </div>
      </div>

      {/* 2. COMPACT TOP LEARNING SUMMARY STRIP */}
      <section aria-label="Learning Summary">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <NeoMetricCard
            label="Courses"
            value={inProgressCount}
            description="in progress"
            icon={BookOpen}
          />
          <NeoMetricCard
            label="Lessons"
            value={totalLessonsCompleted}
            description="completed"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
          />
          <NeoMetricCard
            label="Overall"
            value={`${overallProgress}%`}
            description="completion rate"
            icon={Award}
          />
          <NeoMetricCard
            label="Saved"
            value={totalSavedCount}
            description={`${totalSavedCount === 1 ? 'item saved' : 'items saved'} →`}
            icon={Bookmark}
            onClick={() => navigate('/student/saved-content')}
            className="hover:border-[#F16524]"
          />
        </div>
      </section>

      {/* 3. CONTINUE LEARNING SPOTLIGHT */}
      {statusFilter !== 'saved' && activeEnrollment && (
        <section
          aria-label="Continue Learning"
          className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#241A16]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F16524] border border-[#241A16]" />
              <span>CONTINUE LEARNING</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#241A16] bg-[#FAF8F5] px-2 py-0.5 rounded-[3px] border border-[#241A16] self-start sm:self-auto">
              {activeEnrollment.course?.category || 'Web Development'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7 space-y-1">
              <Link
                to={`/courses/${activeEnrollment.course_id}`}
                className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] block hover:text-[#F16524] transition-colors leading-tight"
              >
                {activeEnrollment.course?.title || activeEnrollment.course_title}
              </Link>
              <p className="font-mono text-xs text-neutral-600 mt-1 leading-relaxed">
                {activeEnrollment.next_lesson
                  ? `Next: ${activeEnrollment.next_lesson.title} • Lesson ${(activeEnrollment.completed_lessons || 0) + 1} of ${activeEnrollment.total_lessons || 0}`
                  : (activeEnrollment.progress ?? 0) >= 100
                  ? '🎉 All lessons completed!'
                  : 'Resume your active lessons'}
              </p>

              <div className="pt-2 space-y-1 max-w-md">
                <div className="flex justify-between font-mono text-[11px] text-neutral-600">
                  <span className="font-bold text-[#241A16]">
                    {activeEnrollment.progress ?? 0}% completed
                  </span>
                  <span>
                    {activeEnrollment.completed_lessons ?? 0} of {activeEnrollment.total_lessons ?? 0} lessons done
                  </span>
                </div>
                <ProgressBar value={activeEnrollment.progress ?? 0} />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center justify-start lg:justify-end gap-2.5">
              <Link
                to={`/courses/${activeEnrollment.course_id}`}
                className="px-3.5 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] transition-all"
              >
                Course Syllabus
              </Link>
              <Link
                to={
                  activeEnrollment.next_lesson
                    ? `/courses/${activeEnrollment.course_id}/lessons/${activeEnrollment.next_lesson.id}`
                    : `/courses/${activeEnrollment.course_id}`
                }
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] border-2 border-[#241A16] bg-[#F16524] text-white font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#241A16] hover:bg-[#d95318] transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Continue Learning →</span>
              </Link>
            </div>
          </div>

          {/* Quick-switch row for other active courses in progress */}
          {otherActiveEnrollments.length > 0 && (
            <div className="pt-3 border-t-[1.5px] border-[#241A16]/20 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 shrink-0">
                Other in progress:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {otherActiveEnrollments.map((oe) => (
                  <Link
                    key={oe.course_id}
                    to={
                      oe.next_lesson
                        ? `/courses/${oe.course_id}/lessons/${oe.next_lesson.id}`
                        : `/courses/${oe.course_id}`
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border-[1.5px] border-[#241A16] bg-white font-mono text-xs text-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] transition-colors"
                    title={`Switch to ${oe.course_title}`}
                  >
                    <BookOpen className="w-3 h-3 text-[#F16524]" />
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">
                      {oe.course_title}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold">
                      {oe.progress ?? 0}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. MY COURSES & SAVED HUB */}
      <section className="space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524]">
              {statusFilter === 'saved' ? (
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{statusFilter === 'saved' ? 'BOOKMARKED MATERIALS' : 'STUDENT ENROLLMENTS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#241A16] tracking-tight leading-tight mt-1 font-normal">
              {statusFilter === 'saved'
                ? `Saved Content (${totalSavedCount})`
                : `My Courses (${enrollments.length})`}
            </h2>
            <p className="font-mono text-xs text-neutral-600 mt-1 max-w-xl leading-relaxed">
              {statusFilter === 'saved'
                ? 'Your bookmarked courses, lessons, and personalized AI study notes.'
                : 'All courses organized by learning status and progress.'}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] sm:min-w-[260px] self-stretch md:self-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={statusFilter === 'saved' ? 'Search saved items...' : 'Search my courses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[6px] border-[1.5px] border-[#241A16] bg-white pl-8 pr-7 py-2 font-mono text-xs text-[#241A16] placeholder:text-neutral-400 shadow-[2px_2px_0_#241A16] focus:border-[#F16524] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#241A16] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Editorial Tab Strip */}
        <div className="border-b-2 border-[#241A16] flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-0">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'all'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {enrollments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('in_progress')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_progress'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <PlayCircle className="w-4 h-4 shrink-0" />
            <span>In Progress</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'in_progress'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {inProgressCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('planning')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'planning'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Planning</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'planning'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {planningCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('want_to_study')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'want_to_study'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Want to Study</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'want_to_study'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {wantToStudyCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('completed')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'completed'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('saved')}
            className={`py-3 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              statusFilter === 'saved'
                ? 'border-[#F16524] text-[#F16524] bg-white/40'
                : 'border-transparent text-neutral-500 hover:text-[#241A16]'
            }`}
          >
            <Bookmark className="w-4 h-4 shrink-0" />
            <span>Saved</span>
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border font-mono text-[10px] font-bold ${
                statusFilter === 'saved'
                  ? 'border-[#241A16] bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                  : 'border-[#241A16]/30 bg-[#FAF8F5] text-neutral-600'
              }`}
            >
              {totalSavedCount}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: SAVED TAB (Courses, Lessons, Notes) */}
        {/* ========================================================================= */}
        {statusFilter === 'saved' ? (
          <div className="space-y-6">
            {/* Sub-navigation Segmented Control */}
            <div className="flex items-center gap-2 border-b-[1.5px] border-[#241A16]/10 pb-3 text-xs">
              <button
                type="button"
                onClick={() => setSavedSection('courses')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  savedSection === 'courses'
                    ? 'border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1.5px_1.5px_0_#241A16]'
                    : 'border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-neutral-600 hover:border-[#241A16]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Saved Courses ({savedCourses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedSection('lessons')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  savedSection === 'lessons'
                    ? 'border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1.5px_1.5px_0_#241A16]'
                    : 'border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-neutral-600 hover:border-[#241A16]'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Saved Lessons ({savedLessons.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedSection('notes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  savedSection === 'notes'
                    ? 'border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1.5px_1.5px_0_#241A16]'
                    : 'border-[1.5px] border-[rgba(36,26,22,0.18)] bg-white text-neutral-600 hover:border-[#241A16]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Saved Notes ({savedNotes.length})</span>
              </button>
            </div>

            {/* 1. Saved Courses Sub-view */}
            {savedSection === 'courses' && (
              <div>
                {savedCourses.length === 0 ? (
                  <div className="rounded-lg border-[1.5px] border-dashed border-[rgba(36,26,22,0.25)] bg-white p-8 text-center space-y-3 max-w-xl mx-auto my-4">
                    <Bookmark className="mx-auto w-8 h-8 text-[#8C827A]" />
                    <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">
                      No saved courses yet
                    </h3>
                    <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                      Save courses you want to study later. Click the &quot;Save Course&quot; button on
                      any course card or course page.
                    </p>
                    <Link
                      to="/courses"
                      className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedCourses.map((item) => {
                      const course = item.course || {}
                      const enroll = enrollments.find((e) => e.course_id === item.course_id)
                      const progress = Math.round(enroll?.progress ?? 0)
                      const isCompleted = progress >= 100

                      return (
                        <div
                          key={item.id}
                          className="ks-neo-card rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white flex flex-col justify-between overflow-hidden transition-all duration-150"
                        >
                          {/* Course Thumbnail */}
                          <div className="relative h-32 w-full overflow-hidden bg-[#FAF8F5] border-b-[1.5px] border-[#241A16]">
                            <img
                              src={getCourseCover(course)}
                              alt={course.title || 'Course'}
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                const fallback = getCourseCover(course)
                                if (e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback
                                }
                              }}
                            />
                            <div className="absolute top-2.5 left-2.5">
                              <span className="rounded-[4px] border border-[#241A16] bg-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#241A16] shadow-[1px_1px_0_#241A16]">
                                {course.category || 'Web Development'}
                              </span>
                            </div>
                            <div className="absolute top-2.5 right-2.5">
                              <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-[#FFF2E6] text-[#F16524] px-2 py-0.5 text-[10px] font-mono font-bold shadow-[1px_1px_0_#241A16]">
                                <BookmarkCheck className="w-3 h-3" />
                                <span>Saved</span>
                              </span>
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 flex flex-1 flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <Link
                                to={`/courses/${item.course_id}`}
                                className="ks-card-title block text-base sm:text-lg font-serif font-normal text-[#241A16] hover:text-[#F16524] transition-colors leading-snug line-clamp-1"
                              >
                                {course.title || `Course #${item.course_id}`}
                              </Link>

                              {course.description && (
                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              )}

                              {enroll && (
                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <ProgressBar value={progress} />
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-[rgba(36,26,22,0.12)] flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleUnsaveCourse(item.course_id)}
                                className="text-xs font-semibold text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                Remove
                              </button>

                              <Link
                                to={`/courses/${item.course_id}`}
                                className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                              >
                                <span>
                                  {isCompleted
                                    ? 'Review Course →'
                                    : progress > 0
                                    ? 'Continue →'
                                    : 'Start Course →'}
                                </span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. Saved Lessons Sub-view */}
            {savedSection === 'lessons' && (
              <div>
                {savedLessons.length === 0 ? (
                  <div className="rounded-lg border-[1.5px] border-dashed border-[rgba(36,26,22,0.25)] bg-white p-8 text-center space-y-3 max-w-xl mx-auto my-4">
                    <PlayCircle className="mx-auto w-8 h-8 text-[#8C827A]" />
                    <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">
                      No saved lessons yet
                    </h3>
                    <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                      Save individual lessons during your study sessions by clicking &quot;Save Lesson&quot;
                      for instant access.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedLessons.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16] hover:shadow-[2px_3px_0_#241A16] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                              {item.course_title}
                            </span>
                            {item.duration_minutes != null && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500">
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>{item.duration_minutes} min</span>
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                            className="block font-serif font-normal text-base sm:text-lg text-[#241A16] hover:text-[#F16524] transition-colors truncate"
                          >
                            {item.lesson_title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUnsaveLesson(item.lesson_id)}
                            className="text-xs font-semibold text-neutral-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                          <Link
                            to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                            className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                          >
                            <span>Go to Lesson</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Saved Notes Sub-view */}
            {savedSection === 'notes' && (
              <div>
                {savedNotes.length === 0 ? (
                  <div className="rounded-lg border-[1.5px] border-dashed border-[rgba(36,26,22,0.25)] bg-white p-8 text-center space-y-3 max-w-xl mx-auto my-4">
                    <FileText className="mx-auto w-8 h-8 text-[#8C827A]" />
                    <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">
                      No saved notes yet
                    </h3>
                    <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                      Generate comprehensive study notes for any lesson and click &quot;Save Notes&quot; to
                      build your revision notebook.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16] hover:shadow-[2px_3px_0_#241A16] bg-white p-5 space-y-3 transition-all duration-150"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                                {note.course_title}
                              </span>
                              <span className="text-xs text-neutral-400">•</span>
                              <span className="text-xs text-neutral-600">
                                {note.lesson_title}
                              </span>
                            </div>
                            <h3 className="ks-card-title text-base sm:text-lg font-serif font-normal text-[#241A16] mt-0.5">
                              {note.topic || note.lesson_title}
                            </h3>
                          </div>

                          <span className="text-[11px] font-mono text-neutral-500">
                            Saved {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        {note.content?.topic_overview && (
                          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed bg-[#FAF8F5] p-3 rounded-md border-[1.5px] border-[rgba(36,26,22,0.12)]">
                            {note.content.topic_overview}
                          </p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(36,26,22,0.12)]">
                          <button
                            type="button"
                            onClick={() => handleUnsaveNote(note.lesson_id)}
                            className="text-xs font-semibold text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(note)}
                              className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#F16524]" />
                              <span>Download PDF</span>
                            </button>

                            <Link
                              to={`/courses/${note.course_id}/lessons/${note.lesson_id}`}
                              className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Open Notes</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: COURSE STATUS TABS (All, In Progress, Planning, Want to Study, Completed) */
          /* ========================================================================= */
          <div>
            {displayedItems.length === 0 ? (
              <div className="rounded-lg border-[1.5px] border-dashed border-[rgba(36,26,22,0.25)] bg-white p-8 text-center space-y-3 max-w-xl mx-auto my-4">
                <BookOpen className="mx-auto w-8 h-8 text-[#8C827A]" />
                <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">
                  {searchQuery
                    ? 'No matching courses found'
                    : statusFilter === 'all'
                    ? 'No courses yet'
                    : statusFilter === 'in_progress'
                    ? 'No courses in progress'
                    : statusFilter === 'completed'
                    ? 'No completed courses yet'
                    : statusFilter === 'planning'
                    ? 'No courses in planning'
                    : 'No courses in want to study'}
                </h3>
                <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                  {searchQuery ? (
                    `No courses matched "${searchQuery}". Try searching with a different keyword.`
                  ) : statusFilter === 'all' ? (
                    'You have not enrolled in any courses yet. Explore our curriculum to get started.'
                  ) : statusFilter === 'completed' ? (
                    'Keep learning to see your completed courses and achievements here.'
                  ) : statusFilter === 'planning' ? (
                    'Plan upcoming courses from the catalog or course pages to schedule your learning.'
                  ) : (
                    'Mark courses you want to study later to view them here.'
                  )}
                </p>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link
                    to="/courses"
                    className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                  >
                    <span>Explore Courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedItems.map(({ course, enrollment }) => {
                  const progress = Math.round(enrollment?.progress ?? 0)
                  const isCompleted = progress >= 100
                  const courseId = course?.id || enrollment?.course_id
                  const lessonPosition = (enrollment?.completed_lessons ?? 0) + 1

                  return (
                    <div
                      key={courseId}
                      className="ks-neo-card group rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white flex flex-col justify-between overflow-hidden transition-all duration-150"
                    >
                      {/* Course Image Header */}
                      <div className="relative h-32 w-full overflow-hidden bg-[#FAF8F5] border-b-[1.5px] border-[#241A16]">
                        <img
                          src={getCourseCover(course)}
                          alt={course?.title || 'Course'}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const fallback = getCourseCover(course)
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback
                            }
                          }}
                        />

                        {/* Top-left category badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="rounded-[4px] border border-[#241A16] bg-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#241A16] shadow-[1px_1px_0_#241A16]">
                            {course?.category || 'Web Development'}
                          </span>
                        </div>

                        {/* Top-right status badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold shadow-[1px_1px_0_#241A16]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>100% Done</span>
                            </span>
                          ) : enrollment ? (
                            <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-[#FFF2E6] text-[#F16524] px-2 py-0.5 text-[10px] font-mono font-bold shadow-[1px_1px_0_#241A16]">
                              <span>{progress}% complete</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-mono font-bold shadow-[1px_1px_0_#241A16]">
                              <span>
                                {statusFilter === 'planning' ? 'Planning' : 'Want to Study'}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 flex flex-1 flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <Link
                            to={`/courses/${courseId}`}
                            className="ks-card-title block text-base sm:text-lg font-serif font-normal text-[#241A16] hover:text-[#F16524] transition-colors leading-snug line-clamp-1"
                            title={course?.title || enrollment?.course_title}
                          >
                            {course?.title || enrollment?.course_title}
                          </Link>

                          {/* Enrolled course status box */}
                          {enrollment ? (
                            <div className="space-y-2">
                              {!isCompleted && enrollment.next_lesson ? (
                                <div className="rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.14)] px-3 py-2 text-xs">
                                  <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold tracking-wider text-[#8C827A] mb-0.5">
                                    <span>Up Next</span>
                                    <span>
                                      Lesson {lessonPosition} of {enrollment.total_lessons}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-[#241A16] truncate">
                                    {enrollment.next_lesson.title}
                                  </p>
                                </div>
                              ) : isCompleted ? (
                                <div className="rounded-md bg-emerald-50 border-[1.5px] border-emerald-300 px-3 py-2 text-xs">
                                  <p className="font-semibold text-emerald-800">
                                    🎉 All {enrollment.total_lessons} lessons completed!
                                  </p>
                                  {enrollment.completed_at && (
                                    <p className="text-[10px] text-emerald-700/80 mt-0.5 font-mono">
                                      Completed on {formatDate(enrollment.completed_at)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                  {course?.description || 'Curriculum lessons ready to explore.'}
                                </p>
                              )}

                              {/* Progress bar */}
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                                  <span>{isCompleted ? 'Completed' : 'Progress'}</span>
                                  <span>
                                    {enrollment.completed_lessons ?? 0} /{' '}
                                    {enrollment.total_lessons ?? 0} lessons
                                  </span>
                                </div>
                                <ProgressBar value={progress} />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {course?.description && (
                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              )}
                              <p className="text-[11px] text-[#8C827A] pt-1 font-medium">
                                {statusFilter === 'planning'
                                  ? 'Planned curriculum for upcoming study sessions'
                                  : 'Saved for future exploration'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-3 border-t border-[rgba(36,26,22,0.12)] flex items-center justify-between gap-2">
                          {enrollment ? (
                            <button
                              type="button"
                              onClick={() => setUnenrollTarget(enrollment)}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Unenroll from this course"
                              aria-label="Unenroll from this course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <div />
                          )}

                          <div className="flex items-center gap-2">
                            <Link
                              to={`/courses/${courseId}`}
                              className="ks-neo-btn-secondary px-3 py-1.5 text-xs font-bold"
                            >
                              Overview
                            </Link>

                            <Link
                              to={
                                enrollment?.next_lesson
                                  ? `/courses/${courseId}/lessons/${enrollment.next_lesson.id}`
                                  : `/courses/${courseId}`
                              }
                              className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>
                                {isCompleted
                                  ? 'Review Course →'
                                  : progress > 0
                                  ? 'Continue →'
                                  : 'Start Course →'}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. SAVED CONTENT SUMMARY & RECENT LEARNING (Shown when not on saved tab) */}
      {statusFilter !== 'saved' && (
        <section
          aria-label="Saved Materials and Activity"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* Saved Content Quick Summary Card (5 cols) */}
          <div className="ks-neo-card lg:col-span-5 rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(36,26,22,0.12)]">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#F16524] block">
                    SAVED CONTENT
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Bookmark className="w-4 h-4 text-[#F16524]" />
                    <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16] leading-tight">
                      {totalSavedCount} Saved {totalSavedCount === 1 ? 'Item' : 'Items'}
                    </h3>
                  </div>
                </div>
                <Link
                  to="/student/saved-content"
                  className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Saved</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3.5">
                <Link
                  to="/student/saved-content?tab=courses"
                  className="p-3 rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.14)] hover:border-[#241A16] hover:bg-[#FFF2E6] transition-all text-center group cursor-pointer block"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFF2E6] text-[#F16524] mx-auto mb-1">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-base font-bold text-[#241A16] group-hover:text-[#F16524] transition-colors leading-none">
                    {savedCourses.length}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">Courses</p>
                </Link>

                <Link
                  to="/student/saved-content?tab=lessons"
                  className="p-3 rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.14)] hover:border-[#241A16] hover:bg-[#FFF2E6] transition-all text-center group cursor-pointer block"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600 mx-auto mb-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-base font-bold text-[#241A16] group-hover:text-sky-600 transition-colors leading-none">
                    {savedLessons.length}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">Lessons</p>
                </Link>

                <Link
                  to="/student/saved-content?tab=notes"
                  className="p-3 rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.14)] hover:border-[#241A16] hover:bg-[#FFF2E6] transition-all text-center group cursor-pointer block"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600 mx-auto mb-1">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-base font-bold text-[#241A16] group-hover:text-purple-600 transition-colors leading-none">
                    {savedNotes.length}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">AI Notes</p>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(36,26,22,0.12)] text-[11px] text-neutral-500 flex items-center justify-between font-medium">
              <span>Organized for quick access</span>
              <Link
                to="/student/saved-content"
                className="text-[#F16524] font-bold hover:underline cursor-pointer"
              >
                Manage all →
              </Link>
            </div>
          </div>

          {/* Recent Learning Activity Feed (7 cols) */}
          <div className="ks-neo-card lg:col-span-7 rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(36,26,22,0.12)]">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#F16524] block">
                    RECENT LEARNING
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Activity className="w-4 h-4 text-[#F16524]" />
                    <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16] leading-tight">
                      Recent Activity
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  {recentActivities.length > 0
                    ? `${recentActivities.length} recent ${recentActivities.length === 1 ? 'event' : 'events'}`
                    : 'Synced'}
                </span>
              </div>

              {recentActivities.length > 0 ? (
                <div className="divide-y divide-[rgba(36,26,22,0.12)] mt-1">
                  {recentActivities.slice(0, 4).map((event, idx) => (
                    <div key={idx} className="py-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="rounded-[4px] border border-[#241A16] bg-[#FFF2E6] px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                          {ACTIVITY_LABELS[event.event_type] || event.event_type}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {event.timestamp
                            ? new Date(event.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="font-semibold text-[#241A16] leading-tight">
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-600 border-[1.5px] border-dashed border-[rgba(36,26,22,0.2)] bg-[#FAF8F5] p-3 rounded-lg mt-3">
                  <p className="font-medium text-[#241A16]">
                    Your recent learning activity will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[rgba(36,26,22,0.12)] text-[11px] text-neutral-500 font-medium">
              <span>Automatically synchronized across all course lessons and quizzes</span>
            </div>
          </div>
        </section>
      )}

      {/* 6. LEARNING PATHWAY (SEQUENTIAL ROADMAP) */}
      <section className="space-y-3 pt-2" aria-label="Learning Pathway">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#F16524]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>SUGGESTED LEARNING ROUTE</span>
          </div>
          <h2 className="ks-page-title text-2xl sm:text-3xl font-serif font-normal text-[#241A16] tracking-tight leading-tight mt-1">
            Web Development Learning Path
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
            A structured path from core web basics to advanced full-stack application development.
          </p>
        </div>

        <LearningJourney enrollments={enrollments} courses={courses} />
      </section>

      {/* 7. SUGGESTED COURSE (Rendered only if real recommendation exists) */}
      {recommendation && (recommendation.course_title || recommendation.course_id) && (
        <section
          aria-label="Suggested Course"
          className="ks-neo-card rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#F16524] block">
              SUGGESTED COURSE
            </span>
            <h3 className="ks-card-title text-xl sm:text-2xl font-serif font-normal text-[#241A16] leading-tight mt-1">
              {recommendation.course_title}
            </h3>
            {recommendation.explanation ? (
              <p className="text-xs text-neutral-600 max-w-xl leading-relaxed mt-1">
                {recommendation.explanation}
              </p>
            ) : recommendation.category ? (
              <p className="text-xs text-neutral-600 max-w-xl leading-relaxed mt-1">
                Curated recommendation based on your current {recommendation.category} study progress.
              </p>
            ) : null}
          </div>
          <Link
            to={`/courses/${recommendation.course_id}`}
            className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold shrink-0 self-start sm:self-auto"
          >
            <span>Explore Course →</span>
          </Link>
        </section>
      )}

      {/* 8. CONFIRMATION DIALOG FOR UNENROLLING */}
      <ConfirmDialog
        open={Boolean(unenrollTarget)}
        title="Unenroll from Course?"
        message={`Unenrolling from "${unenrollTarget?.course_title}" will reset your active course progress and remove it from your in-progress list. However, your lifetime XP, daily streak, and unlocked achievements will remain completely preserved.`}
        confirmText={isUnenrolling ? 'Unenrolling...' : 'Yes, Unenroll'}
        cancelText="Cancel"
        onConfirm={handleConfirmUnenroll}
        onCancel={() => setUnenrollTarget(null)}
      />
    </div>
  )
}
