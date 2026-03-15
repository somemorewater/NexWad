const ALLOWED_PREFIXES = [
  '/auth',
  '/chat',
  '/health',
]

function restrictCSAccess(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase()
  if (role !== 'cs') return next()

  const path = req.path || ''
  const allowed = ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))
  if (allowed) return next()

  return res.status(403).json({
    error: 'CS accounts can only access customer service tools.',
  })
}

module.exports = { restrictCSAccess }
