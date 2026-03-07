const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { LISTING_CATEGORIES } = require('../constants/categories')

const ADMIN_ROLES = new Set(['admin', 'superadmin', 'super_admin', 'moderator', 'cs'])

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-z0-9._]+$/, 'Username can only contain letters, numbers, dots, and underscores'],
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  matricNumber: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
  department: { type: String, trim: true },
  level: { type: String, enum: ['100', '200', '300', '400', '500'] },
  sellerCategories: [{
    type: String,
    trim: true,
    enum: LISTING_CATEGORIES,
  }],
  phone: { type: String, trim: true },
  website: { type: String, trim: true, maxlength: 300 },
  avatar: { type: String },
  avatarPublicId: { type: String },
  bio: { type: String, maxlength: 500 },
  posterImageUrl: { type: String },
  posterPublicId: { type: String },
  posterSignature: { type: String },
  posterTemplateStyle: { type: String, enum: ['basic', 'pro', 'elite'] },
  posterLastGeneratedAt: { type: Date },
  featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'superadmin', 'super_admin', 'moderator', 'cs', 'user'],
    default: 'buyer',
  },
  buyerType: {
    type: String,
    enum: ['regular', 'premium'],
    default: 'regular',
  },
  sellerTier: {
    type: String,
    enum: ['basic', 'pro', 'elite'],
    default: undefined,
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'pending', 'active', 'expired', 'cancelled'],
    default: 'none',
  },
  subscriptionExpiry: { type: Date },

  verified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  banReason: { type: String },
  warningsCount: { type: Number, default: 0, min: 0 },
  warnings: [{
    reason: { type: String, trim: true, maxlength: 500 },
    warnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  reportCount: { type: Number, default: 0, min: 0 },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],

  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },

  // Subscription embedded summary (authoritative record is in Subscription collection)
  subscription: {
    plan: { type: String, enum: ['basic', 'premium_buyer', 'seller_basic', 'seller_pro', 'seller_elite', 'silver', 'gold', 'premium'], default: 'basic' },
    expiresAt: { type: Date },
    active: { type: Boolean, default: false },
  },

  // Social
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Stats
  savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  totalSales: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  pinCredits: { type: Number, default: 0, min: 0 },
  pinCreditsPurchased: { type: Number, default: 0, min: 0 },

  // Auth
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastPasswordChange: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Virtuals
userSchema.virtual('followerCount').get(function () {
  return this.followers?.length || 0
})
userSchema.virtual('followingCount').get(function () {
  return this.following?.length || 0
})
userSchema.virtual('sellerTierLegacy').get(function () {
  if (this.role !== 'seller') return undefined
  if (this.sellerTier) return this.sellerTier
  const plan = this.subscription?.plan
  if (plan === 'premium') return 'elite'
  if (plan === 'gold') return 'pro'
  return 'basic'
})

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.pre('validate', function (next) {
  if (this.username !== undefined) {
    const normalized = String(this.username || '').trim().toLowerCase()
    this.username = normalized || undefined
  }
  next()
})

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Auto-expire subscription
userSchema.methods.applyPlanAccess = function (plan) {
  const normalizedPlan = plan || 'basic'

  if (normalizedPlan === 'premium_buyer' || normalizedPlan === 'silver') {
    this.role = ADMIN_ROLES.has(this.role) ? this.role : 'buyer'
    this.buyerType = 'premium'
    this.sellerTier = undefined
    return
  }

  if (normalizedPlan === 'seller_basic') {
    this.role = ADMIN_ROLES.has(this.role) ? this.role : 'seller'
    this.buyerType = 'regular'
    this.sellerTier = 'basic'
    return
  }

  if (normalizedPlan === 'seller_pro' || normalizedPlan === 'gold') {
    this.role = ADMIN_ROLES.has(this.role) ? this.role : 'seller'
    this.buyerType = 'regular'
    this.sellerTier = 'pro'
    return
  }

  if (normalizedPlan === 'seller_elite' || normalizedPlan === 'premium') {
    this.role = ADMIN_ROLES.has(this.role) ? this.role : 'seller'
    this.buyerType = 'regular'
    this.sellerTier = 'elite'
    return
  }

  this.role = ADMIN_ROLES.has(this.role) ? this.role : 'buyer'
  this.buyerType = 'regular'
  this.sellerTier = undefined
}

userSchema.methods.checkSubscription = async function () {
  if (!this.subscription || typeof this.subscription !== 'object') {
    this.subscription = { plan: 'basic', active: false }
  }

  const previousRole = this.role
  const previousTier = this.sellerTier
  const previousPlan = String(this.subscription?.plan || '').toLowerCase()
  const expiry = this.subscriptionExpiry || this.subscription?.expiresAt
  if (!expiry) return

  const now = new Date()
  if (now > expiry) {
    const wasSellerAccess = previousRole === 'seller'
      || ['seller_basic', 'seller_pro', 'seller_elite', 'gold', 'premium'].includes(previousPlan)
      || ['basic', 'pro', 'elite'].includes(String(previousTier || '').toLowerCase())

    this.subscriptionStatus = 'expired'
    this.subscriptionExpiry = expiry
    this.subscription.active = false
    this.subscription.plan = 'basic'
    this.subscription.expiresAt = expiry

    if (!ADMIN_ROLES.has(this.role)) {
      this.role = 'buyer'
      this.buyerType = 'regular'
      this.sellerTier = undefined
    }

    const Subscription = mongoose.model('Subscription')
    const Listing = mongoose.model('Listing')
    const Pin = mongoose.model('Pin')

    const updates = [
      this.save(),
      Subscription.updateMany(
        { user: this._id, status: 'active', expiresAt: { $lte: now } },
        {
          $set: {
            status: 'expired',
            cancelledAt: now,
            cancelReason: 'Subscription expired',
          },
        }
      ),
    ]

    if (wasSellerAccess && !ADMIN_ROLES.has(previousRole)) {
      updates.push(
        Listing.updateMany(
          { seller: this._id, status: 'active' },
          { $set: { status: 'paused', subscriptionPaused: true } }
        )
      )
      updates.push(
        Pin.updateMany(
          { user: this._id, targetType: 'listing', status: 'active' },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              cancelReason: 'subscription_expired',
            },
          }
        )
      )
    }

    await Promise.all(updates)
    return
  }

  if (this.subscription?.active || this.subscriptionStatus === 'active') {
    this.subscriptionStatus = 'active'
    this.subscriptionExpiry = expiry
    this.applyPlanAccess(this.subscription?.plan)
  }
}

// Indexes
userSchema.index({ name: 'text', bio: 'text', username: 'text' })
userSchema.index({ createdAt: -1 })

module.exports = mongoose.model('User', userSchema)
