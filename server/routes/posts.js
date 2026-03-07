const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadPostImage, deleteAsset } = require('../utils/cloudinary')
const { paginationRules, validate, body } = require('../middleware/validate')
const { buildPostFeed } = require('../utils/feedAlgorithm')
const { notifyLike } = require('../utils/notifications')
const { invalidateFeedCache, getCachedFeed, cacheFeed, responseCacheKey, responseCacheRemember, responseCacheInvalidate } = require('../utils/redis')
const { attachPinsAndSort } = require('../utils/pins')
const { queueUserLog, buildRequestLog } = require('../utils/userLogs')
const { serializeQuery } = require('../utils/cacheKey')

// ─── GET /api/posts/feed ─────────────────────
router.get('/feed', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q } = req.query
    const p = parseInt(page); const l = parseInt(limit)

    const queryText = String(q || '').trim()
    if (queryText) {
      const escaped = queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      const matchedAuthors = await User.find({
        banned: false,
        $or: [{ name: regex }, { username: regex }],
      }).select('_id').limit(40).lean()
      const authorIds = matchedAuthors.map((u) => u._id)

      const searchQuery = { removed: false, $or: [{ content: regex }] }
      if (authorIds.length) searchQuery.$or.push({ author: { $in: authorIds } })

      const skip = (p - 1) * l
      const [posts, total] = await Promise.all([
        Post.find(searchQuery)
          .populate('author', 'name username avatar subscription department role buyerType sellerTier')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .lean(),
        Post.countDocuments(searchQuery),
      ])

      const viewerId = req.user?._id?.toString()
      const normalized = posts.map((post) => ({
        ...post,
        isLiked: viewerId ? post.likes?.some((id) => id.toString() === viewerId) : false,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
      }))
      const { items, pinnedItems } = await attachPinsAndSort(normalized, 'post')
      return res.json({ posts: items, pinnedPosts: pinnedItems, hasMore: total > skip + posts.length, page: p })
    }

    // Personalized feed for authenticated users
    if (req.user && p === 1) {
      const cached = await getCachedFeed(req.user._id)
      if (cached) return res.json(cached)
    }

    if (req.user) {
      const result = await buildPostFeed(req.user, { page: p, limit: l })
      const { items, pinnedItems } = await attachPinsAndSort(result.posts || [], 'post')
      const payload = { ...result, posts: items, pinnedPosts: pinnedItems }
      if (p === 1) await cacheFeed(req.user._id, payload, 90) // 90s TTL
      return res.json(payload)
    }

    const cacheKey = responseCacheKey(['posts', 'public-feed', serializeQuery(req.query)])
    const { value } = await responseCacheRemember({
      key: cacheKey,
      ttlSeconds: 60,
      namespaces: ['posts:public-feed'],
      compute: async () => {
        const skip = (p - 1) * l
        const [posts, total] = await Promise.all([
          Post.find({ removed: false })
            .populate('author', 'name username avatar subscription department role buyerType sellerTier')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
          Post.countDocuments({ removed: false }),
        ])
        const result = {
          posts: posts.map((post) => ({
            ...post,
            isLiked: false,
            likeCount: post.likes?.length || 0,
            commentCount: post.comments?.length || 0,
          })),
          hasMore: total > skip + posts.length,
          page: p,
        }

        const { items, pinnedItems } = await attachPinsAndSort(result.posts || [], 'post')
        return { ...result, posts: items, pinnedPosts: pinnedItems }
      },
    })
    res.json(value)
  } catch (err) { next(err) }
})

// ─── GET /api/posts/:id ──────────────────────
router.get('/mine', protect, async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id, removed: false })
      .populate('author', 'name username avatar subscription department role buyerType sellerTier')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const normalized = posts.map((post) => ({
      ...post,
      isLiked: false,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
    }))
    const { items, pinnedItems } = await attachPinsAndSort(normalized, 'post')
    res.json({ posts: items, pinnedPosts: pinnedItems, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/posts/user/:id ─────────────────
router.get('/user/:id', optionalAuth, async (req, res, next) => {
  try {
    const identifier = String(req.params.id || '').trim()
    const userQuery = []
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) userQuery.push({ _id: identifier })
    userQuery.push({ username: identifier.toLowerCase() })

    const user = await User.findOne({ $or: userQuery, banned: false }).select('_id').lean()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const posts = await Post.find({ author: user._id, removed: false })
      .populate('author', 'name username avatar subscription department role buyerType sellerTier')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const viewerId = req.user?._id?.toString()
    const normalized = posts.map((post) => ({
      ...post,
      isLiked: viewerId ? post.likes?.some((id) => id.toString() === viewerId) : false,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
    }))
    const { items, pinnedItems } = await attachPinsAndSort(normalized, 'post')
    res.json({ posts: items, pinnedPosts: pinnedItems, hasMore: false })
  } catch (err) { next(err) }
})

// ─── GET /api/posts/:id ──────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username avatar subscription department role buyerType sellerTier')
      .populate('comments.author', 'name username avatar')
    if (!post || post.removed) return res.status(404).json({ error: 'Post not found' })
    const viewerId = req.user?._id?.toString()
    const authorId = post.author?._id?.toString()
    if (!viewerId || viewerId !== authorId) {
      post.views += 1
      post.save()
    }
    if (req.user?._id) {
      queueUserLog(buildRequestLog(req, res, {
        action: 'post_viewed',
        category: 'post',
        entityType: 'post',
        entityId: post._id.toString(),
        metadata: { authorId: post.author?._id?.toString?.() },
      }))
    }
    const { items } = await attachPinsAndSort([post.toObject()], 'post')
    res.json({ post: items[0] })
  } catch (err) { next(err) }
})

