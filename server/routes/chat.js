const express = require('express')
const router = express.Router()
const { Chat, Message } = require('../models/Chat')
const User = require('../models/User')
const { protectAllowBanned } = require('../middleware/auth')
const { handleUpload, uploadChatMedia } = require('../utils/cloudinary')
const { paginationRules, validate, body } = require('../middleware/validate')
const { emitToUser } = require('../socket')
const { notifyNewMessage } = require('../utils/notifications')
const { queueUserLog, buildRequestLog } = require('../utils/userLogs')

const SUPPORT_ROLES = new Set(['cs', 'moderator', 'admin', 'superadmin', 'super_admin'])

const isSupportUser = (user) => SUPPORT_ROLES.has(user?.role)
const isSupportChat = (chat) => chat?.participants?.some(isSupportUser)
const isParticipant = (chat, userId) => chat?.participants?.some(p => (
  (p?._id?.toString?.() || p?.toString?.()) === userId
))

// ─── GET /api/chat ────────────────────────────
router.get('/', protectAllowBanned, async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id },
    })
      .populate('participants', 'name avatar online lastSeen role')
      .populate('listing', 'title description price images category')
      .populate({ path: 'lastMessage', select: 'text media createdAt sender' })
      .sort({ lastActivity: -1 })

    const filtered = req.user.banned ? chats.filter(isSupportChat) : chats

    const chatsWithUnread = filtered.map(chat => ({
      ...chat.toObject(),
      unreadCount: chat.unreadCounts?.get?.(req.user._id.toString()) || 0,
    }))

    res.json({ chats: chatsWithUnread })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/support ───────────────────
router.post('/support', protectAllowBanned, async (req, res, next) => {
  try {
    const supportUser = await User.findOne({
      role: { $in: Array.from(SUPPORT_ROLES) },
      banned: false,
    }).select('_id name avatar role')

    if (!supportUser) {
      return res.status(404).json({ error: 'No customer service agent available' })
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, supportUser._id] },
      $or: [{ listing: { $exists: false } }, { listing: null }],
    })
      .populate('participants', 'name avatar online lastSeen role')

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, supportUser._id],
      })
      chat = await chat.populate('participants', 'name avatar online lastSeen role')
    }

    res.status(201).json({ chat })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/start ─────────────────────
router.post('/start', protectAllowBanned,
  [body('sellerId').notEmpty()], validate,
  async (req, res, next) => {
    try {
      const { sellerId, listingId } = req.body
      if (sellerId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot chat with yourself' })
      }

      if (req.user.banned) {
        const supportUser = await User.findById(sellerId).select('role')
        if (!supportUser || !isSupportUser(supportUser)) {
          return res.status(403).json({ error: 'Banned users can only chat with customer service' })
        }
      }

      // Find or create chat
      let chat = await Chat.findOne({
        participants: { $all: [req.user._id, sellerId] },
        ...(listingId ? { listing: listingId } : {}),
      })
        .populate('participants', 'name avatar online lastSeen role')
        .populate('listing', 'title description price images category')

      if (!chat) {
        chat = await Chat.create({
          participants: [req.user._id, sellerId],
          ...(listingId ? { listing: listingId } : {}),
        })
        chat = await chat
          .populate('participants', 'name avatar online lastSeen role')
          .populate('listing', 'title description price images category')
      }

      queueUserLog(buildRequestLog(req, res, {
        action: 'chat_started',
        category: 'chat',
        entityType: 'chat',
        entityId: chat._id.toString(),
        metadata: { listingId: listingId || null, sellerId },
      }))

      res.status(201).json({ chat })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/chat/:chatId/messages ──────────
router.get('/:chatId/messages', protectAllowBanned, paginationRules, validate, async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', 'role')
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (!isParticipant(chat, req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a participant' })
    }
    if (req.user.banned && !isSupportChat(chat)) {
      return res.status(403).json({ error: 'Banned users can only chat with customer service' })
    }

    const { page = 1, limit = 30 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [messages, total] = await Promise.all([
      Message.find({
        chat: req.params.chatId,
        deletedBy: { $ne: req.user._id },
      })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ chat: req.params.chatId }),
    ])

    res.json({
      messages: messages.reverse(),
      hasMore: total > skip + messages.length,
      page: parseInt(page),
    })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/:chatId/messages ─────────
router.post('/:chatId/messages', protectAllowBanned, handleUpload(uploadChatMedia), async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text?.trim() && !req.file) {
      return res.status(400).json({ error: 'Message must have text or media' })
    }

    const chat = await Chat.findById(req.params.chatId).populate('participants', 'role')
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (!isParticipant(chat, req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a participant' })
    }
    if (req.user.banned && !isSupportChat(chat)) {
      return res.status(403).json({ error: 'Banned users can only chat with customer service' })
    }

    const message = await Message.create({
      chat: req.params.chatId,
      sender: req.user._id,
      text: text?.trim(),
      media: req.file?.path,
      mediaPublicId: req.file?.filename,
      mediaType: req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : undefined,
      readBy: [req.user._id],
    })

    const populated = await message.populate('sender', 'name avatar')

    // Update chat metadata + increment unread for other participants
    const unreadUpdateFields = {}
    chat.participants.forEach(pid => {
      const id = pid.toString()
      if (id !== req.user._id.toString()) {
        unreadUpdateFields[`unreadCounts.${id}`] = (chat.unreadCounts?.get?.(id) || 0) + 1
      }
    })

    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: message._id,
      lastActivity: new Date(),
      ...unreadUpdateFields,
    })

    const payload = {
      ...populated.toObject(),
      chatId: req.params.chatId,
    }

    // Emit real-time to each recipient's personal room.
    // This works even if they have not joined the specific chat room yet.
    chat.participants.forEach(pid => {
      emitToUser(pid.toString(), 'new_message', payload)
    })

    // Notify other participants
    chat.participants.forEach(pid => {
      if (pid.toString() !== req.user._id.toString()) {
        notifyNewMessage(pid.toString(), req.user.name, req.params.chatId)
      }
    })

    res.status(201).json({ message: populated })
  } catch (err) { next(err) }
})

// ─── PUT /api/chat/:chatId/read ───────────────
router.put('/:chatId/read', protectAllowBanned, async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', 'role')
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (!isParticipant(chat, req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a participant' })
    }
    if (req.user.banned && !isSupportChat(chat)) {
      return res.status(403).json({ error: 'Banned users can only chat with customer service' })
    }

    const userId = req.user._id.toString()
    await Chat.findByIdAndUpdate(req.params.chatId, {
      [`unreadCounts.${userId}`]: 0,
    })
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )
    res.json({ message: 'Marked as read' })
  } catch (err) { next(err) }
})

module.exports = router
