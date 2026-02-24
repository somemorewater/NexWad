const express = require('express')
const router = express.Router()
const Subscription = require('../models/Subscription')
const User = require('../models/User')
const { protect } = require('../middleware/auth')
const { body, validate } = require('../middleware/validate')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const { sendEmail } = require('../config/email')
const { notifySubscriptionExpiring } = require('../utils/notifications')
const logger = require('../utils/logger')
const { nanoid } = require('nanoid')

// ─── Subscription plans ───────────────────────
const PLANS = [
  {
    _id: 'basic',
    name: 'Basic',
    price: 0,
    currency: 'NGN',
    durationDays: 30,
    features: ['Browse marketplace', 'Post on social feed', 'Lost & Found', 'Basic chat'],
    featured: false,
  },
  {
    _id: 'silver',
    name: 'Silver',
    price: 1500,
    currency: 'NGN',
    durationDays: 30,
    features: ['5 listing boosts/month', 'Verified seller badge', 'Priority support', 'All Basic features'],
    featured: false,
  },
  {
    _id: 'gold',
    name: 'Gold',
    price: 3500,
    currency: 'NGN',
    durationDays: 30,
    features: ['Unlimited listing boosts', 'Top placement in search', 'Seller analytics', 'All Silver features'],
    featured: true,
  },
  {
    _id: 'premium',
    name: 'Premium',
    price: 7000,
    currency: 'NGN',
    durationDays: 30,
    features: ['Homepage featured listings', 'Dedicated support', 'Custom seller page', 'All Gold features'],
    featured: false,
  },
]

// ─── GET /api/subscriptions/plans ─────────────
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS })
})

// ─── GET /api/subscriptions/current ──────────
router.get('/current', protect, async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id, status: 'active' })
      .sort({ createdAt: -1 })
    res.json({ subscription: sub })
  } catch (err) { next(err) }
})

// ─── POST /api/subscriptions ──────────────────
router.post('/',
  protect,
  [body('planId').notEmpty().isIn(PLANS.map(p => p._id))],
  validate,
  async (req, res, next) => {
    try {
      const { planId, paymentReference, paymentMethod = 'card' } = req.body
      const plan = PLANS.find(p => p._id === planId)

      if (plan._id === 'basic') {
        return res.status(400).json({ error: 'Basic plan is always free' })
      }

      // TODO: In production, verify paymentReference with your payment gateway
      // (e.g. Paystack: verify transaction before creating subscription)

      // Cancel existing active subscription
      await Subscription.updateMany(
        { user: req.user._id, status: 'active' },
        { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Plan upgrade' }
      )

      const receiptId = `NW-${nanoid(10).toUpperCase()}`
      const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000)

      const sub = await Subscription.create({
        user: req.user._id,
        plan: planId,
        price: plan.price,
        currency: plan.currency,
        expiresAt,
        status: 'active',
        paymentReference: paymentReference || receiptId,
        paymentMethod,
        paymentGateway: 'paystack',
      })

      // Update user subscription snapshot
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.plan': planId,
        'subscription.expiresAt': expiresAt,
        'subscription.active': true,
      })

      // Generate PDF receipt (non-blocking)
      generateReceiptPDF({
        receiptId,
        type: 'subscription',
        recipientName: req.user.name,
        recipientEmail: req.user.email,
        items: [
          { label: 'Plan', value: plan.name },
          { label: 'Duration', value: `${plan.durationDays} days` },
          { label: 'Payment Method', value: paymentMethod },
          { label: 'Payment Reference', value: paymentReference || receiptId },
        ],
        total: plan.price,
        currency: plan.currency,
      }).then(async ({ url, publicId }) => {
        await Subscription.findByIdAndUpdate(sub._id, { receiptUrl: url, receiptPublicId: publicId })
        await sendEmail(req.user.email, 'subscriptionConfirmation', {
          name: req.user.name,
          plan: plan.name,
          price: plan.price,
          expiresAt,
          receiptId,
        })
      }).catch(err => logger.error('Receipt generation failed:', err))

      logger.info(`Subscription created: ${req.user.email} → ${planId}`)
      res.status(201).json({ subscription: sub, receiptId })
    } catch (err) { next(err) }
  }
)

// ─── DELETE /api/subscriptions/current ────────
router.delete('/current', protect, async (req, res, next) => {
  try {
    await Subscription.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'User requested cancellation', autoRenew: false }
    )
    await User.findByIdAndUpdate(req.user._id, {
      'subscription.active': false,
      'subscription.plan': 'basic',
    })
    res.json({ message: 'Subscription cancelled. Your benefits remain until the end of the billing period.' })
  } catch (err) { next(err) }
})

// ─── GET /api/subscriptions/:id/receipt ───────
router.get('/:id/receipt', protect, async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id })
    if (!sub) return res.status(404).json({ error: 'Subscription not found' })
    if (!sub.receiptUrl) return res.status(404).json({ error: 'Receipt not yet generated' })

    // Redirect to Cloudinary PDF URL
    res.redirect(sub.receiptUrl)
  } catch (err) { next(err) }
})

module.exports = router
