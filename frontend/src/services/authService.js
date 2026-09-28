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

export async function updateProfile({ name, password, avatar_url }) {
  const payload = {}
  if (name !== undefined) payload.name = name
  if (password) payload.password = password
  if (avatar_url !== undefined) payload.avatar_url = avatar_url
  const response = await api.patch('/auth/profile', payload)
  return response.data
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/auth/avatar/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}