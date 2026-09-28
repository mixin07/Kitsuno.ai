import api from './api.js'

export async function getSavedOverview() {
  const response = await api.get('/saved/overview')
  return response.data
}

export async function listSavedCourses() {
  const response = await api.get('/saved/courses')
  return response.data
}

export async function saveCourse(courseId) {
  const response = await api.post(`/saved/courses/${courseId}`)
  return response.data
}

export async function unsaveCourse(courseId) {
  await api.delete(`/saved/courses/${courseId}`)
}

export async function listSavedLessons() {
  const response = await api.get('/saved/lessons')
  return response.data
}

export async function saveLesson(lessonId) {
  const response = await api.post(`/saved/lessons/${lessonId}`)
  return response.data
}

export async function unsaveLesson(lessonId) {
  await api.delete(`/saved/lessons/${lessonId}`)
}

export async function listSavedNotes() {
  const response = await api.get('/saved/notes')
  return response.data
}

export async function getSavedNote(lessonId) {
  try {
    const response = await api.get(`/saved/notes/${lessonId}`)
    return response.data
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export async function saveNote(payload) {
  const response = await api.post('/saved/notes', payload)
  return response.data
}

export async function unsaveNote(lessonId) {
  await api.delete(`/saved/notes/${lessonId}`)
}

export async function getCourseStatuses() {
  const response = await api.get('/saved/status')
  return response.data
}

export async function updateCourseStatus(courseId, status) {
  const response = await api.put(`/saved/status/${courseId}`, { status })
  return response.data
}
