const mongoose = require('mongoose')

const pinSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetType: {
    type: String,
    enum: ['listing', 'post', 'lostfound'],
    required: true,
    index: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  durationHours: { type: Number, default: 24, min: 24 },
  amount: { type: Number, required: true, min: 0 },

  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled'],
    default: 'pending',
    index: true,
  },
  pinnedAt: { type: Date },
  expiresAt: { type: Date, index: true },
  activatedAt: { type: Date },
  cancelledAt: { type: Date },

  paymentReference: { type: String, unique: true, sparse: true },
  paymentGateway: { type: String, default: 'paystack' },

  extensionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin', default: null },
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin', default: null },
  cancelReason: { type: String },
}, { timestamps: true })

pinSchema.index({ targetType: 1, targetId: 1, status: 1, expiresAt: -1 })
pinSchema.index({ user: 1, status: 1, expiresAt: -1 })

module.exports = mongoose.model('Pin', pinSchema)
