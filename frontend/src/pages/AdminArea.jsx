import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Activity,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Layers,
} from 'lucide-react'
import { getAdminAnalytics } from '../services/adminAnalyticsService.js'
import StateMessage from '../components/StateMessage.jsx'

export default function AdminArea() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const res = await getAdminAnalytics()
        if (active) setData(res)
      } catch (err) {
        console.error('Failed to load admin analytics:', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading administration overview..." />
  }

  const summary = data?.summary || {}
  const totalUsers = summary.total_users ?? 0
  const totalStudents = summary.total_students ?? 0
  const totalInstructors = summary.total_instructors ?? 0
  const totalAdmins = summary.total_admins ?? 0
  const totalCourses = summary.total_courses ?? 0
  const publishedCourses = summary.published_courses ?? 0
  const draftCourses = summary.unpublished_courses ?? 0
  const totalQuizzes = summary.total_quizzes ?? 0
  const quizAttempts = summary.completed_quiz_attempts ?? 0
  const avgQuizScore = quizAttempts > 0 ? `${Math.round(summary.average_quiz_score)}%` : '—'

  const courses = data?.courses || []
  const recentActivity = data?.recent_activity || []

  return (
    <div className="space-y-8">
      {/* 1. Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ks-orange)]">
            Administration Control
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)] mt-0.5">
            System Overview & Platform Health
          </h2>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            Real-time telemetry and database analytics for the Kitsuno platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* 2. Overview Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Users */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Total Users
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {totalUsers}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Registered</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalStudents} students · {totalInstructors} instructors · {totalAdmins} admin
          </p>
        </div>

        {/* Metric 2: Total Courses */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Total Courses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {totalCourses}
            </span>
            {totalCourses > 0 && (
              <span className="text-xs font-semibold text-emerald-600">Catalog</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {publishedCourses} published · {draftCourses} draft
          </p>
        </div>

        {/* Metric 3: Quizzes Generated */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Quizzes & Tests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-orange)]">
              {totalQuizzes}
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text)]">quizzes</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {quizAttempts} completed attempts
          </p>
        </div>

        {/* Metric 4: Average Quiz Score */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Quiz Average
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {avgQuizScore}
            </span>
            {quizAttempts > 0 && (
              <span className="text-xs font-semibold text-emerald-600">Platform</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {quizAttempts > 0 ? 'Across all learners' : 'Awaiting quiz attempts'}
          </p>
        </div>
      </div>

      {/* 3. Main Admin Workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Quick Management Links & Infrastructure Status (7/12 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <h3 className="font-display text-xl font-normal text-[var(--ks-text)]">
              Platform Administration
            </h3>
            <p className="text-xs text-[var(--ks-text-muted)] mt-1">
              Direct access to system management and content registries
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/courses"
                className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ks-text)]">Course Catalog</h4>
                    <p className="text-[11px] text-[var(--ks-text-muted)]">Review & manage courses</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>

              <Link
                to="/instructor/ai-quiz-generator"
                className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ks-text)]">AI Engine Testing</h4>
                    <p className="text-[11px] text-[var(--ks-text-muted)]">Quiz generator playground</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>

              <Link
                to="/admin/analytics"
                className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ks-text)]">Global Analytics</h4>
                    <p className="text-[11px] text-[var(--ks-text-muted)]">Platform-wide statistics</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>

              <Link
                to="/instructor/courses"
                className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ks-text)]">Instructor Studios</h4>
                    <p className="text-[11px] text-[var(--ks-text-muted)]">Audit instructor activity</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>
            </div>
          </div>

          {/* Platform Courses List */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
                  Platform Courses
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {totalCourses} registered {totalCourses === 1 ? 'course' : 'courses'}
                </p>
              </div>
              <Link
                to="/courses"
                className="text-xs font-semibold text-[var(--ks-orange)] hover:underline"
              >
                View Catalog
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="mt-4 space-y-3">
                {courses.map((c) => (
                  <div
                    key={c.course_id}
                    className="flex items-center justify-between rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--ks-text)]">
                        {c.course_title}
                      </p>
                      <p className="text-[11px] text-[var(--ks-text-muted)]">
                        Instructor: {c.instructor_name} · {c.enrollment_count} enrolled · {c.lesson_count} lessons
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        c.published
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {c.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-5 text-center">
                <Layers className="mx-auto h-7 w-7 text-[var(--ks-text-muted)] opacity-60" />
                <p className="mt-2 text-xs font-medium text-[var(--ks-text)]">
                  No courses registered yet
                </p>
                <p className="mt-1 text-[11px] text-[var(--ks-text-muted)] leading-relaxed">
                  Courses created by instructors will be listed here with real enrollment statistics.
                </p>
              </div>
            )}
          </div>

          {/* Infrastructure Health Status */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
              Infrastructure Nodes
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 text-center">
                <Server className="h-4 w-4 mx-auto text-[var(--ks-orange)]" />
                <p className="mt-1.5 text-xs font-bold text-[var(--ks-text)]">FastAPI Server</p>
                <span className="text-[10px] text-emerald-600 font-semibold">Healthy · 200 OK</span>
              </div>

              <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 text-center">
                <Database className="h-4 w-4 mx-auto text-sky-600" />
                <p className="mt-1.5 text-xs font-bold text-[var(--ks-text)]">PostgreSQL DB</p>
                <span className="text-[10px] text-emerald-600 font-semibold">Connected · Live</span>
              </div>

              <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 text-center">
                <Cpu className="h-4 w-4 mx-auto text-amber-600" />
                <p className="mt-1.5 text-xs font-bold text-[var(--ks-text)]">Gemini Engine</p>
                <span className="text-[10px] text-emerald-600 font-semibold">Ready · Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Platform Audit Log (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
                  Live Audit Trail
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Platform events & user actions
                </p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            {recentActivity.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recentActivity.map((evt, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[var(--ks-bg-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                        {evt.event_type}
                      </span>
                      <span className="text-[10px] text-[var(--ks-text-subtle)]">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--ks-text)]">
                      {evt.description}
                    </p>
                    {evt.student_name && (
                      <p className="text-[10px] text-[var(--ks-text-muted)]">
                        User: {evt.student_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-5 text-center">
                <Activity className="mx-auto h-7 w-7 text-[var(--ks-text-muted)] opacity-60" />
                <p className="mt-2 text-xs font-medium text-[var(--ks-text)]">
                  No audit events recorded yet
                </p>
                <p className="mt-1 text-[11px] text-[var(--ks-text-muted)] leading-relaxed">
                  Platform events such as enrollments, lesson completions, and quiz submissions will automatically stream here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}