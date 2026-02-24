const mongoose = require('mongoose')

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, trim: true },
  target: { type: String }, // e.g. "User:abc123"
  targetModel: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true })

adminLogSchema.index({ admin: 1, createdAt: -1 })
adminLogSchema.index({ createdAt: -1 })

module.exports = mongoose.model('AdminLog', adminLogSchema)
