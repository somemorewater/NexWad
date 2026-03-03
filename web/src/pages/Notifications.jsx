import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { SocketContext } from '../context/SocketContext'
import { notificationsAPI } from '../api/endpoints'
import toast from 'react-hot-toast'

function NotifIcon({ type }) {
  const icons = {
    message: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    like: <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    sale: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    lostfound: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    system: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }
  return icons[type] || icons.system
}

function typeColor(type) {
  return {
    message: 'var(--nw-primary)',
    like: 'var(--nw-accent)',
    sale: 'var(--nw-green)',
    lostfound: 'var(--nw-red)',
    system: 'var(--nw-gold)',
  }[type] || 'var(--nw-primary)'
}

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications: liveNotifications, markNotificationsRead } = useContext(SocketContext)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState({})

  useEffect(() => {
    let mounted = true
    notificationsAPI.getAll()
      .then(({ data }) => {
        if (!mounted) return
        setNotifications(data.notifications || [])
      })
      .catch(() => {
        if (!mounted) return
        toast.error('Could not load notifications')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    notificationsAPI.readAll().catch(() => {})
    markNotificationsRead()
    return () => { mounted = false }
  }, [markNotificationsRead])

  useEffect(() => {
    if (!liveNotifications?.length) return
    setNotifications((prev) => {
      const byId = new Map(prev.map((item) => [item._id, item]))
      liveNotifications.forEach((item) => {
        byId.set(item._id, item)
      })
      return [...byId.values()].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    })
  }, [liveNotifications])

  const items = useMemo(
    () => notifications.slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [notifications]
  )

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Notifications</h1>
            <p className="page-header__sub">All your updates in one place.</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-bell-slash" aria-hidden="true" /></div>
              <div className="empty-state__title">No notifications yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 760 }}>
              {items.map((notif, index) => {
                const id = notif._id || `notif-${index}`
                const expanded = Boolean(expandedIds[id])
                const color = typeColor(notif.type)
                return (
                  <div key={id} className="card card-body" style={{ padding: 'var(--space-4)' }}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(id)}
                      style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 12, alignItems: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <NotifIcon type={notif.type} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--nw-ink)' }}>{notif.title || 'Notification'}</div>
                        <div style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem', marginTop: 2 }}>
                          {expanded ? (notif.body || 'Tap to view details.') : String(notif.body || 'Tap to view details.').slice(0, 96)}
                          {!expanded && notif.body && String(notif.body).length > 96 ? '...' : ''}
                        </div>
                        <div style={{ color: 'var(--nw-gray-400)', fontSize: '0.75rem', marginTop: 6 }}>
                          {formatDistanceToNow(new Date(notif.createdAt || Date.now()), { addSuffix: true })}
                        </div>
                      </div>
                      <div style={{ color: 'var(--nw-gray-500)', fontSize: '0.75rem', marginTop: 4 }}>
                        {expanded ? 'Collapse' : 'Expand'}
                      </div>
                    </button>

                    {expanded && (
                      <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--nw-gray-100)', display: 'grid', gap: 'var(--space-2)' }}>
                        {notif.link && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ width: 'fit-content' }}
                            onClick={() => navigate(notif.link)}
                          >
                            Open
                          </button>
                        )}
                        {notif.data && (
                          <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--nw-gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', overflowX: 'auto' }}>
                            {JSON.stringify(notif.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
