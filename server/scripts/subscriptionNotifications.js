/* eslint-disable no-console */
const path = require('path')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const Subscription = require('../models/Subscription')
const User = require('../models/User')
const { notifySubscriptionExpiring, notifySubscriptionExpired } = require('../utils/notifications')
const { sendEmail } = require('../config/email')
const logger = require('../utils/logger')

const DAYS_BEFORE_EXPIRY = 10

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function notifyExpiring(now) {
  const targetDate = new Date(now)
  targetDate.setDate(targetDate.getDate() + DAYS_BEFORE_EXPIRY)
  const windowStart = startOfDay(targetDate)
  const windowEnd = endOfDay(targetDate)

  const expiringSubs = await Subscription.find({
    status: 'active',
    expiresAt: { $gte: windowStart, $lte: windowEnd },
    $or: [
      { expiringNoticeSentAt: { $exists: false } },
      { expiringNoticeSentAt: null },
    ],
  }).lean()

  if (!expiringSubs.length) return 0

  let notified = 0
  for (const sub of expiringSubs) {
    const user = await User.findById(sub.user).select('name email role').lean()
    if (!user) continue

    await notifySubscriptionExpiring(user._id, DAYS_BEFORE_EXPIRY)
    if (user.email) {
      await sendEmail(user.email, 'subscriptionExpiring', {
        name: user.name || 'there',
        plan: sub.plan,
        expiresAt: sub.expiresAt,
        daysLeft: DAYS_BEFORE_EXPIRY,
      })
    }

    await Subscription.updateOne(
      { _id: sub._id },
      { $set: { expiringNoticeSentAt: now } }
    )
    notified += 1
  }

  return notified
}

async function notifyExpired(now) {
  const expiredSubs = await Subscription.find({
    status: { $in: ['active', 'expired'] },
    expiresAt: { $lte: now },
    $or: [
      { expiredNoticeSentAt: { $exists: false } },
      { expiredNoticeSentAt: null },
    ],
  }).lean()

  if (!expiredSubs.length) return 0

  let notified = 0
  for (const sub of expiredSubs) {
    const user = await User.findById(sub.user)
    if (!user) continue

    if (sub.status === 'active') {
      await Subscription.updateOne(
        { _id: sub._id },
        {
          $set: {
            status: 'expired',
            cancelledAt: now,
            cancelReason: 'Subscription expired',
          },
        }
      )
    }

    try {
      await user.checkSubscription()
    } catch (err) {
      logger.warn('Failed to sync user subscription', { userId: user._id, error: err?.message || String(err) })
    }

    await notifySubscriptionExpired(user._id)
    if (user.email) {
      await sendEmail(user.email, 'subscriptionExpired', {
        name: user.name || 'there',
        plan: sub.plan,
        expiresAt: sub.expiresAt,
      })
    }

    await Subscription.updateOne(
      { _id: sub._id },
      { $set: { expiredNoticeSentAt: now } }
    )
    notified += 1
  }

  return notified
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  await connectDB()

  const now = new Date()
  const [expiringCount, expiredCount] = await Promise.all([
    notifyExpiring(now),
    notifyExpired(now),
  ])

  console.log(`Subscription notifications sent. Expiring: ${expiringCount}, Expired: ${expiredCount}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Subscription notification cron failed:', err)
  mongoose.disconnect()
})
