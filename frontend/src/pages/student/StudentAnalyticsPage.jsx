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
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 sm:p-5 shadow-xs flex flex-col justify-between font-sans">
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)] truncate font-sans">
        {label}
      </p>
      <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ks-text)] font-sans">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--ks-text-muted)] truncate font-sans">{hint}</p>}
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
        <h2 className="ks-section-title font-serif text-xl sm:text-2xl">Course Progress</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[var(--ks-text-muted)]">Your progress across enrolled courses.</p>
      </div>
      <div className="space-y-3.5">
        {courses.map((course) => (
          <div
            key={course.course_id}
            className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 sm:p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/courses/${course.course_id}`}
                  className="ks-card-title hover:text-[var(--ks-orange)] font-serif text-base sm:text-lg font-normal leading-snug"
                >
                  {course.title}
                </Link>
                {course.completed ? (
                  <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-600">
                    Completed
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--ks-text-muted)]">
                    In progress
                  </span>
                )}
              </div>
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                <p className="text-base sm:text-lg font-bold text-[var(--ks-orange)]">{formatPercent(course.progress)}</p>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {course.completed_lessons}/{course.total_lessons} lessons
                </p>
              </div>
            </div>

            <ProgressBar value={course.progress} className="mt-1" />

            {course.next_lesson_id && course.next_lesson_title && (
              <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 rounded-lg bg-[var(--ks-bg-soft)] border border-[var(--ks-border)]/60 px-3.5 py-2.5">
                <p className="text-xs text-[var(--ks-text-muted)] truncate">
                  Next up: <span className="font-medium text-[var(--ks-text)]">{course.next_lesson_title}</span>
                </p>
                <Link
                  to={`/courses/${course.course_id}/lessons/${course.next_lesson_id}`}
                  className="text-xs font-semibold text-[var(--ks-orange)] hover:text-[var(--ks-deep)] shrink-0 self-start sm:self-auto"
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
        <h2 className="ks-section-title font-serif text-xl sm:text-2xl">Quiz Performance</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[var(--ks-text-muted)]">
          Average and best scores across your completed attempts.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:p-5 shadow-xs">
        <div className="h-56 sm:h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
              <XAxis
                dataKey="quiz_title"
                stroke="#8C7A6B"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) =>
                  value.length > 12 ? `${value.slice(0, 12)}…` : value
                }
              />
              <YAxis domain={[0, 100]} stroke="#8C7A6B" tick={{ fontSize: 11 }} width={36} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="average_percentage" name="Average %" fill="#F16524" radius={[4, 4, 0, 0]} />
              <Bar dataKey="best_percentage" name="Best %" fill="#FF8A4C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        {/* Mobile scroll hint */}
        <p className="sm:hidden text-[10.5px] text-[var(--ks-text-subtle)] px-3.5 py-1.5 italic bg-[var(--ks-bg-soft)] border-b border-[var(--ks-border)]">
          Swipe table to view all metrics →
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
            <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-[10.5px] sm:text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
              <tr>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Quiz</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Course</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Attempts</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Average</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Best</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold">Last Attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ks-border)]">
              {quizPerformance.map((quiz) => (
                <tr key={quiz.quiz_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold text-[var(--ks-text)]">{quiz.quiz_title}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-[var(--ks-text-muted)]">{quiz.course_title}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3">{quiz.attempts}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3">{formatPercent(quiz.average_percentage)}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-emerald-600 font-semibold">{formatPercent(quiz.best_percentage)}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-[var(--ks-text-muted)]">{formatDate(quiz.last_attempt_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function StudyActivitySection({ recentActivity }) {
  if (!recentActivity || recentActivity.length === 0) return null

  const counts = recentActivity.reduce((acc, ev) => {
    acc[ev.event_type] = (acc[ev.event_type] || 0) + 1
    return acc
  }, {})

  const totalEvents = recentActivity.length

  return (
    <section className="space-y-4">
      <div>
        <h2 className="ks-section-title font-serif text-xl sm:text-2xl">Study Activity</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[var(--ks-text-muted)]">
          Summary of your study actions, completions, and milestones.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block truncate">
            Lessons Finished
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-[var(--ks-text)]">
            {counts['LESSON_COMPLETED'] || 0}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block truncate">
            Quizzes Passed
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-[var(--ks-text)]">
            {counts['QUIZ_COMPLETED'] || 0}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block truncate">
            Lessons Started
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-[var(--ks-text)]">
            {counts['LESSON_STARTED'] || 0}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block truncate">
            Total Milestones
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-[var(--ks-orange)]">
            {totalEvents}
          </span>
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
        <h2 className="ks-section-title font-serif text-xl sm:text-2xl">Recent Activity</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[var(--ks-text-muted)]">Your latest learning events.</p>
      </div>
      <div className="divide-y divide-[var(--ks-border)] rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        {recentActivity.map((event, index) => (
          <div
            key={`${event.event_type}-${event.timestamp}-${index}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 px-3.5 sm:px-5 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="shrink-0 rounded-full border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--ks-orange)]">
                {ACTIVITY_LABELS[event.event_type] || event.event_type}
              </span>
              <p className="truncate text-xs sm:text-sm text-[var(--ks-text)]">{event.description}</p>
            </div>
            <span className="shrink-0 text-[11px] text-[var(--ks-text-subtle)] pl-1 sm:pl-0">
              {new Date(event.timestamp).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
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
    <section className="space-y-6 sm:space-y-8 max-w-[1360px] mx-auto pb-12">
      <div>
        <p className="ks-eyebrow text-xs">Student Space</p>
        <h1 className="ks-page-title font-serif text-2xl sm:text-3xl mt-1">Learning Analytics</h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--ks-text-muted)] font-sans">
          A snapshot of your learning progress, quiz metrics, and study history.
        </p>
      </div>

      {/* 1. OVERVIEW: Compact 2x2 stats on mobile, 4-col on desktop */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] font-sans">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Enrolled Courses" value={summary?.total_courses ?? 0} />
          <StatCard label="Active Courses" value={summary?.active_courses ?? 0} />
          <StatCard label="Completed Courses" value={summary?.completed_courses ?? 0} />
          <StatCard label="Lessons Completed" value={summary?.lessons_completed ?? 0} />
        </div>
      </section>

      {/* 2. OVERALL LEARNING PROGRESS */}
      <section className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 sm:p-6 shadow-xs space-y-3 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ks-text-muted)] font-sans">
              Overall Learning Progress
            </h2>
            <p className="text-xs text-[var(--ks-text-muted)] mt-0.5 font-sans">
              Cumulative progress across all your enrolled courses
            </p>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-[var(--ks-orange)] font-sans">
            {formatPercent(summary?.overall_progress)}
          </span>
        </div>
        <ProgressBar value={summary?.overall_progress} className="h-2.5" />
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--ks-border)]/60 text-center font-sans">
          <div>
            <span className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[var(--ks-text-subtle)] block truncate font-sans">
              Quiz Attempts
            </span>
            <span className="text-sm sm:text-base font-semibold text-[var(--ks-text)] font-sans">
              {summary?.quiz_attempts ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[var(--ks-text-subtle)] block truncate font-sans">
              Average Score
            </span>
            <span className="text-sm sm:text-base font-semibold text-[var(--ks-text)] font-sans">
              {formatPercent(summary?.average_quiz_score)}
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-[10.5px] uppercase font-bold text-[var(--ks-text-subtle)] block truncate font-sans">
              Best Score
            </span>
            <span className="text-sm sm:text-base font-semibold text-emerald-600 font-sans">
              {formatPercent(summary?.best_quiz_score)}
            </span>
          </div>
        </div>
      </section>

      {courses.length === 0 && quizPerformance.length === 0 ? (
        <StateMessage variant="empty" title="Nothing here yet">
          <span className="text-[var(--ks-text-muted)]">Enroll in a course to start tracking your analytics.</span>{' '}
          <Link to="/courses" className="font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]">
            Browse the course catalogue →
          </Link>
        </StateMessage>
      ) : (
        <>
          {/* 3. COURSE PROGRESS */}
          <CourseProgressSection courses={courses} />

          {/* 4. QUIZ PERFORMANCE */}
          <QuizPerformanceSection quizPerformance={quizPerformance} />

          {/* 5. STUDY ACTIVITY */}
          <StudyActivitySection recentActivity={recentActivity} />

          {/* 6. RECENT PERFORMANCE */}
          <RecentActivitySection recentActivity={recentActivity} />
        </>
      )}
    </section>
  )
}