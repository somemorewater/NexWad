const mongoose = require('mongoose')

// ─── Chat (conversation) ──────────────────────
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  support: { type: Boolean, default: false },
  supportStatus: { type: String, enum: ['pending', 'assigned', 'closed'], default: null },
  supportAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supportRequestedAt: { type: Date },
  supportAssignedAt: { type: Date },
  supportClosedAt: { type: Date },

  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },

  // Per-participant unread counts
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },

  // Soft delete per participant
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
})

chatSchema.index({ participants: 1 })
chatSchema.index({ listing: 1 })
chatSchema.index({ lastActivity: -1 })

// ─── Message ──────────────────────────────────
const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, maxlength: 5000 },
  media: { type: String },           // Cloudinary URL
  mediaPublicId: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'file'] },

  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
}, {
  timestamps: true,
})

messageSchema.index({ chat: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })

const Chat = mongoose.model('Chat', chatSchema)
const Message = mongoose.model('Message', messageSchema)

module.exports = { Chat, Message }
