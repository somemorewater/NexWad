const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const path = require('path')

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// ─── Security ─────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Global rate limiter ──────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || (isProd ? 100 : 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})
app.use('/api/', limiter)

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || (isProd ? 20 : 200),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
})
app.use('/api/auth/', authLimiter)

// ─── Body parsing ─────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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
app.use('/api/admin', require('../routes/admin'))

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
