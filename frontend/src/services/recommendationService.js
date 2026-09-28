import api from './api.js'

export async function getStudentRecommendation() {
  const response = await api.get('/recommendations/student')
  return response.data
}
