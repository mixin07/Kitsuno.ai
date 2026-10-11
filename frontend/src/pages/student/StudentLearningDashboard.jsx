import { useEffect, useState } from 'react'
import { listMyEnrollments } from '../../services/enrollmentService.js'
import { getStudentAnalytics } from '../../services/analyticsService.js'
import { getStudentRecommendation } from '../../services/recommendationService.js'
import { getGamificationMe } from '../../services/gamificationService.js'
import { listCourses } from '../../services/courseService.js'
import { getSavedOverview } from '../../services/savedService.js'
import { useAuth } from '../../hooks/useAuth.js'
import StateMessage from '../../components/StateMessage.jsx'

// Modular Dashboard Components
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import TodayStudyPlanCard from '../../components/dashboard/TodayStudyPlanCard.jsx'
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard.jsx'
import LearningProgressSection from '../../components/dashboard/LearningProgressSection.jsx'
import ThisWeekConsistencyCard from '../../components/dashboard/ThisWeekConsistencyCard.jsx'
import AIStudyCompanionCard from '../../components/dashboard/AIStudyCompanionCard.jsx'
import PlayAndLearnPreview from '../../components/dashboard/PlayAndLearnPreview.jsx'
import SavedContentSection from '../../components/dashboard/SavedContentSection.jsx'
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed.jsx'
import RecommendedCoursesSection from '../../components/dashboard/RecommendedCoursesSection.jsx'

export default function StudentLearningDashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [gamification, setGamification] = useState(null)
  const [savedOverview, setSavedOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      setIsLoading(true)
      setError('')
      try {
        const [
          enrollmentsRes,
          analyticsRes,
          recommendationRes,
          gamificationRes,
          coursesRes,
          savedOverviewRes,
        ] = await Promise.allSettled([
          listMyEnrollments(),
          getStudentAnalytics(),
          getStudentRecommendation(),
          getGamificationMe(),
          listCourses(),
          getSavedOverview(),
        ])

        if (!active) return

        if (enrollmentsRes.status === 'fulfilled') {
          setEnrollments(enrollmentsRes.value || [])
        } else if (enrollmentsRes.status === 'rejected') {
          setError(enrollmentsRes.reason ? String(enrollmentsRes.reason.message || enrollmentsRes.reason) : '')
        }

        if (coursesRes.status === 'fulfilled') {
          setCourses(Array.isArray(coursesRes.value) ? coursesRes.value : coursesRes.value?.items ?? [])
        }

        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value || null)
        }

        if (recommendationRes.status === 'fulfilled') {
          setRecommendation(recommendationRes.value || null)
        }

        if (gamificationRes.status === 'fulfilled') {
          setGamification(gamificationRes.value || null)
        }

        if (savedOverviewRes.status === 'fulfilled') {
          setSavedOverview(savedOverviewRes.value || null)
        }

        if (enrollmentsRes.status === 'rejected' && analyticsRes.status === 'rejected') {
          const msg = analyticsRes.reason?.response?.data?.detail || enrollmentsRes.reason?.response?.data?.detail || 'Unable to load dashboard'
          setError(typeof msg === 'string' ? msg : 'Unable to load dashboard')
        }
      } catch (err) {
        if (active) setError(String(err?.message || 'Unable to load dashboard'))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [reloadKey])

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading your learning workspace..." />
  }

  if (error && enrollments.length === 0 && !analytics) {
    return (
      <StateMessage variant="error" title="Could not load your learning workspace" onRetry={() => setReloadKey((k) => k + 1)}>
        {error}
      </StateMessage>
    )
  }

  // Active enrollment selection
  const activeEnrollment = (() => {
    if (enrollments.length === 0) return null
    const inProgress = enrollments.find((e) => (e.progress ?? 0) < 100 && e.next_lesson)
    if (inProgress) return inProgress
    const anyInProgress = enrollments.find((e) => (e.progress ?? 0) < 100)
    if (anyInProgress) return anyInProgress
    return enrollments[0]
  })()

  const savedCount =
    (savedOverview?.saved_course_ids?.length || 0) +
    (savedOverview?.saved_lesson_ids?.length || 0) +
    (savedOverview?.saved_note_lesson_ids?.length || 0)

  return (
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {/* 1. DASHBOARD HEADER & GREETING */}
      <DashboardHeader user={user} gamification={gamification} />

      {/* 2. PRIMARY ACTION ROW: TODAY'S FOCUS + CONTINUE LEARNING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Today's Focus (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <TodayStudyPlanCard />
        </div>

        {/* Continue Learning (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <ContinueLearningCard
            recommendation={recommendation}
            activeEnrollment={activeEnrollment}
            enrollments={enrollments}
          />
        </div>
      </div>

      {/* 3. PROGRESS ROW: LEARNING PROGRESS + THIS WEEK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Learning Progress & Active Quests (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <LearningProgressSection
            analytics={analytics}
            enrollments={enrollments}
            gamification={gamification}
            savedCount={savedCount}
          />
        </div>

        {/* This Week: Streak & Consistency Strip (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <ThisWeekConsistencyCard
            gamification={gamification}
            analytics={analytics}
          />
        </div>
      </div>

      {/* 4. INTERACTION ROW: ASK KITSUNO AI + PLAY & LEARN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Ask Kitsuno AI (6 cols on desktop) */}
        <div className="lg:col-span-6 flex flex-col">
          <AIStudyCompanionCard />
        </div>

        {/* Play & Learn Minigames (6 cols on desktop) */}
        <div className="lg:col-span-6 flex flex-col">
          <PlayAndLearnPreview />
        </div>
      </div>

      {/* 5. AUDIT ROW: SAVED CONTENT + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Saved Content & Bookmarks (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col">
          <SavedContentSection
            savedOverview={savedOverview}
            gamification={gamification}
          />
        </div>

        {/* Recent Activity Feed (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <RecentActivityFeed analytics={analytics} />
        </div>
      </div>

      {/* 6. DISCOVERY SHELF: RECOMMENDED COURSES */}
      <RecommendedCoursesSection enrollments={enrollments} courses={courses} />
    </div>
  )
}