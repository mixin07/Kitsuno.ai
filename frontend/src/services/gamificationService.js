import api from './api.js'

export async function getGamificationMe() {
  const response = await api.get('/gamification/me')
  return response.data
}

export const getMyGamification = getGamificationMe

const gamificationService = {
  getGamificationMe,
  getMyGamification,
}

export default gamificationService
