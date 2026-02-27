const mongoose = require('mongoose')

const sellerApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: {
    type: String,
    enum: ['seller_basic', 'seller_pro', 'seller_elite'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  paymentReference: { type: String, required: true },
  paymentMethod: { type: String, default: 'card' },
  application: {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    storeName: { type: String, required: true, trim: true, maxlength: 120 },
    nin: { type: String, required: true, trim: true, maxlength: 20 },
    productDetails: { type: String, required: true, trim: true, maxlength: 2000 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    experience: { type: String, trim: true, maxlength: 80 },
    reason: { type: String, trim: true, maxlength: 1200 },
    schoolIdImage: { type: String, required: true },
    schoolIdImagePublicId: { type: String, required: true },
  },
  rejectionReason: { type: String },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  expiresAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

sellerApplicationSchema.index({ user: 1, status: 1 })
sellerApplicationSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('SellerApplication', sellerApplicationSchema)
