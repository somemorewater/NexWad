const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = require('../models/User')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')
const Review = require('../models/Review')
const Subscription = require('../models/Subscription')
const Chat = require('../models/Chat')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadAvatar, deleteAsset } = require('../utils/cloudinary')
const { notifyNewFollower } = require('../utils/notifications')
const { body, validate } = require('../middleware/validate')
const { canExposeSellerPoster, ensureSellerPoster, generateSellerPoster, profileUrl, fetchAssetBuffer } = require('../utils/sellerPoster')

function userIdentifierQuery(identifierRaw) {
  const identifier = String(identifierRaw || '').trim()
  const query = []
  if (mongoose.Types.ObjectId.isValid(identifier)) query.push({ _id: identifier })
  query.push({ username: identifier.toLowerCase() })
  return { identifier, query }
}

// ─── GET /api/users/search ────────────────────
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return res.json({ users: [] })
    const escapedQuery = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, 'i')
    const query = {
      verified: true,
      banned: false,
      $or: [
        { username: regex },
        { name: regex },
        { bio: regex },
      ],
    }
    if (req.user?._id) query._id = { $ne: req.user._id }

    const users = await User.find(query)
      .select('name username avatar department level subscription rating role buyerType sellerTier')
      .limit(20)
    res.json({ users })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id ───────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { query } = userIdentifierQuery(req.params.id)

    const user = await User.findOne({ $or: query })
      .select('-password -passwordResetToken -passwordResetExpires -savedListings -warnings -reports -reportCount -warningsCount -banReason')
    if (!user || user.banned) return res.status(404).json({ error: 'User not found' })

    const isFollowing = req.user
      ? user.followers.some(f => f.toString() === req.user._id.toString())
      : false

    const isOwner = req.user?._id && String(req.user._id) === String(user._id)
    const payload = { ...user.toObject(), isFollowing }
    if (!isOwner) delete payload.matricNumber

    res.json({ user: payload })
  } catch (err) { next(err) }
})

// ─── PUT /api/users/me ────────────────────────
router.put('/me', protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('matricNumber')
      .optional({ values: 'falsy' })
      .trim()
      .matches(/^U\d{2}[A-Z]{2,6}\d{3,5}$/i)
      .withMessage('Invalid matric format. Use U[year][dept][no], e.g. U24PH1025'),
    body('department').optional().trim(),
    body('level').optional({ values: 'falsy' }).isIn(['100', '200', '300', '400', '500']),
    body('username')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage('Username can only contain letters, numbers, dots, and underscores'),
    body('bio').optional().isLength({ max: 500 }),
    body('phone').optional().trim(),
    body('website')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 300 })
      .matches(/^(https?:\/\/)?[^\s]+\.[^\s]+$/i)
      .withMessage('Website must be a valid URL'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'username', 'bio', 'phone', 'website', 'department', 'level']
      const updates = {}
      allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })
      if (req.body.matricNumber !== undefined) {
        const matric = String(req.body.matricNumber || '').trim().toUpperCase()
        updates.matricNumber = matric || undefined
      }
      if (updates.name !== undefined || updates.username !== undefined || updates.bio !== undefined) {
        updates.posterSignature = null
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
        .select('-password')
      res.json({ user })
    } catch (err) { next(err) }
  }
)

