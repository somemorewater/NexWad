const mongoose = require('mongoose')

function numEnv(name, fallback) {
  const val = Number(process.env[name])
  return Number.isFinite(val) ? val : fallback
}

// ─── Dynamic Weights (configurable via env) ───
const W = {
  like: numEnv('FEED_WEIGHT_LIKE', 3),
  comment: numEnv('FEED_WEIGHT_COMMENT', 5),
  share: numEnv('FEED_WEIGHT_SHARE', 7),
  view: numEnv('FEED_WEIGHT_VIEW', 0.5),
  save: numEnv('FEED_WEIGHT_SAVE', 4),
  recencyHalfLifeHours: numEnv('FEED_RECENCY_HALF_LIFE_HOURS', 12),
  followingBoost: numEnv('FEED_WEIGHT_FOLLOWING', 10),
  buyerPremiumBoost: numEnv('FEED_BOOST_BUYER_PREMIUM', 12),
  sellerTierBasicBoost: numEnv('FEED_BOOST_SELLER_BASIC', 0),
  sellerTierProBoost: numEnv('FEED_BOOST_SELLER_PRO', 8),
  sellerTierEliteBoost: numEnv('FEED_BOOST_SELLER_ELITE', 16),
}

function resolveAccessProfile(profile = {}) {
  const plan = profile.subscription?.plan || 'basic'
  const role = profile.role === 'user' ? 'buyer' : (profile.role || 'buyer')
  const buyerType = profile.buyerType || ((plan === 'premium_buyer' || plan === 'silver') ? 'premium' : 'regular')

  const sellerTier = profile.sellerTier
    || (
      plan === 'seller_elite' || plan === 'premium' ? 'elite'
        : plan === 'seller_pro' || plan === 'gold' ? 'pro'
          : plan === 'seller_basic' ? 'basic'
            : 'basic'
    )

  return { role, buyerType, sellerTier }
}

/**
 * Score a single post/listing for feed ranking.
 */
function scoreItem(item, viewerFollowing = []) {
  const likes    = item.likes?.length || item.likeCount || 0
  const comments = item.comments?.length || item.commentCount || 0
  const shares   = item.shares || 0
  const views    = item.views || 0
  const saves    = item.saves || 0

  const engagement = likes * W.like + comments * W.comment + shares * W.share + views * W.view + saves * W.save

  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3_600_000
  const recency  = Math.pow(0.5, ageHours / W.recencyHalfLifeHours) * 50

  const profile = item.seller || item.author || {}
  const access = resolveAccessProfile(profile)

  const buyerBoost = access.buyerType === 'premium' ? W.buyerPremiumBoost : 0

  const sellerBoost = access.role === 'seller'
    ? (
      access.sellerTier === 'elite' ? W.sellerTierEliteBoost
        : access.sellerTier === 'pro' ? W.sellerTierProBoost
          : W.sellerTierBasicBoost
    )
    : 0

  const authorId = (item.author || item.seller)?._id?.toString()
  const followBoost = viewerFollowing.includes(authorId) ? W.followingBoost : 0

  return engagement + recency + buyerBoost + sellerBoost + followBoost
}

/**
 * Build a paginated, ranked feed of posts for a given user.
 */
async function buildPostFeed(viewerUser, { page = 1, limit = 20 } = {}) {
  const Post = mongoose.model('Post')

  const followingIds = viewerUser.following?.map(f => f.toString()) || []

  // Fetch candidates: following + recent public posts
  const candidates = await Post.find({ removed: false })
    .populate('author', 'name avatar subscription department role buyerType sellerTier')
    .sort({ createdAt: -1 })
    .limit(200)  // score top 200 then paginate
    .lean()

  // Score + sort
  const scored = candidates
    .map(p => ({ ...p, _score: scoreItem(p, followingIds) }))
    .sort((a, b) => b._score - a._score)

  // Paginate
  const start  = (page - 1) * limit
  const slice  = scored.slice(start, start + limit)
  const hasMore = scored.length > start + limit

  // Attach viewer-specific flags
  const viewerId = viewerUser._id.toString()
  const result = slice.map(p => ({
    ...p,
    isLiked: p.likes?.some(id => id.toString() === viewerId) || false,
    likeCount: p.likes?.length || 0,
    commentCount: p.comments?.length || 0,
  }))

  return { posts: result, hasMore, page }
}

/**
 * Build a ranked listings feed.
 */
async function buildListingFeed(viewerUser, {
  page = 1, limit = 12, category, sort, q, mine, saved,
} = {}) {
  const Listing = mongoose.model('Listing')
  const User = mongoose.model('User')

  const query = { status: 'active' }
  if (category && category !== 'All') query.category = category
  if (mine) query.seller = viewerUser._id
  if (saved) {
    const user = await User.findById(viewerUser._id).select('savedListings')
    query._id = { $in: user.savedListings }
  }
  if (q) {
    const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    const sellers = await User.find({
      banned: false,
      $or: [{ name: regex }, { username: regex }],
    }).select('_id').limit(40).lean()
    const sellerIds = sellers.map((s) => s._id)
    const clauses = [
      { title: regex },
      { description: regex },
      { tags: regex },
    ]
    if (sellerIds.length) clauses.push({ seller: { $in: sellerIds } })
    query.$or = clauses
  }

  let mongoSort = { createdAt: -1 }
  if (sort === 'price_asc') mongoSort = { price: 1 }
  else if (sort === 'price_desc') mongoSort = { price: -1 }
  else if (sort === 'popular') mongoSort = { views: -1 }

  const followingIds = viewerUser.following?.map(f => f.toString()) || []
  const savedIds = viewerUser.savedListings?.map(s => s.toString()) || []

  const candidates = await Listing.find(query)
    .populate('seller', 'name avatar subscription role buyerType sellerTier')
    .sort(mongoSort)
    .limit(sort === 'newest' || sort === 'popular' ? 200 : 1000)
    .lean()

  // If default sort, apply algo ranking
  const scored = sort === 'newest' || sort === 'popular' || sort === undefined
    ? candidates
        .map(l => ({ ...l, _score: scoreItem(l, followingIds) }))
        .sort((a, b) => b._score - a._score)
    : candidates

  const start  = (page - 1) * limit
  const slice  = scored.slice(start, start + limit)
  const hasMore = scored.length > start + limit

  const viewerId = viewerUser._id.toString()
  const result = slice.map(l => ({
    ...l,
    isSaved: savedIds.includes(l._id.toString()),
  }))

  return { listings: result, hasMore, page }
}

module.exports = { scoreItem, buildPostFeed, buildListingFeed }
