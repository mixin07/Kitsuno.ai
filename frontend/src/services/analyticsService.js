import api from './api.js'

export async function getStudentAnalytics() {
  const response = await api.get('/analytics/student')
  return response.data
}