const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 5000 },
  image: { type: String },
  imagePublicId: { type: String },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  shares: { type: Number, default: 0 },
  views: { type: Number, default: 0 },

  // Feed algorithm inputs
  engagementScore: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },

  // Linked listing (e.g., "For Sale" post)
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },

  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
  reportCount: { type: Number, default: 0 },
  removed: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

postSchema.virtual('likeCount').get(function () { return this.likes?.length || 0 })
postSchema.virtual('commentCount').get(function () { return this.comments?.length || 0 })

// Update engagement score before save
postSchema.pre('save', function (next) {
  this.engagementScore =
    (this.likes?.length || 0) * 3 +
    (this.comments?.length || 0) * 5 +
    this.shares * 7 +
    this.views * 0.5
  next()
})

postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ engagementScore: -1, createdAt: -1 })
postSchema.index({ content: 'text' })

module.exports = mongoose.model('Post', postSchema)
