import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock, Sparkles, BookOpen } from 'lucide-react'

// Canonical roadmap steps matching the platform's independent curricula
const ROADMAP_STEPS = [
  {
    id: 'html',
    title: 'Introduction to HTML',
    subtitle: 'Markup & Semantic Structure',
    category: 'Frontend Foundation',
    searchKeywords: [
      'introduction to html',
      'introduction to html & web fundamentals',
      'html & web fundamentals',
      'html fundamentals',
      'html',
    ],
    defaultLessons: 14,
  },
  {
    id: 'css',
    title: 'Introduction to CSS',
    subtitle: 'Flexbox, Grid & Responsive UI',
    category: 'Styling & Layouts',
    searchKeywords: [
      'introduction to css',
      'introduction to css & responsive design',
      'css & responsive design',
      'responsive design',
      'css',
    ],
    defaultLessons: 13,
  },
  {
    id: 'js',
    title: 'Introduction to JavaScript',
    subtitle: 'DOM, Async & ES6+ Interactivity',
    category: 'Logic & Interactivity',
    searchKeywords: [
      'introduction to javascript',
      'introduction to javascript programming',
      'javascript programming',
      'javascript',
      'js',
    ],
    defaultLessons: 80,
  },
  {
    id: 'react',
    title: 'Introduction to React',
    subtitle: 'Components, State & Hooks',
    category: 'Modern UI Architecture',
    searchKeywords: [
      'introduction to react',
      'introduction to react development',
      'react development',
      'react',
    ],
    defaultLessons: 10,
  },
  {
    id: 'fullstack',
    title: 'Introduction to Full-Stack Development',
    subtitle: 'Full Stack APIs, DB & React Apps',
    category: 'Full Stack Mastery',
    searchKeywords: [
      'introduction to full-stack development',
      'introduction to full stack development',
      'introduction to full stack web development',
      'introduction to full-stack web development with react',
      'full-stack web development with react',
      'full stack web development',
      'full stack',
    ],
    defaultLessons: 107,
  },
]

