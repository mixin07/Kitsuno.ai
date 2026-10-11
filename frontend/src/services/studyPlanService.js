import api from './api.js'

/**
 * Create a new study plan for the authenticated student and generate deterministic tasks.
 * @param {Object} payload { course_id, target_date, daily_study_minutes, preferred_days_of_week }
 */
export async function createStudyPlan(payload) {
  const response = await api.post('/study-plans', payload)
  return response.data
}

/**
 * List all study plans for the authenticated student.
 */
export async function listStudyPlans() {
  const response = await api.get('/study-plans')
  return response.data
}

/**
 * Get today's workload and overdue tasks across all active plans.
 */
export async function getTodayPlan() {
  const response = await api.get('/study-plans/today')
  return response.data
}

/**
 * Get weekly planner breakdown for the given week start (YYYY-MM-DD) or current week.
 * @param {string} [weekStart] ISO date string (YYYY-MM-DD)
 */
export async function getWeeklyPlan(weekStart) {
  const params = weekStart ? { week_start: weekStart } : {}
  const response = await api.get('/study-plans/weekly', { params })
  return response.data
}

/**
 * Get full study plan details with tasks and course info.
 * @param {number|string} planId
 */
export async function getStudyPlan(planId) {
  const response = await api.get(`/study-plans/${planId}`)
  return response.data
}

/**
 * Update plan metadata (status, target_date, daily_study_minutes, preferred_days_of_week).
 * @param {number|string} planId
 * @param {Object} payload
 */
export async function updateStudyPlan(planId, payload) {
  const response = await api.patch(`/study-plans/${planId}`, payload)
  return response.data
}

/**
 * Delete a study plan (does NOT delete underlying courses or learning progress).
 * @param {number|string} planId
 */
export async function deleteStudyPlan(planId) {
  await api.delete(`/study-plans/${planId}`)
}

/**
 * Reschedule unfinished / overdue tasks for a study plan.
 * @param {number|string} planId
 * @param {Object} payload { new_target_date, daily_study_minutes, preferred_days_of_week }
 */
export async function rescheduleStudyPlan(planId, payload) {
  const response = await api.post(`/study-plans/${planId}/reschedule`, payload)
  return response.data
}

/**
 * Mark a specific task complete (automatically updates lesson progress and awards XP if applicable).
 * @param {number|string} taskId
 */
export async function completeTask(taskId) {
  const response = await api.post(`/study-plans/tasks/${taskId}/complete`)
  return response.data
}

/**
 * Update task attributes (scheduled_date, status, priority, notes).
 * @param {number|string} taskId
 * @param {Object} payload
 */
export async function updateTask(taskId, payload) {
  const response = await api.patch(`/study-plans/tasks/${taskId}`, payload)
  return response.data
}

/**
 * Delete a specific task from a study plan.
 * @param {number|string} taskId
 */
export async function deleteTask(taskId) {
  await api.delete(`/study-plans/tasks/${taskId}`)
}

const studyPlanService = {
  createStudyPlan,
  listStudyPlans,
  getTodayPlan,
  getWeeklyPlan,
  getStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  rescheduleStudyPlan,
  completeTask,
  updateTask,
  deleteTask,
}

export default studyPlanService
