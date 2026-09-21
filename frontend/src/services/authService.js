import api from './api.js'

export async function register({ name, email, password, role }) {
  const payload = { name, email, password }
  if (role) payload.role = role
  const response = await api.post('/auth/register', payload)
  return response.data
}

export async function login({ email, password }) {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}

export async function updateProfile({ name, password }) {
  const payload = {}
  if (name !== undefined) payload.name = name
  if (password) payload.password = password
  const response = await api.patch('/auth/profile', payload)
  return response.data
}