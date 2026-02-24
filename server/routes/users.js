const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Listing = require('../models/Listing')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadAvatar, deleteAsset } = require('../utils/cloudinary')
const { notifyNewFollower } = require('../utils/notifications')
const { body, validate } = require('../middleware/validate')

// ─── GET /api/users/search ────────────────────
router.get('/search', protect, async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return res.json({ users: [] })
    const users = await User.find({
      $text: { $search: q },
      _id: { $ne: req.user._id },
      verified: true,
      banned: false,
    }).select('name avatar department level subscription rating').limit(20)
    res.json({ users })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id ───────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpires -savedListings')
    if (!user || user.banned) return res.status(404).json({ error: 'User not found' })

    const isFollowing = req.user
      ? user.followers.some(f => f.toString() === req.user._id.toString())
      : false

    res.json({ user: { ...user.toObject(), isFollowing } })
  } catch (err) { next(err) }
})

// ─── PUT /api/users/me ────────────────────────
router.put('/me', protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'bio', 'phone']
      const updates = {}
      allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
        .select('-password')
      res.json({ user })
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
      { avatar: req.file.path, avatarPublicId: req.file.filename },
      { new: true }
    ).select('-password')

    res.json({ user })
  } catch (err) { next(err) }
})

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
    const user = await User.findById(req.params.id).populate('followers', 'name avatar department subscription')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ followers: user.followers, count: user.followers.length })
  } catch (err) { next(err) }
})

// ─── GET /api/users/:id/following ─────────────
router.get('/:id/following', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name avatar department subscription')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ following: user.following, count: user.following.length })
  } catch (err) { next(err) }
})

module.exports = router
