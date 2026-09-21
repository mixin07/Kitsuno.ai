import axios from 'axios'
import { clearAccessToken, getAccessToken } from './tokenStorage.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
})

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'

  if (error.response) {
    const { status, data } = error.response

    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail.map((issue) => issue.msg).join(', ')
      }
    }

    if (status === 401) return 'Invalid email or password.'
    if (status === 403) return 'You do not have permission to perform this action.'
    if (status === 409) return 'The request conflicts with the current state.'
    if (status === 422) return 'Please check the form and try again.'
    return `Request failed (${status}). Please try again.`
  }

  if (error.request) {
    return 'Unable to reach the server. Make sure the backend is running and try again.'
  }

  return error.message || 'Something went wrong. Please try again.'
}

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export default api