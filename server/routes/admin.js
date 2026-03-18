const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')
const Subscription = require('../models/Subscription')
const SellerApplication = require('../models/SellerApplication')
const AdminLog = require('../models/AdminLog')
const UserLog = require('../models/UserLog')
const { protect, requireAdmin, requireModerator, requireCS, requireAnalytics } = require('../middleware/auth')
const { body, validate, paginationRules } = require('../middleware/validate')
const { sendEmail } = require('../config/email')
const { notify } = require('../utils/notifications')
const logger = require('../utils/logger')

// ─── Audit log helper ─────────────────────────
async function auditLog(req, action, target, details, targetId = null, targetModel = null) {
  try {
    await AdminLog.create({
      admin: req.user._id,
      action,
      target,
      targetId,
      targetModel,
      details,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
  } catch (err) {
    logger.error('Audit log failed:', err)
  }
}

async function issueWarning(req, userId, reason) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { warningsCount: 1 },
      $push: { warnings: { reason, warnedBy: req.user._id, createdAt: new Date() } },
    },
    { new: true }
  ).select('-password -warnings')
  if (!user) return null

  notify(user._id.toString(), {
    type: 'warning',
    title: 'Account warning',
    body: reason || 'Your account received a warning from moderation.',
    link: '/profile/account-manager',
  }).catch(() => {})

  return user
}

// All admin routes require authentication
router.use(protect)

