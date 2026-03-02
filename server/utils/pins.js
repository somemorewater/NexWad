const Pin = require('../models/Pin')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')

const DAY_MS = 24 * 60 * 60 * 1000
const PIN_PRICE_PER_DAY = 500

function canUserPin(user) {
  if (!user) return false
  const role = String(user.role || '').toLowerCase()
  const plan = String(user.subscription?.plan || '').toLowerCase()
  const buyerType = String(user.buyerType || '').toLowerCase()
  return role === 'seller' || buyerType === 'premium' || plan === 'premium_buyer' || plan === 'silver'
}

function getTargetConfig(targetType) {
  if (targetType === 'listing') return { Model: Listing, ownerField: 'seller' }
  if (targetType === 'post') return { Model: Post, ownerField: 'author' }
  if (targetType === 'lostfound') return { Model: LostFound, ownerField: 'reporter' }
  return null
}

async function getOwnedTargetOrThrow(user, targetType, targetId) {
  const config = getTargetConfig(targetType)
  if (!config) {
    const err = new Error('Unsupported target type')
    err.status = 400
    throw err
  }

  const target = await config.Model.findById(targetId).select(`${config.ownerField} status removed expiresAt`).lean()
  if (!target || target.removed) {
    const err = new Error('Target item not found')
    err.status = 404
    throw err
  }

  const ownerId = target[config.ownerField]?.toString?.()
  if (!ownerId || ownerId !== user._id.toString()) {
    const err = new Error('You can only pin your own content')
    err.status = 403
    throw err
  }

  if (targetType === 'listing' && target.status !== 'active') {
    const err = new Error('Only active listings can be pinned')
    err.status = 400
    throw err
  }

  if (targetType === 'lostfound' && target.status !== 'active') {
    const err = new Error('Only active lost & found reports can be pinned')
    err.status = 400
    throw err
  }

  return target
}

async function markExpiredPins(now = new Date()) {
  await Pin.updateMany(
    { status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  )
}

async function getActivePinsByTargets(targetType, targetIds = []) {
  if (!Array.isArray(targetIds) || targetIds.length === 0) return []

  await markExpiredPins()

  return Pin.find({
    targetType,
    targetId: { $in: targetIds },
    status: 'active',
    expiresAt: { $gt: new Date() },
  })
    .sort({ pinnedAt: -1, createdAt: -1 })
    .lean()
}

async function attachPinsAndSort(items, targetType) {
  if (!Array.isArray(items) || items.length === 0) return { items: [], pinnedItems: [] }

  const ids = items.map((item) => item?._id).filter(Boolean)
  const pins = await getActivePinsByTargets(targetType, ids)

  const pinMap = new Map()
  for (const pin of pins) {
    const key = String(pin.targetId)
    if (!pinMap.has(key)) pinMap.set(key, pin)
  }

  const enriched = items.map((item) => {
    const pin = pinMap.get(String(item._id))
    return {
      ...item,
      isPinned: Boolean(pin),
      pin: pin ? {
        _id: pin._id,
        pinnedAt: pin.pinnedAt,
        expiresAt: pin.expiresAt,
        user: pin.user,
      } : null,
    }
  })

  enriched.sort((a, b) => {
    if (a.isPinned && b.isPinned) {
      return new Date(b.pin?.pinnedAt || 0).getTime() - new Date(a.pin?.pinnedAt || 0).getTime()
    }
    if (a.isPinned) return -1
    if (b.isPinned) return 1
    return 0
  })

  return {
    items: enriched,
    pinnedItems: enriched.filter((item) => item.isPinned),
  }
}

module.exports = {
  DAY_MS,
  PIN_PRICE_PER_DAY,
  canUserPin,
  getOwnedTargetOrThrow,
  markExpiredPins,
  getActivePinsByTargets,
  attachPinsAndSort,
}
