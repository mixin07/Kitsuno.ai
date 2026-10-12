import { supabase } from '../lib/supabase.js'

let activeToken = null

export function getAccessToken() {
  return activeToken
}

export function setAccessToken(token) {
  activeToken = token || null
}

export function clearAccessToken() {
  activeToken = null
}

export async function getValidToken() {
  if (activeToken) return activeToken
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) {
      activeToken = data.session.access_token
      return activeToken
    }
  } catch {
    // ignore
  }
  return null
}