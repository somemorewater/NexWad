const express = require('express')
const router = express.Router()
const Listing = require('../models/Listing')
const User = require('../models/User')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadListingImages, deleteAsset } = require('../utils/cloudinary')
const { listingRules, validate, paginationRules } = require('../middleware/validate')
const { buildListingFeed } = require('../utils/feedAlgorithm')

// ─── GET /api/listings ────────────────────────
router.get('/', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, sort, q, mine, saved, seller } = req.query
    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)

    // Explicit seller filter must always return that seller's listings
    // (including for authenticated users, bypassing personalized feed ranking).
    if (seller) {
      const query = { status: 'active', seller }
      if (category && category !== 'All') query.category = category
      if (q) query.$text = { $search: q }

      const skip = (parsedPage - 1) * parsedLimit
      const [listings, total] = await Promise.all([
        Listing.find(query)
          .populate('seller', 'name avatar subscription role buyerType sellerTier')
          .sort({ isPremium: -1, createdAt: -1 })
          .skip(skip)
          .limit(parsedLimit)
          .lean(),
        Listing.countDocuments(query),
      ])

      const savedIds = req.user?.savedListings?.map(s => s.toString()) || []
      const result = listings.map(l => ({
        ...l,
        isSaved: savedIds.includes(l._id.toString()),
      }))

      return res.json({ listings: result, hasMore: total > skip + result.length, page: parsedPage })
    }

    if (req.user) {
      const result = await buildListingFeed(req.user, {
        page: parsedPage, limit: parsedLimit, category, sort, q,
        mine: mine === 'true', saved: saved === 'true',
      })
      return res.json(result)
    }

    // Unauthenticated: simple query
    const query = { status: 'active' }
    if (category && category !== 'All') query.category = category
    if (seller) query.seller = seller
    if (q) query.$text = { $search: q }

    const skip = (parsedPage - 1) * parsedLimit
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('seller', 'name avatar subscription role buyerType sellerTier')
        .sort({ isPremium: -1, createdAt: -1 })
        .skip(skip).limit(parsedLimit),
      Listing.countDocuments(query),
    ])
    res.json({ listings, hasMore: total > skip + listings.length, page: parsedPage })
  } catch (err) { next(err) }
})

// ─── GET /api/listings/saved ──────────────────
router.get('/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedListings',
      populate: { path: 'seller', select: 'name avatar subscription role buyerType sellerTier' },
    })
    res.json({ listings: user.savedListings, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/listings/mine ───────────────────
router.get('/mine', protect, async (req, res, next) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 })
    res.json({ listings, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/listings/:id ────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name avatar rating ratingCount subscription department role buyerType sellerTier')
    if (!listing || listing.status === 'removed') return res.status(404).json({ error: 'Listing not found' })

    // Increment views
    listing.views += 1
    listing.save()

    const isSaved = req.user
      ? req.user.savedListings?.some(s => s.toString() === listing._id.toString())
      : false

    res.json({ listing: { ...listing.toObject(), isSaved } })
  } catch (err) { next(err) }
})

// ─── POST /api/listings ───────────────────────
router.post('/', protect, handleUpload(uploadListingImages), listingRules, validate, async (req, res, next) => {
  try {
    const canSell = req.user.role === 'seller'
    if (!canSell) {
      return res.status(403).json({ error: 'Upgrade to seller to create listings' })
    }

    const { title, description, price, originalPrice, category, condition, tags } = req.body
    const images = req.files?.map(f => f.path) || []
    const imagePublicIds = req.files?.map(f => f.filename) || []

    const premiumByTier = ['pro', 'elite'].includes(req.user.sellerTier)
    const premiumByLegacyPlan = req.user.subscription?.active && req.user.subscription.plan !== 'basic'

    const listing = await Listing.create({
      title, description, price, originalPrice, category, condition,
      seller: req.user._id,
      images, imagePublicIds,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isPremium: premiumByTier || premiumByLegacyPlan,
    })

    const populated = await listing.populate('seller', 'name avatar subscription role buyerType sellerTier')
    res.status(201).json({ listing: populated })
  } catch (err) { next(err) }
})

// ─── PUT /api/listings/:id ────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Not found' })
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your listing' })
    }
    const allowed = ['title', 'description', 'price', 'originalPrice', 'category', 'condition', 'status', 'location']
    allowed.forEach(f => { if (req.body[f] !== undefined) listing[f] = req.body[f] })
    await listing.save()
    res.json({ listing })
  } catch (err) { next(err) }
})

// ─── DELETE /api/listings/:id ─────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Not found' })
    if (listing.seller.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    // Delete images from Cloudinary
    for (const pid of listing.imagePublicIds || []) await deleteAsset(pid)
    await listing.deleteOne()
    res.json({ message: 'Listing deleted' })
  } catch (err) { next(err) }
})

// ─── POST /api/listings/:id/save ──────────────
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedListings: req.params.id } })
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { saves: 1 } })
    res.json({ saved: true })
  } catch (err) { next(err) }
})

// ─── DELETE /api/listings/:id/save ────────────
router.delete('/:id/save', protect, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedListings: req.params.id } })
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { saves: -1 } })
    res.json({ saved: false })
  } catch (err) { next(err) }
})

// ─── POST /api/listings/:id/report ────────────
router.post('/:id/report', protect, async (req, res, next) => {
  try {
    const { reason } = req.body
    await Listing.findByIdAndUpdate(req.params.id, {
      $push: { reports: { reporter: req.user._id, reason } },
      $inc: { reportCount: 1 },
    })
    res.json({ message: 'Reported' })
  } catch (err) { next(err) }
})

module.exports = router
