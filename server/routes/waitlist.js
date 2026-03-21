const express = require('express')
const router = express.Router()
const WaitlistEntry = require('../models/WaitlistEntry')
const { body, validate } = require('../middleware/validate')

const isWaitlistEnabled = () => String(process.env.WAITLIST ?? 'true').toLowerCase() !== 'false'

router.post('/',
  [
    body('fullName').trim().notEmpty().isLength({ max: 120 }),
    body('email').isEmail().normalizeEmail(),
    body('campus').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
    body('role').optional().isIn(['student', 'seller', 'community', 'brand']),
    body('source').optional().trim().isLength({ max: 120 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (!isWaitlistEnabled()) {
        return res.status(403).json({ error: 'Waitlist is currently inactive' })
      }

      const { fullName, email, campus, role, source } = req.body

      const existing = await WaitlistEntry.findOne({ email })
      if (existing) {
        existing.fullName = fullName || existing.fullName
        if (campus !== undefined) existing.campus = campus
        if (role) existing.role = role
        if (source) existing.source = source
        await existing.save()
        return res.json({ entry: existing, created: false, message: 'Already on the waitlist.' })
      }

      const entry = await WaitlistEntry.create({
        fullName,
        email,
        campus,
        role,
        source,
      })

      res.status(201).json({ entry, created: true })
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Email already on waitlist' })
      }
      next(err)
    }
  }
)

module.exports = router
