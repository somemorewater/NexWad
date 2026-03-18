import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SocketContext } from '../context/SocketContext'
import { useLayout } from '../context/LayoutContext'
import nexwadLogo from '../assets/images/nexwad-logo-full.png'
import { getDefaultRouteForUser, getPrimaryNavForUser, isSellerRole } from '../utils/roleRouting'
import { getUserPath } from '../utils/userPath'

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

function SupportChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M4 12v4a2 2 0 0 0 2 2h2" />
      <path d="M20 12v4a2 2 0 0 1-2 2h-2" />
      <rect x="2.5" y="11" width="4" height="6" rx="1" />
      <rect x="17.5" y="11" width="4" height="6" rx="1" />
      <path d="M9 20h6" />
      <path d="M12 20v2" />
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
  const { unreadCount, unreadSupportCount } = useContext(SocketContext)
  const { toggleSidebar, closeSidebar } = useLayout()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  const [isTabletOrSmaller, setIsTabletOrSmaller] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  )
  const userMenuRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowMobileSearch(false)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768)
      setIsTabletOrSmaller(window.innerWidth <= 1024)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setShowMobileSearch(false)
  }, [location.pathname])

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NW'
  const canSell = isSellerRole(user?.role)
  const defaultRoute = isAuthenticated ? getDefaultRouteForUser(user) : '/'
  const primaryNav = getPrimaryNavForUser(user)
  const isAdminAccount = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs', 'developer'].includes(String(user?.role || '').toLowerCase())

  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname)
  const hasGuestSidebar = location.pathname === '/marketplace'
    || location.pathname === '/social'
    || location.pathname === '/lost-found'
    || location.pathname === '/search'
    || location.pathname.startsWith('/marketplace/')
  const canToggleSidebar = isTabletOrSmaller && (isAuthenticated || hasGuestSidebar)
  const canGoBack = isAuthenticated && !isPublicPage && location.pathname !== defaultRoute

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(defaultRoute)
  }

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          {canToggleSidebar && (
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
          <Link to={defaultRoute} className="navbar__logo" onClick={closeSidebar}>
            <img src={nexwadLogo} alt="NexWAD" className="navbar__logo-img" />
          </Link>
        </div>

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

        {/* Actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <button
                className="btn btn-ghost btn-sm navbar__page-title"
                onClick={() => navigate(primaryNav.to)}
              >
                {primaryNav.label}
              </button>

              {/* New Listing */}
              {canSell && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/marketplace?create=true')}
                >
                  <PlusIcon /> Sell
                </button>
              )}

              {/* Messages */}
              {isMobile && (
                <button
                  className="navbar__icon-btn"
                  onClick={() => setShowMobileSearch(v => !v)}
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              )}

              {/* Messages */}
              <button
                className="navbar__icon-btn"
                onClick={() => navigate('/cs-chat')}
                aria-label="Chat with CS"
              >
                <SupportChatIcon />
                {unreadSupportCount > 0 && <span className="navbar__notif-dot" />}
              </button>

              {/* Notifications */}
              <button
                className="navbar__icon-btn"
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && <span className="navbar__notif-dot" />}
              </button>

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
                    minWidth: isMobile ? 170 : 200,
                    zIndex: 5100,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s var(--ease-out)',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--nw-gray-100)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{user?.email}</div>
                    </div>
                    {[
                      { label: primaryNav.label, to: primaryNav.to },
                      ...(isAdminAccount ? [{ label: 'Buyer Hub', to: '/home' }] : []),
                      { label: 'My Profile', to: getUserPath(user) },
                      { label: 'My Listings', to: '/marketplace?mine=true' },
                      { label: 'Saved Items', to: '/marketplace?saved=true' },
                      { label: 'Settings', to: '/profile/settings' },
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
              {isMobile && (
                <button
                  className="navbar__icon-btn"
                  onClick={() => setShowMobileSearch(v => !v)}
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              )}
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Join NexWAD</Link>
            </>
          )}
        </div>
      </div>
      {isMobile && showMobileSearch && (
        <div className="navbar__search-mobile">
          <span className="navbar__search-icon">
            <SearchIcon />
          </span>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search marketplace, people…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}
    </nav>
  )
}
