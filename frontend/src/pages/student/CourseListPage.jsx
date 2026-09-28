import { useEffect, useMemo, useState } from 'react'
import { Search, Filter, ArrowUpDown, BookOpen } from 'lucide-react'
import { getApiErrorMessage } from '../../services/api.js'
import { listCourses } from '../../services/courseService.js'
import { getSavedOverview, saveCourse, unsaveCourse } from '../../services/savedService.js'
import { listMyEnrollments } from '../../services/enrollmentService.js'
import CourseCard from '../../components/courses/CourseCard.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function CourseListPage() {
  const [courses, setCourses] = useState([])
  const [savedCourseIds, setSavedCourseIds] = useState(new Set())
  const [courseStatuses, setCourseStatuses] = useState({})
  const [enrollmentMap, setEnrollmentMap] = useState(new Map())
  const [savingCourseId, setSavingCourseId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL')
  const [sortBy, setSortBy] = useState('title') // 'title' | 'category' | 'difficulty'

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const [data, savedOverview, myEnrollments] = await Promise.all([
          listCourses(),
          getSavedOverview().catch(() => null),
          listMyEnrollments().catch(() => []),
        ])
        if (active) {
          setCourses(Array.isArray(data) ? data : data?.items ?? [])
          if (savedOverview) {
            setSavedCourseIds(new Set(savedOverview.saved_course_ids || []))
            setCourseStatuses(savedOverview.course_statuses || {})
          }
          if (myEnrollments) {
            const map = new Map()
            myEnrollments.forEach((e) => map.set(e.course_id, e))
            setEnrollmentMap(map)
          }
        }
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
  }, [reloadKey])

  async function handleToggleSaveCourse(course) {
    if (savingCourseId === course.id) return
    setSavingCourseId(course.id)
    const isCurrentlySaved = savedCourseIds.has(course.id)
    try {
      if (isCurrentlySaved) {
        await unsaveCourse(course.id)
        setSavedCourseIds((prev) => {
          const next = new Set(prev)
          next.delete(course.id)
          return next
        })
      } else {
        await saveCourse(course.id)
        setSavedCourseIds((prev) => new Set(prev).add(course.id))
      }
    } catch (err) {
      console.error('Failed to toggle save course', err)
    } finally {
      setSavingCourseId(null)
    }
  }

  // Extract unique categories from real published courses
  const categories = useMemo(() => {
    const set = new Set()
    courses.forEach((c) => {
      if (c.category) set.add(c.category)
    })
    return Array.from(set).sort()
  }, [courses])

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const matchesSearch =
          !searchQuery.trim() ||
          course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory =
          selectedCategory === 'ALL' || course.category === selectedCategory

        const matchesDifficulty =
          selectedDifficulty === 'ALL' || course.difficulty === selectedDifficulty

        return matchesSearch && matchesCategory && matchesDifficulty
      })
      .sort((a, b) => {
        if (sortBy === 'category') {
          return (a.category || '').localeCompare(b.category || '')
        }
        if (sortBy === 'difficulty') {
          return (a.difficulty || '').localeCompare(b.difficulty || '')
        }
        return (a.title || '').localeCompare(b.title || '')
      })
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, sortBy])

  return (
    <section className="space-y-6 max-w-[1360px] mx-auto">
      {/* 1. INTRO HEADER */}
      <div className="pb-4 border-b border-[var(--ks-border)]">
        <span className="ks-eyebrow">COURSE CATALOG</span>
        <h1 className="ks-page-title mt-1">Explore courses</h1>
        <p className="mt-1 text-sm text-[var(--ks-text-muted)] max-w-xl">
          Browse published curricula, learn at your own pace, and test your knowledge with adaptive AI quizzes.
        </p>
      </div>

      {/* 2. REAL FILTER & SEARCH CONTROLS */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ks-text-subtle)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course title, topic, or keyword..."
                className="w-full h-9 rounded border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] pl-9 pr-3 text-xs text-[var(--ks-text)] placeholder-[var(--ks-text-subtle)] outline-none transition focus:border-[var(--ks-orange)]"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-2.5 py-1.5 rounded">
                  <Filter className="h-3.5 w-3.5 text-[var(--ks-text-subtle)] shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-[var(--ks-text)] outline-none cursor-pointer text-xs"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-2.5 py-1.5 rounded">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-[var(--ks-text)] outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-2.5 py-1.5 rounded">
                <ArrowUpDown className="h-3.5 w-3.5 text-[var(--ks-text-subtle)] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[var(--ks-text)] outline-none cursor-pointer text-xs"
                >
                  <option value="title">Sort: Title (A-Z)</option>
                  <option value="category">Sort: Category</option>
                  <option value="difficulty">Sort: Difficulty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-[11px] text-[var(--ks-text-muted)] pt-2 border-t border-[var(--ks-border)]">
            <span>
              Showing <strong>{filteredCourses.length}</strong> of <strong>{courses.length}</strong> published courses
            </span>
            {(searchQuery || selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                  setSelectedDifficulty('ALL')
                  setSortBy('title')
                }}
                className="text-[var(--ks-orange)] font-semibold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. STATES & COURSE GRID */}
      {isLoading && <StateMessage variant="loading" title="Loading courses..." />}

      {!isLoading && error && (
        <StateMessage variant="error" title="Unable to load courses" onRetry={() => setReloadKey((k) => k + 1)}>
          {error}
        </StateMessage>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <StateMessage variant="empty" title="No courses available yet">
          Courses will appear here once instructors create and publish them.
        </StateMessage>
      )}

      {!isLoading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-[var(--ks-text-subtle)]" />
          <h3 className="ks-panel-title">No Matching Courses Found</h3>
          <p className="text-xs text-[var(--ks-text-muted)]">
            Try adjusting your search criteria or resetting filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('ALL')
              setSelectedDifficulty('ALL')
            }}
            className="mt-2 text-xs font-semibold text-[var(--ks-orange)] hover:underline"
          >
            Clear Filters →
          </button>
        </div>
      )}

      {!isLoading && !error && filteredCourses.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              to={`/courses/${course.id}`}
              isSaved={savedCourseIds.has(course.id)}
              onToggleSave={handleToggleSaveCourse}
              isSaving={savingCourseId === course.id}
              status={courseStatuses[course.id]}
              enrollment={enrollmentMap.get(course.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}