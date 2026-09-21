import api from './api.js'

export async function getAdminAnalytics() {
  const response = await api.get('/analytics/admin')
  return response.data
}