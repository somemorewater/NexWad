const express = require('express')
const crypto = require('crypto')
const { nanoid } = require('nanoid')
const Pin = require('../models/Pin')
const PinCreditPurchase = require('../models/PinCreditPurchase')
const User = require('../models/User')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')
const { protect } = require('../middleware/auth')
const {
  PIN_PRICE_PER_DAY,
  canUserPin,
  getOwnedTargetOrThrow,
  markExpiredPins,
} = require('../utils/pins')
const logger = require('../utils/logger')

const router = express.Router()

async function attachTargetPreview(pins = []) {
  if (!pins.length) return pins

  const listingsIds = pins.filter((p) => p.targetType === 'listing').map((p) => p.targetId)
  const postIds = pins.filter((p) => p.targetType === 'post').map((p) => p.targetId)
  const lostFoundIds = pins.filter((p) => p.targetType === 'lostfound').map((p) => p.targetId)

  const [listings, posts, lostFoundItems] = await Promise.all([
    listingsIds.length ? Listing.find({ _id: { $in: listingsIds } }).select('title price images').lean() : [],
    postIds.length ? Post.find({ _id: { $in: postIds } }).select('content image').lean() : [],
    lostFoundIds.length ? LostFound.find({ _id: { $in: lostFoundIds } }).select('title type image').lean() : [],
  ])

  const listingMap = new Map(listings.map((item) => [String(item._id), item]))
  const postMap = new Map(posts.map((item) => [String(item._id), item]))
  const lostFoundMap = new Map(lostFoundItems.map((item) => [String(item._id), item]))

  return pins.map((pin) => {
    const key = String(pin.targetId)
    if (pin.targetType === 'listing') {
      const target = listingMap.get(key)
      return {
        ...pin,
        targetPreview: target ? { title: target.title, price: target.price, image: target.images?.[0] || null } : null,
      }
    }
    if (pin.targetType === 'post') {
      const target = postMap.get(key)
      return {
        ...pin,
        targetPreview: target ? { title: String(target.content || '').slice(0, 72) || 'Post', image: target.image || null } : null,
      }
    }
    const target = lostFoundMap.get(key)
    return {
      ...pin,
      targetPreview: target ? { title: target.title, type: target.type, image: target.image || null } : null,
    }
  })
}

function unitsToHours(units) {
  const parsed = Number.parseInt(units, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
    const err = new Error('Units must be between 1 and 30')
    err.status = 400
    throw err
  }
  return parsed * 24
}

async function verifyPaystackPayment(reference, expectedAmountNaira) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    logger.warn('PAYSTACK_SECRET_KEY not set. Skipping server-side payment verification for pin credits.')
    return { ok: true, skipped: true }
  }

  const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!resp.ok) return { ok: false, reason: 'Payment verification failed' }

  const payload = await resp.json()
  const tx = payload?.data
  if (!payload?.status || !tx) return { ok: false, reason: 'Invalid payment response' }
  if (tx.status !== 'success') return { ok: false, reason: 'Payment not successful' }

  const expectedKobo = Math.round(Number(expectedAmountNaira) * 100)
  if (Number(tx.amount) !== expectedKobo) return { ok: false, reason: 'Payment amount mismatch' }

  return { ok: true }
}

async function activateCreditPurchase(purchaseDoc) {
  if (!purchaseDoc || purchaseDoc.status !== 'pending') return purchaseDoc

  purchaseDoc.status = 'paid'
  purchaseDoc.paidAt = new Date()
  await purchaseDoc.save()

  await User.findByIdAndUpdate(purchaseDoc.user, {
    $inc: {
      pinCredits: purchaseDoc.units,
      pinCreditsPurchased: purchaseDoc.units,
    },
  })

  return purchaseDoc
}

async function consumePinCredits(userId, units) {
  const user = await User.findOneAndUpdate(
    { _id: userId, pinCredits: { $gte: units } },
    { $inc: { pinCredits: -units } },
    { new: true }
  )
  if (!user) {
    const err = new Error('Insufficient pin credits. Purchase credits first.')
    err.status = 402
    throw err
  }
  return user
}

