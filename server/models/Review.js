const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000 },
  verified: { type: Boolean, default: false }, // verified purchase
}, {
  timestamps: true,
})

reviewSchema.index({ seller: 1 })
reviewSchema.index({ reviewer: 1, listing: 1 }, { unique: true })

// Update seller rating after save/remove
async function updateSellerRating(sellerId) {
  const User = mongoose.model('User')
  const stats = await mongoose.model('Review').aggregate([
    { $match: { seller: sellerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const { avg = 0, count = 0 } = stats[0] || {}
  await User.findByIdAndUpdate(sellerId, { rating: Math.round(avg * 10) / 10, ratingCount: count })
}

reviewSchema.post('save', function () { updateSellerRating(this.seller) })
reviewSchema.post('remove', function () { updateSellerRating(this.seller) })

module.exports = mongoose.model('Review', reviewSchema)
