import api from './api.js'

export async function listModules(courseId) {
  const response = await api.get(`/courses/${courseId}/modules`)
  return response.data
}

export async function createModule(courseId, payload) {
  const response = await api.post(`/courses/${courseId}/modules`, payload)
  return response.data
}

export async function updateModule(courseId, moduleId, payload) {
  const response = await api.patch(`/courses/${courseId}/modules/${moduleId}`, payload)
  return response.data
}

export async function deleteModule(courseId, moduleId) {
  await api.delete(`/courses/${courseId}/modules/${moduleId}`)
}