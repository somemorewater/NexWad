import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDefaultRouteForUser, normalizeRole } from '../utils/roleRouting'

export default function ProtectedRoute({ requiredRole, fallbackTo }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.banned) {
    if (location.pathname.startsWith('/chat')) {
      return <Outlet />
    }
    return <Navigate to="/banned" replace />
  }

  if (requiredRole) {
    const expected = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const allowedRoles = expected.map(normalizeRole)
    const currentRole = normalizeRole(user?.role)
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to={fallbackTo || getDefaultRouteForUser(user)} replace />
    }
  }

  return <Outlet />
}
