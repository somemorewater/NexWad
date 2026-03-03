import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io } from 'socket.io-client'
import { AuthContext } from './AuthContext'
import { getStoredToken } from '../utils/tokenStore'
import { getRuntimeApiOrigin } from '../utils/networkConfig'
import { notificationsAPI } from '../api/endpoints'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useContext(AuthContext)
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      setNotifications([])
      setUnreadCount(0)
      return
    }

    notificationsAPI.getAll()
      .then(({ data }) => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {})

    const token = getStoredToken()
    socketRef.current = io(getRuntimeApiOrigin() || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 49)])
      setUnreadCount(c => c + 1)
    })

    socket.on('unread_count', ({ count }) => setUnreadCount(count))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [isAuthenticated, user?._id])

  const emit = useCallback((event, data, cb) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, cb)
    }
  }, [])

  const on = useCallback((event, handler) => {
    const socket = socketRef.current
    if (!socket) return () => {}
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [])

  const markNotificationsRead = useCallback(() => {
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const value = useMemo(() => ({
    socket: socketRef.current,
    connected,
    emit,
    on,
    notifications,
    unreadCount,
    markNotificationsRead,
  }), [connected, emit, on, notifications, unreadCount, markNotificationsRead])

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
