import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../services/tokenStorage.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleUnauthorized = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true

    async function initialize() {
      if (!getAccessToken()) {
        if (active) setIsLoading(false)
        return
      }
      try {
        const currentUser = await authService.getCurrentUser()
        if (active) setUser(currentUser)
      } catch {
        clearAccessToken()
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    initialize()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      active = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [handleUnauthorized])

  const login = useCallback(async ({ email, password }) => {
    const data = await authService.login({ email, password })
    setAccessToken(data.access_token)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      clearAccessToken()
      setUser(null)
      throw error
    }
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    return authService.register({ name, email, password, role })
  }, [])

  const updateUser = useCallback((updated) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : updated))
  }, [])

  const logout = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      updateUser,
      logout,
    }),
    [user, isLoading, login, register, updateUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}