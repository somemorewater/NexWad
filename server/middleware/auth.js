const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ─── Require authentication ───────────────────
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ error: 'User not found' })
    if (user.banned) return res.status(403).json({ error: 'Account suspended' })

    // Check subscription expiry and apply dynamic access rules.
    await user.checkSubscription()

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' })
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' })
    next(err)
  }
}

// ─── Optional auth (attaches user if token present) ──
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return next()
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    next()
  } catch {
    next()
  }
}

// ─── Role-based access ────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

const requireAdmin = requireRole('admin', 'superadmin', 'super_admin')
const requireModerator = requireRole('moderator', 'admin', 'superadmin', 'super_admin')
const requireCS = requireRole('cs', 'moderator', 'admin', 'superadmin', 'super_admin')

// ─── Verified user ────────────────────────────
function requireVerified(req, res, next) {
  if (!req.user?.verified) {
    return res.status(403).json({ error: 'Please verify your email first' })
  }
  next()
}

module.exports = { protect, optionalAuth, requireRole, requireAdmin, requireModerator, requireCS, requireVerified }
