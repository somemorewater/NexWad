const mongoose = require('mongoose')

const userLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, trim: true, index: true },
  category: {
    type: String,
    enum: ['auth', 'navigation', 'click', 'listing', 'post', 'lostfound', 'chat', 'profile', 'system', 'other'],
    default: 'other',
    index: true,
  },
  entityType: { type: String, trim: true, index: true },
  entityId: { type: String, trim: true, index: true },
  source: { type: String, enum: ['server', 'client'], default: 'server', index: true },

  route: { type: String, trim: true },
  method: { type: String, trim: true },
  statusCode: { type: Number },

  ip: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  occurredAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true })

userLogSchema.index({ user: 1, occurredAt: -1 })
userLogSchema.index({ user: 1, category: 1, occurredAt: -1 })

module.exports = mongoose.model('UserLog', userLogSchema)