// ─── PUT /api/users/me/password ──────────────
router.put('/me/password', protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body
      const user = await User.findById(req.user._id).select('+password')
      if (!user) return res.status(404).json({ error: 'User not found' })

      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' })
      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' })
      }

      user.password = newPassword
      user.lastPasswordChange = new Date()
      await user.save()
      res.json({ message: 'Password updated successfully' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/users/me/upgrade-seller ───────
router.post('/me/upgrade-seller', protect, async (req, res, next) => {
  try {
    if (['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(req.user.role)) {
      return res.status(400).json({ error: 'Admin roles cannot be converted to seller' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: 'seller',
        sellerTier: 'basic',
        buyerType: 'regular',
        subscriptionStatus: 'none',
      },
      { new: true, runValidators: true }
    ).select('-password')

    res.json({ user, message: 'Account upgraded to seller' })
  } catch (err) { next(err) }
})

// ─── DELETE /api/users/me ─────────────────────
router.delete('/me', protect,
  [body('password').notEmpty().withMessage('Password is required')],
  validate,
  async (req, res, next) => {
    try {
      const { password } = req.body
      const user = await User.findById(req.user._id).select('+password')
      if (!user) return res.status(404).json({ error: 'User not found' })

      const isMatch = await user.comparePassword(password)
      if (!isMatch) return res.status(401).json({ error: 'Password is incorrect' })

      const userId = user._id
      if (user.avatarPublicId) await deleteAsset(user.avatarPublicId)

      await Promise.all([
        Listing.deleteMany({ seller: userId }),
        Post.deleteMany({ author: userId }),
        LostFound.deleteMany({ reporter: userId }),
        Review.deleteMany({ $or: [{ reviewer: userId }, { seller: userId }] }),
        Subscription.deleteMany({ user: userId }),
        Chat.updateMany({ participants: userId }, { $pull: { participants: userId } }),
        User.updateMany({}, { $pull: { followers: userId, following: userId } }),
      ])

      await User.deleteOne({ _id: userId })
      res.json({ message: 'Account deleted successfully' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/users/me/avatar ────────────────
router.post('/me/avatar', protect, handleUpload(uploadAvatar), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

    // Delete old avatar
    if (req.user.avatarPublicId) await deleteAsset(req.user.avatarPublicId)

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: req.file.path,
        avatarPublicId: req.file.filename,
        posterSignature: null,
      },
      { new: true }
    ).select('-password')

    res.json({ user })
  } catch (err) { next(err) }
})

// ─── PUT /api/users/me/poster/featured ───────
router.put('/me/poster/featured', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only sellers can set featured products' })
    const incoming = Array.isArray(req.body?.productIds) ? req.body.productIds : []
    const productIds = incoming
      .map((id) => String(id || '').trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .slice(0, 3)

    const listings = productIds.length
      ? await Listing.find({
        _id: { $in: productIds },
        seller: req.user._id,
        status: 'active',
      }).select('_id').lean()
      : []

    const availableIds = new Set(listings.map((item) => String(item._id)))
    const normalized = productIds.filter((id) => availableIds.has(id))

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        featuredProducts: normalized,
        posterSignature: null,
      },
      { new: true, runValidators: true }
    ).select('-password')

    res.json({ featuredProducts: user.featuredProducts, user })
  } catch (err) { next(err) }
})

// ─── POST /api/users/me/poster/generate ──────
router.post('/me/poster/generate', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only sellers can generate brand posters' })

    const user = await User.findById(req.user._id)
      .select('name username role sellerTier bio avatar subscription subscriptionStatus posterImageUrl posterSignature posterTemplateStyle posterLastGeneratedAt featuredProducts')
      .lean()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const poster = await generateSellerPoster(user, { force: true })
    res.json({
      message: 'Brand poster generated',
      posterImageUrl: poster.url,
      posterLastGeneratedAt: poster.generatedAt,
      posterTemplateStyle: poster.style,
      profileUrl: profileUrl(user),
    })
  } catch (err) { next(err) }
})

// ─── DELETE /api/users/me/poster ─────────────
router.delete('/me/poster', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only sellers can delete brand posters' })

    const user = await User.findById(req.user._id).select('posterPublicId')
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.posterPublicId) await deleteAsset(user.posterPublicId, 'image')

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        posterImageUrl: '',
        posterPublicId: '',
        posterSignature: null,
        posterTemplateStyle: null,
        posterLastGeneratedAt: null,
      },
      { new: true }
    ).select('-password')

    res.json({ message: 'Brand poster deleted', user: updated })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id/poster ───────────────
