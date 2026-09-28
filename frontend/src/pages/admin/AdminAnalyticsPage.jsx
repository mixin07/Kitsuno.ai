import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import StateMessage from '../../components/StateMessage.jsx'
import { getApiErrorMessage } from '../../services/api.js'
import { getAdminAnalytics } from '../../services/adminAnalyticsService.js'

const ACTIVITY_LABELS = Object.freeze({
  ENROLLED: 'Enrolled',
  LESSON_STARTED: 'Lesson started',
  LESSON_COMPLETED: 'Lesson completed',
  QUIZ_COMPLETED: 'Quiz completed',
  COURSE_COMPLETED: 'Course completed',
})

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#FFFDF9',
  border: '1px solid rgba(90, 55, 30, 0.16)',
  borderRadius: '0.75rem',
  boxShadow: '0 4px 20px -2px rgba(90, 55, 30, 0.08)',
  color: '#241A16',
}

function formatPercent(value) {
  const number = Number(value) || 0
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(1)}%`
}

function formatScore(value) {
  const number = Number(value) || 0
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(2)}%`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--ks-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--ks-text-muted)]">{hint}</p>}
    </div>
  )
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="ks-section-title">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[var(--ks-text-muted)]">{subtitle}</p>}
    </div>
  )
}

function RoleDistributionSection({ roleDistribution }) {
  const chartData = roleDistribution.map((item) => ({
    name: `${item.role[0]}${item.role.slice(1).toLowerCase()}`,
    users: Number(item.count) || 0,
  }))

  return (
    <section className="space-y-4">
      <SectionHeading
        title="User Roles"
        subtitle="Breakdown of accounts by role across the platform."
      />
      <SectionCard className="p-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
              <XAxis dataKey="name" stroke="#8C7A6B" tick={{ fontSize: 12 }} />
              <YAxis stroke="#8C7A6B" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
              <Bar dataKey="users" name="Users" fill="#F16524" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </section>
  )
}

function ProgressDistributionSection({ progressDistribution }) {
  const chartData = progressDistribution.map((bucket) => ({
    name: bucket.bucket,
    students: Number(bucket.students) || 0,
  }))

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Enrollment Progress"
        subtitle="How far students are through their enrolled courses."
      />
      <SectionCard className="p-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
              <XAxis dataKey="name" stroke="#8C7A6B" tick={{ fontSize: 12 }} />
              <YAxis stroke="#8C7A6B" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
              <Bar dataKey="students" name="Students" fill="#FF8A4C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </section>
  )
}

