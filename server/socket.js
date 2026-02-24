const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const Chat = require('./models/Chat')
const logger = require('./utils/logger')

let io

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // ─── Auth middleware ───────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('_id name avatar role banned')
      if (!user || user.banned) return next(new Error('Access denied'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ─── Connection handler ────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    logger.info(`Socket connected: ${socket.user.name} (${socket.id})`)

    // Join personal room for notifications
    socket.join(`user:${userId}`)

    // Update user online status
    User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() }).exec()

    // ─── Chat events ──────────────────────────
    socket.on('join_chat', async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId)
        if (!chat) return
        const isParticipant = chat.participants.some(p => p.toString() === userId)
        if (!isParticipant) return
        socket.join(`chat:${chatId}`)
        logger.info(`${socket.user.name} joined chat ${chatId}`)
      } catch (err) {
        logger.error('join_chat error:', err)
      }
    })

    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(`chat:${chatId}`)
    })

    // Typing indicators
    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId,
        name: socket.user.name,
      })
    })

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', { chatId, userId })
    })

    // ─── Disconnect ───────────────────────────
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user.name}`)
      User.findByIdAndUpdate(userId, { online: false, lastSeen: new Date() }).exec()
    })
  })

  logger.info('Socket.io initialized')
  return io
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

// ─── Notification emitter helpers ─────────────
function emitToUser(userId, event, data) {
  getIO().to(`user:${userId}`).emit(event, data)
}

function emitToChat(chatId, event, data) {
  getIO().to(`chat:${chatId}`).emit(event, data)
}

module.exports = { initSocket, getIO, emitToUser, emitToChat }
