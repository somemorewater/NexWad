import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io } from 'socket.io-client'
import { AuthContext } from './AuthContext'
import { getStoredToken } from '../utils/tokenStore'

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
      return
    }

    const token = getStoredToken()
    socketRef.current = io(import.meta.env.VITE_API_URL || '', {
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

  const markNotificationsRead = useCallback(() => setUnreadCount(0), [])

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
