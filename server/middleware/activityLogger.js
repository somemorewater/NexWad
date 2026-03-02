const { queueUserLog, buildRequestLog } = require('../utils/userLogs')

function shouldSkipRoute(path = '') {
  return path.startsWith('/api/health')
    || path.startsWith('/api/user-logs')
}

function logRequestActivity(req, res, next) {
  res.on('finish', () => {
    if (!req.user?._id) return
    if (shouldSkipRoute(req.originalUrl || '')) return

    queueUserLog(buildRequestLog(req, res, {
      action: 'api_request',
      category: 'system',
      metadata: {
        statusCode: res.statusCode,
      },
    }))
  })

  next()
}

module.exports = {
  logRequestActivity,
}
