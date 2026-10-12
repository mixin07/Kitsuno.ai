import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import * as authService from '../services/authService.js'
import { clearAccessToken, setAccessToken } from '../services/tokenStorage.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleUnauthorized = useCallback(async () => {
    try {
      await authService.signOut()
    } catch {
      clearAccessToken()
    }
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true

    async function syncSession(session) {
      if (!session?.access_token) {
        if (active) {
          clearAccessToken()
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      setAccessToken(session.access_token)
      try {
        const currentUser = await authService.getCurrentUser()
        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          clearAccessToken()
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    // Initialize session from Supabase
    supabase.auth
      .getSession()
      .then(({ data }) => {
        syncSession(data?.session)
      })
      .catch(() => {
        if (active) {
          clearAccessToken()
          setUser(null)
          setIsLoading(false)
        }
      })

    // Listen for Supabase auth state transitions (sign in, sign out, token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (active) {
          clearAccessToken()
          setUser(null)
          setIsLoading(false)
        }
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        await syncSession(session)
      }
    })

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [handleUnauthorized])

  const login = useCallback(async ({ email, password }) => {
    const data = await authService.login({ email, password })
    if (data?.session?.access_token) {
      setAccessToken(data.session.access_token)
    }
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

  const loginWithGoogle = useCallback(async () => {
    return authService.loginWithGoogle()
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    return authService.register({ name, email, password, role })
  }, [])

  const updateUser = useCallback((updated) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : updated))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.signOut()
    } catch {
      clearAccessToken()
    }
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      register,
      updateUser,
      refreshUser,
      logout,
    }),
    [user, isLoading, login, loginWithGoogle, register, updateUser, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}