async function upsertActivePin({ userId, targetType, targetId, durationHours }) {
  const now = new Date()
  const extensionMs = durationHours * 60 * 60 * 1000

  const existing = await Pin.findOne({
    user: userId,
    targetType,
    targetId,
    status: 'active',
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 })

  if (existing) {
    const startMs = Math.max(new Date(existing.expiresAt).getTime(), now.getTime())
    existing.expiresAt = new Date(startMs + extensionMs)
    existing.durationHours = Number(existing.durationHours || 0) + durationHours
    await existing.save()
    return existing
  }

  return Pin.create({
    user: userId,
    targetType,
    targetId,
    durationHours,
    amount: (durationHours / 24) * PIN_PRICE_PER_DAY,
    status: 'active',
    pinnedAt: now,
    activatedAt: now,
    expiresAt: new Date(now.getTime() + extensionMs),
    paymentReference: `CREDIT-${nanoid(12).toUpperCase()}`,
  })
}

router.get('/plans', (req, res) => {
  res.json({
    pinPricePer24Hours: PIN_PRICE_PER_DAY,
    bundles: [
      { units: 1, amount: 500 },
      { units: 5, amount: 2500 },
      { units: 10, amount: 5000 },
    ],
    maxUnitsPerPurchase: 200,
  })
})

router.get('/my', protect, async (req, res, next) => {
  try {
    await markExpiredPins()

    const [pins, freshUser] = await Promise.all([
      Pin.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(200),
      User.findById(req.user._id).select('pinCredits pinCreditsPurchased'),
    ])

    const activePins = pins.filter((p) => p.status === 'active' && p.expiresAt && p.expiresAt > new Date())
    const activePinsEnriched = await attachTargetPreview(activePins.map((pin) => pin.toObject()))

    const usage = {
      activeCount: activePins.length,
      activeDurationHours: activePins.reduce((acc, p) => acc + (p.durationHours || 0), 0),
      activeHoursRemaining: activePins.reduce((acc, p) => {
        const ms = new Date(p.expiresAt).getTime() - Date.now()
        return acc + Math.max(0, Math.ceil(ms / (60 * 60 * 1000)))
      }, 0),
      totalPinsEver: pins.length,
      credits: {
        balance: freshUser?.pinCredits || 0,
        purchased: freshUser?.pinCreditsPurchased || 0,
      },
    }

    res.json({ pins, activePins: activePinsEnriched, usage })
  } catch (err) { next(err) }
})

router.post('/credits/initialize', protect, async (req, res, next) => {
  try {
    if (!canUserPin(req.user)) {
      return res.status(403).json({ error: 'Only sellers or premium users can purchase pin credits' })
    }

    const units = Number.parseInt(req.body.units, 10)
    if (!Number.isInteger(units) || units < 1 || units > 200) {
      return res.status(400).json({ error: 'units must be between 1 and 200' })
    }

    const amount = units * PIN_PRICE_PER_DAY
    const paymentReference = `PCR-${nanoid(14).toUpperCase()}`

    const purchase = await PinCreditPurchase.create({
      user: req.user._id,
      units,
      amount,
      status: 'pending',
      paymentReference,
      paymentGateway: 'paystack',
    })

    res.status(201).json({
      purchase,
      payment: {
        reference: paymentReference,
        amount,
        amountKobo: Math.round(amount * 100),
        currency: 'NGN',
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      },
    })
  } catch (err) { next(err) }
})

