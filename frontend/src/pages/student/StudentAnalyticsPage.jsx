import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import StateMessage from '../../components/StateMessage.jsx'
import { getApiErrorMessage } from '../../services/api.js'
import { getStudentAnalytics } from '../../services/analyticsService.js'

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
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(2)}%`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

function CourseProgressSection({ courses }) {
  if (courses.length === 0) {
    return (
      <StateMessage variant="empty" title="No course progress to show">
        Enrolled courses will appear here with their progress.
      </StateMessage>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ks-text)]">Course Progress</h2>
        <p className="mt-1 text-sm text-[var(--ks-text-muted)]">Your progress across enrolled courses.</p>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.course_id}
            className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Link
                  to={`/courses/${course.course_id}`}
                  className="font-semibold text-[var(--ks-text)] hover:text-[var(--ks-orange)]"
                >
                  {course.title}
                </Link>
                {course.completed ? (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    Completed
                  </span>
                ) : (
                  <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ks-text-muted)]">
                    In progress
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--ks-orange)]">{formatPercent(course.progress)}</p>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {course.completed_lessons}/{course.total_lessons} lessons
                </p>
              </div>
            </div>
            <ProgressBar value={course.progress} className="mt-3" />
            {course.next_lesson_id && course.next_lesson_title && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--ks-bg-soft)] border border-[var(--ks-border)]/60 px-4 py-2.5">
                <p className="text-sm text-[var(--ks-text-muted)]">
                  Next up: <span className="font-medium text-[var(--ks-text)]">{course.next_lesson_title}</span>
                </p>
                <Link
                  to={`/courses/${course.course_id}/lessons/${course.next_lesson_id}`}
                  className="text-sm font-semibold text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
                >
                  Continue →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function QuizPerformanceSection({ quizPerformance }) {
  if (quizPerformance.length === 0) {
    return (
      <StateMessage variant="empty" title="No quiz results yet">
        Complete a quiz to start tracking your performance.
      </StateMessage>
    )
  }

  const chartData = quizPerformance.map((quiz) => ({
    quiz_title: quiz.quiz_title,
    average_percentage: Math.round(quiz.average_percentage || 0),
    best_percentage: Math.round(quiz.best_percentage || 0),
  }))

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ks-text)]">Quiz Performance</h2>
        <p className="mt-1 text-sm text-[var(--ks-text-muted)]">
          Average and best scores across your completed attempts.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
              <XAxis
                dataKey="quiz_title"
                stroke="#8C7A6B"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  value.length > 14 ? `${value.slice(0, 14)}…` : value
                }
              />
              <YAxis domain={[0, 100]} stroke="#8C7A6B" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="average_percentage" name="Average %" fill="#F16524" radius={[4, 4, 0, 0]} />
              <Bar dataKey="best_percentage" name="Best %" fill="#FF8A4C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Quiz</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Attempts</th>
                <th className="px-5 py-3 font-semibold">Average</th>
                <th className="px-5 py-3 font-semibold">Best</th>
                <th className="px-5 py-3 font-semibold">Last Attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ks-border)]">
              {quizPerformance.map((quiz) => (
                <tr key={quiz.quiz_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[var(--ks-text)]">{quiz.quiz_title}</td>
                  <td className="px-5 py-3 text-[var(--ks-text-muted)]">{quiz.course_title}</td>
                  <td className="px-5 py-3">{quiz.attempts}</td>
                  <td className="px-5 py-3">{formatPercent(quiz.average_percentage)}</td>
                  <td className="px-5 py-3 text-emerald-600 font-semibold">{formatPercent(quiz.best_percentage)}</td>
                  <td className="px-5 py-3 text-[var(--ks-text-muted)]">{formatDate(quiz.last_attempt_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function RecentActivitySection({ recentActivity }) {
  if (recentActivity.length === 0) {
    return (
      <StateMessage variant="empty" title="No activity yet">
        Your learning activity will appear here over time.
      </StateMessage>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ks-text)]">Recent Activity</h2>
        <p className="mt-1 text-sm text-[var(--ks-text-muted)]">Your latest learning events.</p>
      </div>
      <div className="divide-y divide-[var(--ks-border)] rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        {recentActivity.map((event, index) => (
          <div key={`${event.event_type}-${event.timestamp}-${index}`} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--ks-orange)]">
                {ACTIVITY_LABELS[event.event_type] || event.event_type}
              </span>
              <p className="truncate text-sm text-[var(--ks-text)]">{event.description}</p>
            </div>
            <span className="shrink-0 text-xs text-[var(--ks-text-muted)]">
              {new Date(event.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function StudentAnalyticsPage() {
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
        const data = await getStudentAnalytics()
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
    return <StateMessage variant="loading" title="Loading your analytics..." />
  }

  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Could not load your analytics"
        onRetry={() => setReloadKey((key) => key + 1)}
      >
        {error}
      </StateMessage>
    )
  }

  const summary = analytics?.summary
  const courses = analytics?.courses || []
  const quizPerformance = analytics?.quiz_performance || []
  const recentActivity = analytics?.recent_activity || []

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-[var(--ks-text-muted)]">
          A snapshot of your learning progress and quiz performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={summary?.total_courses ?? 0} />
        <StatCard label="Completed Courses" value={summary?.completed_courses ?? 0} />
        <StatCard label="Active Courses" value={summary?.active_courses ?? 0} />
        <StatCard label="Lessons Completed" value={summary?.lessons_completed ?? 0} />
        <StatCard label="Quiz Attempts" value={summary?.quiz_attempts ?? 0} />
        <StatCard label="Average Quiz Score" value={formatPercent(summary?.average_quiz_score)} />
        <StatCard label="Best Quiz Score" value={formatPercent(summary?.best_quiz_score)} />
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
            Overall Learning Progress
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--ks-text)]">
            {formatPercent(summary?.overall_progress)}
          </p>
          <ProgressBar value={summary?.overall_progress} className="mt-3" />
        </div>
      </div>

      {courses.length === 0 && quizPerformance.length === 0 ? (
        <StateMessage variant="empty" title="Nothing here yet">
          <span className="text-[var(--ks-text-muted)]">Enroll in a course to start tracking your analytics.</span>{' '}
          <Link to="/courses" className="font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]">
            Browse the course catalogue →
          </Link>
        </StateMessage>
      ) : (
        <>
          <CourseProgressSection courses={courses} />
          <QuizPerformanceSection quizPerformance={quizPerformance} />
          <RecentActivitySection recentActivity={recentActivity} />
        </>
      )}
    </section>
  )
}