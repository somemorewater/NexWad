const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { Chat, Message } = require('../models/Chat')
const User = require('../models/User')
const { protect, protectAllowBanned, requireCS } = require('../middleware/auth')
const { handleUpload, uploadChatMedia } = require('../utils/cloudinary')
const { paginationRules, validate, body } = require('../middleware/validate')
const { emitToUser } = require('../socket')
const { notifyNewMessage } = require('../utils/notifications')
const { queueUserLog, buildRequestLog } = require('../utils/userLogs')

const SUPPORT_ROLES = new Set(['cs', 'moderator', 'admin', 'superadmin', 'super_admin'])
const SUPPORT_ROLE_REGEX = new RegExp(`^(${Array.from(SUPPORT_ROLES).join('|')})$`, 'i')

const normalizeRole = (role) => String(role || '').toLowerCase()
const toObjectIdString = (value) => {
  if (!value) return null
  const raw = value?._id || value?.id || value
  const str = typeof raw === 'string' ? raw : raw?.toString?.()
  if (!str) return null
  if (!mongoose.Types.ObjectId.isValid(str)) return null
  return new mongoose.Types.ObjectId(str).toString()
}
const isSupportUser = (user) => SUPPORT_ROLES.has(normalizeRole(user?.role))
const isSupportChat = (chat) => chat?.support || chat?.participants?.some(isSupportUser)
const isParticipant = (chat, userId) => chat?.participants?.some(p => (
  (p?._id?.toString?.() || p?.toString?.()) === userId
))
const canAccessSupportChat = (chat, user) => {
  if (!chat?.support) return true
  const assigneeId = chat?.supportAssignee?.toString?.() || chat?.supportAssignee?._id?.toString?.()
  if (!assigneeId) return true
  return assigneeId === user?._id?.toString()
}

// ─── GET /api/chat ────────────────────────────
router.get('/', protectAllowBanned, async (req, res, next) => {
  try {
    const needsSupportFilter = req.user.banned || !isSupportUser(req.user)
    let supportIdSet = null
    if (needsSupportFilter) {
      const supportUsers = await User.find({
        role: { $regex: SUPPORT_ROLE_REGEX },
      }).select('_id').lean()
      supportIdSet = new Set(supportUsers.map(u => String(u._id)))
    }

    const chats = await Chat.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id },
    })
      .populate('participants', 'name avatar online lastSeen role')
      .populate('listing', 'title description price images category')
      .populate({ path: 'lastMessage', select: 'text media createdAt sender' })
      .sort({ lastActivity: -1 })

    const isSupportChatById = (chat) => {
      if (chat?.support) return true
      if (!supportIdSet) return false
      return chat?.participants?.some(p => supportIdSet.has(String(p?._id || p)))
    }

    let filtered = req.user.banned
      ? chats.filter(chat => isSupportChat(chat) || isSupportChatById(chat))
      : (isSupportUser(req.user) ? chats : chats.filter(chat => !(isSupportChat(chat) || isSupportChatById(chat))))

    if (!req.user.banned && !isSupportUser(req.user)) {
      const map = new Map()
      for (const chat of filtered) {
        const other = chat.participants?.find(p => String(p?._id || p) !== req.user._id.toString())
        const key = String(other?._id || other || chat._id)
        const existing = map.get(key)
        if (!existing) {
          map.set(key, chat)
        } else {
          const a = new Date(existing.lastActivity || existing.updatedAt || existing.createdAt || 0).getTime()
          const b = new Date(chat.lastActivity || chat.updatedAt || chat.createdAt || 0).getTime()
          if (b > a) map.set(key, chat)
        }
      }
      filtered = Array.from(map.values())
    }

    const withMessages = filtered.filter(chat => chat.lastMessage)

    const chatsWithUnread = withMessages.map(chat => ({
      ...chat.toObject(),
      unreadCount: chat.unreadCounts?.get?.(req.user._id.toString()) || 0,
    }))

    res.json({ chats: chatsWithUnread })
  } catch (err) { next(err) }
})