router.post('/credits/verify', protect, async (req, res, next) => {
  try {
    const { purchaseId, reference } = req.body
    if (!purchaseId) return res.status(400).json({ error: 'purchaseId is required' })

    const purchase = await PinCreditPurchase.findOne({ _id: purchaseId, user: req.user._id })
    if (!purchase) return res.status(404).json({ error: 'Credit purchase not found' })
    if (purchase.status === 'paid') return res.json({ purchase, alreadyPaid: true })
    if (purchase.status !== 'pending') return res.status(400).json({ error: 'Credit purchase is not pending' })

    const ref = reference || purchase.paymentReference
    if (!ref || ref !== purchase.paymentReference) {
      return res.status(400).json({ error: 'Invalid payment reference' })
    }

    const paymentCheck = await verifyPaystackPayment(ref, purchase.amount)
    if (!paymentCheck.ok) {
      return res.status(400).json({ error: paymentCheck.reason || 'Payment verification failed' })
    }

    const activated = await activateCreditPurchase(purchase)
    const freshUser = await User.findById(req.user._id).select('pinCredits pinCreditsPurchased')

    res.json({
      purchase: activated,
      credits: {
        balance: freshUser?.pinCredits || 0,
        purchased: freshUser?.pinCreditsPurchased || 0,
      },
      source: 'manual_verify',
    })
  } catch (err) { next(err) }
})

router.post('/credits/paystack-webhook', async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}))

    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
      const signature = req.get('x-paystack-signature')
      if (!signature || signature !== hash) {
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
    }

    const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body
    if (event?.event !== 'charge.success') return res.sendStatus(200)

    const reference = event?.data?.reference
    const amountKobo = Number(event?.data?.amount || 0)
    if (!reference) return res.sendStatus(200)

    const purchase = await PinCreditPurchase.findOne({ paymentReference: reference, status: 'pending' })
    if (!purchase) return res.sendStatus(200)

    const expectedKobo = Math.round(Number(purchase.amount) * 100)
    if (amountKobo !== expectedKobo) {
      logger.warn('Pin credit webhook amount mismatch', { reference, expectedKobo, amountKobo })
      return res.sendStatus(200)
    }

    await activateCreditPurchase(purchase)
    return res.sendStatus(200)
  } catch (err) {
    return next(err)
  }
})

router.post('/initialize', protect, async (req, res, next) => {
  try {
    if (!canUserPin(req.user)) {
      return res.status(403).json({ error: 'Only sellers or premium users can pin content' })
    }

    let { targetType, targetId, units = 1 } = req.body
    const durationHours = unitsToHours(units)

    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'targetType and targetId are required' })
    }

    targetType = String(targetType).toLowerCase()
    await getOwnedTargetOrThrow(req.user, targetType, targetId)

    await consumePinCredits(req.user._id, Number(units))

    const pin = await upsertActivePin({
      userId: req.user._id,
      targetType,
      targetId,
      durationHours,
    })

    const freshUser = await User.findById(req.user._id).select('pinCredits')
    res.status(201).json({ pin, credits: { balance: freshUser?.pinCredits || 0 } })
  } catch (err) { next(err) }
})

router.post('/:id/extend', protect, async (req, res, next) => {
  try {
    if (!canUserPin(req.user)) {
      return res.status(403).json({ error: 'Only sellers or premium users can pin content' })
    }

    await markExpiredPins()

    const basePin = await Pin.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    })
    if (!basePin) return res.status(404).json({ error: 'Active pin not found' })

    const units = Number.parseInt(req.body.units, 10) || 1
    const durationHours = unitsToHours(units)

    await consumePinCredits(req.user._id, units)

    const startMs = Math.max(new Date(basePin.expiresAt).getTime(), Date.now())
    basePin.expiresAt = new Date(startMs + durationHours * 60 * 60 * 1000)
    basePin.durationHours = Number(basePin.durationHours || 0) + durationHours
    await basePin.save()

    const freshUser = await User.findById(req.user._id).select('pinCredits')
    res.json({ pin: basePin, credits: { balance: freshUser?.pinCredits || 0 } })
  } catch (err) { next(err) }
})

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const pin = await Pin.findOne({ _id: req.params.id, user: req.user._id })
    if (!pin) return res.status(404).json({ error: 'Pin not found' })

    if (!['active', 'pending'].includes(pin.status)) {
      return res.status(400).json({ error: 'Pin is already inactive' })
    }

    pin.status = 'cancelled'
    pin.cancelledAt = new Date()
    pin.cancelReason = 'user_unpinned'
    await pin.save()

    res.json({ message: 'Unpinned successfully' })
  } catch (err) { next(err) }
})

module.exports = router
