import api from './api.js'

export async function getInstructorRequests() {
  const response = await api.get('/admin/instructor-requests')
  return response.data
}

export async function approveInstructorRequest(userId) {
  const response = await api.post(`/admin/instructor-requests/${userId}/approve`)
  return response.data
}

export async function rejectInstructorRequest(userId) {
  const response = await api.post(`/admin/instructor-requests/${userId}/reject`)
  return response.data
}
