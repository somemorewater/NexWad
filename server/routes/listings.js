const express = require('express')
const router = express.Router()
const Listing = require('../models/Listing')
const User = require('../models/User')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadListingImages, deleteAsset } = require('../utils/cloudinary')
const { listingRules, validate, paginationRules } = require('../middleware/validate')
const { buildListingFeed } = require('../utils/feedAlgorithm')
const { attachPinsAndSort } = require('../utils/pins')
const { queueUserLog, buildRequestLog } = require('../utils/userLogs')
const { responseCacheKey, responseCacheRemember, responseCacheInvalidate } = require('../utils/redis')
const { serializeQuery } = require('../utils/cacheKey')

const MONTHLY_UPLOAD_LIMITS = {
  basic: 12,
  pro: 17,
  elite: 23,
}
const MAX_LISTING_IMAGES = 4

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null || value === '') return []
  return [value]
}

function resolveSellerTier(user) {
  if (['basic', 'pro', 'elite'].includes(user?.sellerTier)) return user.sellerTier

  const plan = String(user?.subscription?.plan || '').toLowerCase()
  if (plan === 'seller_elite' || plan === 'premium') return 'elite'
  if (plan === 'seller_pro' || plan === 'gold') return 'pro'
  return 'basic'
}

async function buildListingSearchClause(rawQuery) {
  const q = String(rawQuery || '').trim()
  if (!q) return null

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'i')
  const sellers = await User.find({
    banned: false,
    $or: [{ name: regex }, { username: regex }],
  }).select('_id').limit(40).lean()
  const sellerIds = sellers.map((s) => s._id)

  const clauses = [
    { title: regex },
    { description: regex },
    { tags: regex },
  ]
  if (sellerIds.length) clauses.push({ seller: { $in: sellerIds } })
  return { $or: clauses }
}

// ─── GET /api/listings ────────────────────────
router.get('/', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, sort, q, mine, saved, seller } = req.query
    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)

    // Explicit seller filter must always return that seller's listings
    // (including for authenticated users, bypassing personalized feed ranking).
    if (seller) {
      if (!req.user) {
        const cacheKey = responseCacheKey(['listings', 'seller', serializeQuery(req.query)])
        const { value } = await responseCacheRemember({
          key: cacheKey,
          ttlSeconds: 75,
          namespaces: ['listings:list'],
          compute: async () => {
            const query = { status: 'active', seller }
            if (category && category !== 'All') query.category = category
            const searchClause = await buildListingSearchClause(q)
            if (searchClause) Object.assign(query, searchClause)

            const skip = (parsedPage - 1) * parsedLimit
            const [listings, total] = await Promise.all([
              Listing.find(query)
                .populate('seller', 'name username avatar subscription role buyerType sellerTier')
                .sort({ isPremium: -1, createdAt: -1 })
                .skip(skip)
                .limit(parsedLimit)
                .lean(),
              Listing.countDocuments(query),
            ])

            const { items, pinnedItems } = await attachPinsAndSort(listings, 'listing')
            return { listings: items, pinnedListings: pinnedItems, hasMore: total > skip + listings.length, page: parsedPage }
          },
        })
        return res.json(value)
      }

      const query = { status: 'active', seller }
      if (category && category !== 'All') query.category = category
      const searchClause = await buildListingSearchClause(q)
      if (searchClause) Object.assign(query, searchClause)

      const skip = (parsedPage - 1) * parsedLimit
      const [listings, total] = await Promise.all([
        Listing.find(query)
          .populate('seller', 'name username avatar subscription role buyerType sellerTier')
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

      const { items, pinnedItems } = await attachPinsAndSort(result, 'listing')
      return res.json({ listings: items, pinnedListings: pinnedItems, hasMore: total > skip + result.length, page: parsedPage })
    }

    if (req.user) {
      const result = await buildListingFeed(req.user, {
        page: parsedPage, limit: parsedLimit, category, sort, q,
        mine: mine === 'true', saved: saved === 'true',
      })
      const { items, pinnedItems } = await attachPinsAndSort(result.listings || [], 'listing')
      return res.json({ ...result, listings: items, pinnedListings: pinnedItems })
    }

    // Unauthenticated: simple query
    const query = { status: 'active' }
    if (category && category !== 'All') query.category = category
    if (seller) query.seller = seller
    const searchClause = await buildListingSearchClause(q)
    if (searchClause) Object.assign(query, searchClause)

    const cacheKey = responseCacheKey(['listings', 'public', serializeQuery(req.query)])
    const { value } = await responseCacheRemember({
      key: cacheKey,
      ttlSeconds: 75,
      namespaces: ['listings:list'],
      compute: async () => {
        const skip = (parsedPage - 1) * parsedLimit
        const [listings, total] = await Promise.all([
          Listing.find(query)
            .populate('seller', 'name username avatar subscription role buyerType sellerTier')
            .sort({ isPremium: -1, createdAt: -1 })
            .skip(skip).limit(parsedLimit),
          Listing.countDocuments(query),
        ])
        const serialized = listings.map((listing) => listing.toObject?.() || listing)
        const { items, pinnedItems } = await attachPinsAndSort(serialized, 'listing')
        return { listings: items, pinnedListings: pinnedItems, hasMore: total > skip + listings.length, page: parsedPage }
      },
    })
    res.json(value)
  } catch (err) { next(err) }
})

