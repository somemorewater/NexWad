const express = require('express')
const router = express.Router()
const Subscription = require('../models/Subscription')
const SellerApplication = require('../models/SellerApplication')
const User = require('../models/User')
const Listing = require('../models/Listing')
const Pin = require('../models/Pin')
const { handleUpload, uploadSellerId } = require('../utils/cloudinary')
const { protect } = require('../middleware/auth')
const { body, validate } = require('../middleware/validate')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const { sendEmail } = require('../config/email')
const { notifySubscriptionExpiring } = require('../utils/notifications')
const logger = require('../utils/logger')
const { nanoid } = require('nanoid')
const DAY_MS = 24 * 60 * 60 * 1000

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
  basic: { role: 'buyer', buyerType: 'regular', sellerTier: undefined },
  premium_buyer: { role: 'buyer', buyerType: 'premium', sellerTier: undefined },
  seller_basic: { role: 'seller', buyerType: 'regular', sellerTier: 'basic' },
  seller_pro: { role: 'seller', buyerType: 'regular', sellerTier: 'pro' },
  seller_elite: { role: 'seller', buyerType: 'regular', sellerTier: 'elite' },
  silver: { role: 'buyer', buyerType: 'premium', sellerTier: undefined },
  gold: { role: 'seller', buyerType: 'regular', sellerTier: 'pro' },
  premium: { role: 'seller', buyerType: 'regular', sellerTier: 'elite' },
}

function getPlanById(planId) {
  return PLANS.find(p => p._id === planId)
}

function computeSellerUpgradeQuote(targetPlan, currentSub) {
  const now = Date.now()
  const targetPrice = Number(targetPlan?.price || 0)
  const targetDurationDays = Number(targetPlan?.durationDays || 30)
  const fullChargeExpiry = new Date(now + targetDurationDays * DAY_MS)
  const fullCharge = {
    amountDue: targetPrice,
    expiresAt: fullChargeExpiry,
    billingMode: 'full',
  }

  if (!currentSub || currentSub.status !== 'active') return fullCharge

  const currentPlan = getPlanById(currentSub.plan)
  if (!currentPlan || currentPlan.type !== 'seller') return fullCharge

  const currentExpiryMs = new Date(currentSub.expiresAt).getTime()
  if (!Number.isFinite(currentExpiryMs)) return fullCharge
  const remainingMs = currentExpiryMs - now
  if (remainingMs <= 0) return fullCharge

  const currentPrice = Number(currentPlan?.price || 0)
  if (targetPrice <= currentPrice) {
    return {
      amountDue: 0,
      expiresAt: new Date(currentExpiryMs),
      billingMode: 'switch_no_charge',
    }
  }

  const currentDurationMs = Math.max(1, Number(currentPlan.durationDays || 30)) * DAY_MS
  const remainingRatio = Math.max(0, Math.min(1, remainingMs / currentDurationMs))
  const delta = targetPrice - currentPrice
  const amountDue = Math.max(0, Math.round(delta * remainingRatio))

  return {
    amountDue,
    expiresAt: new Date(currentExpiryMs),
    billingMode: 'upgrade_prorated',
  }
}

// ─── GET /api/subscriptions/plans ─────────────
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS })
})

