const mongoose = require('mongoose')

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },

  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Textbooks', 'Hostel', 'Clothing', 'Food', 'Services', 'Other'],
  },
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair'],
    default: 'good',
  },

  images: [{ type: String }],
  imagePublicIds: [{ type: String }],

  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['active', 'sold', 'paused', 'removed'],
    default: 'active',
  },

  // Premium / boost
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: Date },
  boostScore: { type: Number, default: 0 },

  // Engagement
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  chatCount: { type: Number, default: 0 },

  // Location
  location: { type: String, trim: true },

  // Reports
  reportCount: { type: Number, default: 0 },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],

  tags: [{ type: String, lowercase: true, trim: true }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Auto-expire premium
listingSchema.pre('find', function () {
  this.where({ $or: [{ premiumUntil: { $gt: new Date() } }, { premiumUntil: null }] })
})

listingSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return null
  return Math.round((1 - this.price / this.originalPrice) * 100)
})

listingSchema.index({ title: 'text', description: 'text', tags: 'text' })
listingSchema.index({ seller: 1, status: 1 })
listingSchema.index({ category: 1, status: 1 })
listingSchema.index({ createdAt: -1 })
listingSchema.index({ isPremium: -1, boostScore: -1, createdAt: -1 })

module.exports = mongoose.model('Listing', listingSchema)
