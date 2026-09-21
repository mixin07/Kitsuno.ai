import api from './api.js'

export async function getQuiz(quizId) {
  const response = await api.get(`/quizzes/${quizId}`)
  return response.data
}

export async function startQuizAttempt(quizId) {
  const response = await api.post(`/quizzes/${quizId}/attempts`)
  return response.data
}

export async function listQuizAttempts(quizId) {
  const response = await api.get(`/quizzes/${quizId}/attempts`)
  return response.data
}

export async function getAttemptDetail(attemptId) {
  const response = await api.get(`/attempts/${attemptId}`)
  return response.data
}

export async function submitQuizAttempt(attemptId, answers) {
  const response = await api.post(`/attempts/${attemptId}/submit`, { answers })
  return response.data
}