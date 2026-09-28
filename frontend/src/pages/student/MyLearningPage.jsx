import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  Layers,
} from 'lucide-react'
import { listMyEnrollments, unenrollFromCourse } from '../../services/enrollmentService.js'
import { listCourses } from '../../services/courseService.js'
import { getStudentRecommendation } from '../../services/recommendationService.js'
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
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard.jsx'

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [courseStatuses, setCourseStatuses] = useState({})
  const [savedCourses, setSavedCourses] = useState([])
  const [savedLessons, setSavedLessons] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'

  // Filters & Tabs
  // 'all' | 'in_progress' | 'planning' | 'want_to_study' | 'completed' | 'saved'
  const [statusFilter, setStatusFilter] = useState(initialTab)
  // 'courses' | 'lessons' | 'notes' (for 'saved' tab)
  const [savedSection, setSavedSection] = useState('courses')
  const [searchQuery, setSearchQuery] = useState('')

  const tabParam = searchParams.get('tab')
  useEffect(() => {
    if (tabParam) {
      setStatusFilter((prev) => (prev !== tabParam ? tabParam : prev))
    }
  }, [tabParam])

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
          recRes,
          savedCoursesRes,
          savedLessonsRes,
          savedNotesRes,
          savedOverviewRes,
        ] = await Promise.allSettled([
          listMyEnrollments(),
          listCourses(),
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

  // Active enrollment (next lesson to continue)
  const activeEnrollment = useMemo(() => {
    if (enrollments.length === 0) return null
    const inProgressWithNext = enrollments.find((e) => (e.progress ?? 0) < 100 && e.next_lesson)
    if (inProgressWithNext) return inProgressWithNext
    const anyInProgress = enrollments.find((e) => (e.progress ?? 0) < 100)
    if (anyInProgress) return anyInProgress
    return enrollments[0]
  }, [enrollments])

  // Aggregate stats
  const completedCount = useMemo(
    () => enrollments.filter((e) => (e.progress ?? 0) >= 100).length,
    [enrollments],
  )
  const inProgressCount = useMemo(
    () => enrollments.filter((e) => (e.progress ?? 0) < 100).length,
    [enrollments],
  )
  const planningCount = useMemo(
    () => Object.values(courseStatuses).filter((s) => s === 'PLANNING').length,
    [courseStatuses],
  )
  const wantToStudyCount = useMemo(
    () => Object.values(courseStatuses).filter((s) => s === 'WANT_TO_STUDY').length,
    [courseStatuses],
  )
  const totalSavedCount = savedCourses.length + savedLessons.length + savedNotes.length

  // Filtered enrollments / courses for current tab
  const displayedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (statusFilter === 'planning') {
      const planningCourseIds = new Set(
        Object.entries(courseStatuses)
          .filter(([, st]) => st === 'PLANNING')
          .map(([id]) => Number(id)),
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
          .map(([id]) => Number(id)),
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
          const titleMatch = (e.course_title || '').toLowerCase().includes(query)
          const nextLessonMatch = (e.next_lesson?.title || '').toLowerCase().includes(query)
          return titleMatch || nextLessonMatch
        }
        return true
      })
      .map((e) => {
        const course = courses.find((c) => c.id === e.course_id)
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

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading your courses and curriculum..." />
  }

  if (error && enrollments.length === 0) {
    return (
      <StateMessage variant="error" title="Could not load My Learning" onRetry={() => setReloadKey((k) => k + 1)}>
        {error}
      </StateMessage>
    )
  }

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto pb-12">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--ks-border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">Student Space</span>
          </div>
          <h1 className="ks-page-title mt-1">My Learning</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--ks-text-muted)] max-w-2xl leading-relaxed">
            Manage your enrolled courses, resume active lessons, inspect milestone progress, and organize your saved courses, lessons, and AI study notes.
          </p>
        </div>

        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Compass className="h-4 w-4" />
          <span>Browse Catalog</span>
        </Link>
      </div>

      {/* 2. CONTINUE LEARNING HERO (Only when not in 'saved' tab) */}
      {statusFilter !== 'saved' && enrollments.length > 0 && activeEnrollment && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ks-text-subtle)]">
              Continue Where You Left Off
            </h2>
          </div>
          <ContinueLearningCard
            recommendation={recommendation}
            activeEnrollment={activeEnrollment}
          />
        </section>
      )}

      {/* 3. COURSES & SAVED HUB */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="ks-section-title font-serif text-xl sm:text-2xl">
              {statusFilter === 'saved' ? `Saved Content (${totalSavedCount})` : `My Courses (${enrollments.length})`}
            </h2>
            <p className="text-xs text-[var(--ks-text-muted)]">
              {statusFilter === 'saved'
                ? 'Your bookmarked courses, lessons, and personalized AI study notes'
                : 'All courses organized by learning status and progress'}
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full md:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-1 text-xs whitespace-nowrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                All ({enrollments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('planning')}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'planning'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                Planning ({planningCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('want_to_study')}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'want_to_study'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                Want to Study ({wantToStudyCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('saved')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors ${
                  statusFilter === 'saved'
                    ? 'bg-[var(--ks-orange)] text-white shadow-xs'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                <Bookmark className="h-3 w-3" />
                <span>Saved ({totalSavedCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ks-text-subtle)]" />
              <input
                type="text"
                placeholder={statusFilter === 'saved' ? 'Search saved items...' : 'Search my courses...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--ks-text)] placeholder:text-[var(--ks-text-subtle)] focus:border-[var(--ks-orange)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: SAVED TAB (Courses, Lessons, Notes) */}
        {/* ========================================================================= */}
        {statusFilter === 'saved' ? (
          <div className="space-y-6">
            {/* Sub-navigation Segmented Control */}
            <div className="flex items-center gap-2 border-b border-[var(--ks-border)] pb-3 text-xs">
              <button
                type="button"
                onClick={() => setSavedSection('courses')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  savedSection === 'courses'
                    ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Saved Courses ({savedCourses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedSection('lessons')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  savedSection === 'lessons'
                    ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Saved Lessons ({savedLessons.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedSection('notes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  savedSection === 'notes'
                    ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                    : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Saved Notes ({savedNotes.length})</span>
              </button>
            </div>

            {/* 1. Saved Courses Sub-view */}
            {savedSection === 'courses' && (
              <div>
                {savedCourses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center space-y-3">
                    <Bookmark className="mx-auto h-8 w-8 text-[var(--ks-text-subtle)]" />
                    <h3 className="font-serif text-base text-[var(--ks-text)]">No saved courses yet</h3>
                    <p className="text-xs text-[var(--ks-text-muted)] max-w-sm mx-auto">
                      Save courses you want to study later. Click the "♡ Save Course" button on any course card or course page.
                    </p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
                          className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ks-orange)]/40 hover:shadow-sm transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
                                {course.category || 'Web Development'}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ks-orange)]">
                                <BookmarkCheck className="h-3 w-3" />
                                <span>Saved</span>
                              </span>
                            </div>

                            <Link
                              to={`/courses/${item.course_id}`}
                              className="block font-serif text-lg font-normal text-[var(--ks-text)] hover:text-[var(--ks-orange)] transition-colors leading-snug line-clamp-2"
                            >
                              {course.title || `Course #${item.course_id}`}
                            </Link>

                            {course.description && (
                              <p className="text-xs text-[var(--ks-text-muted)] line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                            )}

                            {enroll && (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-[11px] text-[var(--ks-text-muted)] font-medium">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <ProgressBar value={progress} />
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-[var(--ks-border)] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleUnsaveCourse(item.course_id)}
                              className="text-xs text-[var(--ks-text-muted)] hover:text-rose-600 transition-colors"
                            >
                              Remove from Saved
                            </button>

                            <Link
                              to={`/courses/${item.course_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs"
                            >
                              <span>
                                {isCompleted
                                  ? 'Review Course →'
                                  : progress > 0
                                  ? 'Continue Learning →'
                                  : 'Start Learning →'}
                              </span>
                            </Link>
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
                  <div className="rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center space-y-3">
                    <PlayCircle className="mx-auto h-8 w-8 text-[var(--ks-text-subtle)]" />
                    <h3 className="font-serif text-base text-[var(--ks-text)]">No saved lessons yet</h3>
                    <p className="text-xs text-[var(--ks-text-muted)] max-w-sm mx-auto">
                      Save individual lessons during your study sessions by clicking "♡ Save Lesson" for instant access.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedLessons.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--ks-orange)]/40 hover:shadow-xs transition"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                              {item.course_title}
                            </span>
                            {item.duration_minutes != null && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ks-text-subtle)]">
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{item.duration_minutes} min</span>
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                            className="block font-medium text-sm text-[var(--ks-text)] hover:text-[var(--ks-orange)] truncate"
                          >
                            {item.lesson_title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUnsaveLesson(item.lesson_id)}
                            className="text-xs text-[var(--ks-text-muted)] hover:text-rose-600 px-2 py-1 transition-colors"
                          >
                            Remove
                          </button>
                          <Link
                            to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--ks-orange)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ks-orange-light)] transition shadow-2xs"
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
                  <div className="rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center space-y-3">
                    <FileText className="mx-auto h-8 w-8 text-[var(--ks-text-subtle)]" />
                    <h3 className="font-serif text-base text-[var(--ks-text)]">No saved notes yet</h3>
                    <p className="text-xs text-[var(--ks-text-muted)] max-w-sm mx-auto">
                      Generate comprehensive study notes for any lesson and click "Save Notes" to build your revision notebook.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-3 hover:border-[var(--ks-orange)]/40 hover:shadow-xs transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                                {note.course_title}
                              </span>
                              <span className="text-xs text-[var(--ks-text-subtle)]">•</span>
                              <span className="text-xs text-[var(--ks-text-muted)]">{note.lesson_title}</span>
                            </div>
                            <h3 className="font-serif text-base font-semibold text-[var(--ks-text)] mt-0.5">
                              {note.topic || note.lesson_title}
                            </h3>
                          </div>

                          <span className="text-[11px] text-[var(--ks-text-subtle)]">
                            Saved {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        {note.content?.topic_overview && (
                          <p className="text-xs text-[var(--ks-text-muted)] line-clamp-2 leading-relaxed bg-[var(--ks-surface-soft)] p-3 rounded-lg border border-[var(--ks-border)]/50">
                            {note.content.topic_overview}
                          </p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ks-border)]/60">
                          <button
                            type="button"
                            onClick={() => handleUnsaveNote(note.lesson_id)}
                            className="text-xs text-[var(--ks-text-muted)] hover:text-rose-600 transition-colors"
                          >
                            Remove from Saved
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(note)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] hover:border-[var(--ks-orange)]/40 transition shadow-2xs"
                            >
                              <Download className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
                              <span>Download PDF</span>
                            </button>

                            <Link
                              to={`/courses/${note.course_id}/lessons/${note.lesson_id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ks-orange)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ks-orange-light)] transition shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
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
              <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center text-xs text-[var(--ks-text-muted)]">
                {statusFilter === 'all'
                  ? 'You are not enrolled in any courses yet. Explore our curriculum to get started.'
                  : `No courses currently in "${statusFilter.replace('_', ' ')}".`}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedItems.map(({ course, enrollment }) => {
                  const progress = Math.round(enrollment?.progress ?? 0)
                  const isCompleted = progress >= 100
                  const courseId = course?.id || enrollment?.course_id

                  return (
                    <div
                      key={courseId}
                      className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ks-orange)]/40 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-3">
                        {/* Top Row: Category + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
                            {course?.category || 'Web Development'}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Completed</span>
                            </span>
                          ) : enrollment ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-800">
                              <span>{progress}% complete</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-medium text-blue-700">
                              <span>{statusFilter === 'planning' ? 'Planning' : 'Want to Study'}</span>
                            </span>
                          )}
                        </div>

                        {/* Course Title */}
                        <Link
                          to={`/courses/${courseId}`}
                          className="block font-serif text-lg font-normal text-[var(--ks-text)] hover:text-[var(--ks-orange)] transition-colors leading-snug line-clamp-2"
                        >
                          {course?.title || enrollment?.course_title}
                        </Link>

                        {/* Progress Bar & Lessons Count if enrolled */}
                        {enrollment && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[11px] text-[var(--ks-text-muted)] font-medium">
                              <span>Progress</span>
                              <span>
                                {enrollment.completed_lessons ?? 0} / {enrollment.total_lessons ?? 0} lessons
                              </span>
                            </div>
                            <ProgressBar value={progress} />
                          </div>
                        )}

                        {!enrollment && course?.description && (
                          <p className="text-xs text-[var(--ks-text-muted)] line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}

                        {/* Next Lesson Box (if in progress) */}
                        {!isCompleted && enrollment?.next_lesson && (
                          <div className="rounded-lg bg-[var(--ks-bg-soft)] border border-[var(--ks-border)]/60 p-2.5 text-xs">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ks-text-subtle)] block mb-0.5">
                              Up Next
                            </span>
                            <p className="font-medium text-[var(--ks-text)] truncate">
                              {enrollment.next_lesson.title}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[var(--ks-border)] flex items-center justify-between gap-2">
                        {enrollment ? (
                          <button
                            type="button"
                            onClick={() => setUnenrollTarget(enrollment)}
                            className="p-1.5 rounded-md text-[var(--ks-text-subtle)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Unenroll from this course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/courses/${courseId}`}
                            className="px-3 py-1.5 rounded-md border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] transition-colors"
                          >
                            Overview
                          </Link>

                          <Link
                            to={
                              enrollment?.next_lesson
                                ? `/courses/${courseId}/lessons/${enrollment.next_lesson.id}`
                                : `/courses/${courseId}`
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>
                              {isCompleted
                                ? 'Review Course →'
                                : progress > 0
                                ? 'Continue Learning →'
                                : 'Start Learning →'}
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
      </section>

      {/* 4. LEARNING JOURNEY (SEQUENTIAL ROADMAP) */}
      <section className="space-y-3 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/25">
              ✨ SUGGESTED COURSE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--ks-orange)]" />
            <h2 className="ks-section-title font-serif text-xl sm:text-2xl">
              Web Development Learning Path
            </h2>
          </div>
          <p className="text-xs text-[var(--ks-text-muted)] mt-1">
            A structured path from core web basics to advanced full-stack application development.
          </p>
        </div>

        <LearningJourney enrollments={enrollments} courses={courses} />
      </section>

      {/* Confirmation Dialog for Unenrolling */}
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
