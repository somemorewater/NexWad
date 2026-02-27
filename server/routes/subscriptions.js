const express = require('express')
const router = express.Router()
const Subscription = require('../models/Subscription')
const SellerApplication = require('../models/SellerApplication')
const User = require('../models/User')
const { handleUpload, uploadSellerId } = require('../utils/cloudinary')
const { protect } = require('../middleware/auth')
const { body, validate } = require('../middleware/validate')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const { sendEmail } = require('../config/email')
const { notifySubscriptionExpiring } = require('../utils/notifications')
const logger = require('../utils/logger')
const { nanoid } = require('nanoid')

async function verifyPaystackPayment(reference, expectedAmountNaira) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    logger.warn('PAYSTACK_SECRET_KEY not set. Skipping server-side payment verification.')
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
  if (Number(tx.amount) !== expectedKobo) {
    return { ok: false, reason: 'Payment amount mismatch' }
  }

  return { ok: true, gateway: tx.gateway_response || 'success' }
}

// ─── Subscription plans ───────────────────────
const PLANS = [
  {
    _id: 'basic',
    name: 'Regular Buyer',
    price: 0,
    currency: 'NGN',
    durationDays: 30,
    type: 'buyer',
    requiresApproval: false,
    features: ['Browse marketplace', 'Post on social feed', 'Lost & Found', 'Basic chat'],
    featured: false,
  },
  {
    _id: 'premium_buyer',
    name: 'Premium Buyer',
    price: 800,
    currency: 'NGN',
    durationDays: 30,
    type: 'buyer',
    requiresApproval: false,
    features: [
      'Premium badge',
      'Higher feed visibility boost',
      'Early access to featured listings',
      'Priority chat placement',
      'Advanced buyer analytics',
      'Exclusive promotions',
    ],
    featured: true,
  },
  {
    _id: 'seller_basic',
    name: 'Basic Seller',
    price: 2000,
    currency: 'NGN',
    durationDays: 30,
    type: 'seller',
    requiresApproval: true,
    features: [
      'Up to 10 active listings',
      'Standard marketplace visibility',
      'Basic seller dashboard analytics',
      'Customer reviews enabled',
      'Requires admin approval',
    ],
    featured: false,
  },
  {
    _id: 'seller_pro',
    name: 'Pro Seller',
    price: 3000,
    currency: 'NGN',
    durationDays: 30,
    type: 'seller',
    requiresApproval: true,
    features: [
      'Up to 30 active listings',
      'Pin up to 2 listings',
      'Increased feed visibility boost',
      'Advanced analytics',
      'Seller badge',
      'Requires admin approval',
    ],
    featured: false,
  },
  {
    _id: 'seller_elite',
    name: 'Elite Seller',
    price: 6000,
    currency: 'NGN',
    durationDays: 30,
    type: 'seller',
    requiresApproval: true,
    features: [
      'Unlimited active listings',
      'Pin up to 5 listings',
      'Highest feed priority',
      'Full analytics dashboard',
      'Premium seller badge',
      'Featured placement opportunities',
      'Requires admin approval',
    ],
    featured: false,
  },
]

const PLAN_ACCESS = {
  basic: { role: 'buyer', buyerType: 'regular', sellerTier: 'basic' },
  premium_buyer: { role: 'buyer', buyerType: 'premium', sellerTier: 'basic' },
  seller_basic: { role: 'seller', buyerType: 'regular', sellerTier: 'basic' },
  seller_pro: { role: 'seller', buyerType: 'regular', sellerTier: 'pro' },
  seller_elite: { role: 'seller', buyerType: 'regular', sellerTier: 'elite' },
  silver: { role: 'buyer', buyerType: 'premium', sellerTier: 'basic' },
  gold: { role: 'seller', buyerType: 'regular', sellerTier: 'pro' },
  premium: { role: 'seller', buyerType: 'regular', sellerTier: 'elite' },
}

// ─── GET /api/subscriptions/plans ─────────────
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS })
})