function CourseTableSection({ courses }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    const list = [...courses]
    if (!sortKey) return list
    const direction = sortDir === 'asc' ? 1 : -1
    return list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * direction
      }
      return String(av ?? '').localeCompare(String(bv ?? '')) * direction
    })
  }, [courses, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (courses.length === 0) {
    return (
      <StateMessage variant="empty" title="No courses yet">
        Courses created by instructors will appear here.
      </StateMessage>
    )
  }

  const sortableHeaderClass = 'cursor-pointer select-none hover:text-[var(--ks-orange)]'

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Course Overview"
        subtitle="Enrollment, progress, and quiz performance for every course."
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            <tr>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('course_title')}>
                Course
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('instructor_name')}>
                Instructor
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('published')}>
                Status
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('enrollment_count')}>
                Enrollments
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('completion_count')}>
                Completed
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('average_progress')}>
                Avg Progress
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('lesson_count')}>
                Lessons
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('quiz_count')}>
                Quizzes
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('quiz_attempts')}>
                Quiz Attempts
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('average_quiz_score')}>
                Avg Quiz Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ks-border)]">
            {sorted.map((course) => (
              <tr key={course.course_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                <td className="px-5 py-3 font-semibold text-[var(--ks-text)]">{course.course_title}</td>
                <td className="px-5 py-3">{course.instructor_name}</td>
                <td className="px-5 py-3">
                  {course.published ? (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                      Published
                    </span>
                  ) : (
                    <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ks-text-muted)]">
                      Unpublished
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">{course.enrollment_count}</td>
                <td className="px-5 py-3">{course.completion_count}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={course.average_progress} />
                    </div>
                    <span className="text-xs">{formatPercent(course.average_progress)}</span>
                  </div>
                </td>
                <td className="px-5 py-3">{course.lesson_count}</td>
                <td className="px-5 py-3">{course.quiz_count}</td>
                <td className="px-5 py-3">{course.quiz_attempts}</td>
                <td className="px-5 py-3">{formatScore(course.average_quiz_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RecentActivitySection({ activity }) {
  if (activity.length === 0) {
    return (
      <StateMessage variant="empty" title="No activity yet">
        Student activity across the platform will appear here over time.
      </StateMessage>
    )
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Recent Activity"
        subtitle="Latest events from students across all courses."
      />
      <div className="divide-y divide-[var(--ks-border)] rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        {activity.map((event, index) => (
          <div
            key={`${event.event_type}-${event.timestamp}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="shrink-0 rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--ks-orange)]">
                {ACTIVITY_LABELS[event.event_type] || event.event_type}
              </span>
              <span className="min-w-0 truncate text-sm text-[var(--ks-text)]">{event.description}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm font-semibold text-[var(--ks-text)]">{event.student_name}</span>
              <span className="text-xs text-[var(--ks-text-muted)]">{formatDateTime(event.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getAdminAnalytics()
        if (!active) return
        setAnalytics(data)
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
  }, [reloadKey])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading platform analytics..." />
  }

  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Could not load platform analytics"
        onRetry={() => setReloadKey((key) => key + 1)}
      >
        {error}
      </StateMessage>
    )
  }

  const summary = analytics?.summary
  const courses = analytics?.courses || []
  const roleDistribution = analytics?.role_distribution || []
  const progressDistribution = analytics?.progress_distribution || []
  const activity = analytics?.recent_activity || []

  const hasPlatformActivity =
    summary?.total_courses > 0 ||
    summary?.total_enrollments > 0 ||
    summary?.total_lessons > 0 ||
    summary?.total_quiz_attempts > 0

  return (
    <section className="space-y-8">
      <div>
        <p className="ks-eyebrow mb-2 text-[var(--ks-orange)]">
          Admin
        </p>
        <h1 className="ks-page-title">Platform Analytics</h1>
        <p className="mt-2 text-[var(--ks-text-muted)]">
          A platform-wide view of users, courses, enrollments, and performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={summary?.total_users ?? 0} />
        <StatCard label="Students" value={summary?.total_students ?? 0} />
        <StatCard label="Instructors" value={summary?.total_instructors ?? 0} />
        <StatCard label="Admins" value={summary?.total_admins ?? 0} />
        <StatCard
          label="Courses"
          value={summary?.total_courses ?? 0}
          hint={`${summary?.published_courses ?? 0} published · ${summary?.unpublished_courses ?? 0} unpublished`}
        />
        <StatCard
          label="Enrollments"
          value={summary?.total_enrollments ?? 0}
          hint={`${summary?.completed_enrollments ?? 0} completed`}
        />
        <StatCard label="Lessons" value={summary?.total_lessons ?? 0} hint={`${summary?.completed_lessons ?? 0} completed`} />
        <StatCard
          label="Quiz Attempts"
          value={summary?.total_quiz_attempts ?? 0}
          hint={`${summary?.completed_quiz_attempts ?? 0} completed`}
        />
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
            Overall Course Progress
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--ks-text)]">
            {formatPercent(summary?.overall_course_progress)}
          </p>
          <ProgressBar value={summary?.overall_course_progress} className="mt-3" />
        </div>
        <StatCard label="Average Quiz Score" value={formatScore(summary?.average_quiz_score)} />
      </div>

      {!hasPlatformActivity && courseCountZeroAndEnrollmentsZero(summary) ? (
        <StateMessage variant="empty" title="No platform activity yet">
          Analytics will populate as users, courses, and enrollments are created.
        </StateMessage>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <RoleDistributionSection roleDistribution={roleDistribution} />
            <ProgressDistributionSection progressDistribution={progressDistribution} />
          </div>
          <CourseTableSection courses={courses} />
          <RecentActivitySection activity={activity} />
        </>
      )}
    </section>
  )
}

function courseCountZeroAndEnrollmentsZero(summary) {
  return (summary?.total_courses ?? 0) === 0 && (summary?.total_enrollments ?? 0) === 0
}