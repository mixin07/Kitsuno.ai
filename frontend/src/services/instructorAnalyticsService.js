import api from './api.js'

export async function getInstructorCourseSummaries() {
  const response = await api.get('/analytics/instructor')
  return response.data
}

export async function getInstructorCourseAnalytics(courseId) {
  const response = await api.get(`/analytics/instructor/courses/${courseId}`)
  return response.data
}