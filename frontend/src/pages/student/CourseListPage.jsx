import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../services/api.js'
import { listCourses } from '../../services/courseService.js'
import CourseCard from '../../components/courses/CourseCard.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function CourseListPage() {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <section className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
          Course Catalog
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Explore courses</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--ks-text-muted)]">
          Browse published courses available on the platform.
        </p>
      </div>

      {isLoading && <StateMessage variant="loading" title="Loading courses..." />}

      {!isLoading && error && (
        <StateMessage variant="error" title="Unable to load courses" onRetry={() => window.location.reload()}>
          {error}
        </StateMessage>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <StateMessage variant="empty" title="No courses available yet">
          Courses will appear here once instructors create and publish them.
        </StateMessage>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} to={`/courses/${course.id}`} />
          ))}
        </div>
      )}
    </section>
  )
}