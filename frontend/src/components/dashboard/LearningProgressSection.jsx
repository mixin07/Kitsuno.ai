import { Link } from 'react-router-dom'
import {
  BookOpen,
  GraduationCap,
  Award,
  Bookmark,
  Zap,
} from 'lucide-react'
import NeoMetricCard from '../NeoMetricCard.jsx'

export default function LearningProgressSection({
  analytics,
  enrollments = [],
  gamification,
  savedCount = 0,
}) {
  const summary = analytics?.summary || {}
  const totalCourses = enrollments?.length || 0
  const completedCourses =
    summary.completed_courses ??
    enrollments?.filter((e) => (e.progress ?? 0) >= 100).length ??
    0
  const activeCourses = summary.active_courses ?? totalCourses - completedCourses
  const lessonsCompleted = summary.lessons_completed ?? 0
  const overallProgress = summary.overall_progress ?? 0

  const backendQuests = gamification?.quests || []
  const displayQuests =
    backendQuests.length > 0
      ? backendQuests
      : [
          {
            id: 'daily_lesson',
            title: 'Complete 1 Lesson',
            period: 'daily',
            current_count: 0,
            target_count: 1,
            xp_reward: 50,
            completed: false,
          },
          {
            id: 'daily_quiz',
            title: 'Finish 1 Quiz',
            period: 'daily',
            current_count: 0,
            target_count: 1,
            xp_reward: 75,
            completed: false,
          },
          {
            id: 'daily_ai',
            title: 'Ask Kitsuno AI a doubt',
            period: 'daily',
            current_count: 0,
            target_count: 1,
            xp_reward: 25,
            completed: false,
          },
          {
            id: 'weekly_lessons',
            title: 'Complete 3 Lessons this week',
            period: 'weekly',
            current_count: 0,
            target_count: 3,
            xp_reward: 200,
            completed: false,
          },
        ]

  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3.5 h-full">
      {/* 1. Top: Header & Metrics Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                CURRICULUM METRICS
              </span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>
            <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight mt-0.5">
              Learning Progress
            </h3>
          </div>
          <Link
            to="/student/analytics"
            className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Full Analytics →</span>
          </Link>
        </div>

        {/* 4 Neo-Brutalist Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <NeoMetricCard
            label="Lessons"
            value={lessonsCompleted}
            description="Completed"
            icon={BookOpen}
          />

          <NeoMetricCard
            label="Enrolled"
            value={activeCourses}
            description="In Progress"
            icon={GraduationCap}
          />

          <NeoMetricCard
            label="Overall"
            value={`${overallProgress}%`}
            description="Curriculum"
            icon={Award}
          />

          <Link to="/student/learning?tab=saved" className="block">
            <NeoMetricCard
              label="Saved"
              value={savedCount}
              description="Bookmarks →"
              icon={Bookmark}
              className="hover:border-[#F16524]"
            />
          </Link>
        </div>
      </div>

      {/* 2. Bottom: Minimal Checklist Sheet with Thin Dark Separators */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#F16524] fill-[#F16524]" />
          <h4 className="text-[11px] font-bold text-[#241A16] uppercase tracking-wider">
            DAILY QUESTS
          </h4>
        </div>

        {/* Minimal Checklist Sheet */}
        <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-white divide-y-[1.5px] divide-[#241A16]/15 overflow-hidden">
          {displayQuests.slice(0, 3).map((quest) => {
            const isDone = quest.completed || quest.current_count >= quest.target_count

            return (
              <div
                key={quest.id}
                className={`flex items-center justify-between py-2 px-3 transition-colors text-xs ${
                  isDone ? 'bg-[#F9F7F4] opacity-70' : 'bg-white hover:bg-[#FFF4EB]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`ks-quest-checkbox ${
                      isDone ? 'ks-quest-checkbox--checked' : ''
                    }`}
                  >
                    {isDone ? '✓' : ''}
                  </span>
                  <span
                    className={`truncate font-semibold ${
                      isDone ? 'line-through text-[var(--ks-text-muted)]' : 'text-[#241A16]'
                    }`}
                  >
                    {quest.title}
                  </span>
                </div>

                <span className="text-[10.5px] font-mono font-bold text-[#F16524] bg-[#FFF2E6] px-2 py-0.5 rounded-[4px] border border-[#F16524]/30 shrink-0">
                  +{quest.xp_reward} XP
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
