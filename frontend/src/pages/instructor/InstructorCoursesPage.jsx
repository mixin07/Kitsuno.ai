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
  'ks-neo-btn-secondary px-3 py-1.5 text-xs font-bold'

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
    <section className="space-y-5 md:space-y-6 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <span className="ks-eyebrow">
            INSTRUCTOR STUDIO
          </span>
          <h1 className="ks-page-title mt-0.5">My Courses</h1>
          <p className="ks-muted mt-1">
            Create, edit, publish, and manage the content of your courses.
          </p>
        </div>
        <Link
          to="/instructor/courses/new"
          className="ks-neo-btn-primary px-3.5 py-2 text-xs font-bold shrink-0"
        >
          + New Course
        </Link>
      </div>

      {notice && (
        <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] px-4 py-2.5 text-xs font-medium text-[#241A16] shadow-[2px_2px_0_#241A16]">
          {notice}
        </div>
      )}

      {isLoading && <StateMessage variant="loading" title="Loading your courses..." />}

      {!isLoading && error && (
        <StateMessage variant="error" title="Unable to load courses" onRetry={() => window.location.reload()}>
          {error}
        </StateMessage>
      )}

      {!isLoading && !error && visibleCourses.length === 0 && (
        <div className="ks-neo-card rounded-[8px] border-2 border-[#241A16] bg-white p-8 text-center sm:p-10 shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
          <h3 className="font-serif text-2xl font-normal text-[#241A16]">No courses yet</h3>
          <p className="ks-muted mt-2 max-w-sm mx-auto">
            You have not created any courses. Click &quot;+ New Course&quot; to get started.
          </p>
          <div className="mt-4">
            <Link
              to="/instructor/courses/new"
              className="ks-neo-btn-primary px-4 py-2 text-xs font-bold"
            >
              + New Course
            </Link>
          </div>
        </div>
      )}

      {!isLoading && !error && visibleCourses.length > 0 && (
        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              to={`/instructor/courses/${course.id}/content`}
              actions={
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                    Curriculum
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course)}
                    disabled={busyCourseId === course.id}
                    className="ks-neo-btn-primary px-2.5 py-1.5 text-xs font-bold"
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
                    className="ks-neo-btn-secondary px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
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