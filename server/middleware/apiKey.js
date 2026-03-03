const logger = require('../utils/logger')

function parseApiKeys(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
}

function shouldSkipPath(pathname, skipPaths) {
  return skipPaths.some((basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`))
}

function enforceApiKey(options = {}) {
  const enabled = String(options.enabled ?? process.env.API_KEY_PROTECTION ?? 'true').toLowerCase() !== 'false'
  const configuredKeys = parseApiKeys(options.keys ?? process.env.API_KEYS ?? process.env.API_KEY)
  const skipPaths = options.skipPaths || ['/health', '/pins/paystack-webhook', '/pins/credits/paystack-webhook']
  const publicGetPaths = options.publicGetPaths || [
    '/listings',
    '/posts/feed',
    '/posts',
    '/lostfound',
    '/users/search',
    '/users',
  ]

  return (req, res, next) => {
    if (!enabled) return next()
    if (req.method === 'OPTIONS') return next()
    if (shouldSkipPath(req.path, skipPaths)) return next()
    if (req.method === 'GET' && shouldSkipPath(req.path, publicGetPaths)) return next()

    if (configuredKeys.length === 0) {
      logger.error('API key protection is enabled but API_KEYS is not configured')
      return res.status(503).json({ error: 'Server API key protection is not configured' })
    }

    const providedKey = String(req.get('x-api-key') || '').trim()
    if (!providedKey || !configuredKeys.includes(providedKey)) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    return next()
  }
}

module.exports = { enforceApiKey }
