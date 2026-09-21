import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { getCourse } from '../../services/courseService.js'
import { listModules } from '../../services/moduleService.js'
import { listLessons } from '../../services/lessonService.js'
import {
  enrollInCourse,
  getMyEnrollment,
  unenrollFromCourse,
} from '../../services/enrollmentService.js'
import { ROLES, isRoleAllowed } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import EnrollmentPanel from '../../components/learning/EnrollmentPanel.jsx'
import StateMessage from '../../components/StateMessage.jsx'

function LessonDetails({ lesson }) {
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
  const [enrollmentBusy, setEnrollmentBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getCourse(courseId)
        const modules = await listModules(courseId)
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

  async function handleEnroll() {
    setEnrollmentBusy(true)
    try {
      const created = await enrollInCourse(courseId)
      setEnrollment(created)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setEnrollmentBusy(false)
    }
  }

  async function handleUnenroll() {
    setEnrollmentBusy(true)
    try {
      await unenrollFromCourse(courseId)
      setEnrollment(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
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

  return (
    <section className="space-y-8">
      <div>
        <Link
          to="/courses"
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to courses
        </Link>

        <div className="mt-4">
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt=""
              className="mb-6 h-56 w-full rounded-xl border border-[var(--ks-border)] object-cover shadow-xs"
            />
          )}
          <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
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
          {course.description && (
            <p className="mt-4 max-w-3xl leading-relaxed text-[var(--ks-text-muted)]">{course.description}</p>
          )}
          <p className="mt-3 text-sm text-[var(--ks-text-muted)] opacity-75">Instructor #{course.instructor_id}</p>
        </div>
      </div>

      {isStudent && enrollment !== undefined && (
        <EnrollmentPanel
          enrollment={enrollment}
          isBusy={enrollmentBusy}
          onEnroll={handleEnroll}
          onUnenroll={handleUnenroll}
          onContinue={handleContinue}
        />
      )}

      <div className="space-y-4">
        {tree.map(({ module, lessons }) => (
          <div key={module.id} className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
            <div className="border-b border-[var(--ks-border)] px-5 py-4">
              <h2 className="text-lg font-semibold text-[var(--ks-text)]">
                <span className="mr-2 text-[var(--ks-text-muted)]">{module.order_number}.</span>
                {module.title}
              </h2>
              {module.description && (
                <p className="mt-1 text-sm text-[var(--ks-text-muted)]">{module.description}</p>
              )}
            </div>
            {lessons.length > 0 ? (
              <ul className="space-y-2 px-5 py-4">
                {lessons.map((lesson) => (
                  <LessonDetails key={lesson.id} lesson={lesson} />
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
    </section>
  )
}