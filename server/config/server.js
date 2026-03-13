const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const path = require('path')
const { logRequestActivity } = require('../middleware/activityLogger')

const app = express()
const isProd = process.env.NODE_ENV === 'production'
const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

// ─── Security ─────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Read/Write rate limiting ─────────────────
const rateWindowMs = toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000)
const readLimiter = rateLimit({
  windowMs: rateWindowMs,
  // Browsing/search can trigger many GETs quickly (especially mobile guest mode).
  max: toNumber(process.env.READ_RATE_LIMIT_MAX, isProd ? 800 : 6000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET',
  message: { error: 'Too many read requests. Please try again shortly.' },
})

const writeLimiter = rateLimit({
  windowMs: rateWindowMs,
  max: toNumber(process.env.WRITE_RATE_LIMIT_MAX, toNumber(process.env.RATE_LIMIT_MAX, isProd ? 240 : 2000)),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
  message: { error: 'Too many write requests. Please try again later.' },
})
app.use('/api/', readLimiter)
app.use('/api/', writeLimiter)

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toNumber(process.env.AUTH_RATE_LIMIT_MAX, isProd ? 40 : 300),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
})
app.use('/api/auth/', authLimiter)

// ─── Body parsing ─────────────────────────────
app.use(compression())
app.use('/api/pins/paystack-webhook', express.raw({ type: 'application/json' }))
app.use('/api/pins/credits/paystack-webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(logRequestActivity)

// ─── Logging ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// ─── Routes ───────────────────────────────────
app.use('/api/auth', require('../routes/auth'))
app.use('/api/users', require('../routes/users'))
app.use('/api/posts', require('../routes/posts'))
app.use('/api/listings', require('../routes/listings'))
app.use('/api/lostfound', require('../routes/lostfound'))
app.use('/api/chat', require('../routes/chat'))
app.use('/api/subscriptions', require('../routes/subscriptions'))
app.use('/api/pins', require('../routes/pins'))
app.use('/api/user-logs', require('../routes/userLogs'))
app.use('/api/notifications', require('../routes/notifications'))
app.use('/api/admin', require('../routes/admin'))

// ─── Social preview (pre-rendered meta tags) ───
app.use('/', require('../routes/meta'))

// ─── Health check ─────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

// ─── Serve frontend in production ─────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../frontend/dist/index.html')))
}

// ─── 404 handler ──────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// ─── Global error handler ─────────────────────
app.use((err, req, res, next) => {
  const logger = require('../utils/logger')
  logger.error(`${err.status || 500} — ${err.message}`, { stack: err.stack, url: req.url })

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors })
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({ error: `${field} already exists` })
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

module.exports = app
