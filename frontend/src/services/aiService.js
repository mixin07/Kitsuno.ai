import api from './api.js'

export async function generateQuizQuestions(payload) {
  const response = await api.post('/ai/quizzes/generate', payload)
  return response.data
}

export async function saveQuizQuestions(payload) {
  const response = await api.post('/ai/quizzes/save', payload)
  return response.data
}