export default function LearningJourney({ enrollments = [], courses = [] }) {
  const navigate = useNavigate()

  // Calculate dynamic nodes based on real courses and real student enrollment/progress
  const nodes = useMemo(() => {
    // Helper to find matching published course from catalog
    const findCourse = (step) => {
      if (!courses || courses.length === 0) return null
      // 1. Try exact title match first
      const exact = courses.find(
        (c) => (c.title || '').trim().toLowerCase() === step.title.toLowerCase()
      )
      if (exact) return exact
      // 2. Try match against searchKeywords
      return courses.find((c) => {
        const title = (c.title || '').toLowerCase()
        return step.searchKeywords.some((kw) => title === kw || title.includes(kw))
      })
    }

    // Step 1: Pair each roadmap landmark with real course & real enrollment
    const stepData = ROADMAP_STEPS.map((step) => {
      const course = findCourse(step)
      const courseId = course?.id

      // Check if student is actively enrolled in this course
      const enrollment = courseId
        ? (enrollments || []).find((e) => e.course_id === courseId)
        : null

      const isEnrolled = !!enrollment
      const progress = enrollment?.progress ?? 0
      const totalLessons =
        enrollment?.total_lessons ?? course?.total_lessons ?? step.defaultLessons
      const completedLessons = enrollment?.completed_lessons ?? 0
      const isCompleted =
        isEnrolled &&
        progress === 100 &&
        totalLessons > 0 &&
        completedLessons === totalLessons
      const nextLesson = enrollment?.next_lesson

      return {
        ...step,
        course,
        courseId,
        enrollment,
        isEnrolled,
        progress,
        totalLessons,
        completedLessons,
        isCompleted,
        nextLesson,
        lessonId: nextLesson?.id,
      }
    })

    // Step 2: Calculate status according to strict percentage & prerequisite flow
    // State machine: COMPLETED | CURRENT (IN PROGRESS) | NOT_STARTED | LOCKED
    return stepData.map((data, index) => {
      // Check if all previous steps up to this index were completed
      const previousStepCompleted =
        index === 0 || stepData.slice(0, index).every((prev) => prev.isCompleted)

      let status = 'LOCKED'
      let isCompleted = false
      let isCurrent = false
      let isLocked = false
      let isNotStarted = false

      if (data.isCompleted) {
        // 100% completed
        status = 'COMPLETED'
        isCompleted = true
      } else if (data.isEnrolled) {
        // Enrolled
        if (data.progress > 0) {
          // 1-99% -> IN PROGRESS
          status = 'CURRENT'
          isCurrent = true
        } else {
          // 0% -> NOT STARTED
          status = 'NOT_STARTED'
          isNotStarted = true
        }
      } else {
        // Not enrolled
        if (previousStepCompleted) {
          // Prerequisite satisfied: unlocked and ready to start
          status = 'NOT_STARTED'
          isNotStarted = true
        } else {
          // Prerequisite not met: locked
          status = 'LOCKED'
          isLocked = true
        }
      }

      return {
        ...data,
        status,
        isCompleted,
        isCurrent,
        isLocked,
        isNotStarted,
      }
    })
  }, [enrollments, courses])

  const handleNodeClick = (node) => {
    if (node.isLocked) return
    if (node.courseId && node.lessonId) {
      navigate(`/courses/${node.courseId}/lessons/${node.lessonId}`)
    } else if (node.courseId) {
      navigate(`/courses/${node.courseId}`)
    } else {
      navigate('/courses')
    }
  }

  const handleKeyDown = (e, node) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNodeClick(node)
    }
  }

  // Active course subtitle display
  const activeCourseTitle = useMemo(() => {
    const active = nodes.find((n) => n.isCurrent && n.isEnrolled)
    if (active) return active.title
    const completed = nodes.filter((n) => n.isCompleted)
    if (completed.length > 0) return `${completed.length} of ${nodes.length} Milestones Complete`
    return 'Web Development Pathway'
  }, [nodes])

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 md:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[var(--ks-orange)]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--ks-orange)]">
              KITSUNO LEARNING JOURNEY
            </span>
          </div>
          <h2 className="ks-section-title text-lg font-serif mt-0.5">
            Interactive Curriculum Pathway
          </h2>
        </div>
        <span className="text-xs text-[var(--ks-text-muted)] hidden sm:inline-block font-medium">
          {activeCourseTitle}
        </span>
      </div>

      {/* Horizontal Node Path for Desktop / Stacked for Mobile */}
      <div className="relative pt-2 pb-2">
        {/* Connection Line Behind Nodes (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 bg-[var(--ks-border)] -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
          {nodes.map((node) => {
            const isCompleted = node.isCompleted
            const isCurrent = node.isCurrent
            const isLocked = node.isLocked
            const isNotStarted = node.isNotStarted

            return (
              <div
                key={node.id}
                tabIndex={isLocked ? -1 : 0}
                role="button"
                aria-label={`${node.title} - ${node.status}`}
                onClick={() => handleNodeClick(node)}
                onKeyDown={(e) => handleKeyDown(e, node)}
                className={`group relative rounded-xl border p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-orange)] flex flex-col justify-between min-h-[148px] ${
                  isCurrent
                    ? 'border-[var(--ks-orange)] bg-[var(--ks-surface-soft)] shadow-md ring-2 ring-[var(--ks-orange)]/20 scale-[1.02] cursor-pointer'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500 shadow-2xs cursor-pointer'
                    : isNotStarted
                    ? 'border-[var(--ks-border)] bg-[var(--ks-surface)] hover:border-[var(--ks-orange)]/60 shadow-2xs cursor-pointer'
                    : 'border-[var(--ks-border)] bg-[var(--ks-bg-soft)]/50 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Node Status Emblem */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-105 ${
                      isCurrent
                        ? 'bg-[var(--ks-orange)] text-white shadow-sm ring-4 ring-[var(--ks-orange)]/20 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isNotStarted
                        ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                        : 'bg-[var(--ks-border)] text-[var(--ks-text-subtle)]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isLocked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : isNotStarted ? (
                      <BookOpen className="h-3.5 w-3.5" />
                    ) : (
                      <span className="font-bold text-sm">🦊</span>
                    )}
                  </div>

                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-[var(--ks-orange)] text-white'
                        : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-700 font-semibold'
                        : isNotStarted
                        ? 'bg-[var(--ks-surface-soft)] text-[var(--ks-text-muted)] border border-[var(--ks-border)]'
                        : 'bg-[var(--ks-border)] text-[var(--ks-text-muted)]'
                    }`}
                  >
                    {node.status === 'COMPLETED'
                      ? 'COMPLETED'
                      : node.status === 'CURRENT'
                      ? 'IN PROGRESS'
                      : node.status === 'NOT_STARTED'
                      ? 'NOT STARTED'
                      : 'LOCKED'}
                  </span>
                </div>

                {/* Node Content */}
                <div>
                  <h3
                    className={`text-sm font-semibold leading-snug ${
                      isCurrent
                        ? 'text-[var(--ks-orange)] font-bold'
                        : isCompleted
                        ? 'text-[var(--ks-text)]'
                        : isNotStarted
                        ? 'text-[var(--ks-text)] group-hover:text-[var(--ks-orange)] transition-colors'
                        : 'text-[var(--ks-text-muted)]'
                    }`}
                  >
                    {node.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[var(--ks-text-muted)] line-clamp-1">
                    {node.subtitle}
                  </p>
                </div>

                {/* Progress bar inside enrolled current node */}
                {isCurrent && node.isEnrolled && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ks-text-muted)] font-medium">
                      <span>{node.progress}%</span>
                      <span>
                        {node.completedLessons} / {node.totalLessons} lessons
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--ks-border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--ks-orange)] transition-all duration-300"
                        style={{ width: `${Math.max(node.progress > 0 ? 8 : 0, node.progress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Completed node status text */}
                {isCompleted && (
                  <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span>{node.totalLessons} / {node.totalLessons} lessons finished</span>
                  </div>
                )}

                {/* Not started step prompt */}
                {isNotStarted && (
                  <div className="mt-2 text-[10px] text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] font-medium flex items-center gap-1">
                    <span>
                      {node.isEnrolled
                        ? `Start first lesson (${node.totalLessons} lessons) →`
                        : `Enroll to start (${node.totalLessons} lessons) →`}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
