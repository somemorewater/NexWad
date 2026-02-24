const { createClient } = require('redis')
const logger = require('../utils/logger')

let client = null

async function connectRedis() {
  try {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    client.on('error', (err) => logger.error('Redis error:', err))
    client.on('reconnecting', () => logger.warn('Redis reconnecting…'))
    await client.connect()
    logger.info('Redis connected')
    return client
  } catch (err) {
    logger.error('Redis connection failed:', err.message)
    // Non-fatal — app continues without Redis (degraded mode)
  }
}

function getRedis() {
  return client
}

module.exports = { connectRedis, getRedis }
