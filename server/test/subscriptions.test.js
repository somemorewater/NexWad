const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader } = require('./helpers')

describe('Subscriptions', () => {
  it('returns subscription plans', async () => {
    const res = await request(app).get('/api/subscriptions/plans')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.plans)).toBe(true)
  })

  it('returns current subscription for user', async () => {
    const user = await createUser({ role: 'buyer', verified: true })
    const res = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', authHeader(user))

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('subscription')
  })
})
