const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { totp } = require('otplib')
const User = require('../models/User')
const { protect } = require('../middleware/auth')
const { signupRules, loginRules, validate, body } = require('../middleware/validate')
const { storeOTP, verifyOTP, blacklistToken } = require('../utils/redis')
const { sendEmail } = require('../config/email')
const logger = require('../utils/logger')

totp.options = { step: 600, digits: 6 } // 10 min OTP

// ─── Token factory ────────────────────────────
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user
  delete obj.password
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  return obj
}

// ─── POST /api/auth/signup ────────────────────
router.post('/signup', signupRules, validate, async (req, res, next) => {
  try {
    const { name, username, email, password, matricNumber, department, level, phone, otp, _step } = req.body
    const normalizedMatric = String(matricNumber || '').trim().toUpperCase()
    const matricValue = normalizedMatric || undefined
    const departmentValue = String(department || '').trim() || undefined
    const levelValue = String(level || '').trim() || undefined

    // Step 1: initiate — create unverified user and send OTP
    if (_step === 'initiate' || !_step) {
      const normalizedUsername = String(username || '').trim().toLowerCase()
      const existing = await User.findOne({
        $or: [
          { email },
          ...(matricValue ? [{ matricNumber: matricValue }] : []),
          ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
        ],
      })
      if (existing && existing.verified) {
        if (existing.username === normalizedUsername && normalizedUsername) {
          return res.status(409).json({ error: 'Username already exists' })
        }
        return res.status(409).json({ error: 'Account already exists' })
      }
      if (existing && existing.email !== email) {
        if (existing.username === normalizedUsername && normalizedUsername) {
          return res.status(409).json({ error: 'Username already exists' })
        }
        return res.status(409).json({ error: 'Matric number already in use' })
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await storeOTP(email, code)
      await sendEmail(email, 'otp', { name, otp: code })

      // Create/update pending user through document save so password hashing hooks run.
      const pendingUser = existing && existing.email === email ? existing : new User({ email })
      pendingUser.name = name
      pendingUser.username = normalizedUsername || undefined
      pendingUser.email = email
      pendingUser.password = password
      pendingUser.matricNumber = matricValue
      pendingUser.department = departmentValue
      pendingUser.level = levelValue
      pendingUser.phone = phone
      pendingUser.verified = false
      await pendingUser.save()

      return res.status(200).json({ message: 'OTP sent to your email', email })
    }

    // Step 2: verify OTP and activate
    if (_step === 'verify') {
      if (!otp) return res.status(400).json({ error: 'OTP required' })
      const valid = await verifyOTP(email, otp)
      if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' })

      const user = await User.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      )
      if (!user) return res.status(404).json({ error: 'User not found. Please sign up again.' })

      await sendEmail(email, 'welcome', { name: user.name })
      const token = signToken(user._id)
      logger.info(`New user registered: ${email}`)
      return res.status(201).json({ token, user: sanitizeUser(user) })
    }

    return res.status(400).json({ error: 'Invalid signup step' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/login ─────────────────────
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const identifier = String(email || '').trim()
    const normalizedUsername = identifier.toLowerCase()

    // Accept email, username, or matric number
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: normalizedUsername },
        { matricNumber: identifier.toUpperCase() },
      ],
    }).select('+password')

    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (user.banned) return res.status(403).json({ error: 'Account suspended. Contact support.' })
    if (!user.verified) return res.status(403).json({ error: 'Please verify your email first' })

    let match = false
    if (user.password?.startsWith?.('$2')) {
      match = await user.comparePassword(password)
    } else if (user.password === password) {
      // Legacy fix: upgrade accidentally stored plaintext passwords.
      const hashed = await bcrypt.hash(password, 12)
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashed, lastPasswordChange: new Date() } }
      )
      match = true
    }
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user._id)
    logger.info(`User logged in: ${user.email}`)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/auth/me ─────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: sanitizeUser(req.user) })
})

// ─── POST /api/auth/logout ────────────────────
router.post('/logout', protect, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) await blacklistToken(token)
  res.json({ message: 'Logged out' })
})

// ─── POST /api/auth/forgot-password ──────────
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()], validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

      const token = crypto.randomBytes(32).toString('hex')
      user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
      user.passwordResetExpires = new Date(Date.now() + 3600000) // 1 hour
      await user.save({ validateBeforeSave: false })

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`
      await sendEmail(user.email, 'passwordReset', { name: user.name, resetUrl })
      res.json({ message: 'If that email exists, a reset link has been sent.' })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /api/auth/reset-password ───────────
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })], validate,
  async (req, res, next) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex')
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      })
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' })

      user.password = req.body.password
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      user.lastPasswordChange = new Date()
      await user.save()

      res.json({ message: 'Password reset successful' })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /api/auth/resend-otp ────────────────
router.post('/resend-otp',
  [body('email').isEmail().normalizeEmail()], validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email, verified: false })
      if (!user) return res.status(404).json({ error: 'No pending account found' })
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await storeOTP(req.body.email, code)
      await sendEmail(req.body.email, 'otp', { name: user.name, otp: code })
      res.json({ message: 'OTP resent' })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
