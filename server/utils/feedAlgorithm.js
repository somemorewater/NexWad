const mongoose = require('mongoose')

// ─── Weights ──────────────────────────────────
const W = {
  like: 3,
  comment: 5,
  share: 7,
  view: 0.5,
  save: 4,
  premium: 20,
  tierGold: 8,
  tierSilver: 4,
  recencyHalfLifeHours: 12,
  followingBoost: 10,
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

  const premium  = item.isPremium ? W.premium : 0

  const sellerTier = item.seller?.subscription?.plan
  const tier = sellerTier === 'premium' || sellerTier === 'gold' ? W.tierGold
    : sellerTier === 'silver' ? W.tierSilver : 0

  const authorId = (item.author || item.seller)?._id?.toString()
  const followBoost = viewerFollowing.includes(authorId) ? W.followingBoost : 0

  return engagement + recency + premium + tier + followBoost
}

/**
 * Build a paginated, ranked feed of posts for a given user.
 */
async function buildPostFeed(viewerUser, { page = 1, limit = 20 } = {}) {
  const Post = mongoose.model('Post')

  const followingIds = viewerUser.following?.map(f => f.toString()) || []

  // Fetch candidates: following + recent public posts
  const candidates = await Post.find({ removed: false })
    .populate('author', 'name avatar subscription department')
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
  if (q) query.$text = { $search: q }

  let mongoSort = { createdAt: -1 }
  if (sort === 'price_asc') mongoSort = { price: 1 }
  else if (sort === 'price_desc') mongoSort = { price: -1 }
  else if (sort === 'popular') mongoSort = { views: -1 }

  const followingIds = viewerUser.following?.map(f => f.toString()) || []
  const savedIds = viewerUser.savedListings?.map(s => s.toString()) || []

  const candidates = await Listing.find(query)
    .populate('seller', 'name avatar subscription')
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
