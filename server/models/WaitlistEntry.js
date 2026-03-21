const mongoose = require('mongoose')

const waitlistEntrySchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  campus: { type: String, trim: true, maxlength: 160 },
  role: {
    type: String,
    enum: ['student', 'seller', 'community', 'brand'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['pending', 'invited', 'converted'],
    default: 'pending',
  },
  source: { type: String, trim: true, maxlength: 120, default: 'waitlist_page' },
}, { timestamps: true })

waitlistEntrySchema.index({ email: 1 }, { unique: true })
waitlistEntrySchema.index({ createdAt: -1 })
waitlistEntrySchema.index({ role: 1 })
waitlistEntrySchema.index({ status: 1 })

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema)
