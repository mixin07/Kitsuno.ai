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

function LessonDetails({ lesson, courseId }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium text-[var(--ks-text)]">
          <span className="mr-2 text-[var(--ks-text-muted)]">{lesson.order_number}.</span>
          {lesson.title}
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-[var(--ks-text-muted)]">
          {lesson.duration_minutes != null && <span>{lesson.duration_minutes} min</span>}
          {lesson.quiz_id && (
            <span className="rounded bg-[var(--ks-orange)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--ks-orange)]">
              Quiz
            </span>
          )}
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--ks-border)] px-4 py-4">
          {lesson.description && (
            <p className="mb-3 text-sm text-[var(--ks-text-muted)]">{lesson.description}</p>
          )}
          {lesson.content && (
            <div className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ks-text-muted)]">
              {lesson.content}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            {lesson.video_url && (
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
              >
                Watch video ↗
              </a>
            )}
            {lesson.resource_url && (
              <a
                href={lesson.resource_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
              >
                Open resource ↗
              </a>
            )}
            {lesson.quiz_id && courseId && (
              <Link
                to={`/student/quiz/${lesson.quiz_id}?courseId=${courseId}&lessonId=${lesson.id}`}
                className="font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
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
    <section className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/courses"
            className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
          >
            ← Back to courses
          </Link>

          {isStudent && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Learning Status Dropdown */}
              <div className="flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs shadow-2xs">
                <span className="text-[var(--ks-text-muted)] font-medium">Status:</span>
                <select
                  value={courseStatus || (enrollment ? (enrollment.progress >= 100 ? 'completed' : 'in_progress') : 'want_to_study')}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent font-semibold text-[var(--ks-text)] outline-none cursor-pointer"
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
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition shadow-2xs ${
                  isSaved
                    ? 'border-[var(--ks-orange)]/40 bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.18)]'
                    : 'border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-muted)] hover:border-[var(--ks-border-focus)] hover:text-[var(--ks-text)]'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
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
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt=""
              className="mb-6 h-56 w-full rounded-xl border border-[var(--ks-border)] object-cover shadow-xs"
            />
          )}
          <span className="ks-eyebrow">CURRICULUM</span>
          <h1 className="ks-page-title mt-1">{course.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            {course.category && (
              <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-3 py-1 text-[var(--ks-text-muted)]">
                {course.category}
              </span>
            )}
            <span className="rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-3 py-1 text-[var(--ks-orange)]">
              {difficultyLabel}
            </span>
            {!course.published && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-700 font-semibold">
                Unpublished
              </span>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 text-sm text-[var(--ks-text)] shadow-xs">
            <div>
              <span className="block text-xs text-[var(--ks-text-muted)] uppercase tracking-wider font-semibold">Modules</span>
              <span className="text-base font-bold">{totalModulesCount}</span>
            </div>
            <div className="h-8 w-px bg-[var(--ks-border)]" />
            <div>
              <span className="block text-xs text-[var(--ks-text-muted)] uppercase tracking-wider font-semibold">Lessons</span>
              <span className="text-base font-bold">{totalLessonsCount}</span>
            </div>
            {totalDurationMinutes > 0 && (
              <>
                <div className="h-8 w-px bg-[var(--ks-border)]" />
                <div>
                  <span className="block text-xs text-[var(--ks-text-muted)] uppercase tracking-wider font-semibold">Total Duration</span>
                  <span className="text-base font-bold">{formatDuration(totalDurationMinutes)}</span>
                </div>
              </>
            )}
          </div>

          {course.description && (
            <p className="mt-5 max-w-3xl leading-relaxed text-[var(--ks-text-muted)]">{course.description}</p>
          )}
        </div>
      </div>

      {isStudent && enrollment !== undefined && (
        <>
          {enrollmentError && (
            <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
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
          <div key={module.id} className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
            <div className="border-b border-[var(--ks-border)] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="ks-section-title">
                  <span className="mr-2 text-[var(--ks-text-muted)]">{module.order_number}.</span>
                  {module.title}
                </h2>
                {module.description && (
                  <p className="mt-1 text-sm text-[var(--ks-text-muted)]">{module.description}</p>
                )}
              </div>
              <span className="text-xs font-semibold text-[var(--ks-text-muted)] bg-[var(--ks-bg-soft)] border border-[var(--ks-border)] px-2.5 py-1 rounded-full">
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
              <p className="px-5 py-4 text-sm text-[var(--ks-text-muted)]">No lessons yet.</p>
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
    </section>
  )
}