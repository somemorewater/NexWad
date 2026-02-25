const { validationResult, body, param, query } = require('express-validator')

// Run validation and return errors
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

// ─── Auth validators ──────────────────────────
const signupRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('matricNumber').optional().trim().notEmpty(),
  body('department').optional().trim(),
  body('level').optional().isIn(['100', '200', '300', '400', '500']),
]

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email required'),
  body('password').notEmpty().withMessage('Password required'),
]

// ─── Listing validators ───────────────────────
const listingRules = [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }),
  body('category').isIn(['Electronics', 'Textbooks', 'Hostel', 'Clothing', 'Food', 'Services', 'Other']).withMessage('Invalid category'),
  body('condition').optional().isIn(['new', 'excellent', 'good', 'fair']),
  body('description').optional().isLength({ max: 2000 }),
]

// ─── Post validators ──────────────────────────
const postRules = [
  body('content').optional().isLength({ max: 5000 }),
]

// ─── Pagination ───────────────────────────────
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
]

module.exports = {
  validate,
  signupRules,
  loginRules,
  listingRules,
  postRules,
  paginationRules,
  body, param, query,
}
