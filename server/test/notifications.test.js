const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader } = require('./helpers')
const { cacheSet } = require('../utils/redis')

describe('Notifications', () => {
  it('returns unread count and marks all read', async () => {
    const user = await createUser({ email: 'notify@example.com', verified: true })
    await cacheSet(`notifs:${user._id}`, [
      { _id: 'n1', title: 'Test', read: false },
      { _id: 'n2', title: 'Test2', read: true },
    ])

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader(user))

    expect(res.status).toBe(200)
    expect(res.body.unreadCount).toBe(1)

    const markRes = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', authHeader(user))

    expect(markRes.status).toBe(200)
    expect(markRes.body.ok).toBe(true)
  })
})
