const mongoose = require('mongoose')
const { LOST_FOUND_CATEGORIES } = require('../constants/categories')

const lostFoundSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  category: { type: String, enum: LOST_FOUND_CATEGORIES, required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  location: { type: String, trim: true },
  image: { type: String },
  imagePublicId: { type: String },

  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['active', 'resolved', 'expired'],
    default: 'active',
  },

  claimants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    claimedAt: { type: Date, default: Date.now },
  }],

  resolvedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },

  views: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
}, { timestamps: true })

lostFoundSchema.index({ type: 1, status: 1, createdAt: -1 })
lostFoundSchema.index({ reporter: 1 })
lostFoundSchema.index({ title: 'text', description: 'text' })

module.exports = mongoose.model('LostFound', lostFoundSchema)
