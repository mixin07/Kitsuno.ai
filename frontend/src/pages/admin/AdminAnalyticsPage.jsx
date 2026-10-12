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
import NeoMetricCard from '../../components/NeoMetricCard.jsx'
import {
  Users,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Layers,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react'
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
  backgroundColor: '#FFFFFF',
  border: '1.5px solid #241A16',
  borderRadius: '6px',
  boxShadow: '2px 2px 0 #241A16',
  color: '#241A16',
  fontSize: '12px',
  fontWeight: '600',
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

function StatCard({ label, value, hint, icon, iconColor, valueColor, children }) {
  return (
    <NeoMetricCard
      label={label}
      value={value}
      hint={hint}
      icon={icon}
      iconColor={iconColor}
      valueColor={valueColor}
    >
      {children}
    </NeoMetricCard>
  )
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`ks-neo-card bg-white rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="ks-section-title">{title}</h2>
      {subtitle && <p className="ks-muted mt-1">{subtitle}</p>}
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
      <div className="overflow-x-auto rounded-[8px] border-2 border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-[#241A16] bg-[#FAF8F5] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('course_title')}>
                Course
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('instructor_name')}>
                Instructor
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('published')}>
                Status
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('enrollment_count')}>
                Enrollments
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('completion_count')}>
                Completed
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('average_progress')}>
                Avg Progress
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('lesson_count')}>
                Lessons
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('quiz_count')}>
                Quizzes
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('quiz_attempts')}>
                Quiz Attempts
              </th>
              <th className={`px-4 py-3 ${sortableHeaderClass}`} onClick={() => toggleSort('average_quiz_score')}>
                Avg Quiz Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#241A16]/15">
            {sorted.map((course) => (
              <tr key={course.course_id} className="text-[#241A16] hover:bg-[#FAF8F5] transition-colors">
                <td className="px-4 py-3 font-bold text-[#241A16]">{course.course_title}</td>
                <td className="px-4 py-3 text-neutral-700">{course.instructor_name}</td>
                <td className="px-4 py-3">
                  {course.published ? (
                    <span className="inline-flex rounded-[4px] border-[1px] border-[#241A16] bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex rounded-[4px] border-[1px] border-[#241A16] bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono font-semibold">{course.enrollment_count}</td>
                <td className="px-4 py-3 font-mono font-semibold">{course.completion_count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-16">
                      <ProgressBar value={course.average_progress} />
                    </div>
                    <span className="text-[11px] font-mono font-semibold">{formatPercent(course.average_progress)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-semibold">{course.lesson_count}</td>
                <td className="px-4 py-3 font-mono font-semibold">{course.quiz_count}</td>
                <td className="px-4 py-3 font-mono font-semibold">{course.quiz_attempts}</td>
                <td className="px-4 py-3 font-mono font-semibold">{formatScore(course.average_quiz_score)}</td>
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
      <div className="divide-y divide-[#241A16]/15 rounded-[8px] border-2 border-[#241A16] bg-white shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
        {activity.map((event, index) => (
          <div
            key={`${event.event_type}-${event.timestamp}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#FAF8F5] transition-colors"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="shrink-0 rounded-[4px] border-[1px] border-[#241A16] bg-[#FFF4E6] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8590C]">
                {ACTIVITY_LABELS[event.event_type] || event.event_type}
              </span>
              <span className="min-w-0 truncate text-xs font-medium text-[#241A16]">{event.description}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-xs font-bold text-[#241A16]">{event.student_name}</span>
              <span className="text-[10px] font-mono text-neutral-500">{formatDateTime(event.timestamp)}</span>
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
    <section className="space-y-6 md:space-y-8 w-full pb-8">
      <div className="pb-4 border-b-2 border-[#241A16]">
        <span className="ks-eyebrow block">ADMINISTRATION CONTROL</span>
        <h1 className="ks-page-title mt-0.5">Platform Analytics</h1>
        <p className="ks-muted mt-1">
          A platform-wide view of users, courses, enrollments, and performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={summary?.total_users ?? 0} icon={Users} />
        <StatCard label="Students" value={summary?.total_students ?? 0} icon={GraduationCap} />
        <StatCard label="Instructors" value={summary?.total_instructors ?? 0} icon={UserCheck} />
        <StatCard label="Admins" value={summary?.total_admins ?? 0} icon={ShieldCheck} />
        <StatCard
          label="Courses"
          value={summary?.total_courses ?? 0}
          icon={BookOpen}
          hint={`${summary?.published_courses ?? 0} published · ${summary?.unpublished_courses ?? 0} unpublished`}
        />
        <StatCard
          label="Enrollments"
          value={summary?.total_enrollments ?? 0}
          icon={Layers}
          hint={`${summary?.completed_enrollments ?? 0} completed`}
        />
        <StatCard
          label="Lessons"
          value={summary?.total_lessons ?? 0}
          icon={CheckCircle2}
          hint={`${summary?.completed_lessons ?? 0} completed`}
        />
        <StatCard
          label="Quiz Attempts"
          value={summary?.total_quiz_attempts ?? 0}
          icon={Sparkles}
          iconColor="text-[#F16524]"
          valueColor="text-[#F16524]"
          hint={`${summary?.completed_quiz_attempts ?? 0} completed`}
        />
        <StatCard
          label="Overall Course Progress"
          value={formatPercent(summary?.overall_course_progress)}
          icon={TrendingUp}
        >
          <ProgressBar value={summary?.overall_course_progress} className="mt-3" />
        </StatCard>
        <StatCard
          label="Average Quiz Score"
          value={formatScore(summary?.average_quiz_score)}
          icon={Award}
          iconColor="text-emerald-700"
          valueColor="text-emerald-700"
        />
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