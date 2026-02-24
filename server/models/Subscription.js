const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  plan: {
    type: String,
    enum: ['basic', 'silver', 'gold', 'premium'],
    required: true,
  },

  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending',
  },

  price: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },

  startDate: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },

  autoRenew: { type: Boolean, default: true },

  // Payment details
  paymentReference: { type: String, unique: true, sparse: true },
  paymentMethod: { type: String },
  paymentGateway: { type: String },

  // PDF receipt
  receiptUrl: { type: String },
  receiptPublicId: { type: String },

  cancelledAt: { type: Date },
  cancelReason: { type: String },
}, { timestamps: true })

subscriptionSchema.index({ user: 1, status: 1 })
subscriptionSchema.index({ expiresAt: 1 })

module.exports = mongoose.model('Subscription', subscriptionSchema)
