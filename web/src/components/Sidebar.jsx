import { Fragment, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLayout } from '../context/LayoutContext'
import { getPrimaryNavForUser, isSellerRole } from '../utils/roleRouting'

function HomeIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function GridIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function ShopIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
}
function AlertIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function ChatIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function UserIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function SettingsIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function StarIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

export default function Sidebar({ messageBadge = 0 }) {
  const { user } = useAuth()
  const location = useLocation()
  const { sidebarOpen, closeSidebar } = useLayout()
  const isGuest = !user
  const primaryNav = getPrimaryNavForUser(user)
  const navItems = isGuest ? [
    {
      label: 'Explore',
      links: [
        { to: '/marketplace', label: 'Marketplace', icon: ShopIcon },
        { to: '/social', label: 'Social Feed', icon: GridIcon },
        { to: '/lost-found', label: 'Lost & Found', icon: AlertIcon },
        { to: '/legal', label: 'Legal', icon: SettingsIcon },
      ],
    },
    {
      label: 'Account',
      links: [
        { to: '/login', label: 'Login', icon: UserIcon },
        { to: '/signup', label: 'Sign Up', icon: StarIcon },
      ],
    },
  ] : [
    {
      label: 'Main',
      links: [
        { to: primaryNav.to, label: primaryNav.label, icon: HomeIcon },
        { to: '/social', label: 'Social Feed', icon: GridIcon },
        { to: '/marketplace', label: 'Marketplace', icon: ShopIcon },
        { to: '/lost-found', label: 'Lost & Found', icon: AlertIcon },
        { to: '/chat', label: 'Messages', icon: ChatIcon, badge: null },
      ],
    },
    {
      label: 'Account',
      links: [
        { to: '/profile', label: 'Profile', icon: UserIcon, end: true },
        { to: '/profile/settings', label: 'Settings', icon: SettingsIcon },
        { to: '/profile/subscription', label: 'Subscription', icon: StarIcon },
      ],
    },
  ]

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NW'
  const sections = navItems.map(section => {
    if (section.label !== 'Account' || isGuest) return section
    return {
      ...section,
      links: [
        ...section.links,
        ...(!isSellerRole(user?.role) ? [{ to: '/profile/become-seller', label: 'Become Seller', icon: ShopIcon }] : []),
      ],
    }
  })

  useEffect(() => {
    closeSidebar()
  }, [location.pathname])

  return (
    <Fragment>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar__backdrop open"
          onClick={closeSidebar}
          aria-label="Close menu"
        />
      )}
      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        {sections.map(section => (
          <div key={section.label}>
            <div className="sidebar__section-label">{section.label}</div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <link.icon />
                {link.label}
                {link.to === '/chat' && messageBadge > 0 && (
                  <span className="sidebar__link-badge">{messageBadge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar__footer">
          {isGuest ? (
            <div className="sidebar__user">
              <div className="avatar avatar-sm">NW</div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">Guest</div>
                <div className="sidebar__user-role">Sign in for full access</div>
              </div>
            </div>
          ) : (
            <NavLink to={`/profile/${user?._id}`} className="sidebar__user" onClick={closeSidebar}>
              <div className="avatar avatar-sm">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : avatarInitials}
              </div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user?.name}</div>
                <div className="sidebar__user-role">
                  {user?.subscription?.plan === 'premium_buyer' || user?.subscription?.plan === 'premium'
                    ? <>
                        <svg
                          viewBox="0 0 22 22"
                          aria-label="Verified account"
                          role="img"
                          style={{ width: 14, height: 14, marginRight: 6, display: 'inline-block' }}
                        >
                          <g>
                            <path
                              fill="currentColor"
                              d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                            />
                          </g>
                        </svg>
                        Verified
                      </>
                    : user?.role || 'Student'}
                </div>
              </div>
            </NavLink>
          )}
        </div>
      </aside>
    </Fragment>
  )
}
