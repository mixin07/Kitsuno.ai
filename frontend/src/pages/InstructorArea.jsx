import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Users,
  Sparkles,
  Award,
  Plus,
  ArrowRight,
  FileEdit,
  Layers,
  Activity,
} from 'lucide-react'
import { listCourses } from '../services/courseService.js'
import { getInstructorCourseSummaries } from '../services/instructorAnalyticsService.js'
import { useAuth } from '../hooks/useAuth.js'
import { ROLES } from '../constants/roles.js'
import StateMessage from '../components/StateMessage.jsx'

export default function InstructorArea() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [summaries, setSummaries] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const [coursesRes, summariesRes] = await Promise.allSettled([
          listCourses(),
          getInstructorCourseSummaries(),
        ])

        if (!active) return

        if (coursesRes.status === 'fulfilled') {
          const allCourses = coursesRes.value || []
          const userCourses =
            user?.role === ROLES.ADMIN
              ? allCourses
              : allCourses.filter((c) => c.instructor_id === user?.id)
          setCourses(userCourses)
        }

        if (summariesRes.status === 'fulfilled') {
          setSummaries(summariesRes.value || [])
        }
      } catch (err) {
        console.error('Failed to load instructor dashboard data:', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading instructor studio..." />
  }

  // Build summary lookup map
  const summaryMap = {}
  summaries.forEach((s) => {
    summaryMap[s.course_id] = s
  })

  const coursesCount = courses.length
  const publishedCount = courses.filter((c) => c.published).length
  const draftCount = coursesCount - publishedCount
  const totalEnrolled = summaries.reduce((sum, s) => sum + (s.total_enrolled || 0), 0)
  const totalQuizAttempts = summaries.reduce((sum, s) => sum + (s.total_quiz_attempts || 0), 0)
  const avgCompletion =
    summaries.length > 0
      ? Math.round(
          summaries.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / summaries.length
        )
      : 0

  return (
    <div className="space-y-8">
      {/* 1. Header with Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ks-orange)]">
            Instructor Studio
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)] mt-0.5">
            Course Management & Studio
          </h2>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            Manage your real curricula, lessons, student progress, and automated AI quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/instructor/courses/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ks-orange)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </Link>
          <Link
            to="/instructor/ai-quiz-generator"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(241,101,36,0.3)] bg-[var(--ks-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--ks-orange)] shadow-xs transition hover:bg-[rgba(241,101,36,0.08)]"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Quiz Generator</span>
          </Link>
        </div>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Courses Created */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Courses Created
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {coursesCount}
            </span>
            {coursesCount > 0 && (
              <span className="text-xs font-semibold text-emerald-600">Active</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {coursesCount > 0
              ? `${publishedCount} published · ${draftCount} draft`
              : 'Create your first course'}
          </p>
        </div>

        {/* Card 2: Total Enrolled Learners */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Total Learners
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {totalEnrolled}
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text-muted)]">enrolled</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalEnrolled > 0
              ? `Across ${coursesCount} managed ${coursesCount === 1 ? 'course' : 'courses'}`
              : 'No student enrollments yet'}
          </p>
        </div>

        {/* Card 3: Quiz Attempts */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Quiz Submissions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-orange)]">
              {totalQuizAttempts}
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text)]">attempts</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalQuizAttempts > 0
              ? 'Evaluated by adaptive AI engine'
              : 'Add quizzes to your lessons'}
          </p>
        </div>

        {/* Card 4: Avg Completion Rate */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Avg Completion
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {avgCompletion}%
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text-muted)]">rate</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalEnrolled > 0 ? 'Across active student cohorts' : 'Awaiting student activity'}
          </p>
        </div>
      </div>

      {/* 3. Main Studio Workspace: Courses & Activity Feed */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Courses List (7/12 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-normal text-[var(--ks-text)]">
                Managed Courses
              </h3>
              <p className="text-xs text-[var(--ks-text-muted)]">
                Curriculum, lessons, and automated quizzes
              </p>
            </div>
            <Link
              to="/instructor/courses"
              className="group flex items-center gap-1 text-xs font-semibold text-[var(--ks-orange)] hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {coursesCount > 0 ? (
            <div className="space-y-3">
              {courses.map((course) => {
                const summary = summaryMap[course.id]
                return (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/35"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            course.published
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-amber-500/10 text-amber-700'
                          }`}
                        >
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs font-medium text-[var(--ks-text-muted)]">
                          {course.category || 'General'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-[var(--ks-text)]">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[var(--ks-text-muted)]">
                        <span>{summary?.total_enrolled || 0} enrolled</span>
                        <span>·</span>
                        <span>{summary?.total_lessons || 0} lessons</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-medium">
                          {Math.round(summary?.completion_rate || 0)}% completion
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/instructor/courses/${course.id}/content`}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Curriculum</span>
                      </Link>
                      <Link
                        to={`/instructor/courses/${course.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                <BookOpen className="h-6 w-6" />
              </div>
              <h4 className="font-display text-xl font-normal text-[var(--ks-text)] mt-3">
                You haven't created any courses yet
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-xs text-[var(--ks-text-muted)] leading-relaxed">
                Build your curriculum with modules, lessons, and auto-generated AI quizzes to publish for students.
              </p>
              <div className="mt-5">
                <Link
                  to="/instructor/courses/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ks-orange)] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Course</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Learner Activity & Quick AI Generator Panel (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* AI Quiz Generator Callout Card */}
          <div className="rounded-3xl border border-[rgba(241,101,36,0.25)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ks-orange)] text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
                  AI Quiz Synthesis
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Generate instant comprehension quizzes from lesson notes
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[var(--ks-text-muted)]">
              Input any markdown notes, syllabus, or lecture transcript. Kitsuno analyzes conceptual depth and creates calibrated multiple-choice questions with answer explanations.
            </p>

            <div className="mt-4">
              <Link
                to="/instructor/ai-quiz-generator"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ks-orange)] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] hover:shadow-md"
              >
                <span>Open Quiz Generator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Learner Activity Stream */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
                  Learner Activity Feed
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Real-time events across your courses
                </p>
              </div>
              <Link
                to="/instructor/analytics"
                className="text-xs font-semibold text-[var(--ks-orange)] hover:underline"
              >
                Full Analytics
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-5 text-center">
              <Activity className="mx-auto h-7 w-7 text-[var(--ks-text-muted)] opacity-60" />
              <p className="mt-2 text-xs font-medium text-[var(--ks-text)]">
                No student activity yet
              </p>
              <p className="mt-1 text-[11px] text-[var(--ks-text-muted)] leading-relaxed">
                When students enroll in your courses and complete lessons or quizzes, their real-time progress will be recorded here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}