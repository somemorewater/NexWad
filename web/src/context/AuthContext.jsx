import { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/auth'
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/tokenStore'
import { clearBanInfo } from '../utils/banStore'

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
    } catch (err) {
      if (err?.error === 'Account suspended') {
        setUser(err.user || { banned: true, banReason: err.banReason })
        return
      }
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
    try {
      const { data } = await authAPI.login(credentials)
      setStoredToken(data.token)
      setUser(data.user)
      return data
    } catch (err) {
      if (err?.error === 'Account suspended' && err?.token) {
        setStoredToken(err.token)
        if (err.user) setUser(err.user)
        return err
      }
      throw err
    }
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
    clearBanInfo()
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const isAuthenticated = Boolean(user)
  const isAdmin = user?.role && ['admin', 'superadmin', 'super_admin', 'moderator', 'cs', 'developer'].includes(user.role)
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin'

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