// ─── GET /api/admin/stats ─────────────────────
router.get('/stats', requireAnalytics, async (req, res, next) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfRange = new Date(startOfToday)
    const rangeDays = 7
    startOfRange.setDate(startOfRange.getDate() - (rangeDays - 1))
    const perfWindowHours = 24
    const perfWindowStart = new Date(now.getTime() - (perfWindowHours * 60 * 60 * 1000))

    const buildDailySeries = async (Model, days, extraMatch = {}) => {
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const raw = await Model.aggregate([
        { $match: { createdAt: { $gte: startOfRange, $lte: end }, ...extraMatch } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      const map = new Map(raw.map(row => [row._id, row.count]))
      const series = []
      for (let i = 0; i < days; i += 1) {
        const day = new Date(startOfRange)
        day.setDate(startOfRange.getDate() + i)
        const key = day.toISOString().slice(0, 10)
        series.push({ date: key, count: map.get(key) || 0 })
      }
      return series
    }

    const buildPerformanceSeries = async (days) => {
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const raw = await UserLog.aggregate([
        {
          $match: {
            source: 'server',
            action: 'api_request',
            occurredAt: { $gte: startOfRange, $lte: end },
            'metadata.durationMs': { $type: 'number' },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' },
            },
            avgDurationMs: { $avg: '$metadata.durationMs' },
            total: { $sum: 1 },
            errors: {
              $sum: {
                $cond: [
                  { $gte: ['$statusCode', 400] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      const map = new Map(raw.map(row => [row._id, row]))
      const series = []
      for (let i = 0; i < days; i += 1) {
        const day = new Date(startOfRange)
        day.setDate(startOfRange.getDate() + i)
        const key = day.toISOString().slice(0, 10)
        const row = map.get(key)
        series.push({
          date: key,
          avgDurationMs: row?.avgDurationMs || 0,
          errorRate: row?.total ? (row.errors / row.total) : 0,
        })
      }
      return series
    }

    const [
      totalUsers, activeListings, openReports, premiumUsers,
      activeLostFound, totalRevenue, recentUsers,
      currentActiveUsers, dailyActiveUsers,
      totalPosts, postsToday,
      planCounts, postsDailySeries, listingsDailySeries,
      performanceDailySeries,
    ] = await Promise.all([
      User.countDocuments({ verified: true }),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ reportCount: { $gt: 0 }, status: 'active' }),
      User.countDocuments({ 'subscription.active': true }),
      LostFound.countDocuments({ status: 'active' }),
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]).then(r => r[0]?.total || 0),
      User.find({ verified: true })
        .sort({ createdAt: -1 }).limit(10)
        .select('name email department subscription createdAt'),
      User.countDocuments({ verified: true, online: true }),
      User.countDocuments({ verified: true, lastSeen: { $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) } }),
      Post.countDocuments({}),
      Post.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.aggregate([
        { $match: { verified: true } },
        {
          $group: {
            _id: { $ifNull: ['$subscription.plan', 'basic'] },
            count: { $sum: 1 },
          },
        },
      ]),
      buildDailySeries(Post, rangeDays),
      buildDailySeries(Listing, rangeDays),
      buildPerformanceSeries(rangeDays),
    ])

    const planBreakdown = planCounts.reduce((acc, row) => {
      acc[row._id] = row.count
      return acc
    }, {})
    const totalListingsInRange = listingsDailySeries.reduce((acc, row) => acc + row.count, 0)
    const avgListingsPerDay = rangeDays ? (totalListingsInRange / rangeDays) : 0

    const perfMatch = {
      source: 'server',
      action: 'api_request',
      occurredAt: { $gte: perfWindowStart },
      'metadata.durationMs': { $type: 'number' },
    }

    const [perfAgg, perfDurations, slowRoutes] = await Promise.all([
      UserLog.aggregate([
        { $match: perfMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgDurationMs: { $avg: '$metadata.durationMs' },
            errorCount: {
              $sum: {
                $cond: [
                  { $gte: ['$statusCode', 400] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      UserLog.find(perfMatch, { 'metadata.durationMs': 1, _id: 0 })
        .sort({ 'metadata.durationMs': 1 })
        .limit(5000)
        .lean(),
      UserLog.aggregate([
        { $match: perfMatch },
        {
          $group: {
            _id: { route: '$route', method: '$method' },
            avgDurationMs: { $avg: '$metadata.durationMs' },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgDurationMs: -1 } },
        { $limit: 5 },
      ]),
    ])

    const durations = perfDurations.map(d => d?.metadata?.durationMs || 0).filter(n => typeof n === 'number')
    const percentile = (arr, p) => {
      if (!arr.length) return 0
      const idx = Math.min(arr.length - 1, Math.ceil(p * arr.length) - 1)
      return arr[idx]
    }
    const perfSummary = perfAgg[0] || { total: 0, avgDurationMs: 0, errorCount: 0 }
    const performanceSummary = {
      windowHours: perfWindowHours,
      totalRequests: perfSummary.total || 0,
      avgDurationMs: perfSummary.avgDurationMs || 0,
      p95DurationMs: percentile(durations, 0.95),
      p99DurationMs: percentile(durations, 0.99),
      errorRate: perfSummary.total ? (perfSummary.errorCount / perfSummary.total) : 0,
      slowestRoutes: slowRoutes.map(row => ({
        route: row?._id?.route || '',
        method: row?._id?.method || '',
        avgDurationMs: row?.avgDurationMs || 0,
        count: row?.count || 0,
      })),
    }

    res.json({
      totalUsers, activeListings, openReports, premiumUsers,
      activeLostFound, totalRevenue, recentUsers,
      currentActiveUsers, dailyActiveUsers,
      totalPosts, postsToday,
      planBreakdown,
      avgListingsPerDay,
      postsDailySeries,
      listingsDailySeries,
      performanceSummary,
      performanceDailySeries,
    })
  } catch (err) { next(err) }
})

// All other admin routes require at minimum CS role
router.use(requireCS)

// ─── GET /api/admin/users ─────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 30, role, banned } = req.query
    const query = { verified: true }
    if (q) query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { matricNumber: { $regex: q, $options: 'i' } },
    ]
    if (role) query.role = role
    if (banned !== undefined) query.banned = banned === 'true'

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [users, total] = await Promise.all([
      User.find(query).select('-password -warnings').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ])
    res.json({ users, total, hasMore: total > skip + users.length })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/users/:id/role ───────────
router.put('/users/:id/role', requireAdmin,
  [body('role').isIn(['buyer', 'seller', 'user', 'cs', 'moderator', 'admin', 'superadmin', 'super_admin', 'developer'])], validate,
  async (req, res, next) => {
    try {
      const isSuperAdmin = ['superadmin', 'super_admin'].includes(req.user.role)
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Only super admin can change roles' })
      }
      const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password')
      if (!user) return res.status(404).json({ error: 'User not found' })
      await auditLog(req, 'CHANGE_ROLE', `User:${user.email}`, `Role changed to ${req.body.role}`, user._id, 'User')
      res.json({ user })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/admin/seller-applications ──────
router.get('/seller-applications', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 30 } = req.query
    const query = status ? { status } : {}
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [applications, total] = await Promise.all([
      SellerApplication.find(query)
        .populate('user', 'name email role buyerType sellerTier')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SellerApplication.countDocuments(query),
    ])
    res.json({ applications, total, hasMore: total > skip + applications.length })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/seller-applications/:id/approve ──
router.put('/seller-applications/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const application = await SellerApplication.findById(req.params.id).populate('user')
    if (!application) return res.status(404).json({ error: 'Application not found' })
    if (application.status !== 'pending') return res.status(400).json({ error: 'Application is not pending' })

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
    const tier = application.plan === 'seller_elite' ? 'elite'
      : application.plan === 'seller_pro' ? 'pro'
        : 'basic'

    await Subscription.updateMany(
      { user: application.user._id, status: 'active' },
      { status: 'cancelled', cancelledAt: now, cancelReason: 'Seller plan approved' }
    )

    const sub = await Subscription.create({
      user: application.user._id,
      plan: application.plan,
      price: application.amount,
      currency: application.currency,
      status: 'active',
      startDate: now,
      expiresAt,
      paymentReference: application.paymentReference,
      paymentMethod: application.paymentMethod,
      paymentGateway: 'manual-approval',
    })

    const user = await User.findByIdAndUpdate(
      application.user._id,
      {
        role: 'seller',
        buyerType: 'regular',
        sellerTier: tier,
        subscriptionStatus: 'active',
        subscriptionExpiry: expiresAt,
        'subscription.plan': application.plan,
        'subscription.expiresAt': expiresAt,
        'subscription.active': true,
      },
      { new: true }
    ).select('-password')

    application.status = 'approved'
    application.approvedAt = now
    application.expiresAt = expiresAt
    application.approvedBy = req.user._id
    await application.save()

    await auditLog(
      req,
      'APPROVE_SELLER_APPLICATION',
      `SellerApplication:${application._id}`,
      `Approved ${application.plan} for ${user.email}`,
      application._id,
      'SellerApplication'
    )

    await sendEmail(user.email, 'sellerApplicationApproved', {
      name: user.name,
      plan: application.plan,
      expiresAt,
    })

    res.json({ application, user, subscription: sub })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/seller-applications/:id/reject ───
router.put('/seller-applications/:id/reject', requireAdmin,
  [body('reason').optional().isLength({ max: 500 })], validate,
  async (req, res, next) => {
    try {
      const application = await SellerApplication.findById(req.params.id).populate('user')
      if (!application) return res.status(404).json({ error: 'Application not found' })
      if (application.status !== 'pending') return res.status(400).json({ error: 'Application is not pending' })

      application.status = 'rejected'
      application.rejectionReason = req.body.reason || 'Application rejected by admin'
      application.approvedBy = req.user._id
      await application.save()

      await User.findByIdAndUpdate(application.user._id, {
        role: 'buyer',
        sellerTier: undefined,
        subscriptionStatus: 'none',
      })

      await auditLog(
        req,
        'REJECT_SELLER_APPLICATION',
        `SellerApplication:${application._id}`,
        application.rejectionReason,
        application._id,
        'SellerApplication'
      )

      res.json({ application, message: 'Seller application rejected' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/admin/users/:id/ban ───────────
router.post('/users/:id/ban', requireModerator,
  [body('reason').notEmpty()], validate,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: true, banReason: req.body.reason },
        { new: true }
      ).select('-password')
      if (!user) return res.status(404).json({ error: 'User not found' })

      // Also pause their listings
      await Listing.updateMany({ seller: req.params.id }, { status: 'paused' })

      await auditLog(req, 'BAN_USER', `User:${user.email}`, req.body.reason, user._id, 'User')
      res.json({ user })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/admin/users/:id/warn ──────────
router.post('/users/:id/warn', requireModerator,
  [body('reason').trim().notEmpty().isLength({ max: 500 })], validate,
  async (req, res, next) => {
    try {
      const user = await issueWarning(req, req.params.id, req.body.reason)
      if (!user) return res.status(404).json({ error: 'User not found' })

      await auditLog(req, 'WARN_USER', `User:${user.email}`, req.body.reason, user._id, 'User')
      res.json({ user, warningCount: user.warningsCount })
    } catch (err) { next(err) }
  }
)

// ─── DELETE /api/admin/users/:id/ban ─────────
router.delete('/users/:id/ban', requireModerator, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: false, banReason: undefined },
      { new: true }
    ).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Restore their active listings
    await Listing.updateMany({ seller: req.params.id, status: 'paused' }, { status: 'active' })

    await auditLog(req, 'UNBAN_USER', `User:${user.email}`, 'User unbanned', user._id, 'User')
    res.json({ user })
  } catch (err) { next(err) }
})

// ─── GET /api/admin/listings ──────────────────
router.get('/listings', async (req, res, next) => {
  try {
    const { page = 1, limit = 30, status, category, reported } = req.query
    const query = {}
    if (status) query.status = status
    if (category) query.category = category
    if (reported === 'true') query.reportCount = { $gt: 0 }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('seller', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Listing.countDocuments(query),
    ])
    res.json({ listings, total, hasMore: total > skip + listings.length })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/listings/:id/feature ─────
router.put('/listings/:id/feature', requireModerator,
  [body('featured').isBoolean()], validate,
  async (req, res, next) => {
    try {
      const listing = await Listing.findByIdAndUpdate(
        req.params.id,
        {
          isPremium: req.body.featured,
          premiumUntil: req.body.featured ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null,
        },
        { new: true }
      )
      if (!listing) return res.status(404).json({ error: 'Not found' })
      await auditLog(req, req.body.featured ? 'FEATURE_LISTING' : 'UNFEATURE_LISTING', `Listing:${listing.title}`, '', listing._id, 'Listing')
      res.json({ listing })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/admin/reports ───────────────────
router.get('/reports', requireModerator, async (req, res, next) => {
  try {
    const { status = 'open', page = 1, limit = 30 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Aggregate reports from listings, posts, lostfound, and users
    const [listingReports, postReports, lostFoundReports, userReports] = await Promise.all([
      Listing.find({ reportCount: { $gt: 0 }, ...(status === 'open' ? { status: 'active' } : {}) })
        .populate('seller', 'name').populate('reports.reporter', 'name')
        .sort({ reportCount: -1 }).skip(skip).limit(parseInt(limit)),
      Post.find({ reportCount: { $gt: 0 }, removed: status !== 'open' })
        .populate('author', 'name').populate('reports.reporter', 'name')
        .sort({ reportCount: -1 }).skip(skip).limit(parseInt(limit)),
      LostFound.find({ reportCount: { $gt: 0 }, ...(status === 'open' ? { status: { $ne: 'resolved' } } : {}) })
        .populate('reporter', 'name').populate('reports.reporter', 'name')
        .sort({ reportCount: -1 }).skip(skip).limit(parseInt(limit)),
      User.find({ reportCount: { $gt: 0 }, ...(status === 'open' ? { banned: false } : {}) })
        .populate('reports.reporter', 'name')
        .sort({ reportCount: -1 }).skip(skip).limit(parseInt(limit)),
    ])

    const reports = [
      ...listingReports.flatMap(l => l.reports.map(r => ({
        _id: r._id, targetType: 'listing', targetName: l.title,
        targetId: l._id, reporter: r.reporter, reason: r.reason,
        createdAt: r.createdAt, status: l.status === 'removed' ? 'resolved' : 'open',
      }))),
      ...postReports.flatMap(p => p.reports.map(r => ({
        _id: r._id, targetType: 'post', targetName: p.content?.slice(0, 60),
        targetId: p._id, reporter: r.reporter, reason: r.reason,
        createdAt: r.createdAt, status: p.removed ? 'resolved' : 'open',
      }))),
      ...lostFoundReports.flatMap((item) => item.reports.map((r) => ({
        _id: r._id, targetType: 'lostfound', targetName: item.title,
        targetId: item._id, reporter: r.reporter, reason: r.reason,
        ownerId: item.reporter?._id || item.reporter,
        createdAt: r.createdAt, status: item.status === 'resolved' ? 'resolved' : 'open',
      }))),
      ...userReports.flatMap((target) => target.reports.map((r) => ({
        _id: r._id, targetType: 'user', targetName: target.name,
        targetId: target._id, reporter: r.reporter, reason: r.reason,
        ownerId: target._id,
        createdAt: r.createdAt, status: target.banned ? 'resolved' : 'open',
      }))),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ reports })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/reports/:id ───────────────
router.put('/reports/:id', requireModerator,
  [body('action').isIn(['dismiss', 'remove', 'warn'])], validate,
  async (req, res, next) => {
    try {
      const { action, targetType, targetId } = req.body
      if (action === 'remove') {
        if (targetType === 'listing') await Listing.findByIdAndUpdate(targetId, { status: 'removed' })
        if (targetType === 'post') await Post.findByIdAndUpdate(targetId, { removed: true })
        if (targetType === 'lostfound') await LostFound.findByIdAndUpdate(targetId, { status: 'resolved', resolvedAt: new Date() })
        if (targetType === 'user') await User.findByIdAndUpdate(targetId, { banned: true, banReason: 'Removed via report action' })
      }

      if (action === 'warn') {
        let warningTargetId = null
        if (targetType === 'listing') {
          const listing = await Listing.findById(targetId).select('seller')
          warningTargetId = listing?.seller
        } else if (targetType === 'post') {
          const post = await Post.findById(targetId).select('author')
          warningTargetId = post?.author
        } else if (targetType === 'lostfound') {
          const item = await LostFound.findById(targetId).select('reporter')
          warningTargetId = item?.reporter
        } else if (targetType === 'user') {
          warningTargetId = targetId
        }

        if (!warningTargetId) return res.status(404).json({ error: 'Warning target not found' })
        await issueWarning(req, warningTargetId, 'A moderation report was confirmed on your account.')
      }
      await auditLog(req, `REPORT_${action.toUpperCase()}`, `${targetType}:${targetId}`, `Action: ${action}`, targetId, targetType)
      res.json({ message: `Report ${action}d` })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/admin/logs ──────────────────────
router.get('/logs', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, adminId } = req.query
    const query = adminId ? { admin: adminId } : {}
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate('admin', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      AdminLog.countDocuments(query),
    ])
    res.json({ logs, total, hasMore: total > skip + logs.length })
  } catch (err) { next(err) }
})

module.exports = router
