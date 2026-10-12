import api from './api.js'

// ==========================================
// QUIZ HUB
// ==========================================

export async function getQuizHubSummary() {
  const response = await api.get('/practice/quiz-hub')
  return response.data
}

// ==========================================
// QUESTION BANK
// ==========================================

export async function listQuestionBank({ courseId = null, moduleId = null, search = '', status = 'ALL' } = {}) {
  const params = {}
  if (courseId) params.course_id = courseId
  if (moduleId) params.module_id = moduleId
  if (search && search.trim()) params.search = search.trim()
  if (status && status !== 'ALL') params.status = status

  const response = await api.get('/practice/question-bank', { params })
  return response.data
}

export async function checkQuestionAnswer(questionId, selectedOptionId) {
  const response = await api.post('/practice/question-bank/check', {
    question_id: questionId,
    selected_option_id: selectedOptionId,
  })
  return response.data
}

export async function getQuestionBankStats() {
  const response = await api.get('/practice/question-bank/stats')
  return response.data
}

// ==========================================
// MOCK EXAMS
// ==========================================

export async function listMockExams() {
  const response = await api.get('/practice/mock-exams')
  return response.data
}

export async function createMockExam({ courseId = null, questionCount = 10, durationMinutes = 10 }) {
  const response = await api.post('/practice/mock-exams', {
    course_id: courseId,
    question_count: questionCount,
    duration_minutes: durationMinutes,
  })
  return response.data
}

export async function getMockExamSession(sessionId) {
  const response = await api.get(`/practice/mock-exams/${sessionId}`)
  return response.data
}

export async function submitMockExam(sessionId, answers) {
  const response = await api.post(`/practice/mock-exams/${sessionId}/submit`, {
    answers,
  })
  return response.data
}

export async function getMockExamResult(sessionId) {
  const response = await api.get(`/practice/mock-exams/${sessionId}/result`)
  return response.data
}