// ─── GET /api/subscriptions/current ──────────
router.get('/current', protect, async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id, status: 'active' })
      .sort({ createdAt: -1 })
    const application = await SellerApplication.findOne({ user: req.user._id, status: 'pending' })
      .sort({ createdAt: -1 })
    res.json({ subscription: sub, application })
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
      if (!plan) return res.status(404).json({ error: 'Plan not found' })

      if (plan._id === 'basic') {
        return res.status(400).json({ error: 'Basic plan is always free' })
      }

      if (plan.requiresApproval || plan.type === 'seller') {
        return res.status(400).json({ error: 'Seller tiers require application. Use /api/subscriptions/apply-seller.' })
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
      const access = PLAN_ACCESS[planId] || PLAN_ACCESS.basic
      const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)
      await User.findByIdAndUpdate(req.user._id, {
        role: isAdminRole ? req.user.role : access.role,
        buyerType: access.buyerType,
        sellerTier: access.sellerTier,
        subscriptionStatus: 'active',
        subscriptionExpiry: expiresAt,
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

// ─── POST /api/subscriptions/apply-seller ─────
router.post('/apply-seller',
  protect,
  handleUpload(uploadSellerId),
  [
    body('planId').isIn(['seller_basic', 'seller_pro', 'seller_elite']),
    body('paymentReference').trim().notEmpty(),
    body('fullName').trim().notEmpty().isLength({ max: 120 }),
    body('storeName').trim().notEmpty().isLength({ max: 120 }),
    body('nin').trim().notEmpty().isLength({ max: 20 }),
    body('productDetails').trim().notEmpty().isLength({ max: 2000 }),
    body('phone').trim().notEmpty().isLength({ max: 30 }),
    body('experience').optional().trim().isLength({ max: 80 }),
    body('reason').optional().trim().isLength({ max: 1200 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        planId,
        paymentReference,
        paymentMethod = 'card',
        fullName,
        storeName,
        nin,
        productDetails,
        phone,
        experience,
        reason,
      } = req.body
      if (!req.file) return res.status(400).json({ error: 'School ID image is required' })

      const plan = PLANS.find(p => p._id === planId)
      if (!plan) return res.status(404).json({ error: 'Plan not found' })

      const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)
      if (isAdminRole) return res.status(403).json({ error: 'Admin roles cannot apply for seller plans' })

      const existingPending = await SellerApplication.findOne({ user: req.user._id, status: 'pending' })
      if (existingPending) {
        return res.status(409).json({ error: 'You already have a pending seller application' })
      }

      const paymentCheck = await verifyPaystackPayment(paymentReference, plan.price)
      if (!paymentCheck.ok) {
        return res.status(400).json({ error: paymentCheck.reason || 'Unable to verify payment' })
      }

      const app = await SellerApplication.create({
        user: req.user._id,
        plan: planId,
        amount: plan.price,
        currency: plan.currency,
        paymentReference,
        paymentMethod,
        application: {
          fullName,
          storeName,
          nin,
          productDetails,
          phone,
          experience,
          reason,
          schoolIdImage: req.file.path,
          schoolIdImagePublicId: req.file.filename,
        },
        status: 'pending',
      })

      await User.findByIdAndUpdate(req.user._id, {
        role: 'buyer',
        buyerType: req.user.buyerType || 'regular',
        sellerTier: 'basic',
        subscriptionStatus: 'pending',
        'subscription.active': false,
      })

      logger.info(`Seller application submitted: ${req.user.email} → ${planId}`)
      res.status(201).json({ application: app, message: 'Application submitted. Awaiting admin approval.' })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/subscriptions/my-application ────
router.get('/my-application', protect, async (req, res, next) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
    res.json({ application })
  } catch (err) { next(err) }
})

// ─── DELETE /api/subscriptions/current ────────
router.delete('/current', protect, async (req, res, next) => {
  try {
    await Subscription.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'User requested cancellation', autoRenew: false }
    )
    const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)
    await User.findByIdAndUpdate(req.user._id, {
      role: isAdminRole ? req.user.role : 'buyer',
      buyerType: isAdminRole ? req.user.buyerType : 'regular',
      sellerTier: isAdminRole ? req.user.sellerTier : 'basic',
      subscriptionStatus: 'cancelled',
      subscriptionExpiry: new Date(),
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
