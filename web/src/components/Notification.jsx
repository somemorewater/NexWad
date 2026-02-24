import { useContext, useEffect } from 'react'
import { SocketContext } from '../context/SocketContext'
import { formatDistanceToNow } from 'date-fns'

function NotifIcon({ type }) {
  const icons = {
    message: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    like: <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    sale: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    system: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }
  return icons[type] || icons.system
}

function typeColor(type) {
  return {
    message: 'var(--nw-primary)',
    like: 'var(--nw-accent)',
    sale: 'var(--nw-green)',
    system: 'var(--nw-gold)',
  }[type] || 'var(--nw-primary)'
}

export default function NotificationPanel({ onClose }) {
  const { notifications, markNotificationsRead } = useContext(SocketContext)

  useEffect(() => {
    markNotificationsRead()
  }, [markNotificationsRead])

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: 340,
      background: 'var(--nw-white)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--nw-gray-100)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 200,
      overflow: 'hidden',
      animation: 'fadeIn 0.15s var(--ease-out)',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--nw-gray-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem' }}>
          Notifications
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nw-gray-500)', fontSize: '0.8125rem', fontFamily: 'var(--font-body)' }}
        >
          Close
        </button>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--nw-gray-400)',
            fontSize: '0.875rem',
          }}>
            <i className="fa-solid fa-circle-check" aria-hidden="true" /> You're all caught up
          </div>
        ) : (
          notifications.map((notif, i) => (
            <div
              key={notif._id || i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 18px',
                borderBottom: '1px solid var(--nw-gray-50)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--nw-gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: `${typeColor(notif.type)}18`,
                color: typeColor(notif.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <NotifIcon type={notif.type} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--nw-ink)', marginBottom: 2 }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{notif.body}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--nw-gray-400)', marginTop: 4 }}>
                  {formatDistanceToNow(new Date(notif.createdAt || Date.now()), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Standalone Notification component for custom toast-style alerts
 */
export function Notification({ type = 'info', title, message, onDismiss }) {
  const icons = {
    success: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    info: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    warning: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m10.29 3.86-8.17 14A1 1 0 0 0 3 19.5h18a1 1 0 0 0 .88-1.5l-8.17-14a1 1 0 0 0-1.76 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  }

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification__icon">{icons[type]}</div>
      <div className="notification__content">
        {title && <div className="notification__title">{title}</div>}
        {message && <div className="notification__message">{message}</div>}
      </div>
      {onDismiss && (
        <button className="notification__dismiss" onClick={onDismiss} aria-label="Dismiss">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  )
}
