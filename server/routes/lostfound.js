const express = require('express')
const router = express.Router()
const LostFound = require('../models/LostFound')
const { protect, optionalAuth } = require('../middleware/auth')
const { deleteAsset } = require('../utils/cloudinary')
const { paginationRules, validate, body } = require('../middleware/validate')
const { notifyLostFoundClaim } = require('../utils/notifications')
const { attachPinsAndSort } = require('../utils/pins')
const { queueUserLog, buildRequestLog } = require('../utils/userLogs')
const { LOST_FOUND_CATEGORIES } = require('../constants/categories')
const { responseCacheKey, responseCacheRemember, responseCacheInvalidate } = require('../utils/redis')
const { serializeQuery } = require('../utils/cacheKey')

// ─── GET /api/lostfound ───────────────────────
router.get('/', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { type, status = 'active', page = 1, limit = 20, q } = req.query
    const cacheKey = responseCacheKey(['lostfound', 'list', serializeQuery(req.query)])
    const { value } = await responseCacheRemember({
      key: cacheKey,
      ttlSeconds: 60,
      namespaces: ['lostfound:list'],
      compute: async () => {
        const query = {}
        if (type) query.type = type
        if (status) query.status = status
        if (q) query.$text = { $search: q }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [items, total] = await Promise.all([
          LostFound.find(query)
            .populate('reporter', 'name avatar department')
            .sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit)),
          LostFound.countDocuments(query),
        ])
        const serialized = items.map((item) => item.toObject?.() || item)
        const { items: enrichedItems, pinnedItems } = await attachPinsAndSort(serialized, 'lostfound')
        return { items: enrichedItems, pinnedItems, hasMore: total > skip + items.length, total }
      },
    })
    res.json(value)
  } catch (err) { next(err) }
})

// ─── GET /api/lostfound/:id ───────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id)
      .populate('reporter', 'name avatar department phone')
      .populate('claimants.user', 'name avatar')
    if (!item) return res.status(404).json({ error: 'Not found' })
    item.views += 1
    item.save()
    if (req.user?._id) {
      queueUserLog(buildRequestLog(req, res, {
        action: 'lostfound_viewed',
        category: 'lostfound',
        entityType: 'lostfound',
        entityId: item._id.toString(),
        metadata: { type: item.type, status: item.status },
      }))
    }
    const { items } = await attachPinsAndSort([item.toObject()], 'lostfound')
    res.json({ item: items[0] })
  } catch (err) { next(err) }
})

// ─── POST /api/lostfound ──────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { type, category, title, description, location } = req.body
    if (!type || !category || !title) return res.status(400).json({ error: 'type, category and title are required' })
    if (!['lost', 'found'].includes(type)) return res.status(400).json({ error: 'Invalid type' })
    if (!LOST_FOUND_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' })

    const item = await LostFound.create({
      type, category, title, description, location,
      reporter: req.user._id,
    })
    const populated = await item.populate('reporter', 'name avatar department')
    await responseCacheInvalidate('lostfound:list')
    res.status(201).json({ item: populated })
  } catch (err) { next(err) }
})

// ─── PUT /api/lostfound/:id ───────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    if (item.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your report' })
    }
    const allowed = ['title', 'description', 'location', 'status', 'category']
    allowed.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f] })
    if (item.category && !LOST_FOUND_CATEGORIES.includes(item.category)) {
      return res.status(400).json({ error: 'Invalid category' })
    }
    await item.save()
    await responseCacheInvalidate('lostfound:list')
    res.json({ item })
  } catch (err) { next(err) }
})

// ─── DELETE /api/lostfound/:id ────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    if (item.reporter.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    if (item.imagePublicId) await deleteAsset(item.imagePublicId)
    await item.deleteOne()
    await responseCacheInvalidate('lostfound:list')
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) }
})

// ─── POST /api/lostfound/:id/claim ───────────
router.post('/:id/claim', protect,
  [body('message').optional().isLength({ max: 500 })], validate,
  async (req, res, next) => {
    try {
      const item = await LostFound.findById(req.params.id)
      if (!item || item.status !== 'active') return res.status(404).json({ error: 'Item not available' })
      if (item.reporter.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot claim your own report' })
      }
      const alreadyClaimed = item.claimants.some(c => c.user.toString() === req.user._id.toString())
      if (alreadyClaimed) return res.status(409).json({ error: 'Already claimed' })

      item.claimants.push({ user: req.user._id, message: req.body.message })
      await item.save()
      await responseCacheInvalidate('lostfound:list')
      notifyLostFoundClaim(item.reporter.toString(), req.user.name, item._id)
      res.json({ message: 'Claim submitted. The reporter will be notified.' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/lostfound/:id/resolve ─────────
router.post('/:id/resolve', protect, async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    if (item.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the reporter can resolve this' })
    }
    item.status = 'resolved'
    item.resolvedAt = new Date()
    await item.save()
    await responseCacheInvalidate('lostfound:list')
    res.json({ item })
  } catch (err) { next(err) }
})

// ─── POST /api/lostfound/:id/report ──────────
router.post('/:id/report', protect,
  [body('reason').trim().notEmpty().isLength({ max: 500 })], validate,
  async (req, res, next) => {
    try {
      const item = await LostFound.findById(req.params.id).select('_id reporter reports reportCount')
      if (!item) return res.status(404).json({ error: 'Not found' })
      if (item.reporter.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot report your own item' })
      }

      const alreadyReported = item.reports?.some((r) => r.reporter?.toString() === req.user._id.toString())
      if (alreadyReported) return res.status(409).json({ error: 'You have already reported this item' })

      item.reports.push({ reporter: req.user._id, reason: req.body.reason })
      item.reportCount = (item.reportCount || 0) + 1
      await item.save()
      await responseCacheInvalidate('lostfound:list')
      res.json({ message: 'Report submitted' })
    } catch (err) { next(err) }
  }
)

module.exports = router
