const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const { protect, optionalAuth } = require('../middleware/auth')
const { handleUpload, uploadPostImage, deleteAsset } = require('../utils/cloudinary')
const { paginationRules, validate, body } = require('../middleware/validate')
const { buildPostFeed } = require('../utils/feedAlgorithm')
const { notifyLike } = require('../utils/notifications')
const { invalidateFeedCache, getCachedFeed, cacheFeed } = require('../utils/redis')

// ─── GET /api/posts/feed ─────────────────────
router.get('/feed', protect, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const p = parseInt(page); const l = parseInt(limit)

    // Cache only page 1
    if (p === 1) {
      const cached = await getCachedFeed(req.user._id)
      if (cached) return res.json(cached)
    }

    const result = await buildPostFeed(req.user, { page: p, limit: l })

    if (p === 1) await cacheFeed(req.user._id, result, 90) // 90s TTL

    res.json(result)
  } catch (err) { next(err) }
})

// ─── GET /api/posts/:id ──────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar subscription department')
      .populate('comments.author', 'name avatar')
    if (!post || post.removed) return res.status(404).json({ error: 'Post not found' })
    post.views += 1
    post.save()
    res.json({ post })
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
    const populated = await post.populate('author', 'name avatar subscription department')
    await invalidateFeedCache(req.user._id)
    res.status(201).json({ post: { ...populated.toObject(), isLiked: false, likeCount: 0, commentCount: 0 } })
  } catch (err) { next(err) }
})

// ─── DELETE /api/posts/:id ───────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.author.toString() !== req.user._id.toString() && !['admin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    if (post.imagePublicId) await deleteAsset(post.imagePublicId)
    await post.deleteOne()
    await invalidateFeedCache(req.user._id)
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
      ).populate('comments.author', 'name avatar')
      if (!post) return res.status(404).json({ error: 'Not found' })
      const comment = post.comments[post.comments.length - 1]
      res.status(201).json({ comment, commentCount: post.comments.length })
    } catch (err) { next(err) }
  }
)

// ─── DELETE /api/posts/:postId/comments/:commentId ─
router.delete('/:postId/comments/:commentId', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Not found' })
    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    if (comment.author.toString() !== req.user._id.toString() && !['admin', 'super_admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    comment.deleteOne()
    await post.save()
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
