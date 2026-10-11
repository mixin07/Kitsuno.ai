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
import NeoMetricCard from '../components/NeoMetricCard.jsx'

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
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {/* 1. Header with Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <span className="ks-eyebrow">
            INSTRUCTOR STUDIO
          </span>
          <h1 className="ks-page-title mt-0.5">
            Course Management & Studio
          </h1>
          <p className="ks-muted mt-1">
            Manage your real curricula, lessons, student progress, and automated AI quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/instructor/courses/new"
            className="ks-neo-btn-primary px-3.5 py-2 text-xs font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </Link>
          <Link
            to="/instructor/ai-quiz-generator"
            className="ks-neo-btn-secondary px-3.5 py-2 text-xs font-bold"
          >
            <Sparkles className="h-4 w-4 text-[#F16524]" />
            <span>AI Quiz Generator</span>
          </Link>
        </div>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <NeoMetricCard
          label="Courses Created"
          value={coursesCount}
          icon={BookOpen}
          badge={coursesCount > 0 ? 'Active' : null}
          badgeVariant="success"
          hint={coursesCount > 0 ? `${publishedCount} published · ${draftCount} draft` : 'Create your first course'}
        />
        <NeoMetricCard
          label="Total Learners"
          value={totalEnrolled}
          icon={Users}
          hint={totalEnrolled > 0 ? `Across ${coursesCount} managed ${coursesCount === 1 ? 'course' : 'courses'}` : 'No student enrollments yet'}
        />
        <NeoMetricCard
          label="Quiz Submissions"
          value={totalQuizAttempts}
          icon={Sparkles}
          iconColor="text-[#F16524]"
          valueColor="text-[#F16524]"
          hint={totalQuizAttempts > 0 ? 'Evaluated by adaptive AI engine' : 'Add quizzes to your lessons'}
        />
        <NeoMetricCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          icon={Award}
          hint={totalEnrolled > 0 ? 'Across active student cohorts' : 'Awaiting student activity'}
        />
      </div>

      {/* 3. Main Studio Workspace: Courses & Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Courses List (7/12 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="ks-section-title">
                Managed Courses
              </h2>
              <p className="ks-muted">
                Curriculum, lessons, and automated quizzes
              </p>
            </div>
            <Link
              to="/instructor/courses"
              className="group flex items-center gap-1 text-xs font-bold text-[#F16524] hover:underline"
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[8px] border-2 border-[#241A16] bg-white p-4 sm:p-5 shadow-[4px_4px_0_#241A16] hover:shadow-[5px_5px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-[4px] border border-[#241A16] px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                            course.published
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs font-mono text-neutral-500">
                          {course.category || 'General'}
                        </span>
                      </div>
                      <h3 className="ks-neo-card-title text-base sm:text-lg">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                        <span>{summary?.total_enrolled || 0} enrolled</span>
                        <span>·</span>
                        <span>{summary?.total_lessons || 0} lessons</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold">
                          {Math.round(summary?.completion_rate || 0)}% completion
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/instructor/courses/${course.id}/content`}
                        className="ks-neo-btn-secondary px-3 py-1.5 text-xs"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Curriculum</span>
                      </Link>
                      <Link
                        to={`/instructor/courses/${course.id}/edit`}
                        className="ks-neo-btn-secondary px-3 py-1.5 text-xs"
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
            <div className="bg-white rounded-[8px] border-2 border-[#241A16] p-8 text-center sm:p-10 shadow-[4px_4px_0_#241A16]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524]">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="ks-neo-card-title mt-3 text-lg">
                You haven't created any courses yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs text-neutral-600 leading-relaxed">
                Build your curriculum with modules, lessons, and auto-generated AI quizzes to publish for students.
              </p>
              <div className="mt-5">
                <Link
                  to="/instructor/courses/new"
                  className="ks-neo-btn-primary px-4 py-2 text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Course</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Learner Activity & Quick AI Generator Panel (5/12 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* AI Quiz Generator Callout Card */}
          <div className="bg-white rounded-[8px] border-2 border-[#241A16] p-5 shadow-[4px_4px_0_#241A16] space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#241A16] bg-[#F16524] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="ks-neo-card-title text-base sm:text-lg">
                  AI Quiz Synthesis
                </h3>
                <p className="ks-muted text-[11px]">
                  Generate instant comprehension quizzes from lesson notes
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-neutral-600">
              Input any markdown notes, syllabus, or lecture transcript. Kitsuno analyzes conceptual depth and creates calibrated multiple-choice questions with answer explanations.
            </p>

            <div className="pt-1">
              <Link
                to="/instructor/ai-quiz-generator"
                className="ks-neo-btn-primary w-full py-2.5 text-xs font-bold"
              >
                <span>Open Quiz Generator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Learner Activity Stream */}
          <div className="bg-white rounded-[8px] border-2 border-[#241A16] p-5 shadow-[4px_4px_0_#241A16] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="ks-neo-card-title text-base sm:text-lg">
                  Learner Activity Feed
                </h3>
                <p className="ks-muted text-[11px]">
                  Real-time events across your courses
                </p>
              </div>
              <Link
                to="/instructor/analytics"
                className="text-xs font-bold text-[#F16524] hover:underline"
              >
                Full Analytics
              </Link>
            </div>

            <div className="rounded-[6px] border border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-5 text-center">
              <Activity className="mx-auto h-7 w-7 text-neutral-400" />
              <p className="mt-2 text-xs font-semibold text-[#241A16]">
                No student activity yet
              </p>
              <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                When students enroll in your courses and complete lessons or quizzes, their real-time progress will be recorded here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}