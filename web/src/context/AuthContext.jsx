import { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/auth'
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/tokenStore'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authAPI.me()
      setUser(data.user)
    } catch {
      clearStoredToken()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (credentials) => {
    setError(null)
    const { data } = await authAPI.login(credentials)
    setStoredToken(data.token)
    setUser(data.user)
    return data
  }

  const signup = async (formData) => {
    setError(null)
    const { data } = await authAPI.signup(formData)
    setStoredToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try { await authAPI.logout() } catch { /* silent */ }
    clearStoredToken()
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const isAuthenticated = Boolean(user)
  const isAdmin = user?.role && ['admin', 'super_admin', 'moderator', 'cs'].includes(user.role)
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      login,
      signup,
      logout,
      updateUser,
      refreshUser: loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
