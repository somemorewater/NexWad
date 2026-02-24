import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SocketContext } from '../context/SocketContext'
import { useLayout } from '../context/LayoutContext'
import NotificationPanel from './Notification'
import nexwadLogo from '../assets/images/nexwad-logo-full.png'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount } = useContext(SocketContext)
  const { toggleSidebar, closeSidebar } = useLayout()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NW'

  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname)
  const canGoBack = isAuthenticated && !isPublicPage && location.pathname !== '/dashboard'

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/dashboard')
  }

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          {isAuthenticated && isMobile && (
            <button
              className="navbar__icon-btn navbar__menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
          )}

          {canGoBack && (
            <button
              className="navbar__icon-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
          )}

          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar__logo" onClick={closeSidebar}>
            <img src={nexwadLogo} alt="NexWAD" className="navbar__logo-img" />
          </Link>
        </div>

        {/* Search (only when authenticated) */}
        {isAuthenticated && (
          <div className="navbar__search">
            <span className="navbar__search-icon">
              <SearchIcon />
            </span>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search marketplace, people…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        )}

        {/* Actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              {/* New Listing */}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/marketplace?create=true')}
              >
                <PlusIcon /> Sell
              </button>

              {/* Messages */}
              <button
                className="navbar__icon-btn"
                onClick={() => navigate('/chat')}
                aria-label="Messages"
              >
                <MessageIcon />
              </button>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  className="navbar__icon-btn"
                  onClick={() => setShowNotifs(v => !v)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="navbar__notif-dot" />}
                </button>
                {showNotifs && (
                  <NotificationPanel onClose={() => setShowNotifs(false)} />
                )}
              </div>

              {/* User Menu */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  className="avatar avatar-sm"
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{ cursor: 'pointer', border: 'none' }}
                  aria-label="User menu"
                >
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : avatarInitials}
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--nw-white)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--nw-gray-100)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 200,
                    zIndex: 200,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s var(--ease-out)',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--nw-gray-100)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{user?.email}</div>
                    </div>
                    {[
                      { label: 'My Profile', to: `/profile/${user?._id}` },
                      { label: 'My Listings', to: '/marketplace?mine=true' },
                      { label: 'Saved Items', to: '/marketplace?saved=true' },
                      { label: 'Settings', to: '/profile/settings' },
                      ...(user?.role === 'super_admin' || user?.role === 'admin' ? [{ label: 'Admin Panel', to: '/admin' }] : []),
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '0.875rem',
                          color: 'var(--nw-gray-700)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--nw-gray-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--nw-gray-100)' }}>
                      <button
                        onClick={() => { logout(); navigate('/') }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          fontSize: '0.875rem',
                          color: 'var(--nw-red)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Join NexWAD</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
