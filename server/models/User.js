const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const ADMIN_ROLES = new Set(['admin', 'superadmin', 'super_admin', 'moderator', 'cs'])

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  matricNumber: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
  department: { type: String, trim: true },
  level: { type: String, enum: ['100', '200', '300', '400', '500'] },
  phone: { type: String, trim: true },
  avatar: { type: String },
  avatarPublicId: { type: String },
  bio: { type: String, maxlength: 500 },

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
    default: 'basic',
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
    this.sellerTier = 'basic'
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
  this.sellerTier = 'basic'
}

userSchema.methods.checkSubscription = async function () {
  const expiry = this.subscriptionExpiry || this.subscription?.expiresAt
  if (!expiry) return

  if (new Date() > expiry) {
    this.subscriptionStatus = 'expired'
    this.subscriptionExpiry = expiry
    this.subscription.active = false
    this.subscription.plan = 'basic'
    this.subscription.expiresAt = expiry

    if (!ADMIN_ROLES.has(this.role)) {
      this.role = 'buyer'
      this.buyerType = 'regular'
      this.sellerTier = 'basic'
    }

    await this.save()
    return
  }

  if (this.subscription?.active || this.subscriptionStatus === 'active') {
    this.subscriptionStatus = 'active'
    this.subscriptionExpiry = expiry
    this.applyPlanAccess(this.subscription?.plan)
  }
}

// Indexes
userSchema.index({ name: 'text', bio: 'text' })
userSchema.index({ createdAt: -1 })

module.exports = mongoose.model('User', userSchema)