router.get('/:id/poster', optionalAuth, async (req, res, next) => {
  try {
    const { query } = userIdentifierQuery(req.params.id)
    const user = await User.findOne({ $or: query })
      .select('name username role sellerTier bio avatar subscription subscriptionStatus posterImageUrl posterSignature posterTemplateStyle posterLastGeneratedAt featuredProducts banned')
      .lean()
    if (!user || user.banned) return res.status(404).json({ error: 'Seller not found' })
    if (!canExposeSellerPoster(user)) return res.status(404).json({ error: 'Poster unavailable for this seller' })

    const poster = await ensureSellerPoster(user)
    res.json({
      posterImageUrl: poster.url,
      posterLastGeneratedAt: poster.generatedAt,
      posterTemplateStyle: poster.style,
      profileUrl: profileUrl(user),
    })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id/poster/image ─────────
router.get('/:id/poster/image', optionalAuth, async (req, res, next) => {
  try {
    const { query } = userIdentifierQuery(req.params.id)
    const user = await User.findOne({ $or: query })
      .select('name username role sellerTier bio avatar subscription subscriptionStatus posterImageUrl posterSignature posterTemplateStyle posterLastGeneratedAt featuredProducts banned')
      .lean()
    if (!user || user.banned) return res.status(404).json({ error: 'Seller not found' })
    if (!canExposeSellerPoster(user)) return res.status(404).json({ error: 'Poster unavailable for this seller' })

    const poster = await ensureSellerPoster(user)
    if (!poster?.url) return res.status(404).json({ error: 'Poster unavailable' })

    const buffer = await fetchAssetBuffer(poster.url)
    if (!buffer) return res.status(502).json({ error: 'Could not load poster image' })

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=900')
    res.send(buffer)
  } catch (err) { next(err) }
})

// ─── POST /api/users/:id/report ──────────────
router.post('/:id/report', protect,
  [body('reason').trim().notEmpty().isLength({ max: 500 })], validate,
  async (req, res, next) => {
    try {
      const target = await User.findById(req.params.id).select('_id banned reports reportCount')
      if (!target || target.banned) return res.status(404).json({ error: 'User not found' })
      if (target._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot report your own profile' })
      }

      const alreadyReported = target.reports?.some((r) => r.reporter?.toString() === req.user._id.toString())
      if (alreadyReported) return res.status(409).json({ error: 'You have already reported this user' })

      target.reports.push({ reporter: req.user._id, reason: req.body.reason })
      target.reportCount = (target.reportCount || 0) + 1
      await target.save()

      res.json({ message: 'Report submitted' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/users/:id/follow ───────────────
router.post('/:id/follow', protect, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself' })
    }
    const target = await User.findById(req.params.id)
    if (!target || target.banned) return res.status(404).json({ error: 'User not found' })

    const alreadyFollowing = target.followers.some(f => f.toString() === req.user._id.toString())
    if (alreadyFollowing) return res.status(409).json({ error: 'Already following' })

    await Promise.all([
      User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } }),
    ])

    notifyNewFollower(req.params.id, req.user.name, req.user._id)

    const updated = await User.findById(req.params.id)
      .select('_id followers following')
      .lean()

    res.json({
      message: 'Following',
      isFollowing: true,
      followerCount: updated?.followers?.length || 0,
      followingCount: updated?.following?.length || 0,
    })
  } catch (err) { next(err) }
})

// ─── DELETE /api/users/:id/follow ────────────
router.delete('/:id/follow', protect, async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } }),
    ])

    const updated = await User.findById(req.params.id)
      .select('_id followers following')
      .lean()

    res.json({
      message: 'Unfollowed',
      isFollowing: false,
      followerCount: updated?.followers?.length || 0,
      followingCount: updated?.following?.length || 0,
    })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id/followers ─────────────
router.get('/:id/followers', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'name username avatar department subscription role buyerType sellerTier')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ followers: user.followers, count: user.followers.length })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id/following ─────────────
router.get('/:id/following', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name username avatar department subscription role buyerType sellerTier')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ following: user.following, count: user.following.length })
  } catch (err) { next(err) }
})

module.exports = router
