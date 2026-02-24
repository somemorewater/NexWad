/**
 * NexWAD Client-side Feed Algorithm
 * Mirrors the backend scoring for optimistic rendering.
 * Real ranking is authoritative from the server.
 */

// Weights
const W = {
  like: 3,
  comment: 5,
  share: 7,
  save: 4,
  view: 0.5,
  premium: 20,
  sellerGold: 8,
  sellerSilver: 4,
  recencyDecayHalfLife: 12, // hours
}

/**
 * Calculate an engagement score for a single post/listing.
 * @param {Object} item
 * @returns {number} score
 */
export function scoreItem(item) {
  const {
    likes = 0,
    comments = 0,
    shares = 0,
    saves = 0,
    views = 0,
    isPremium = false,
    sellerTier = 'basic', // 'basic' | 'silver' | 'gold'
    createdAt,
  } = item

  // Engagement score
  const engagement =
    likes * W.like +
    comments * W.comment +
    shares * W.share +
    saves * W.save +
    views * W.view

  // Recency decay: exponential half-life
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  const recencyScore = Math.pow(0.5, ageHours / W.recencyDecayHalfLife) * 50

  // Boost
  const premiumBoost = isPremium ? W.premium : 0
  const tierBoost =
    sellerTier === 'gold' ? W.sellerGold :
    sellerTier === 'silver' ? W.sellerSilver : 0

  return engagement + recencyScore + premiumBoost + tierBoost
}

/**
 * Sort an array of feed items by score descending.
 * Inserts sponsored items at fixed intervals.
 * @param {Array} items
 * @param {Array} sponsored - premium items to inject
 * @returns {Array}
 */
export function rankFeed(items = [], sponsored = []) {
  const scored = items.map(item => ({ ...item, _score: scoreItem(item) }))
  scored.sort((a, b) => b._score - a._score)

  // Inject sponsored every 5 organic items
  const result = []
  let sponsoredIdx = 0
  for (let i = 0; i < scored.length; i++) {
    if (i > 0 && i % 5 === 0 && sponsoredIdx < sponsored.length) {
      result.push({ ...sponsored[sponsoredIdx++], _sponsored: true })
    }
    result.push(scored[i])
  }

  return result
}

/**
 * Deduplicate items by _id.
 * Useful when paginating and a new premium item appears in earlier position.
 */
export function deduplicateFeed(items = []) {
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item._id)) return false
    seen.add(item._id)
    return true
  })
}
