const express = require('express')
const { protect } = require('../middleware/auth')
const { getNotifications, markAllRead } = require('../utils/notifications')
const { emitToUser } = require('../socket')

const router = express.Router()

// ─── GET /api/notifications ──────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await getNotifications(req.user._id)
    const unreadCount = notifications.filter((n) => !n.read).length
    res.json({ notifications, unreadCount })
  } catch (err) { next(err) }
})

// ─── PUT /api/notifications/read-all ─────────
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await markAllRead(req.user._id)
    try {
      emitToUser(req.user._id.toString(), 'unread_count', { count: 0 })
    } catch { /* no-op */ }
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
