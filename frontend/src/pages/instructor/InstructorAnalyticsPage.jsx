import { useEffect, useMemo, useState } from 'react'
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
import {
  getInstructorCourseAnalytics,
  getInstructorCourseSummaries,
} from '../../services/instructorAnalyticsService.js'

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

function CourseProgressSection({ progress }) {
  if (progress.total_enrolled === 0) {
    return (
      <StateMessage variant="empty" title="No students enrolled yet">
        Course progress will appear here once students enroll.
      </StateMessage>
    )
  }

  const { progress_buckets: buckets = [], min_progress: min = 0, max_progress: max = 0 } = progress
  const chartData = buckets.map((bucket) => ({
    name: bucket.bucket,
    students: Number(bucket.students) || 0,
  }))

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Course Progress"
        subtitle="Enrollment progress distribution across students."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="p-4 lg:col-span-2">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
                <XAxis dataKey="name" stroke="#8C7A6B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#8C7A6B" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
                <Bar dataKey="students" name="Students" fill="#F16524" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <div className="flex flex-col gap-4">
          <StatCard label="Average Progress" value={formatPercent(progress.average_progress)} />
          <SectionCard className="flex flex-1 flex-col justify-center gap-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
              Range &amp; Completion
            </p>
            <p className="text-sm text-[var(--ks-text)]">
              <span className="font-semibold text-[var(--ks-text)]">{formatPercent(min)}</span> min ·
              <span className="ml-1 font-semibold text-[var(--ks-text)]">{formatPercent(max)}</span> max
            </p>
            <p className="text-sm text-[var(--ks-text)]">
              <span className="font-semibold text-emerald-600">
                {formatPercent(progress.completion_percentage)}
              </span>{' '}
              completion rate
            </p>
            <p className="text-sm text-[var(--ks-text)]">
              <span className="font-semibold text-[var(--ks-text)]">{progress.completed_students}</span>{' '}
              completed · <span className="font-semibold text-[var(--ks-text)]">{progress.active_students}</span>{' '}
              still learning
            </p>
          </SectionCard>
        </div>
      </div>
    </section>
  )
}

