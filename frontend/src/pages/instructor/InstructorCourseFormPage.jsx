import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { createCourse, getCourse, updateCourse } from '../../services/courseService.js'
import CourseForm from '../../components/courses/CourseForm.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function InstructorCourseFormPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(courseId)

  const [course, setCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let active = true

    async function load() {
      setIsLoading(true)
      setLoadError('')
      try {
        const data = await getCourse(courseId)
        if (active) setCourse(data)
      } catch (err) {
        if (active) setLoadError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [courseId, isEdit])

  async function handleSubmit(values) {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      if (isEdit) {
        await updateCourse(courseId, values)
        navigate('/instructor/courses', { replace: true })
      } else {
        const created = await createCourse(values)
        navigate(`/instructor/courses/${created.id}/content`, { replace: true })
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading course..." />
  }

  if (loadError) {
    return (
      <section className="space-y-4">
        <StateMessage variant="error" title={isEdit ? 'Course not available' : 'Unable to load'}>
          {loadError}
        </StateMessage>
        <Link
          to="/instructor/courses"
          className="inline-block font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to my courses
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          to="/instructor/courses"
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to my courses
        </Link>
        <h1 className="ks-page-title mt-2">
          {isEdit ? 'Edit Course' : 'Create Course'}
        </h1>
        <p className="mt-2 text-[var(--ks-text-muted)]">
          {isEdit
            ? 'Update the details of this course.'
            : 'New courses stay unpublished until you add modules and publish them.'}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
        <CourseForm
          initialValues={isEdit ? course : undefined}
          submitLabel={isEdit ? 'Save Changes' : 'Create Course'}
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/instructor/courses')}
        />
      </div>
    </section>
  )
}