// ─── GET /api/subscriptions/current ──────────
router.get('/current', protect, async (req, res, next) => {
  try {
    const now = new Date()
    await Subscription.updateMany(
      { user: req.user._id, status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'expired', cancelledAt: now, cancelReason: 'Subscription expired' } }
    )

    const sub = await Subscription.findOne({ user: req.user._id, status: 'active', expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
    const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)
    if (!sub && !isAdminRole) {
      await Promise.all([
        Listing.updateMany(
          { seller: req.user._id, status: 'active' },
          { $set: { status: 'paused' } }
        ),
        Pin.updateMany(
          { user: req.user._id, targetType: 'listing', status: 'active' },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              cancelReason: 'subscription_inactive',
            },
          }
        ),
      ])
    }
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
      const currentActiveSub = await Subscription.findOne({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 })

      if (plan._id === 'basic') {
        return res.status(400).json({ error: 'Basic plan is always free' })
      }

      if (plan.type === 'seller') {
        const hasApprovedSellerApplication = await SellerApplication.exists({
          user: req.user._id,
          status: 'approved',
        })
        if (!hasApprovedSellerApplication) {
          return res.status(400).json({ error: 'Seller tiers require first-time approval. Use /api/subscriptions/apply-seller.' })
        }
      }

      let chargeAmount = plan.price
      let expiresAt = new Date(Date.now() + plan.durationDays * DAY_MS)
      let billingMode = 'full'
      if (plan.type === 'seller') {
        const quote = computeSellerUpgradeQuote(plan, currentActiveSub)
        chargeAmount = quote.amountDue
        expiresAt = quote.expiresAt
        billingMode = quote.billingMode
      }

      if (chargeAmount > 0) {
        if (!paymentReference) {
          return res.status(400).json({ error: 'Payment reference required' })
        }
        const paymentCheck = await verifyPaystackPayment(paymentReference, chargeAmount)
        if (!paymentCheck.ok) {
          return res.status(400).json({ error: paymentCheck.reason || 'Unable to verify payment' })
        }
      }

      // Cancel existing active subscription
      await Subscription.updateMany(
        { user: req.user._id, status: 'active' },
        { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Plan upgrade' }
      )

      const receiptId = `NW-${nanoid(10).toUpperCase()}`

      const sub = await Subscription.create({
        user: req.user._id,
        plan: planId,
        price: chargeAmount,
        currency: plan.currency,
        expiresAt,
        status: 'active',
        paymentReference: chargeAmount > 0 ? (paymentReference || receiptId) : `NO-CHARGE-${receiptId}`,
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
          { label: 'Billing Mode', value: billingMode },
          { label: 'Payment Method', value: paymentMethod },
          { label: 'Payment Reference', value: chargeAmount > 0 ? (paymentReference || receiptId) : 'No charge (prorated/switch)' },
        ],
        total: chargeAmount,
        currency: plan.currency,
      }).then(async ({ url, publicId }) => {
        await Subscription.findByIdAndUpdate(sub._id, { receiptUrl: url, receiptPublicId: publicId })
        await sendEmail(req.user.email, 'subscriptionConfirmation', {
          name: req.user.name,
          plan: plan.name,
          price: chargeAmount,
          expiresAt,
          receiptId,
        })
      }).catch(err => logger.error('Receipt generation failed:', err))

      logger.info(`Subscription created: ${req.user.email} → ${planId}`)
      res.status(201).json({ subscription: sub, receiptId, billingMode, chargedAmount: chargeAmount, fullPlanPrice: plan.price })
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
      const existingApplication = await SellerApplication.findOne({ user: req.user._id })
      if (existingApplication?.status === 'approved') {
        return res.status(409).json({ error: 'You are already approved as a seller. Renew or upgrade from subscription without re-approval.' })
      }
      if (existingApplication?.status === 'pending') {
        return res.status(409).json({ error: 'You already have a pending seller application' })
      }

      const paymentCheck = await verifyPaystackPayment(paymentReference, plan.price)
      if (!paymentCheck.ok) {
        return res.status(400).json({ error: paymentCheck.reason || 'Unable to verify payment' })
      }

      let app
      if (existingApplication) {
        existingApplication.plan = planId
        existingApplication.amount = plan.price
        existingApplication.currency = plan.currency
        existingApplication.paymentReference = paymentReference
        existingApplication.paymentMethod = paymentMethod
        existingApplication.application = {
          fullName,
          storeName,
          nin,
          productDetails,
          phone,
          experience,
          reason,
          schoolIdImage: req.file.path,
          schoolIdImagePublicId: req.file.filename,
        }
        existingApplication.status = 'pending'
        existingApplication.rejectionReason = undefined
        existingApplication.approvedAt = undefined
        existingApplication.expiresAt = undefined
        existingApplication.approvedBy = undefined
        existingApplication.submittedAt = new Date()
        app = await existingApplication.save()
      } else {
        app = await SellerApplication.create({
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
      }

      await User.findByIdAndUpdate(req.user._id, {
        role: 'buyer',
        buyerType: req.user.buyerType || 'regular',
        sellerTier: undefined,
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
    const now = new Date()
    await Subscription.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled', cancelledAt: now, cancelReason: 'User requested cancellation', autoRenew: false }
    )
    const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)
    const updates = [
      User.findByIdAndUpdate(req.user._id, {
        role: isAdminRole ? req.user.role : 'buyer',
        buyerType: isAdminRole ? req.user.buyerType : 'regular',
        sellerTier: isAdminRole ? req.user.sellerTier : undefined,
        subscriptionStatus: 'cancelled',
        subscriptionExpiry: now,
        'subscription.active': false,
        'subscription.plan': 'basic',
        'subscription.expiresAt': now,
      }),
    ]

    if (!isAdminRole) {
      updates.push(
        Listing.updateMany(
          { seller: req.user._id, status: 'active' },
          { $set: { status: 'paused' } }
        )
      )
      updates.push(
        Pin.updateMany(
          { user: req.user._id, targetType: 'listing', status: 'active' },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              cancelReason: 'subscription_cancelled',
            },
          }
        )
      )
    }

    await Promise.all(updates)
    res.json({ message: 'Subscription cancelled. Seller listings were paused and listing pins were removed.' })
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
