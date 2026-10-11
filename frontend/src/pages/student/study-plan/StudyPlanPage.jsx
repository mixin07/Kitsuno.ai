import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Target,
} from 'lucide-react'
import {
  listStudyPlans,
  getTodayPlan,
  completeTask,
  deleteStudyPlan,
} from '../../../services/studyPlanService.js'
import TodayFocusTab from './TodayFocusTab.jsx'
import WeeklyCalendarTab from './WeeklyCalendarTab.jsx'
import AllPlansTab from './AllPlansTab.jsx'
import CreatePlanModal from './CreatePlanModal.jsx'
import ReschedulePlanModal from './ReschedulePlanModal.jsx'
import NeoMetricCard from '../../../components/NeoMetricCard.jsx'

export default function StudyPlanPage() {
  const [activeTab, setActiveTab] = useState('today') // 'today' | 'weekly' | 'plans'
  const [plans, setPlans] = useState([])
  const [todayPlan, setTodayPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rescheduleModalPlan, setRescheduleModalPlan] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [plansData, todayData] = await Promise.all([
        listStudyPlans(),
        getTodayPlan(),
      ])
      setPlans(Array.isArray(plansData) ? plansData : [])
      setTodayPlan(todayData)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load study plan information')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTaskCompleted = async (taskId) => {
    try {
      await completeTask(taskId)
      showToast('Task completed! Learning progress updated.')
      // Refresh today plan & plans metrics
      const [plansData, todayData] = await Promise.all([
        listStudyPlans(),
        getTodayPlan(),
      ])
      setPlans(Array.isArray(plansData) ? plansData : [])
      setTodayPlan(todayData)
    } catch (err) {
      console.error('Failed to complete task:', err)
      showToast(err.response?.data?.detail || 'Could not complete task')
    }
  }

  const handlePlanCreated = (newPlan) => {
    showToast(`Study plan for "${newPlan.course_title}" generated successfully!`)
    loadData()
  }

  const handlePlanRescheduled = (updatedPlan) => {
    showToast(`Study plan for "${updatedPlan.course_title}" rescheduled successfully!`)
    loadData()
  }

  const handleDeletePlan = async (planId) => {
    try {
      await deleteStudyPlan(planId)
      showToast('Study plan removed. Lesson progress remains safe.')
      loadData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete plan')
    }
  }

  // Calculate summary metrics
  const activePlans = plans.filter((p) => p.status === 'ACTIVE')
  const overdueCount = todayPlan?.overdue_tasks?.length || 0
  const todayTasksCount = todayPlan?.tasks?.length || 0
  const completedTodayCount =
    todayPlan?.tasks?.filter((t) => t.status === 'COMPLETED').length || 0

  const existingCourseIds = plans.map((p) => p.course_id)
  const dailyGoalMinutes =
    activePlans.length > 0 ? activePlans[0].daily_study_minutes : 30

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7 text-[#241A16] pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-[#241A16] text-white text-xs font-semibold shadow-[2px_3px_0_#241A16] border-[1.5px] border-[#241A16] flex items-center gap-2.5 transition-all">
          <Sparkles className="w-4 h-4 text-[#F16524] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b-[1.5px] border-[#241A16]/10">
        <div>
          <div className="ks-eyebrow flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>PERSONALIZED LEARNING PLANNER</span>
          </div>
          <h1 className="ks-page-title mt-1">
            Study Plans
          </h1>
          <p className="text-xs sm:text-sm text-[#6F625B] mt-1 max-w-xl leading-relaxed">
            Automated, pace-adjusted schedules that keep your coursework and milestones on track.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="ks-neo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Plan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border-[1.5px] border-rose-300 text-rose-900 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <NeoMetricCard
          label="Active Plans"
          value={activePlans.length}
          description={`${plans.length} total enrolled ${plans.length === 1 ? 'plan' : 'plans'}`}
          icon={BookOpen}
        />
        <NeoMetricCard
          label="Today's Tasks"
          value={`${completedTodayCount} / ${todayTasksCount}`}
          description={`${todayPlan?.completed_minutes || 0} / ${todayPlan?.planned_minutes || 0} mins studied`}
          icon={Calendar}
        />
        <NeoMetricCard
          label="Overdue Tasks"
          value={overdueCount}
          valueColor={overdueCount > 0 ? 'text-amber-700' : 'text-[#241A16]'}
          description={overdueCount > 0 ? 'Needs catch-up attention' : 'Zero overdue backlog'}
          icon={AlertTriangle}
          iconColor={overdueCount > 0 ? 'text-amber-600' : 'text-neutral-400'}
        />
        <NeoMetricCard
          label="Daily Goal"
          value={`${dailyGoalMinutes}m`}
          description="Daily session pacing target"
          icon={Clock}
        />
      </div>

      {/* Tabs & View Navigation */}
      <div className="border-b-2 border-[#241A16] flex items-center gap-4 sm:gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`pb-3 border-b-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'today'
              ? 'border-[#F16524] text-[#F16524]'
              : 'border-transparent text-neutral-500 hover:text-[#241A16]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Today's Focus</span>
          {todayTasksCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border border-[#241A16] text-[10px] font-mono font-bold ${
                activeTab === 'today'
                  ? 'bg-[#FFF2E6] text-[#F16524]'
                  : 'bg-white text-neutral-700'
              }`}
            >
              {todayTasksCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 border-b-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'weekly'
              ? 'border-[#F16524] text-[#F16524]'
              : 'border-transparent text-neutral-500 hover:text-[#241A16]'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Weekly Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`pb-3 border-b-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'plans'
              ? 'border-[#F16524] text-[#F16524]'
              : 'border-transparent text-neutral-500 hover:text-[#241A16]'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>All Plans</span>
          {plans.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-[3px] border border-[#241A16] text-[10px] font-mono font-bold ${
                activeTab === 'plans'
                  ? 'bg-[#FFF2E6] text-[#F16524]'
                  : 'bg-white text-neutral-700'
              }`}
            >
              {plans.length}
            </span>
          )}
        </button>
      </div>

      {/* View Content (ONE View Active at a Time) */}
      <div>
        {activeTab === 'today' && (
          <TodayFocusTab
            todayPlan={todayPlan}
            plans={plans}
            loading={loading}
            onTaskCompleted={handleTaskCompleted}
            onOpenReschedule={() => {
              if (plans.length > 0) {
                const overduePlan =
                  plans.find((p) => p.overdue_task_count > 0) || plans[0]
                setRescheduleModalPlan(overduePlan)
              }
            }}
            onOpenCreatePlan={() => setCreateModalOpen(true)}
            hasPlans={plans.length > 0}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyCalendarTab onTaskCompleted={handleTaskCompleted} />
        )}

        {activeTab === 'plans' && (
          <AllPlansTab
            plans={plans}
            loading={loading}
            onOpenCreatePlan={() => setCreateModalOpen(true)}
            onOpenReschedule={(plan) => setRescheduleModalPlan(plan)}
            onDeletePlan={handleDeletePlan}
            onTaskCompleted={handleTaskCompleted}
          />
        )}
      </div>

      {/* Create Plan Modal */}
      <CreatePlanModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPlanCreated={handlePlanCreated}
        existingPlanCourseIds={existingCourseIds}
      />

      {/* Reschedule Plan Modal */}
      <ReschedulePlanModal
        isOpen={Boolean(rescheduleModalPlan)}
        onClose={() => setRescheduleModalPlan(null)}
        plan={rescheduleModalPlan}
        onPlanRescheduled={handlePlanRescheduled}
      />
    </div>
  )
}
