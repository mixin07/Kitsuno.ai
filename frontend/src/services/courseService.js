import api from './api.js'

export async function listCourses() {
  const response = await api.get('/courses')
  return response.data
}

export async function getCourse(courseId) {
  const response = await api.get(`/courses/${courseId}`)
  return response.data
}

export async function createCourse(payload) {
  const response = await api.post('/courses', payload)
  return response.data
}

export async function updateCourse(courseId, payload) {
  const response = await api.patch(`/courses/${courseId}`, payload)
  return response.data
}

export async function deleteCourse(courseId) {
  await api.delete(`/courses/${courseId}`)
}

export async function publishCourse(courseId) {
  const response = await api.post(`/courses/${courseId}/publish`)
  return response.data
}

export async function unpublishCourse(courseId) {
  const response = await api.post(`/courses/${courseId}/unpublish`)
  return response.data
}