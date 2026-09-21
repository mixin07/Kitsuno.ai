import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLES } from '../../constants/roles.js'
import { getApiErrorMessage } from '../../services/api.js'
import {
  deleteCourse,
  listCourses,
  publishCourse,
  unpublishCourse,
} from '../../services/courseService.js'
import CourseCard from '../../components/courses/CourseCard.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import StateMessage from '../../components/StateMessage.jsx'

const ACTION_LINK_CLASS =
  'rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)]'

export default function InstructorCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyCourseId, setBusyCourseId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await listCourses()
        if (active) setCourses(data)
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

  const visibleCourses =
    user?.role === ROLES.ADMIN
      ? courses
      : courses.filter((course) => course.instructor_id === user?.id)

  function applyUpdated(updated) {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  async function handleTogglePublish(course) {
    setBusyCourseId(course.id)
    setNotice('')
    try {
      const updated = course.published
        ? await unpublishCourse(course.id)
        : await publishCourse(course.id)
      applyUpdated(updated)
      setNotice(updated.published ? 'Course published.' : 'Course unpublished.')
    } catch (err) {
      if (err.response?.status === 409) {
        setNotice('Add at least one module before publishing this course.')
      } else {
        setNotice(getApiErrorMessage(err))
      }
    } finally {
      setBusyCourseId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCourse(deleteTarget.id)
      setDeleteTarget(null)
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setNotice('Course deleted.')
    } catch (err) {
      setDeleteError(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
            Instructor
          </p>
          <h1 className="text-4xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-3 text-lg text-[var(--ks-text-muted)]">
            Create, edit, publish, and manage the content of your courses.
          </p>
        </div>
        <Link
          to="/instructor/courses/new"
          className="rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
        >
          + New Course
        </Link>
      </div>

      {notice && (
        <p className="rounded-lg border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-4 py-3 text-sm text-[var(--ks-orange)]">
          {notice}
        </p>
      )}

      {isLoading && <StateMessage variant="loading" title="Loading your courses..." />}

      {!isLoading && error && (
        <StateMessage variant="error" title="Unable to load courses" onRetry={() => window.location.reload()}>
          {error}
        </StateMessage>
      )}

      {!isLoading && !error && visibleCourses.length === 0 && (
        <StateMessage variant="empty" title="No courses yet">
          You have not created any courses. Click &quot;New Course&quot; to get started.
        </StateMessage>
      )}

      {!isLoading && !error && visibleCourses.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              to={`/instructor/courses/${course.id}/content`}
              actions={
                <>
                  <Link
                    to={`/instructor/courses/${course.id}/edit`}
                    className={ACTION_LINK_CLASS}
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/instructor/courses/${course.id}/content`}
                    className={ACTION_LINK_CLASS}
                  >
                    Manage Content
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course)}
                    disabled={busyCourseId === course.id}
                    className="rounded-md border border-[var(--ks-orange)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--ks-orange)] transition hover:bg-[var(--ks-orange)]/10 disabled:opacity-50"
                  >
                    {busyCourseId === course.id
                      ? 'Saving...'
                      : course.published
                        ? 'Unpublish'
                        : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('')
                      setDeleteTarget(course)
                    }}
                    className="rounded-md border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete course?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? Its modules and lessons will also be deleted. This cannot be undone.`
            : ''
        }
        error={deleteError}
        isSubmitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}