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
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {/* 1. INTRO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">
              COURSE CATALOG
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
          </div>

          <h1 className="ks-page-title">
            Explore Courses
          </h1>

          <p className="ks-muted">
            Browse published curricula, learn at your own pace, and test your knowledge with adaptive AI quizzes.
          </p>
        </div>
      </div>

      {/* 2. REAL FILTER & SEARCH CONTROLS */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="ks-neo-card p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course title, topic, or keyword..."
                className="w-full h-9 rounded-[6px] border-[1.5px] border-[#241A16] bg-white pl-9 pr-3 text-xs text-[#241A16] placeholder-neutral-400 outline-none transition focus:border-[#F16524]"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 border-[1.5px] border-[#241A16] bg-[#FAF8F5] px-2.5 py-1.5 rounded-[6px] shadow-[1px_1px_0_#241A16]">
                  <Filter className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-[#241A16] outline-none cursor-pointer text-xs font-medium"
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
              <div className="flex items-center gap-1.5 border-[1.5px] border-[#241A16] bg-[#FAF8F5] px-2.5 py-1.5 rounded-[6px] shadow-[1px_1px_0_#241A16]">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-[#241A16] outline-none cursor-pointer text-xs font-medium"
                >
                  <option value="ALL">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 border-[1.5px] border-[#241A16] bg-[#FAF8F5] px-2.5 py-1.5 rounded-[6px] shadow-[1px_1px_0_#241A16]">
                <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[#241A16] outline-none cursor-pointer text-xs font-medium"
                >
                  <option value="title">Sort: Title (A-Z)</option>
                  <option value="category">Sort: Category</option>
                  <option value="difficulty">Sort: Difficulty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-[rgba(36,26,22,0.12)]">
            <span>
              Showing <strong className="text-[#241A16]">{filteredCourses.length}</strong> of <strong className="text-[#241A16]">{courses.length}</strong> published courses
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
                className="text-[#F16524] font-bold hover:underline cursor-pointer"
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
        <div className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white p-8 text-center shadow-[3px_3px_0_#241A16] space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-[#8C827A]" />
          <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">No Matching Courses Found</h3>
          <p className="text-xs text-neutral-600">
            Try adjusting your search criteria or resetting filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('ALL')
              setSelectedDifficulty('ALL')
            }}
            className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold mt-2"
          >
            Clear Filters →
          </button>
        </div>
      )}

      {!isLoading && !error && filteredCourses.length > 0 && (
        <div className="grid gap-6 sm:gap-7 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}