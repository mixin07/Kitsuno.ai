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
  UserCheck,
} from 'lucide-react'
import { getAdminAnalytics } from '../services/adminAnalyticsService.js'
import StateMessage from '../components/StateMessage.jsx'
import NeoMetricCard from '../components/NeoMetricCard.jsx'

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
    <div className="space-y-6 md:space-y-8 w-full pb-8">
      {/* 1. Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <span className="ks-eyebrow block">ADMINISTRATION CONTROL</span>
          <h1 className="ks-page-title mt-0.5">
            System Overview &amp; Platform Health
          </h1>
          <p className="ks-muted mt-1">
            Real-time telemetry and database analytics for the Kitsuno platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#241A16] bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-[1.5px_1.5px_0_#241A16]">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* 2. Overview Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeoMetricCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          badge="Registered"
          badgeVariant="success"
          hint={`${totalStudents} students · ${totalInstructors} instructors · ${totalAdmins} admin`}
        />
        <NeoMetricCard
          label="Total Courses"
          value={totalCourses}
          icon={BookOpen}
          badge={totalCourses > 0 ? 'Catalog' : null}
          badgeVariant="success"
          hint={`${publishedCourses} published · ${draftCourses} draft`}
        />
        <NeoMetricCard
          label="Quizzes & Tests"
          value={totalQuizzes}
          icon={Sparkles}
          iconColor="text-[#F16524]"
          valueColor="text-[#F16524]"
          hint={`${quizAttempts} completed attempts`}
        />
        <NeoMetricCard
          label="Quiz Average"
          value={avgQuizScore}
          icon={ShieldCheck}
          iconColor="text-emerald-700"
          valueColor={quizAttempts > 0 ? 'text-emerald-700' : 'text-[#241A16]'}
          badge={quizAttempts > 0 ? 'Platform' : null}
          badgeVariant="success"
          hint={quizAttempts > 0 ? 'Across all learners' : 'Awaiting quiz attempts'}
        />
      </div>

      {/* 3. Main Admin Workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Quick Management Links & Infrastructure Status (7/12 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">
              Platform Administration
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Direct access to system management and content registries
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/courses"
                className="ks-neo-card-interactive flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0_#241A16] hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF4E6] text-[#E8590C]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#241A16]">Course Catalog</h3>
                    <p className="text-[11px] text-neutral-500">Review & manage courses</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                to="/instructor/ai-quiz-generator"
                className="ks-neo-card-interactive flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0_#241A16] hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF4E6] text-[#E8590C]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#241A16]">AI Engine Testing</h3>
                    <p className="text-[11px] text-neutral-500">Quiz generator playground</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                to="/admin/analytics"
                className="ks-neo-card-interactive flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0_#241A16] hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-amber-50 text-amber-700">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#241A16]">Global Analytics</h3>
                    <p className="text-[11px] text-neutral-500">Platform-wide statistics</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                to="/instructor/courses"
                className="ks-neo-card-interactive flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0_#241A16] hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-sky-50 text-sky-700">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#241A16]">Instructor Studios</h3>
                    <p className="text-[11px] text-neutral-500">Audit instructor activity</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                to="/admin/instructor-requests"
                className="ks-neo-card-interactive flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0_#241A16] hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-emerald-50 text-emerald-800">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#241A16]">Instructor Requests</h3>
                    <p className="text-[11px] text-neutral-500">Review &amp; approve educators</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </Link>
            </div>
          </div>

          {/* Platform Courses List */}
          <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">
                  Platform Courses
                </h2>
                <p className="text-xs text-neutral-600">
                  {totalCourses} registered {totalCourses === 1 ? 'course' : 'courses'}
                </p>
              </div>
              <Link
                to="/courses"
                className="text-xs font-bold text-[#F16524] hover:underline"
              >
                View Catalog →
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="mt-4 space-y-3">
                {courses.map((c) => (
                  <div
                    key={c.course_id}
                    className="flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#241A16]">
                        {c.course_title}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Instructor: {c.instructor_name} · {c.enrollment_count} enrolled · {c.lesson_count} lessons
                      </p>
                    </div>
                    <span
                      className={`rounded-[4px] border-[1px] border-[#241A16] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                        c.published
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[6px] border-[1.5px] border-dashed border-[#241A16] bg-[#FAF8F5] p-6 text-center">
                <Layers className="mx-auto h-7 w-7 text-neutral-400" />
                <p className="mt-2 text-xs font-bold text-[#241A16]">
                  No courses registered yet
                </p>
                <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                  Courses created by instructors will be listed here with real enrollment statistics.
                </p>
              </div>
            )}
          </div>

          {/* Infrastructure Health Status */}
          <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
            <h2 className="font-serif text-2xl font-normal text-[#241A16]">
              Infrastructure Nodes
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3 text-center shadow-[1.5px_1.5px_0_#241A16]">
                <Server className="h-4 w-4 mx-auto text-[#F16524]" />
                <p className="mt-1.5 text-xs font-bold text-[#241A16]">FastAPI Server</p>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Healthy · 200 OK</span>
              </div>

              <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3 text-center shadow-[1.5px_1.5px_0_#241A16]">
                <Database className="h-4 w-4 mx-auto text-sky-700" />
                <p className="mt-1.5 text-xs font-bold text-[#241A16]">PostgreSQL DB</p>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Connected · Live</span>
              </div>

              <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3 text-center shadow-[1.5px_1.5px_0_#241A16]">
                <Cpu className="h-4 w-4 mx-auto text-amber-700" />
                <p className="mt-1.5 text-xs font-bold text-[#241A16]">Gemini Engine</p>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Ready · Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Platform Audit Log (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#241A16]">
                  Live Audit Trail
                </h2>
                <p className="text-xs text-neutral-600">
                  Platform events &amp; user actions
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#241A16]" />
            </div>

            {recentActivity.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recentActivity.map((evt, idx) => (
                  <div
                    key={idx}
                    className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-[4px] border-[1px] border-[#241A16] bg-[#FFF4E6] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8590C]">
                        {evt.event_type}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#241A16]">
                      {evt.description}
                    </p>
                    {evt.student_name && (
                      <p className="text-[10px] font-mono text-neutral-500">
                        User: {evt.student_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[6px] border-[1.5px] border-dashed border-[#241A16] bg-[#FAF8F5] p-6 text-center">
                <Activity className="mx-auto h-7 w-7 text-neutral-400" />
                <p className="mt-2 text-xs font-bold text-[#241A16]">
                  No audit events recorded yet
                </p>
                <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
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