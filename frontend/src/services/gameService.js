import api from './api'

export const gameService = {
  /**
   * Fetch all Play & Learn games with user high scores and play statistics.
   */
  async getGames() {
    const response = await api.get('/games')
    return response.data
  },

  /**
   * Start a verified game session (optionally linked to course context).
   */
  async startGame(gameId, { courseId = null, lessonId = null } = {}) {
    const response = await api.post(`/games/${gameId}/start`, {
      course_id: courseId,
      lesson_id: lessonId,
    })
    return response.data
  },

  /**
   * Fetch game configuration, questions/cards, and an idempotent session token.
   */
  async getGameDetail(gameId) {
    const response = await api.get(`/games/${gameId}`)
    return response.data
  },

  /**
   * Submit game results with answers for server-side verification and idempotent XP rewards.
   */
  async completeGame(gameId, payload) {
    const response = await api.post(`/games/${gameId}/complete`, {
      session_token: payload.sessionToken || payload.session_token,
      score: payload.score ?? 0,
      time_spent_seconds: payload.timeSpentSeconds ?? payload.time_spent_seconds ?? 0,
      course_id: payload.courseId ?? payload.course_id ?? null,
      lesson_id: payload.lessonId ?? payload.lesson_id ?? null,
      answers: payload.answers ?? null,
      matched_pairs: payload.matchedPairs ?? payload.matched_pairs ?? null,
      scrambled_answers: payload.scrambledAnswers ?? payload.scrambled_answers ?? null,
      challenge_solutions: payload.challengeSolutions ?? payload.challenge_solutions ?? null,
    })
    return response.data
  },

  /**
   * Retrieve player's aggregate game stats.
   */
  async getStats() {
    const response = await api.get('/games/stats')
    return response.data
  },

  /**
   * Retrieve player's recent game history.
   */
  async getHistory(limit = 20) {
    const response = await api.get(`/games/history?limit=${limit}`)
    return response.data
  },
}

export default gameService
