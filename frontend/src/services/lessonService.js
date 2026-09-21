import api from './api.js'

export async function listLessons(courseId, moduleId) {
  const response = await api.get(`/courses/${courseId}/modules/${moduleId}/lessons`)
  return response.data
}

export async function createLesson(courseId, moduleId, payload) {
  const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload)
  return response.data
}

export async function updateLesson(courseId, moduleId, lessonId, payload) {
  const response = await api.patch(
    `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    payload,
  )
  return response.data
}

export async function deleteLesson(courseId, moduleId, lessonId) {
  await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)
}