function LessonAnalyticsSection({ lessons }) {
  if (lessons.length === 0) {
    return (
      <StateMessage variant="empty" title="No lessons yet">
        Add lessons to this course to start tracking engagement.
      </StateMessage>
    )
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Lesson Analytics"
        subtitle="Which lessons students start and complete."
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            <tr>
              <th className="px-5 py-3 font-semibold">Lesson</th>
              <th className="px-5 py-3 font-semibold">Started</th>
              <th className="px-5 py-3 font-semibold">Completed</th>
              <th className="px-5 py-3 font-semibold">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ks-border)]">
            {lessons.map((lesson) => (
              <tr key={lesson.lesson_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                <td className="px-5 py-3">
                  <span className="font-semibold text-[var(--ks-text)]">{lesson.lesson_title}</span>
                  <span className="ml-2 text-xs text-[var(--ks-text-muted)]">{lesson.module_title}</span>
                </td>
                <td className="px-5 py-3">{lesson.students_started}</td>
                <td className="px-5 py-3">{lesson.students_completed}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <ProgressBar value={lesson.completion_percentage} />
                    </div>
                    <span
                      className={
                        lesson.completion_percentage < 40
                          ? 'font-semibold text-amber-700'
                          : 'font-semibold text-emerald-600'
                      }
                    >
                      {formatPercent(lesson.completion_percentage)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function QuizAnalyticsSection({ quizzes }) {
  if (quizzes.length === 0) {
    return (
      <StateMessage variant="empty" title="No quizzes yet">
        Quiz performance will appear here once students take quizzes.
      </StateMessage>
    )
  }

  const chartData = quizzes.map((quiz) => ({
    name: quiz.quiz_title.length > 14 ? `${quiz.quiz_title.slice(0, 14)}…` : quiz.quiz_title,
    average: Math.round(Number(quiz.average_score) || 0),
    best: Math.round(Number(quiz.best_score) || 0),
  }))

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Quiz Analytics"
        subtitle="Average and best scores across completed attempts."
      />
      <SectionCard className="p-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90, 55, 30, 0.08)" />
              <XAxis dataKey="name" stroke="#8C7A6B" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="#8C7A6B" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#241A16' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="average" name="Average %" fill="#F16524" radius={[4, 4, 0, 0]} />
              <Bar dataKey="best" name="Best %" fill="#FF8A4C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
      <div className="overflow-x-auto rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            <tr>
              <th className="px-5 py-3 font-semibold">Quiz</th>
              <th className="px-5 py-3 font-semibold">Attempts</th>
              <th className="px-5 py-3 font-semibold">Students</th>
              <th className="px-5 py-3 font-semibold">Average</th>
              <th className="px-5 py-3 font-semibold">Best</th>
              <th className="px-5 py-3 font-semibold">Lowest</th>
              <th className="px-5 py-3 font-semibold">Completion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ks-border)]">
            {quizzes.map((quiz) => (
              <tr key={quiz.quiz_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                <td className="px-5 py-3 font-semibold text-[var(--ks-text)]">{quiz.quiz_title}</td>
                <td className="px-5 py-3">{quiz.total_attempts}</td>
                <td className="px-5 py-3">{quiz.unique_students}</td>
                <td className="px-5 py-3">{formatScore(quiz.average_score)}</td>
                <td className="px-5 py-3 text-emerald-600 font-semibold">{formatScore(quiz.best_score)}</td>
                <td className="px-5 py-3 text-amber-700 font-semibold">{formatScore(quiz.lowest_score)}</td>
                <td className="px-5 py-3">{formatPercent(quiz.completion_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StudentPerformanceSection({ students }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    const list = [...students]
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
  }, [students, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (students.length === 0) {
    return (
      <StateMessage variant="empty" title="No students enrolled">
        Student performance will appear here once students enroll in this course.
      </StateMessage>
    )
  }

  const sortableHeaderClass = 'cursor-pointer select-none hover:text-[var(--ks-orange)]'

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Student Performance"
        subtitle="Progress and quiz results for enrolled students."
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--ks-border)] bg-[var(--ks-bg-soft)] text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            <tr>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('student_name')}>
                Student
              </th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('course_progress')}>
                Progress
              </th>
              <th className="px-5 py-3 font-semibold">Lessons</th>
              <th className="px-5 py-3 font-semibold">Quiz Attempts</th>
              <th className="px-5 py-3 font-semibold">Avg Quiz Score</th>
              <th className={`px-5 py-3 font-semibold ${sortableHeaderClass}`} onClick={() => toggleSort('completed')}>
                Status
              </th>
              <th className="px-5 py-3 font-semibold">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ks-border)]">
            {sorted.map((student) => (
              <tr key={student.student_id} className="text-[var(--ks-text)] hover:bg-[var(--ks-bg-soft)]/50 transition-colors">
                <td className="px-5 py-3">
                  <span className="font-semibold text-[var(--ks-text)]">{student.student_name}</span>
                  <span className="block text-xs text-[var(--ks-text-muted)]">{student.student_email}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={student.course_progress} />
                    </div>
                    <span className="text-xs">{formatPercent(student.course_progress)}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {student.lessons_completed}/{student.total_lessons}
                </td>
                <td className="px-5 py-3">{student.quiz_attempts}</td>
                <td className="px-5 py-3">{formatScore(student.average_quiz_score)}</td>
                <td className="px-5 py-3">
                  {student.completed ? (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ks-text-muted)]">
                      In progress
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-[var(--ks-text-muted)]">{formatDate(student.last_activity)}</td>
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
        Student activity for this course will appear here over time.
      </StateMessage>
    )
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Recent Activity"
        subtitle="Latest events from students in this course."
      />
      <div className="divide-y divide-[var(--ks-border)] rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] shadow-xs">
        {activity.map((event, index) => (
          <div key={`${event.event_type}-${event.timestamp}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
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

export default function InstructorAnalyticsPage() {
  const [summaries, setSummaries] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [detailReloadKey, setDetailReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadCourses() {
      setIsLoadingCourses(true)
      setCoursesError('')
      try {
        const data = await getInstructorCourseSummaries()
        if (!active) return
        setSummaries(data)
        setSelectedCourseId((current) => {
          if (current && data.some((item) => item.course_id === current)) return current
          return data.length > 0 ? data[0].course_id : null
        })
      } catch (err) {
        if (!active) return
        setCoursesError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoadingCourses(false)
      }
    }

    loadCourses()
    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (!selectedCourseId) return undefined

    let active = true

    async function loadDetail() {
      setIsLoadingDetail(true)
      setDetailError('')
      try {
        const data = await getInstructorCourseAnalytics(selectedCourseId)
        if (!active) return
        setAnalytics(data)
      } catch (err) {
        if (!active) return
        setDetailError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoadingDetail(false)
      }
    }

    loadDetail()
    return () => {
      active = false
    }
  }, [selectedCourseId, detailReloadKey])

  if (isLoadingCourses) {
    return <StateMessage variant="loading" title="Loading your courses..." />
  }

  if (coursesError) {
    return (
      <StateMessage
        variant="error"
        title="Could not load your courses"
        onRetry={() => setReloadKey((key) => key + 1)}
      >
        {coursesError}
      </StateMessage>
    )
  }

  if (summaries.length === 0) {
    return (
      <section className="space-y-6">
        <SectionHeading
          title="Instructor Analytics"
          subtitle="Track enrollment, engagement, and performance across your courses."
        />
        <StateMessage variant="empty" title="No courses to analyze yet">
          Create a course to start tracking enrollment and student performance.
        </StateMessage>
      </section>
    )
  }

  const summary = analytics?.summary
  const progress = analytics?.progress
  const lessons = analytics?.lesson_analytics || []
  const quizzes = analytics?.quiz_analytics || []
  const students = analytics?.student_performance || []
  const activity = analytics?.recent_activity || []

  return (
    <section className="space-y-8">
      <div>
        <p className="ks-eyebrow mb-2 text-[var(--ks-orange)]">
          Instructor
        </p>
        <h1 className="ks-page-title">Instructor Analytics</h1>
        <p className="mt-2 text-[var(--ks-text-muted)]">
          Track enrollment, engagement, and performance across your courses.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="course-select" className="text-sm font-medium text-[var(--ks-text-muted)]">
          Select Course
        </label>
        <select
          id="course-select"
          value={selectedCourseId ?? ''}
          onChange={(event) => setSelectedCourseId(Number(event.target.value))}
          className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-sm text-[var(--ks-text)] shadow-xs focus:border-[var(--ks-orange)] focus:outline-none"
        >
          {summaries.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_title}
              {course.published ? '' : ' (unpublished)'}
            </option>
          ))}
        </select>
      </div>

      {isLoadingDetail && <StateMessage variant="loading" title="Loading analytics..." />}

      {!isLoadingDetail && detailError && (
        <StateMessage
          variant="error"
          title="Could not load course analytics"
          onRetry={() => setDetailReloadKey((key) => key + 1)}
        >
          {detailError}
        </StateMessage>
      )}

      {!isLoadingDetail && !detailError && analytics && (
        <>
          {!summary || summary.total_enrolled === 0 ? (
            <StateMessage variant="empty" title="No analytics data yet for this course">
              Enroll students to start seeing enrollment, progress, and quiz analytics.
            </StateMessage>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Enrolled Students" value={summary?.total_enrolled ?? 0} />
              <StatCard label="Completed Students" value={summary?.completed_students ?? 0} />
              <StatCard label="Average Progress" value={formatPercent(summary?.average_progress)} />
              <StatCard label="Completion Rate" value={formatPercent(summary?.completion_rate)} />
              <StatCard label="Total Lessons" value={summary?.total_lessons ?? 0} />
              <StatCard label="Quiz Attempts" value={summary?.total_quiz_attempts ?? 0} />
              <StatCard label="Average Quiz Score" value={formatScore(summary?.average_quiz_score)} />
              <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
                  Active Students
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--ks-text)]">{summary?.active_students ?? 0}</p>
              </div>
            </div>
          )}

          {progress && <CourseProgressSection progress={progress} />}
          <LessonAnalyticsSection lessons={lessons} />
          <QuizAnalyticsSection quizzes={quizzes} />
          <StudentPerformanceSection students={students} />
          <RecentActivitySection activity={activity} />
        </>
      )}
    </section>
  )
}