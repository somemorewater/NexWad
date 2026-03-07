const { getRedis } = require('../config/redis')
const logger = require('./logger')

const OTP_PREFIX = 'otp:'
const FEED_CACHE_PREFIX = 'feed:'
const SESSION_PREFIX = 'session:'
const RESPONSE_CACHE_PREFIX = 'rcache:'
const RESPONSE_CACHE_INDEX_PREFIX = 'rcacheidx:'

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

// ─── HTTP response cache ──────────────────────

function responseCacheKey(parts = []) {
  const normalized = Array.isArray(parts) ? parts : [parts]
  return `${RESPONSE_CACHE_PREFIX}${normalized.map((part) => String(part || '').trim()).join(':')}`
}

async function responseCacheSet(key, value, ttlSeconds = 120, namespaces = []) {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.setEx(key, ttlSeconds, JSON.stringify(value))
    const tags = Array.isArray(namespaces) ? namespaces.filter(Boolean) : [namespaces].filter(Boolean)
    if (tags.length) {
      await Promise.all(tags.map(async (namespace) => {
        const indexKey = `${RESPONSE_CACHE_INDEX_PREFIX}${namespace}`
        await redis.sAdd(indexKey, key)
        // Keep index sets alive slightly longer than data keys to allow invalidation.
        await redis.expire(indexKey, Math.max(ttlSeconds * 4, 600))
      }))
    }
  } catch (err) {
    logger.error('responseCacheSet error:', err)
  }
}

async function responseCacheGet(key) {
  try {
    const redis = getRedis()
    if (!redis) return null
    const v = await redis.get(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

async function responseCacheInvalidate(namespaces = []) {
  try {
    const redis = getRedis()
    if (!redis) return
    const tags = Array.isArray(namespaces) ? namespaces.filter(Boolean) : [namespaces].filter(Boolean)
    if (!tags.length) return

    for (const namespace of tags) {
      const indexKey = `${RESPONSE_CACHE_INDEX_PREFIX}${namespace}`
      const keys = await redis.sMembers(indexKey)
      if (keys?.length) await redis.del(keys)
      await redis.del(indexKey)
    }
  } catch (err) {
    logger.error('responseCacheInvalidate error:', err)
  }
}

async function responseCacheRemember({ key, ttlSeconds = 120, namespaces = [], compute }) {
  const cached = await responseCacheGet(key)
  if (cached !== null) return { value: cached, hit: true }
  const value = await compute()
  await responseCacheSet(key, value, ttlSeconds, namespaces)
  return { value, hit: false }
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
  responseCacheKey, responseCacheSet, responseCacheGet, responseCacheRemember, responseCacheInvalidate,
  blacklistToken, isTokenBlacklisted,
}
