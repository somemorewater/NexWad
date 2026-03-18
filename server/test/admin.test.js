const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader } = require('./helpers')

describe('Admin', () => {
  it('rejects non-admin access to stats', async () => {
    const user = await createUser({ role: 'buyer', verified: true })
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', authHeader(user))

    expect(res.status).toBe(403)
  })

  it('allows admin access to stats', async () => {
    const admin = await createUser({ role: 'admin', verified: true, email: 'admin@example.com' })
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', authHeader(admin))

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('totalUsers')
  })
})
