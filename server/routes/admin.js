const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Listing = require('../models/Listing')
const Post = require('../models/Post')
const LostFound = require('../models/LostFound')
const Subscription = require('../models/Subscription')
const SellerApplication = require('../models/SellerApplication')
const AdminLog = require('../models/AdminLog')
const { protect, requireAdmin, requireModerator, requireCS } = require('../middleware/auth')
const { body, validate, paginationRules } = require('../middleware/validate')
const { sendEmail } = require('../config/email')
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

// All admin routes require at minimum CS role
router.use(protect)
router.use(requireCS)

// ─── GET /api/admin/stats ─────────────────────
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers, activeListings, openReports, premiumUsers,
      activeLostFound, totalRevenue, recentUsers,
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
    ])

    res.json({
      totalUsers, activeListings, openReports, premiumUsers,
      activeLostFound, totalRevenue, recentUsers,
    })
  } catch (err) { next(err) }
})

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
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ])
    res.json({ users, total, hasMore: total > skip + users.length })
  } catch (err) { next(err) }
})

// ─── PUT /api/admin/users/:id/role ───────────
router.put('/users/:id/role', requireAdmin,
  [body('role').isIn(['buyer', 'seller', 'user', 'cs', 'moderator', 'admin', 'superadmin', 'super_admin'])], validate,
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
        sellerTier: 'basic',
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

    // Aggregate reports from Listings and Posts
    const [listingReports, postReports] = await Promise.all([
      Listing.find({ reportCount: { $gt: 0 }, ...(status === 'open' ? { status: 'active' } : {}) })
        .populate('seller', 'name').populate('reports.reporter', 'name')
        .sort({ reportCount: -1 }).skip(skip).limit(parseInt(limit)),
      Post.find({ reportCount: { $gt: 0 }, removed: status !== 'open' })
        .populate('author', 'name').populate('reports.reporter', 'name')
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
