import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { getApiErrorMessage } from '../../services/api.js'
import { getCourse } from '../../services/courseService.js'
import { listModules } from '../../services/moduleService.js'
import { listLessons } from '../../services/lessonService.js'
import {
  enrollInCourse,
  getMyEnrollment,
  unenrollFromCourse,
} from '../../services/enrollmentService.js'
import {
  getSavedOverview,
  saveCourse,
  unsaveCourse,
  updateCourseStatus,
} from '../../services/savedService.js'
import { ROLES, isRoleAllowed } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import EnrollmentPanel from '../../components/learning/EnrollmentPanel.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import StateMessage from '../../components/StateMessage.jsx'
import { getCourseCover } from '../../utils/courseCovers.js'

function LessonDetails({ lesson, courseId }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] shadow-[2px_2px_0_#241A16] transition-all hover:bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer select-none"
      >
        <span className="font-sans font-bold text-xs sm:text-sm text-[#241A16]">
          <span className="mr-2 font-mono text-neutral-400">{lesson.order_number}.</span>
          {lesson.title}
        </span>
        <span className="flex shrink-0 items-center gap-2.5 text-xs text-neutral-500 font-mono">
          {lesson.duration_minutes != null && <span>{lesson.duration_minutes} min</span>}
          {lesson.quiz_id && (
            <span className="rounded-[3px] border border-[#241A16] bg-[#FFF2E6] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              Quiz
            </span>
          )}
          <span className={`transition-transform font-bold text-[#241A16] ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && (
        <div className="border-t-[1.5px] border-[#241A16] bg-white px-4 py-4">
          {lesson.description && (
            <p className="mb-3 text-xs sm:text-sm text-neutral-600">{lesson.description}</p>
          )}
          {lesson.content && (
            <div className="mb-3 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-neutral-700">
              {lesson.content}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs font-mono font-bold">
            {lesson.video_url && (
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#F16524] hover:underline"
              >
                Watch video ↗
              </a>
            )}
            {lesson.resource_url && (
              <a
                href={lesson.resource_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#F16524] hover:underline"
              >
                Open resource ↗
              </a>
            )}
            {lesson.quiz_id && courseId && (
              <Link
                to={`/student/quiz/${lesson.quiz_id}?courseId=${courseId}&lessonId=${lesson.id}`}
                className="text-[#F16524] hover:underline"
              >
                Take Quiz →
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isStudent = isRoleAllowed(user?.role, [ROLES.STUDENT])

  const [course, setCourse] = useState(null)
  const [tree, setTree] = useState([])
  const [enrollment, setEnrollment] = useState(undefined)
  const [isSaved, setIsSaved] = useState(false)
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [courseStatus, setCourseStatus] = useState('')
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false)
  const [enrollmentBusy, setEnrollmentBusy] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const [data, modules, savedOverview] = await Promise.all([
          getCourse(courseId),
          listModules(courseId),
          isStudent ? getSavedOverview().catch(() => null) : Promise.resolve(null),
        ])
        const withLessons = await Promise.all(
          modules.map(async (mod) => ({
            module: mod,
            lessons: await listLessons(courseId, mod.id),
          })),
        )
        let enroll = null
        if (isStudent) {
          try {
            enroll = await getMyEnrollment(courseId)
          } catch (err) {
            if (err?.response?.status !== 404) {
              throw err
            }
          }
        }
        if (!active) return
        setCourse(data)
        setTree(withLessons)
        setEnrollment(enroll)
        if (savedOverview) {
          setIsSaved(savedOverview.saved_course_ids?.includes(Number(courseId)) || false)
          if (savedOverview.course_statuses?.[courseId]) {
            setCourseStatus(savedOverview.course_statuses[courseId])
          } else if (enroll) {
            setCourseStatus((enroll.progress ?? 0) >= 100 ? 'completed' : 'in_progress')
          } else {
            setCourseStatus('want_to_study')
          }
        }
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
  }, [courseId, isStudent])

  async function handleToggleSave() {
    if (isSavingCourse) return
    setIsSavingCourse(true)
    try {
      if (isSaved) {
        await unsaveCourse(courseId)
        setIsSaved(false)
      } else {
        await saveCourse(courseId)
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Failed to toggle save course', err)
    } finally {
      setIsSavingCourse(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setCourseStatus(newStatus)
    try {
      await updateCourseStatus(courseId, newStatus)
    } catch (err) {
      console.error('Failed to update course status', err)
    }
  }

  async function handleEnroll() {
    setEnrollmentBusy(true)
    setEnrollmentError('')
    try {
      await enrollInCourse(courseId)
      // POST returns plain EnrollmentResponse; fetch enriched detail for panel
      const detail = await getMyEnrollment(courseId)
      setEnrollment(detail)
      setCourseStatus('in_progress')
    } catch (err) {
      const message = getApiErrorMessage(err)
      // 409 duplicate enrollment -> refresh instead of page-level error
      if (err?.response?.status === 409) {
        try {
          const detail = await getMyEnrollment(courseId)
          setEnrollment(detail)
          setEnrollmentError('')
          setCourseStatus('in_progress')
          return
        } catch {
          // fall through to show message
        }
      }
      setEnrollmentError(message)
    } finally {
      setEnrollmentBusy(false)
    }
  }

  async function handleConfirmUnenroll() {
    setEnrollmentBusy(true)
    setEnrollmentError('')
    try {
      await unenrollFromCourse(courseId)
      setEnrollment(null)
      setShowUnenrollConfirm(false)
    } catch (err) {
      setEnrollmentError(getApiErrorMessage(err))
    } finally {
      setEnrollmentBusy(false)
    }
  }

  function handleContinue(lessonId) {
    navigate(`/courses/${courseId}/lessons/${lessonId}`)
  }

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading course..." />
  }

  if (error) {
    return (
      <StateMessage variant="error" title="Course not available">
        {error}
      </StateMessage>
    )
  }

  const difficultyLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty

  const totalModulesCount = tree.length
  const totalLessonsCount = tree.reduce((acc, item) => acc + item.lessons.length, 0)
  const totalDurationMinutes = tree.reduce(
    (acc, item) => acc + item.lessons.reduce((lAcc, l) => lAcc + (l.duration_minutes || 0), 0),
    0,
  )

  const formatDuration = (mins) => {
    if (!mins) return null
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    if (hrs === 0) return `${remMins} min`
    if (remMins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${remMins} min`
  }

  return (
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-[1.5px] border-[#241A16]">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#F16524] hover:text-[#241A16] transition-colors"
          >
            ← Back to courses
          </Link>

          {isStudent && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Learning Status Dropdown */}
              <div className="flex items-center gap-2 rounded-[6px] border-[1.5px] border-[#241A16] bg-white px-3 py-1.5 text-xs shadow-[1.5px_1.5px_0_#241A16]">
                <span className="text-neutral-500 font-mono font-bold uppercase text-[10px]">Status:</span>
                <select
                  value={courseStatus || (enrollment ? (enrollment.progress >= 100 ? 'completed' : 'in_progress') : 'want_to_study')}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent font-sans font-bold text-xs text-[#241A16] outline-none cursor-pointer"
                >
                  <option value="want_to_study">Want to Study</option>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Save Course Button */}
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={isSavingCourse}
                className={`inline-flex items-center gap-1.5 rounded-[6px] border-[1.5px] border-[#241A16] px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition shadow-[1.5px_1.5px_0_#241A16] cursor-pointer ${
                  isSaved
                    ? 'bg-[#FFF2E6] text-[#F16524] hover:bg-[#FFE8D2]'
                    : 'bg-white text-[#241A16] hover:bg-[#FAF8F5]'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5 text-[#F16524]" />
                    <span>✓ Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>♡ Save Course</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <img
            src={getCourseCover(course)}
            alt={course.title ? `${course.title} Cover` : 'Course Cover'}
            className="mb-5 h-60 sm:h-72 w-full rounded-[8px] border-[1.5px] border-[#241A16] object-cover shadow-[2.5px_2.5px_0_#241A16]"
            loading="lazy"
            onError={(e) => {
              const fallback = getCourseCover(course)
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback
              }
            }}
          />

          <div className="flex items-center gap-2 mb-1">
            <span className="ks-eyebrow">CURRICULUM</span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
          </div>

          <h1 className="ks-page-title mt-1">{course.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            {course.category && (
              <span className="rounded-[4px] border border-[#241A16] bg-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#241A16]">
                {course.category}
              </span>
            )}
            <span className="rounded-[4px] border border-[#241A16] bg-[#FFF2E6] px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              {difficultyLabel}
            </span>
            {!course.published && (
              <span className="rounded-[4px] border border-amber-600 bg-amber-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                Unpublished
              </span>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 flex flex-wrap items-center gap-6 rounded-[8px] border-2 border-[#241A16] bg-white p-4 shadow-[4px_4px_0_#241A16]">
            <div>
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Modules</span>
              <span className="ks-metric-number">{totalModulesCount}</span>
            </div>
            <div className="h-8 w-[1.5px] bg-[#241A16]/20" />
            <div>
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Lessons</span>
              <span className="ks-metric-number">{totalLessonsCount}</span>
            </div>
            {totalDurationMinutes > 0 && (
              <>
                <div className="h-8 w-[1.5px] bg-[#241A16]/20" />
                <div>
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Total Duration</span>
                  <span className="ks-metric-number text-lg sm:text-xl">{formatDuration(totalDurationMinutes)}</span>
                </div>
              </>
            )}
          </div>

          {course.description && (
            <p className="mt-5 max-w-3xl leading-relaxed text-sm sm:text-base text-neutral-700">{course.description}</p>
          )}
        </div>
      </div>

      {isStudent && enrollment !== undefined && (
        <>
          {enrollmentError && (
            <p role="alert" className="rounded-lg border-[1.5px] border-rose-500 bg-rose-50 px-4 py-3 text-xs font-mono font-bold text-rose-700">
              {enrollmentError}
            </p>
          )}
          <EnrollmentPanel
            enrollment={enrollment}
            isBusy={enrollmentBusy}
            onEnroll={handleEnroll}
            onUnenroll={() => setShowUnenrollConfirm(true)}
            onContinue={handleContinue}
          />
        </>
      )}

      <div className="space-y-4">
        {tree.map(({ module, lessons }) => (
          <div key={module.id} className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] overflow-hidden">
            <div className="border-b-2 border-[#241A16] bg-[#FAF8F5] px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="ks-card-title text-base sm:text-lg text-[#241A16]">
                  <span className="mr-2 font-mono text-neutral-400">{module.order_number}.</span>
                  {module.title}
                </h2>
                {module.description && (
                  <p className="mt-1 text-xs text-neutral-600">{module.description}</p>
                )}
              </div>
              <span className="rounded-[3px] border border-[#241A16] bg-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#241A16]">
                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
              </span>
            </div>
            {lessons.length > 0 ? (
              <ul className="space-y-2 px-5 py-4">
                {lessons.map((lesson) => (
                  <LessonDetails key={lesson.id} lesson={lesson} courseId={courseId} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-xs font-mono text-neutral-500">No lessons yet.</p>
            )}
          </div>
        ))}
      </div>

      {tree.length === 0 && (
        <StateMessage variant="empty" title="No content yet">
          This course does not have any modules yet.
        </StateMessage>
      )}

      {/* Confirmation Dialog on Unenroll */}
      <ConfirmDialog
        open={showUnenrollConfirm}
        title="Unenroll from Course?"
        message={`Unenrolling from "${course?.title}" will reset your active course progress and remove it from your in-progress list. However, your lifetime XP, daily streak, and unlocked achievements will remain completely preserved.`}
        confirmText="Yes, Unenroll"
        cancelText="Cancel"
        isSubmitting={enrollmentBusy}
        onConfirm={handleConfirmUnenroll}
        onCancel={() => setShowUnenrollConfirm(false)}
      />
    </div>
  )
}