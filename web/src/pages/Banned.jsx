import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getBanInfo, clearBanInfo } from '../utils/banStore'

export default function Banned() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const banInfo = useMemo(() => getBanInfo() || {}, [])
  const banReason = user?.banReason || banInfo?.banReason
  const banMessage = banReason || banInfo?.error || 'Your account has been suspended.'

  const handleLogout = async () => {
    await logout()
    clearBanInfo()
    navigate('/login', { replace: true })
  }

  return (
    <div className="banned-page">
      <div className="banned-card">
        <div className="banned-header">
          <div className="banned-badge">Account Suspended</div>
          <h1>We need to review your account</h1>
          <p className="banned-sub">
            {banMessage}
          </p>
        </div>

        <div className="banned-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/cs-chat')}
          >
            Contact Customer Service
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
