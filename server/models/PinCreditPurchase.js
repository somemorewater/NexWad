const mongoose = require('mongoose')

const pinCreditPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  units: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
    index: true,
  },
  paymentReference: { type: String, unique: true, sparse: true },
  paymentGateway: { type: String, default: 'paystack' },
  paidAt: { type: Date },
}, { timestamps: true })

pinCreditPurchaseSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('PinCreditPurchase', pinCreditPurchaseSchema)
