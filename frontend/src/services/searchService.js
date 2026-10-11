import api from './api.js'

export async function searchLibrary(query) {
  if (!query || !query.trim()) {
    return { query: '', interpreted_query: '', total_results: 0, results: [] }
  }
  const response = await api.get('/search', { params: { q: query.trim() } })
  return response.data
}
