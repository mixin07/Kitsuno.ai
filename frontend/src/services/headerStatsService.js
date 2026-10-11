import api from './api.js'

export async function getStreakDetails() {
  const response = await api.get('/gamification/streak')
  return response.data
}

export async function getXpSummary() {
  const response = await api.get('/gamification/xp-summary')
  return response.data
}

export async function getLevelDetails() {
  const response = await api.get('/gamification/level-details')
  return response.data
}

export async function getNotifications() {
  const response = await api.get('/notifications')
  return response.data
}

export async function markNotificationRead(id) {
  const response = await api.post(`/notifications/${id}/read`)
  return response.data
}

export async function markAllNotificationsRead() {
  const response = await api.post('/notifications/read-all')
  return response.data
}

export async function getMonthlyActivity(year, month) {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  const response = await api.get('/gamification/monthly-activity', { params })
  return response.data
}
