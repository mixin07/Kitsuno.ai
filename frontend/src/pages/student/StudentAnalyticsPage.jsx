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
import NeoMetricCard from '../../components/NeoMetricCard.jsx'
import { BookOpen, CheckCircle2, Award, Flag, Play, Sparkles } from 'lucide-react'
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

function StatCard({ label, value, hint, icon, iconColor, valueColor }) {
  return (
    <NeoMetricCard
      label={label}
      value={value}
      hint={hint}
      icon={icon}
      iconColor={iconColor}
      valueColor={valueColor}
    />
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
        <h2 className="ks-section-title">Course Progress</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Your progress across enrolled courses.</p>
      </div>
      <div className="space-y-3.5">
        {courses.map((course) => (
          <div
            key={course.course_id}
            className="ks-neo-card p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/courses/${course.course_id}`}
                  className="font-serif text-lg font-normal text-[#241A16] hover:text-[#F16524] transition-colors leading-snug"
                >
                  {course.title}
                </Link>
                {course.completed ? (
                  <span className="shrink-0 rounded-[4px] border border-[#241A16] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                    Completed
                  </span>
                ) : (
                  <span className="shrink-0 rounded-[4px] border border-[rgba(36,26,22,0.25)] bg-[#FAF8F5] text-neutral-600 px-2 py-0.5 font-mono text-[10px] font-medium uppercase">
                    In progress
                  </span>
                )}
              </div>
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                <p className="font-serif text-lg font-normal text-[#F16524]">{formatPercent(course.progress)}</p>
                <p className="text-xs font-mono text-neutral-500">
                  {course.completed_lessons}/{course.total_lessons} lessons
                </p>
              </div>
            </div>

            <ProgressBar value={course.progress} className="mt-1" />

            {course.next_lesson_id && course.next_lesson_title && (
              <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.18)] px-3.5 py-2.5">
                <p className="text-xs text-neutral-600 truncate">
                  Next up: <span className="font-semibold text-[#241A16]">{course.next_lesson_title}</span>
                </p>
                <Link
                  to={`/courses/${course.course_id}/lessons/${course.next_lesson_id}`}
                  className="font-mono text-xs font-bold uppercase text-[#F16524] hover:text-[#241A16] shrink-0 self-start sm:self-auto transition-colors"
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
        <h2 className="ks-section-title">Quiz Performance</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">
          Average and best scores across your completed attempts.
        </p>
      </div>

      <div className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-3.5 sm:p-5">
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

      <div className="overflow-hidden bg-white rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16]">
        {/* Mobile scroll hint */}
        <p className="sm:hidden text-[10.5px] font-mono text-neutral-500 px-3.5 py-1.5 italic bg-[#FAF8F5] border-b-2 border-[#241A16]">
          Swipe table to view all metrics →
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
            <thead className="border-b-2 border-[#241A16] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Quiz</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Course</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Attempts</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Average</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Best</th>
                <th className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold">Last Attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#241A16]/15">
              {quizPerformance.map((quiz) => (
                <tr key={quiz.quiz_id} className="text-[#241A16] hover:bg-[#FAF8F5]/80 transition-colors">
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold text-[#241A16]">{quiz.quiz_title}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-neutral-600 font-mono text-xs">{quiz.course_title}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-mono">{quiz.attempts}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-mono font-semibold">{formatPercent(quiz.average_percentage)}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-emerald-700 font-mono font-bold">{formatPercent(quiz.best_percentage)}</td>
                  <td className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-neutral-500 font-mono text-xs">{formatDate(quiz.last_attempt_at)}</td>
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
        <h2 className="ks-section-title">Study Activity</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">
          Summary of your study actions, completions, and milestones.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <NeoMetricCard
          label="Lessons Finished"
          value={counts['LESSON_COMPLETED'] || 0}
          icon={CheckCircle2}
          valueColor="text-[#241A16]"
        />
        <NeoMetricCard
          label="Quizzes Passed"
          value={counts['QUIZ_COMPLETED'] || 0}
          icon={Award}
          iconColor="text-emerald-700"
          valueColor="text-emerald-700"
        />
        <NeoMetricCard
          label="Lessons Started"
          value={counts['LESSON_STARTED'] || 0}
          icon={Play}
          valueColor="text-[#241A16]"
        />
        <NeoMetricCard
          label="Total Milestones"
          value={totalEvents}
          icon={Flag}
          iconColor="text-[#F16524]"
          valueColor="text-[#F16524]"
        />
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
        <h2 className="ks-section-title">Recent Activity</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Your latest learning events.</p>
      </div>
      <div className="divide-y divide-[rgba(36,26,22,0.12)] ks-neo-card">
        {recentActivity.map((event, index) => (
          <div
            key={`${event.event_type}-${event.timestamp}-${index}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 px-3.5 sm:px-5 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="shrink-0 rounded-[4px] border border-[#241A16] bg-[#F16524]/10 text-[#F16524] px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                {ACTIVITY_LABELS[event.event_type] || event.event_type}
              </span>
              <p className="truncate text-xs sm:text-sm text-[#241A16]">{event.description}</p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-neutral-400 pl-1 sm:pl-0">
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
    <section className="space-y-6 max-w-[1360px] mx-auto pb-12">
      <div className="pb-4 border-b border-[rgba(36,26,22,0.12)]">
        <span className="ks-eyebrow">STUDENT SPACE</span>
        <h1 className="mt-1 ks-page-title">Learning Analytics</h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-xl">
          A snapshot of your learning progress, quiz metrics, and study history.
        </p>
      </div>

      {/* 1. OVERVIEW: 4-col stats */}
      <section className="space-y-3">
        <h2 className="ks-section-title">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Enrolled Courses"
            value={summary?.total_courses ?? 0}
            icon={BookOpen}
            hint={summary?.total_courses === 1 ? '1 active course' : `${summary?.total_courses ?? 0} active courses`}
          />
          <StatCard
            label="Active Courses"
            value={summary?.active_courses ?? 0}
            icon={Sparkles}
            hint="Currently in progress"
          />
          <StatCard
            label="Completed Courses"
            value={summary?.completed_courses ?? 0}
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            valueColor="text-emerald-700"
            hint="100% finished"
          />
          <StatCard
            label="Lessons Completed"
            value={summary?.lessons_completed ?? 0}
            icon={Award}
            iconColor="text-[#F16524]"
            valueColor="text-[#F16524]"
            hint="Across all courses"
          />
        </div>
      </section>

      {/* 2. OVERALL LEARNING PROGRESS */}
      <section className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="ks-neo-card-title">
              Overall Learning Progress
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Cumulative progress across all your enrolled courses
            </p>
          </div>
          <span className="font-serif text-3xl sm:text-4xl font-normal text-[#F16524]">
            {formatPercent(summary?.overall_progress)}
          </span>
        </div>
        <ProgressBar value={summary?.overall_progress} className="h-2.5" />
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[rgba(36,26,22,0.12)] text-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block truncate">
              Quiz Attempts
            </span>
            <span className="text-base sm:text-lg font-normal font-serif text-[#241A16]">
              {summary?.quiz_attempts ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block truncate">
              Average Score
            </span>
            <span className="text-base sm:text-lg font-normal font-serif text-[#241A16]">
              {formatPercent(summary?.average_quiz_score)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block truncate">
              Best Score
            </span>
            <span className="text-base sm:text-lg font-normal font-serif text-emerald-700">
              {formatPercent(summary?.best_quiz_score)}
            </span>
          </div>
        </div>
      </section>

      {courses.length === 0 && quizPerformance.length === 0 ? (
        <StateMessage variant="empty" title="Nothing here yet">
          <span className="text-neutral-600">Enroll in a course to start tracking your analytics.</span>{' '}
          <Link to="/courses" className="font-semibold text-[#F16524] hover:underline">
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