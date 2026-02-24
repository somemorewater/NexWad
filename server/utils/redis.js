const { getRedis } = require('../config/redis')
const logger = require('./logger')

const OTP_PREFIX = 'otp:'
const FEED_CACHE_PREFIX = 'feed:'
const SESSION_PREFIX = 'session:'

// ─── OTP ──────────────────────────────────────

async function storeOTP(email, otp) {
  try {
    const redis = getRedis()
    if (!redis) return
    const expirySeconds = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60
    await redis.setEx(`${OTP_PREFIX}${email}`, expirySeconds, otp)
  } catch (err) {
    logger.error('storeOTP error:', err)
  }
}

async function verifyOTP(email, otp) {
  try {
    const redis = getRedis()
    if (!redis) return true // Skip in degraded mode
    const stored = await redis.get(`${OTP_PREFIX}${email}`)
    if (!stored) return false
    if (stored !== otp.toString()) return false
    await redis.del(`${OTP_PREFIX}${email}`)
    return true
  } catch (err) {
    logger.error('verifyOTP error:', err)
    return false
  }
}

async function deleteOTP(email) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.del(`${OTP_PREFIX}${email}`)
  } catch { /* silent */ }
}

// ─── Feed Cache ───────────────────────────────

async function cacheFeed(userId, data, ttlSeconds = 120) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.setEx(`${FEED_CACHE_PREFIX}${userId}`, ttlSeconds, JSON.stringify(data))
  } catch (err) {
    logger.error('cacheFeed error:', err)
  }
}

async function getCachedFeed(userId) {
  try {
    const redis = getRedis()
    if (!redis) return null
    const data = await redis.get(`${FEED_CACHE_PREFIX}${userId}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

async function invalidateFeedCache(userId) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.del(`${FEED_CACHE_PREFIX}${userId}`)
  } catch { /* silent */ }
}

// ─── Generic cache ────────────────────────────

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch { /* silent */ }
}

async function cacheGet(key) {
  try {
    const redis = getRedis()
    if (!redis) return null
    const v = await redis.get(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

async function cacheDel(key) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.del(key)
  } catch { /* silent */ }
}

// ─── Token blacklist (for logout) ─────────────
async function blacklistToken(token, expirySeconds = 7 * 24 * 3600) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.setEx(`bl:${token}`, expirySeconds, '1')
  } catch { /* silent */ }
}

async function isTokenBlacklisted(token) {
  try {
    const redis = getRedis()
    if (!redis) return false
    return Boolean(await redis.get(`bl:${token}`))
  } catch {
    return false
  }
}

module.exports = {
  storeOTP, verifyOTP, deleteOTP,
  cacheFeed, getCachedFeed, invalidateFeedCache,
  cacheSet, cacheGet, cacheDel,
  blacklistToken, isTokenBlacklisted,
}
