import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  BookOpen,
  Play,
  Activity,
  Award,
  BookMarked,
} from 'lucide-react'
import { listMyEnrollments } from '../../services/enrollmentService.js'
import { getStudentAnalytics } from '../../services/analyticsService.js'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import { useAuth } from '../../hooks/useAuth.js'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function StudentLearningDashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const [enrollmentsRes, analyticsRes] = await Promise.allSettled([
          listMyEnrollments(),
          getStudentAnalytics(),
        ])

        if (!active) return

        if (enrollmentsRes.status === 'fulfilled') {
          setEnrollments(enrollmentsRes.value || [])
        }
        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value || null)
        }
      } catch (err) {
        console.error('Failed to load student dashboard data:', err)
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
    return <StateMessage variant="loading" title="Loading your learning workspace..." />
  }

  const summary = analytics?.summary || {}
  const totalCourses = enrollments.length
  const completedCourses = summary.completed_courses ?? 0
  const activeCourses = summary.active_courses ?? totalCourses - completedCourses
  const lessonsCompleted = summary.lessons_completed ?? 0
  const overallProgress = summary.overall_progress ?? 0
  const quizAttempts = summary.quiz_attempts ?? 0
  const avgQuizScore = quizAttempts > 0 ? `${Math.round(summary.average_quiz_score)}%` : '—'

  const activeEnrollment = enrollments.length > 0 ? enrollments[0] : null
  const quizPerformance = analytics?.quiz_performance || []
  const recentActivity = analytics?.recent_activity || []

  return (
    <div className="space-y-8">
      {/* 1. Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ks-orange)]">
            Student Workspace
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)] mt-0.5">
            Welcome back, {user?.name || 'Learner'}
          </h1>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            Track your real course progress, completed lessons, and adaptive quiz scores.
          </p>
        </div>

        <Link
          to="/courses"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-xs font-semibold text-[var(--ks-text)] shadow-xs transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Browse Catalog</span>
        </Link>
      </div>

      {/* 2. Real Metric Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Courses In Progress */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Courses in Progress
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {activeCourses}
            </span>
            {totalCourses > 0 && (
              <span className="text-xs font-semibold text-emerald-600">Active</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalCourses === 0
              ? 'No enrolled courses yet'
              : `${completedCourses} of ${totalCourses} completed`}
          </p>
        </div>

        {/* Card 2: Lessons Completed */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Lessons Completed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {lessonsCompleted}
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text-muted)]">finished</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {summary.lessons_started
              ? `${summary.lessons_started} started in progress`
              : 'Complete lessons to track'}
          </p>
        </div>

        {/* Card 3: Quiz Average */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Quiz Average
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {avgQuizScore}
            </span>
            {quizAttempts > 0 && (
              <span className="text-xs font-semibold text-emerald-600">Real score</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {quizAttempts > 0
              ? `${quizAttempts} ${quizAttempts === 1 ? 'attempt' : 'attempts'} recorded`
              : 'No quizzes taken yet'}
          </p>
        </div>

        {/* Card 4: Overall Progress */}
        <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Overall Progress
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal text-[var(--ks-text)]">
              {overallProgress}%
            </span>
            <span className="text-xs font-semibold text-[var(--ks-text-muted)]">curriculum</span>
          </div>
          <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
            {totalCourses > 0 ? `Across ${totalCourses} course${totalCourses === 1 ? '' : 's'}` : 'Enroll to start progress'}
          </p>
        </div>
      </div>

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Continue Learning & My Courses (7/12 cols) */}
        <div className="space-y-8 lg:col-span-7">
          {/* Continue Learning Prominent Card or Empty State */}
          {activeEnrollment ? (
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(241,101,36,0.2)] bg-[var(--ks-surface)] p-6 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(241,101,36,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ks-orange)] animate-pulse" />
                  Continue Learning
                </span>
                <span className="text-xs font-medium text-[var(--ks-text-muted)]">
                  {activeEnrollment.course?.category || 'Curriculum'}
                </span>
              </div>

              <div className="mt-4">
                <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)]">
                  {activeEnrollment.course?.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--ks-text-muted)]">
                  {activeEnrollment.next_lesson
                    ? `Next: ${activeEnrollment.next_lesson.title}`
                    : activeEnrollment.progress === 100
                    ? 'Congratulations! You have completed all lessons in this course.'
                    : 'Resume your course curriculum'}
                </p>
              </div>

              {/* Progress indicator */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--ks-text)]">{activeEnrollment.progress || 0}% complete</span>
                  <span className="text-[var(--ks-text-muted)]">
                    {activeEnrollment.completed_lessons || 0} of {activeEnrollment.total_lessons || 0} lessons
                  </span>
                </div>
                <ProgressBar value={activeEnrollment.progress || 0} className="h-2.5" />
              </div>

              {/* CTA action */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={
                    activeEnrollment.next_lesson
                      ? `/courses/${activeEnrollment.course_id}/lessons/${activeEnrollment.next_lesson.id}`
                      : `/courses/${activeEnrollment.course_id}`
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--ks-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] hover:shadow-md"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{activeEnrollment.next_lesson ? 'Resume Lesson' : 'View Course'}</span>
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-[var(--ks-text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Active curriculum</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 text-center sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ks-orange)]">
                Get Started
              </span>
              <h3 className="font-display text-2xl font-normal text-[var(--ks-text)] mt-1">
                You are not enrolled in any courses yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ks-text-muted)] leading-relaxed">
                Explore our catalog of structured courses, follow interactive lessons, and challenge yourself with automated AI quizzes.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--ks-orange)] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] hover:shadow-md"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Browse Available Courses</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* My Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-normal text-[var(--ks-text)]">
                  My Courses
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {totalCourses} enrolled {totalCourses === 1 ? 'course' : 'courses'}
                </p>
              </div>
              <Link
                to="/courses"
                className="group flex items-center gap-1 text-xs font-semibold text-[var(--ks-orange)] hover:underline"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {totalCourses > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {enrollments.map((item) => {
                  const course = item.course || {}
                  const diffLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty || 'All Levels'
                  const progress = item.progress || 0
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs transition hover:border-[var(--ks-orange)]/35 hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-[var(--ks-bg-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--ks-text-muted)]">
                            {course.category || 'General'}
                          </span>
                          <span className="text-[11px] font-bold text-[var(--ks-orange)]">
                            {diffLabel}
                          </span>
                        </div>
                        <h4 className="mt-3 font-semibold text-sm line-clamp-2 text-[var(--ks-text)]">
                          {course.title}
                        </h4>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[var(--ks-text-muted)] mb-1.5">
                            <span>{progress}% done</span>
                            <span>
                              {item.completed_lessons || 0}/{item.total_lessons || 0} lessons
                            </span>
                          </div>
                          <ProgressBar value={progress} className="h-1.5" />
                        </div>

                        <Link
                          to={`/courses/${item.course_id}`}
                          className="block w-full text-center rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] py-2 text-xs font-semibold text-[var(--ks-text)] transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.08)] hover:text-[var(--ks-orange)]"
                        >
                          View Course
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 text-center">
                <p className="text-xs text-[var(--ks-text-muted)]">
                  When you enroll in courses from the catalog, they will appear here with your real lesson progress.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real Quiz Performance & Real Learning Activity (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quiz Performance Widget */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(241,101,36,0.15)] text-[var(--ks-orange)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ks-orange)]">
                    Quiz Performance
                  </h3>
                  <p className="text-[11px] text-[var(--ks-text-muted)]">
                    Adaptive recall and assessment scores
                  </p>
                </div>
              </div>
            </div>

            {quizPerformance.length > 0 ? (
              <div className="mt-4 space-y-3">
                {quizPerformance.map((quiz) => (
                  <div
                    key={quiz.quiz_id}
                    className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ks-text)]">
                          {quiz.quiz_title}
                        </p>
                        <p className="text-[10px] text-[var(--ks-text-muted)]">
                          {quiz.course_title}
                        </p>
                      </div>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {Math.round(quiz.best_percentage)}% best
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ks-text-muted)]">
                      <span>{quiz.attempts} {quiz.attempts === 1 ? 'attempt' : 'attempts'}</span>
                      <span>Avg: {Math.round(quiz.average_percentage)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-5 text-center">
                <Award className="mx-auto h-8 w-8 text-[var(--ks-text-muted)] opacity-60" />
                <p className="mt-2 text-xs font-medium text-[var(--ks-text)]">
                  No quizzes completed yet
                </p>
                <p className="mt-1 text-[11px] text-[var(--ks-text-muted)] leading-relaxed">
                  Quizzes are generated within course lessons to test your mastery. Complete your first lesson to take a quiz.
                </p>
              </div>
            )}
          </div>

          {/* Real Learning Activity */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-normal text-[var(--ks-text)]">
                  Recent Activity
                </h3>
                <p className="text-xs text-[var(--ks-text-muted)]">
                  Your authenticated platform timeline
                </p>
              </div>
              <span className="rounded-full bg-[var(--ks-bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ks-text-muted)]">
                Live
              </span>
            </div>

            {recentActivity.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recentActivity.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)] mt-0.5">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--ks-text)] leading-snug">
                        {event.description}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--ks-text-muted)]">
                        {event.timestamp ? new Date(event.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-5 text-center">
                <Activity className="mx-auto h-8 w-8 text-[var(--ks-text-muted)] opacity-60" />
                <p className="mt-2 text-xs font-medium text-[var(--ks-text)]">
                  No learning activity recorded yet
                </p>
                <p className="mt-1 text-[11px] text-[var(--ks-text-muted)] leading-relaxed">
                  Your lesson starts, completions, and quiz submissions will automatically appear here.
                </p>
              </div>
            )}
          </div>

          {/* Quick Learning Shortcuts */}
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ks-text-muted)]">
              Quick Shortcuts
            </h3>
            <div className="mt-4 space-y-2.5">
              <Link
                to="/courses"
                className="flex items-center justify-between rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                    <BookMarked className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--ks-text)]">Explore Courses</p>
                    <p className="text-[10px] text-[var(--ks-text-muted)]">Browse all available curricula</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>

              <Link
                to="/student/analytics"
                className="flex items-center justify-between rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--ks-text)]">Detailed Analytics</p>
                    <p className="text-[10px] text-[var(--ks-text-muted)]">Full breakdown of all metrics</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ks-text-muted)]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}