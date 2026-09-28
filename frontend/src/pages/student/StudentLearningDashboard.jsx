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
import MetricsOverview from '../../components/dashboard/MetricsOverview.jsx'
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard.jsx'
import AIStudyCompanionCard from '../../components/dashboard/AIStudyCompanionCard.jsx'
import DailyQuests from '../../components/dashboard/DailyQuests.jsx'
import PlayAndLearnPreview from '../../components/dashboard/PlayAndLearnPreview.jsx'
import AchievementsSection from '../../components/dashboard/AchievementsSection.jsx'
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
    <div className="space-y-6 w-full pb-8">
      {/* 1. DASHBOARD HEADER */}
      <DashboardHeader user={user} gamification={gamification} />

      {/* 2. PROGRESS OVERVIEW BAR (COMPACT METRICS STRIP WITH SAVED SHORTCUT) */}
      <MetricsOverview
        analytics={analytics}
        enrollments={enrollments}
        gamification={gamification}
        savedCount={savedCount}
      />

      {/* 3. DASHBOARD MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* MAIN LEARNING COLUMN (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-7">
          {/* PRIMARY CONTINUE LEARNING HERO */}
          <ContinueLearningCard
            recommendation={recommendation}
            activeEnrollment={activeEnrollment}
            enrollments={enrollments}
          />

          {/* ACTIVE QUESTS / DAILY GOALS */}
          <DailyQuests gamification={gamification} />

          {/* RECOMMENDED FOR YOU (EXPAND YOUR LEARNING) */}
          <RecommendedCoursesSection enrollments={enrollments} courses={courses} />
        </div>

        {/* COMPANION & ACTIVITY COLUMN (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI STUDY COMPANION */}
          <AIStudyCompanionCard />

          {/* PLAY & LEARN MINIGAMES PREVIEW */}
          <PlayAndLearnPreview />

          {/* ACHIEVEMENTS */}
          <AchievementsSection gamification={gamification} />

          {/* RECENT ACTIVITY LOG */}
          <RecentActivityFeed analytics={analytics} />
        </div>
      </div>
    </div>
  )
}