// ─── POST /api/posts ─────────────────────────
router.post('/', protect, handleUpload(uploadPostImage), async (req, res, next) => {
  try {
    const { content } = req.body
    if (!content?.trim() && !req.file) {
      return res.status(400).json({ error: 'Post must have content or an image' })
    }
    const post = await Post.create({
      author: req.user._id,
      content: content?.trim(),
      image: req.file?.path,
      imagePublicId: req.file?.filename,
    })
    const populated = await post.populate('author', 'name username avatar subscription department role buyerType sellerTier')
    await invalidateFeedCache(req.user._id)
    await responseCacheInvalidate('posts:public-feed')
    res.status(201).json({ post: { ...populated.toObject(), isLiked: false, likeCount: 0, commentCount: 0 } })
  } catch (err) { next(err) }
})

// ─── PUT /api/posts/:id ──────────────────────
router.put('/:id', protect, handleUpload(uploadPostImage),
  [body('content').optional().isLength({ max: 5000 })], validate,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id)
      if (!post || post.removed) return res.status(404).json({ error: 'Not found' })
      if (post.author.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'super_admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      if (req.body.content !== undefined) {
        post.content = String(req.body.content || '').trim()
      }
      const removeImage = String(req.body.removeImage || '').toLowerCase() === 'true'
      if (removeImage && post.imagePublicId) {
        await deleteAsset(post.imagePublicId)
        post.image = undefined
        post.imagePublicId = undefined
      }
      if (req.file) {
        if (post.imagePublicId) await deleteAsset(post.imagePublicId)
        post.image = req.file.path
        post.imagePublicId = req.file.filename
      }
      if (!post.content?.trim() && !post.image) {
        return res.status(400).json({ error: 'Post must have content or an image' })
      }
      await post.save()
      const populated = await post.populate('author', 'name username avatar subscription department role buyerType sellerTier')
      await invalidateFeedCache(req.user._id)
      await responseCacheInvalidate('posts:public-feed')
      res.json({
        post: {
          ...populated.toObject(),
          isLiked: false,
          likeCount: populated.likes?.length || 0,
          commentCount: populated.comments?.length || 0,
        },
      })
    } catch (err) { next(err) }
  }
)

// ─── DELETE /api/posts/:id ───────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.author.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    if (post.imagePublicId) await deleteAsset(post.imagePublicId)
    await post.deleteOne()
    await invalidateFeedCache(req.user._id)
    await responseCacheInvalidate('posts:public-feed')
    res.json({ message: 'Post deleted' })
  } catch (err) { next(err) }
})

// ─── POST /api/posts/:id/like ────────────────
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    )
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.author.toString() !== req.user._id.toString()) {
      notifyLike(post.author.toString(), req.user.name, post._id)
    }
    await responseCacheInvalidate('posts:public-feed')
    res.json({ likeCount: post.likes.length })
  } catch (err) { next(err) }
})

// ─── DELETE /api/posts/:id/like ──────────────
router.delete('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.user._id } },
      { new: true }
    )
    await responseCacheInvalidate('posts:public-feed')
    res.json({ likeCount: post?.likes.length || 0 })
  } catch (err) { next(err) }
})

// ─── POST /api/posts/:id/comments ────────────
router.post('/:id/comments', protect,
  [body('text').trim().notEmpty().isLength({ max: 1000 })], validate,
  async (req, res, next) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: { author: req.user._id, text: req.body.text } } },
        { new: true }
      ).populate('comments.author', 'name username avatar')
      if (!post) return res.status(404).json({ error: 'Not found' })
      const comment = post.comments[post.comments.length - 1]
      await responseCacheInvalidate('posts:public-feed')
      res.status(201).json({ comment, commentCount: post.comments.length })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/posts/:id/comments ─────────────
router.get('/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments.author', 'name username avatar')
    if (!post || post.removed) return res.status(404).json({ error: 'Post not found' })
    res.json({ comments: post.comments, commentCount: post.comments.length })
  } catch (err) { next(err) }
})

// ─── DELETE /api/posts/:postId/comments/:commentId ─
router.delete('/:postId/comments/:commentId', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Not found' })
    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    if (comment.author.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    comment.deleteOne()
    await post.save()
    await responseCacheInvalidate('posts:public-feed')
    res.json({ message: 'Comment deleted', commentCount: post.comments.length })
  } catch (err) { next(err) }
})

// ─── POST /api/posts/:id/report ──────────────
router.post('/:id/report', protect, async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      $push: { reports: { reporter: req.user._id, reason: req.body.reason } },
      $inc: { reportCount: 1 },
    })
    res.json({ message: 'Reported' })
  } catch (err) { next(err) }
})

module.exports = router
