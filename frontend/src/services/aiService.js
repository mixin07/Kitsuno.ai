import api from './api.js'

export async function generateQuizQuestions(payload) {
  const response = await api.post('/ai/quizzes/generate', payload)
  return response.data
}

export async function saveQuizQuestions(payload) {
  const response = await api.post('/ai/quizzes/save', payload)
  return response.data
}

export async function askStudyAssistant(payload) {
  const response = await api.post('/ai/study-assistant', payload)
  return response.data
}

export async function sendAIChat(payload) {
  const response = await api.post('/ai/chat', payload)
  return response.data
}

export async function getLessonSummary(lessonId) {
  const response = await api.post(`/ai/lessons/${lessonId}/summary`)
  return response.data
}

export async function getLessonNotes(lessonId) {
  const response = await api.post(`/ai/lessons/${lessonId}/notes`)
  return response.data
}