// ─── GET /api/chat/support/inbox ──────────────
router.get('/support/inbox', protect, requireCS, async (req, res, next) => {
  try {
    const chats = await Chat.find({
      support: true,
      $or: [
        { supportStatus: 'pending' },
        { supportStatus: { $exists: false } },
        { supportStatus: null },
        { supportAssignee: req.user._id },
      ],
      lastMessage: { $ne: null },
    })
      .populate('participants', 'name avatar online lastSeen role')
      .populate('supportAssignee', 'name avatar role')
      .populate({ path: 'lastMessage', select: 'text media createdAt sender' })
      .sort({ lastActivity: -1 })

    res.json({ chats })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/support/:chatId/accept ─────
router.post('/support/:chatId/accept', protect, requireCS, async (req, res, next) => {
  try {
    const existing = await Chat.findById(req.params.chatId).select('lastMessage').lean()
    if (!existing?.lastMessage) {
      return res.status(409).json({ error: 'No messages yet' })
    }

    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        support: true,
        $and: [
          {
            $or: [
              { supportAssignee: { $exists: false } },
              { supportAssignee: null },
            ],
          },
        ],
      },
      {
        $set: {
          supportAssignee: req.user._id,
          supportStatus: 'assigned',
          supportAssignedAt: new Date(),
        },
        $addToSet: { participants: req.user._id },
      },
      { new: true }
    )
      .populate('participants', 'name avatar online lastSeen role')
      .populate('supportAssignee', 'name avatar role')
      .populate({ path: 'lastMessage', select: 'text media createdAt sender' })

    if (!chat) {
      return res.status(409).json({ error: 'Chat already assigned' })
    }

    res.json({ chat })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/support ───────────────────
router.post('/support', protectAllowBanned, async (req, res, next) => {
  try {
    // Prefer an existing support chat for this user, but only if it's truly with support
    const existingSupportChats = await Chat.find({
      participants: req.user._id,
      support: true,
      $or: [{ listing: { $exists: false } }, { listing: null }],
      deletedBy: { $ne: req.user._id },
    })
      .populate('participants', 'name avatar online lastSeen role')

    if (existingSupportChats.length) {
      const validSupportChat = existingSupportChats.find(c => c.support)
      if (validSupportChat) {
        if (!validSupportChat.supportStatus) {
          await Chat.updateOne(
            { _id: validSupportChat._id },
            { $set: { supportStatus: 'pending', supportRequestedAt: validSupportChat.supportRequestedAt || new Date() } }
          )
          validSupportChat.supportStatus = 'pending'
        }
        return res.status(200).json({ chat: validSupportChat })
      }
    }
    chat = await Chat.create({
      participants: [req.user._id],
      support: true,
      supportStatus: 'pending',
      supportRequestedAt: new Date(),
    })
    chat = await chat.populate('participants', 'name avatar online lastSeen role')

    res.status(201).json({ chat })
  } catch (err) { next(err) }
})

// ─── POST /api/chat/start ─────────────────────
router.post('/start', protectAllowBanned,
  [body('sellerId').notEmpty()], validate,
  async (req, res, next) => {
    try {
      if (normalizeRole(req.user?.role) === 'cs') {
        return res.status(403).json({ error: 'CS accounts cannot start marketplace chats' })
      }
      const { sellerId, listingId } = req.body
      if (sellerId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot chat with yourself' })
      }

      let shouldMarkSupport = false
      if (req.user.banned) {
        const supportUser = await User.findById(sellerId).select('role')
        if (!supportUser || !isSupportUser(supportUser)) {
          return res.status(403).json({ error: 'Banned users can only chat with customer service' })
        }
        shouldMarkSupport = true
      } else {
        const supportUser = await User.findById(sellerId).select('role')
        if (supportUser && isSupportUser(supportUser)) shouldMarkSupport = true
      }

      // Find or create a single chat per seller
      let chat = await Chat.findOne({
        participants: { $all: [req.user._id, sellerId] },
      })
        .populate('participants', 'name avatar online lastSeen role')
        .populate('listing', 'title description price images category')

      if (!chat) {
        chat = await Chat.create({
          participants: [req.user._id, sellerId],
          ...(listingId ? { listing: listingId } : {}),
          ...(shouldMarkSupport ? { support: true } : {}),
        })
        chat = await chat
          .populate('participants', 'name avatar online lastSeen role')
          .populate('listing', 'title description price images category')
      } else if (listingId && String(chat.listing || '') !== String(listingId)) {
        chat = await Chat.findByIdAndUpdate(
          chat._id,
          { listing: listingId },
          { new: true }
        )
          .populate('participants', 'name avatar online lastSeen role')
          .populate('listing', 'title description price images category')
      }

      if (shouldMarkSupport && !chat.support) {
        await Chat.updateOne({ _id: chat._id }, { $set: { support: true } })
        chat.support = true
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
    if (isSupportUser(req.user) && !canAccessSupportChat(chat, req.user)) {
      return res.status(403).json({ error: 'Chat assigned to another agent' })
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
    if (isSupportUser(req.user) && !canAccessSupportChat(chat, req.user)) {
      return res.status(403).json({ error: 'Chat assigned to another agent' })
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
      const id = toObjectIdString(pid)
      if (!id) return
      if (id !== req.user._id.toString()) {
        unreadUpdateFields[`unreadCounts.${id}`] = (chat.unreadCounts?.get?.(id) || 0) + 1
      }
    })

    const participantIds = chat.participants
      .map(pid => toObjectIdString(pid))
      .filter(Boolean)
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: message._id,
      lastActivity: new Date(),
      ...unreadUpdateFields,
      $pull: { deletedBy: { $in: participantIds } },
    })

    const payload = {
      ...populated.toObject(),
      chatId: req.params.chatId,
    }

    // Emit real-time to each recipient's personal room.
    // This works even if they have not joined the specific chat room yet.
    chat.participants.forEach(pid => {
      const id = toObjectIdString(pid)
      if (!id) return
      emitToUser(id, 'new_message', payload)
    })

    // Notify other participants
    chat.participants.forEach(pid => {
      const id = toObjectIdString(pid)
      if (!id) return
      if (id !== req.user._id.toString()) {
        notifyNewMessage(id, req.user.name, req.params.chatId)
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
    if (isSupportUser(req.user) && !canAccessSupportChat(chat, req.user)) {
      return res.status(403).json({ error: 'Chat assigned to another agent' })
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

// ─── DELETE /api/chat/:chatId ────────────────
router.delete('/:chatId', protectAllowBanned, async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', 'role')
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (!isParticipant(chat, req.user._id.toString())) {
      return res.status(403).json({ error: 'Not a participant' })
    }
    if (isSupportUser(req.user) && !canAccessSupportChat(chat, req.user)) {
      return res.status(403).json({ error: 'Chat assigned to another agent' })
    }
    if (req.user.banned && !isSupportChat(chat)) {
      return res.status(403).json({ error: 'Banned users can only chat with customer service' })
    }

    const userId = req.user._id
    await Chat.findByIdAndUpdate(req.params.chatId, {
      $addToSet: { deletedBy: userId },
      [`unreadCounts.${userId.toString()}`]: 0,
    })

    await Message.updateMany(
      { chat: req.params.chatId },
      { $addToSet: { deletedBy: userId } }
    )

    res.json({ message: 'Conversation deleted' })
  } catch (err) { next(err) }
})

module.exports = router
