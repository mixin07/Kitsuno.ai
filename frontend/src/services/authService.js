import api from './api.js'
import { supabase } from '../lib/supabase.js'
import { clearAccessToken, setAccessToken } from './tokenStorage.js'

export async function register({ name, email, password, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: role || 'STUDENT',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (data?.session?.access_token) {
    setAccessToken(data.session.access_token)
  }

  return data
}

export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  clearAccessToken()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw new Error(error.message)
  }
  return data?.session
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    throw new Error(error.message)
  }
  return data?.user
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}

export async function updateProfile({ name, password, avatar_url }) {
  if (password) {
    const { error: pwdErr } = await supabase.auth.updateUser({ password })
    if (pwdErr) {
      throw new Error(pwdErr.message)
    }
  }

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