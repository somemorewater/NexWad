import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  {
    label: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
      { to: '/social', label: 'Social Feed', icon: GridIcon },
      { to: '/marketplace', label: 'Marketplace', icon: ShopIcon },
      { to: '/lost-found', label: 'Lost & Found', icon: AlertIcon },
      { to: '/chat', label: 'Messages', icon: ChatIcon, badge: null },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/profile', label: 'Profile', icon: UserIcon },
      { to: '/profile/settings', label: 'Settings', icon: SettingsIcon },
      { to: '/profile/subscription', label: 'Subscription', icon: StarIcon },
    ],
  },
]

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

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NW'

  return (
    <aside className="sidebar">
      {navItems.map(section => (
        <div key={section.label}>
          <div className="sidebar__section-label">{section.label}</div>
          {section.links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
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
        <NavLink to={`/profile/${user?._id}`} className="sidebar__user">
          <div className="avatar avatar-sm">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : avatarInitials}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.name}</div>
            <div className="sidebar__user-role">
              {user?.subscription?.plan === 'premium' ? '⭐ Premium' : user?.role || 'Student'}
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
