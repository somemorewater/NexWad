const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

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
    enum: ['user', 'cs', 'moderator', 'admin', 'super_admin'],
    default: 'user',
  },

  verified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  banReason: { type: String },

  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },

  // Subscription embedded summary (authoritative record is in Subscription collection)
  subscription: {
    plan: { type: String, enum: ['basic', 'silver', 'gold', 'premium'], default: 'basic' },
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
userSchema.virtual('sellerTier').get(function () {
  const plan = this.subscription?.plan
  if (plan === 'premium' || plan === 'gold') return 'gold'
  if (plan === 'silver') return 'silver'
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
userSchema.methods.checkSubscription = function () {
  if (this.subscription?.expiresAt && new Date() > this.subscription.expiresAt) {
    this.subscription.active = false
    this.subscription.plan = 'basic'
    this.save()
  }
}

// Indexes
userSchema.index({ name: 'text', bio: 'text' })
userSchema.index({ createdAt: -1 })

module.exports = mongoose.model('User', userSchema)
