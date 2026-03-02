const express = require('express')
const { protect, requireAdmin } = require('../middleware/auth')
const UserLog = require('../models/UserLog')
const { createUserLog, getClientIp } = require('../utils/userLogs')

const router = express.Router()

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

module.exports = router