// ─── GET /api/listings/saved ──────────────────
router.get('/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedListings',
      populate: { path: 'seller', select: 'name username avatar subscription role buyerType sellerTier' },
    })
    res.json({ listings: user.savedListings, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/listings/mine ───────────────────
router.get('/mine', protect, async (req, res, next) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 })
    const { items, pinnedItems } = await attachPinsAndSort(listings.map((listing) => listing.toObject?.() || listing), 'listing')
    res.json({ listings: items, pinnedListings: pinnedItems, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/listings/:id ────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name username avatar rating ratingCount subscription department role buyerType sellerTier')
    if (!listing || listing.status === 'removed') return res.status(404).json({ error: 'Listing not found' })

    // Increment views
    listing.views += 1
    listing.save()
    if (req.user?._id) {
      queueUserLog(buildRequestLog(req, res, {
        action: 'listing_viewed',
        category: 'listing',
        entityType: 'listing',
        entityId: listing._id.toString(),
        metadata: { sellerId: listing.seller?._id?.toString?.() || listing.seller?.toString?.() },
      }))
    }

    const isSaved = req.user
      ? req.user.savedListings?.some(s => s.toString() === listing._id.toString())
      : false

    const { items } = await attachPinsAndSort([{ ...listing.toObject(), isSaved }], 'listing')
    res.json({ listing: items[0] })
  } catch (err) { next(err) }
})

// ─── POST /api/listings ───────────────────────
router.post('/', protect, handleUpload(uploadListingImages), listingRules, validate, async (req, res, next) => {
  try {
    const canSell = req.user.role === 'seller'
    if (!canSell) {
      return res.status(403).json({ error: 'Upgrade to seller to create listings' })
    }
    if (!Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required to create a listing' })
    }

    const sellerTier = resolveSellerTier(req.user)
    const monthlyLimit = MONTHLY_UPLOAD_LIMITS[sellerTier] || MONTHLY_UPLOAD_LIMITS.basic
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
    const uploadsThisMonth = await Listing.countDocuments({
      seller: req.user._id,
      createdAt: { $gte: monthStart, $lt: nextMonthStart },
    })
    if (uploadsThisMonth >= monthlyLimit) {
      return res.status(403).json({
        error: `Monthly upload limit reached for ${sellerTier} sellers (${monthlyLimit} listings per month).`,
        limit: monthlyLimit,
        uploadsThisMonth,
        tier: sellerTier,
      })
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

    const populated = await listing.populate('seller', 'name username avatar subscription role buyerType sellerTier')
    await responseCacheInvalidate(['listings:list', 'users:public-profile'])
    res.status(201).json({ listing: populated })
  } catch (err) { next(err) }
})

// ─── PUT /api/listings/:id ────────────────────
router.put('/:id', protect, handleUpload(uploadListingImages), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Not found' })
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your listing' })
    }
    const allowed = ['title', 'description', 'price', 'originalPrice', 'category', 'condition', 'status', 'location']
    allowed.forEach(f => { if (req.body[f] !== undefined) listing[f] = req.body[f] })

    const hasImageUpdate = Boolean(req.files?.length)
      || req.body.retainImagePublicIds !== undefined
      || req.body.retainImageUrls !== undefined
    if (hasImageUpdate) {
      const existingImages = Array.isArray(listing.images) ? listing.images : []
      const existingPublicIds = Array.isArray(listing.imagePublicIds) ? listing.imagePublicIds : []
      const retainById = new Set(asArray(req.body.retainImagePublicIds).map((v) => String(v || '').trim()).filter(Boolean))
      const retainByUrl = new Set(asArray(req.body.retainImageUrls).map((v) => String(v || '').trim()).filter(Boolean))
      const selectorsProvided = retainById.size > 0 || retainByUrl.size > 0

      const kept = []
      const removedPublicIds = []
      existingImages.forEach((url, index) => {
        const publicId = existingPublicIds[index]
        const shouldKeep = !selectorsProvided
          || (publicId && retainById.has(String(publicId)))
          || retainByUrl.has(String(url))
        if (shouldKeep) {
          kept.push({ url, publicId })
        } else if (publicId) {
          removedPublicIds.push(publicId)
        }
      })

      const newUploads = (req.files || []).map((file) => ({
        url: file.path,
        publicId: file.filename,
      }))
      const merged = [...kept, ...newUploads]
      if (merged.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' })
      }
      if (merged.length > MAX_LISTING_IMAGES) {
        return res.status(400).json({ error: `Maximum ${MAX_LISTING_IMAGES} images allowed` })
      }

      listing.images = merged.map((item) => item.url)
      listing.imagePublicIds = merged.map((item) => item.publicId).filter(Boolean)
      if (removedPublicIds.length) {
        await Promise.all(removedPublicIds.map((publicId) => deleteAsset(publicId)))
      }
    }

    await listing.save()
    await responseCacheInvalidate(['listings:list', 'users:public-profile'])
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
    await responseCacheInvalidate(['listings:list', 'users:public-profile'])
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
