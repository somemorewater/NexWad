import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { normalizeRole } from '../utils/roleRouting'
import { userLogsAPI } from '../api/endpoints'

const CLICK_SELECTOR = 'button, a, [role="button"], [data-log-action]'

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 140)
}

export default function ActivityTracker() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const lastClickRef = useRef({ key: '', at: 0 })

  useEffect(() => {
    if (!isAuthenticated) return
    if (normalizeRole(user?.role) === 'cs') return

    userLogsAPI.event({
      action: 'route_viewed',
      category: 'navigation',
      route: `${location.pathname}${location.search}`,
      metadata: {
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      },
      occurredAt: new Date().toISOString(),
    }).catch(() => {})
  }, [isAuthenticated, location.pathname, location.search, user?.role])

  useEffect(() => {
    if (!isAuthenticated) return
    if (normalizeRole(user?.role) === 'cs') return

    const onClick = (event) => {
      const target = event.target?.closest?.(CLICK_SELECTOR)
      if (!target) return

      const action = target.getAttribute('data-log-action') || 'ui_click'
      const label = cleanText(
        target.getAttribute('aria-label')
        || target.getAttribute('title')
        || target.textContent
        || target.id
      )

      if (!label) return

      const key = `${action}:${label}:${location.pathname}`
      const now = Date.now()
      if (lastClickRef.current.key === key && now - lastClickRef.current.at < 600) return
      lastClickRef.current = { key, at: now }

      userLogsAPI.event({
        action,
        category: 'click',
        route: `${location.pathname}${location.search}`,
        metadata: {
          label,
          tagName: target.tagName,
          id: target.id || null,
          className: typeof target.className === 'string' ? target.className.slice(0, 200) : null,
          href: target.getAttribute('href') || null,
        },
        occurredAt: new Date().toISOString(),
      }).catch(() => {})
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [isAuthenticated, location.pathname, location.search, user?.role])

  return null
}
