const { emitToUser } = require('../socket')
const { cacheGet, cacheSet } = require('./redis')
const logger = require('./logger')
const { enqueueBackgroundJob } = require('./jobQueue')

/**
 * Send a real-time notification to a user via Socket.io
 * and persist it to the notification store (Redis for now).
 */
async function notify(userId, { type, title, body, link, data }) {
  const notification = {
    _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,   // 'message' | 'like' | 'sale' | 'system' | 'lostfound'
    title,
    body,
    link,
    data,
    createdAt: new Date().toISOString(),
    read: false,
  }

  enqueueBackgroundJob('notification-delivery', async () => {
    // Emit real-time
    try {
      emitToUser(userId.toString(), 'notification', notification)
    } catch { /* socket may not be initialised yet */ }

    // Persist to Redis list (last 50 per user)
    try {
      const key = `notifs:${userId}`
      const existing = await cacheGet(key) || []
      const updated = [notification, ...existing].slice(0, 50)
      await cacheSet(key, updated, 7 * 24 * 3600) // 7 days TTL
    } catch (err) {
      logger.error('notify persist error:', err)
    }
  }, { retries: 2 })

  return notification
}

async function getNotifications(userId) {
  return (await cacheGet(`notifs:${userId}`)) || []
}

async function markAllRead(userId) {
  const key = `notifs:${userId}`
  const existing = await cacheGet(key) || []
  const updated = existing.map(n => ({ ...n, read: true }))
  await cacheSet(key, updated, 7 * 24 * 3600)
}

// ─── Domain-specific helpers ──────────────────

function notifyNewMessage(recipientId, senderName, chatId) {
  return notify(recipientId, {
    type: 'message',
    title: `New message from ${senderName}`,
    body: 'Tap to view and reply',
    link: `/chat/${chatId}`,
  })
}

function notifyLike(recipientId, likerName, postId) {
  return notify(recipientId, {
    type: 'like',
    title: `${likerName} liked your post`,
    body: 'See what they thought',
    link: `/social?post=${postId}`,
  })
}

function notifyNewFollower(recipientId, followerName, followerId) {
  return notify(recipientId, {
    type: 'system',
    title: `${followerName} started following you`,
    link: `/profile/${followerId}`,
  })
}

function notifyListingInterest(sellerId, buyerName, listingId, chatId) {
  return notify(sellerId, {
    type: 'sale',
    title: `${buyerName} is interested in your listing`,
    body: 'Reply to their message',
    link: `/chat/${chatId}`,
    data: { listingId },
  })
}

function notifyLostFoundClaim(reporterId, claimerName, itemId) {
  return notify(reporterId, {
    type: 'lostfound',
    title: `Someone claims to have found your item`,
    body: `${claimerName} has responded to your lost item report`,
    link: `/lost-found/${itemId}`,
  })
}

function notifySubscriptionExpiring(userId, daysLeft) {
  return notify(userId, {
    type: 'system',
    title: `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    body: 'Renew now to keep your premium benefits',
    link: '/profile/subscription',
  })
}

module.exports = {
  notify,
  getNotifications,
  markAllRead,
  notifyNewMessage,
  notifyLike,
  notifyNewFollower,
  notifyListingInterest,
  notifyLostFoundClaim,
  notifySubscriptionExpiring,
}
