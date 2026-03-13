const express = require('express')
const { protect, requireAdmin } = require('../middleware/auth')
const UserLog = require('../models/UserLog')
const { createUserLog, getClientIp } = require('../utils/userLogs')

const router = express.Router()

function requireAnalyticsKey(req, res, next) {
  const provided = req.get('x-api-key') || ''
  const expected = process.env.USER_LOGS_API_KEY || ''
  if (!expected) return res.status(500).json({ error: 'Analytics key not configured' })
  if (!provided || provided !== expected) return res.status(401).json({ error: 'Invalid API key' })
  next()
}

router.get('/me', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, action } = req.query
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1)
    const parsedLimit = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 50))
    const skip = (parsedPage - 1) * parsedLimit

    const query = { user: req.user._id }
    if (category) query.category = String(category)
    if (action) query.action = String(action)

    const [logs, total] = await Promise.all([
      UserLog.find(query).sort({ occurredAt: -1 }).skip(skip).limit(parsedLimit).lean(),
      UserLog.countDocuments(query),
    ])

    res.json({ logs, total, hasMore: total > skip + logs.length, page: parsedPage })
  } catch (err) { next(err) }
})

router.post('/event', protect, async (req, res, next) => {
  try {
    const {
      action,
      category,
      entityType,
      entityId,
      route,
      metadata,
      occurredAt,
    } = req.body || {}

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'action is required' })
    }

    const log = await createUserLog({
      user: req.user._id,
      action: action.trim().slice(0, 120),
      category: ['auth', 'navigation', 'click', 'listing', 'post', 'lostfound', 'chat', 'profile', 'system', 'other'].includes(category)
        ? category
        : 'other',
      entityType: entityType ? String(entityType).slice(0, 80) : undefined,
      entityId: entityId ? String(entityId).slice(0, 120) : undefined,
      source: 'client',
      route: route ? String(route).slice(0, 260) : req.originalUrl,
      method: req.method,
      statusCode: 200,
      ip: getClientIp(req),
      userAgent: req.get('user-agent') || '',
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    })

    res.status(201).json({ ok: true, id: log?._id })
  } catch (err) { next(err) }
})

router.get('/admin', protect, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 100, userId, category, action, groupByUser } = req.query
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1)
    const parsedLimit = Math.min(300, Math.max(1, Number.parseInt(limit, 10) || 100))
    const skip = (parsedPage - 1) * parsedLimit
    const shouldGroupByUser = String(groupByUser).toLowerCase() === 'true'

    const query = {}
    if (userId) query.user = userId
    if (category) query.category = String(category)
    if (action) query.action = String(action)

    if (shouldGroupByUser) {
      const [groups, groupedTotals] = await Promise.all([
        UserLog.aggregate([
          { $match: query },
          { $sort: { occurredAt: -1 } },
          {
            $group: {
              _id: '$user',
              totalEvents: { $sum: 1 },
              lastOccurredAt: { $first: '$occurredAt' },
              lastAction: { $first: '$action' },
              lastCategory: { $first: '$category' },
            },
          },
          { $sort: { lastOccurredAt: -1 } },
          { $skip: skip },
          { $limit: parsedLimit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
              as: 'user',
            },
          },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              user: {
                $ifNull: [{ $arrayElemAt: ['$user', 0] }, null],
              },
              totalEvents: 1,
              lastOccurredAt: 1,
              lastAction: 1,
              lastCategory: 1,
            },
          },
        ]),
        UserLog.aggregate([
          { $match: query },
          { $group: { _id: '$user' } },
          { $count: 'total' },
        ]),
      ])

      const totalGroups = groupedTotals[0]?.total || 0
      return res.json({
        grouped: true,
        groups,
        total: totalGroups,
        hasMore: totalGroups > skip + groups.length,
        page: parsedPage,
      })
    }

    const [logs, total] = await Promise.all([
      UserLog.find(query)
        .populate('user', 'name email role')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      UserLog.countDocuments(query),
    ])

    res.json({ logs, total, hasMore: total > skip + logs.length, page: parsedPage })
  } catch (err) { next(err) }
})

// ─── GET /api/user-logs/analytics ─────────────
router.get('/analytics', requireAnalyticsKey, async (req, res, next) => {
  try {
    const { page = 1, limit = 200, userId, category, action, source, entityType, from, to } = req.query
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1)
    const parsedLimit = Math.min(1000, Math.max(1, Number.parseInt(limit, 10) || 200))
    const skip = (parsedPage - 1) * parsedLimit

    const query = {}
    if (userId) query.user = userId
    if (category) query.category = String(category)
    if (action) query.action = String(action)
    if (source) query.source = String(source)
    if (entityType) query.entityType = String(entityType)
    if (from || to) {
      query.occurredAt = {}
      if (from) query.occurredAt.$gte = new Date(from)
      if (to) query.occurredAt.$lte = new Date(to)
    }

    const [logs, total] = await Promise.all([
      UserLog.find(query)
        .populate('user', 'name email role')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      UserLog.countDocuments(query),
    ])

    res.json({ logs, total, hasMore: total > skip + logs.length, page: parsedPage })
  } catch (err) { next(err) }
})

// ─── GET /api/user-logs/analytics/summary ─────
router.get('/analytics/summary', requireAnalyticsKey, async (req, res, next) => {
  try {
    const { from, to } = req.query
    const match = {}
    if (from || to) {
      match.occurredAt = {}
      if (from) match.occurredAt.$gte = new Date(from)
      if (to) match.occurredAt.$lte = new Date(to)
    }

    const summary = await UserLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: '$category', action: '$action' },
          count: { $sum: 1 },
          lastOccurredAt: { $max: '$occurredAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 200 },
    ])

    res.json({ summary })
  } catch (err) { next(err) }
})

module.exports = router
