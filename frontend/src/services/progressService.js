import api from './api.js'

export async function getCourseProgress(courseId) {
  const response = await api.get(`/progress/courses/${courseId}`)
  return response.data
}

export async function getLessonProgress(lessonId) {
  const response = await api.get(`/progress/lessons/${lessonId}`)
  return response.data
}

export async function updateLessonProgress(lessonId, payload) {
  const response = await api.put(`/progress/lessons/${lessonId}`, payload)
  return response.data
}

export async function markLessonComplete(lessonId, completed = true) {
  return updateLessonProgress(lessonId, { completed })
}