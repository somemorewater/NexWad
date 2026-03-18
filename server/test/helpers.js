const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')
const Chat = require('../models/Chat').Chat
const { LISTING_CATEGORIES, LOST_FOUND_CATEGORIES } = require('../constants/categories')

let emailCounter = 0

function nextEmail(prefix = 'user') {
  emailCounter += 1
  return `${prefix}${emailCounter}@example.com`
}

async function createUser(overrides = {}) {
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || nextEmail('user'),
    password: overrides.password || 'password123',
    role: overrides.role || 'buyer',
    verified: overrides.verified ?? true,
    subscription: overrides.subscription,
    sellerTier: overrides.sellerTier,
  })
  return user
}

function authHeader(user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
  return `Bearer ${token}`
}

async function createListing(overrides = {}) {
  const seller = overrides.seller || await createUser({ role: 'seller' })
  const listing = await Listing.create({
    title: overrides.title || 'Sample Listing',
    description: overrides.description || 'Description',
    price: overrides.price || 5000,
    category: overrides.category || LISTING_CATEGORIES[0],
    condition: overrides.condition || 'good',
    images: overrides.images || ['https://example.com/img.jpg'],
    imagePublicIds: overrides.imagePublicIds || ['img1'],
    seller: seller._id,
  })
  return { listing, seller }
}

async function createPost(overrides = {}) {
  const author = overrides.author || await createUser()
  const post = await Post.create({
    author: author._id,
    content: overrides.content || 'Hello world',
    image: overrides.image,
    imagePublicId: overrides.imagePublicId,
  })
  return { post, author }
}

async function createLostFound(overrides = {}) {
  const reporter = overrides.reporter || await createUser()
  const item = await LostFound.create({
    type: overrides.type || 'lost',
    category: overrides.category || LOST_FOUND_CATEGORIES[0],
    title: overrides.title || 'Lost Item',
    description: overrides.description || 'Description',
    location: overrides.location || 'Library',
    reporter: reporter._id,
  })
  return { item, reporter }
}

async function createSupportChat(overrides = {}) {
  const requester = overrides.requester || await createUser()
  const chat = await Chat.create({
    participants: [requester._id],
    support: true,
    supportStatus: 'pending',
    supportRequestedAt: new Date(),
  })
  return { chat, requester }
}

module.exports = {
  createUser,
  authHeader,
  createListing,
  createPost,
  createLostFound,
  createSupportChat,
}
