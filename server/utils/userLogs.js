const UserLog = require('../models/UserLog')
const logger = require('./logger')

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim()
  return req.ip || req.socket?.remoteAddress || ''
}

async function createUserLog(payload = {}) {
  try {
    if (!payload?.user) return null
    return await UserLog.create(payload)
  } catch (err) {
    logger.warn('Failed to write user log', { error: err?.message })
    return null
  }
}

function queueUserLog(payload = {}) {
  setImmediate(() => {
    createUserLog(payload)
  })
}

function buildRequestLog(req, res, overrides = {}) {
  return {
    user: req.user?._id,
    action: overrides.action || 'api_request',
    category: overrides.category || 'system',
    entityType: overrides.entityType,
    entityId: overrides.entityId,
    source: overrides.source || 'server',
    route: req.originalUrl,
    method: req.method,
    statusCode: res.statusCode,
    ip: getClientIp(req),
    userAgent: req.get('user-agent') || '',
    metadata: overrides.metadata || {},
    occurredAt: overrides.occurredAt || new Date(),
  }
}

module.exports = {
  createUserLog,
  queueUserLog,
  buildRequestLog,
  getClientIp,
}
