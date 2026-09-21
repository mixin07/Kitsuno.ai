import api from './api.js'

export async function enrollInCourse(courseId) {
  const response = await api.post(`/enrollments/${courseId}`)
  return response.data
}

export async function listMyEnrollments() {
  const response = await api.get('/enrollments')
  return response.data
}

export async function getMyEnrollment(courseId) {
  const response = await api.get(`/enrollments/${courseId}`)
  return response.data
}

export async function unenrollFromCourse(courseId) {
  await api.delete(`/enrollments/${courseId}`)
}