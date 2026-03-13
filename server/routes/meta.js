const express = require('express')
const Post = require('../models/Post')
const User = require('../models/User')

const router = express.Router()

const DEFAULT_IMAGE = '/nexwad-social.png'
const DEFAULT_TITLE = 'NexWAD'
const DEFAULT_DESCRIPTION = 'NexWAD - Buy, sell, find lost items, and connect with campus.'

function absoluteUrl(req, input) {
  const base = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`
  if (!input) return base
  if (/^https?:\/\//i.test(input)) return input
  return `${base}${input.startsWith('/') ? '' : '/'}${input}`
}

function sanitizeText(input = '', max = 200) {
  const text = String(input || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function renderMetaHtml({ title, description, image, url, type = 'website' }) {
  const metaTitle = title || DEFAULT_TITLE
  const metaDescription = description || DEFAULT_DESCRIPTION
  const metaImage = image || DEFAULT_IMAGE
  const metaUrl = url || ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${metaTitle}</title>
    <meta name="description" content="${metaDescription}" />

    <meta property="og:title" content="${metaTitle}" />
    <meta property="og:description" content="${metaDescription}" />
    <meta property="og:image" content="${metaImage}" />
    <meta property="og:url" content="${metaUrl}" />
    <meta property="og:type" content="${type}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metaTitle}" />
    <meta name="twitter:description" content="${metaDescription}" />
    <meta name="twitter:image" content="${metaImage}" />
  </head>
  <body>
    <noscript>NexWAD</noscript>
  </body>
</html>`
}

router.get('/social/post/:postId', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name avatar bio')
      .lean()
    if (!post) return next()

    const title = post.author?.name ? `${post.author.name} on NexWAD` : DEFAULT_TITLE
    const description = sanitizeText(post.content || `Post from ${post.author?.name || 'NexWAD'}`, 200)
    const image = post.image || post.author?.avatar || DEFAULT_IMAGE
    const url = absoluteUrl(req, req.originalUrl)

    return res.status(200).send(renderMetaHtml({
      title,
      description,
      image: absoluteUrl(req, image),
      url,
      type: 'article',
    }))
  } catch (err) { next(err) }
})

router.get('/profile/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name username avatar bio department')
      .lean()
    if (!user) return next()

    const title = user.name ? `${user.name} on NexWAD` : DEFAULT_TITLE
    const description = sanitizeText(user.bio || `${user.name || 'User'} · ${user.department || 'AFIT Community'}`, 200)
    const image = user.avatar || DEFAULT_IMAGE
    const url = absoluteUrl(req, req.originalUrl)

    return res.status(200).send(renderMetaHtml({
      title,
      description,
      image: absoluteUrl(req, image),
      url,
      type: 'profile',
    }))
  } catch (err) { next(err) }
})

router.get('/:username', async (req, res, next) => {
  try {
    const username = String(req.params.username || '').trim().toLowerCase()
    const reserved = new Set([
      'login', 'signup', 'marketplace', 'social', 'lost-found', 'search', 'chat',
      'notifications', 'profile', 'admin', 'moderator', 'cs', 'legal',
      'terms-and-conditions', 'privacy-policy', 'cookies-policy', 'data-retention-policy',
      'home', 'dashboard', 'banned', 'cs-chat', 'profile', 'settings',
    ])
    if (!username || reserved.has(username)) return next()

    const user = await User.findOne({ username }).select('name username avatar bio department').lean()
    if (!user) return next()

    const title = user.name ? `${user.name} on NexWAD` : DEFAULT_TITLE
    const description = sanitizeText(user.bio || `${user.name || 'User'} · ${user.department || 'AFIT Community'}`, 200)
    const image = user.avatar || DEFAULT_IMAGE
    const url = absoluteUrl(req, req.originalUrl)

    return res.status(200).send(renderMetaHtml({
      title,
      description,
      image: absoluteUrl(req, image),
      url,
      type: 'profile',
    }))
  } catch (err) { next(err) }
})

module.exports = router

