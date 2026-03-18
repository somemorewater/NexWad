const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader } = require('./helpers')

describe('Support Chat', () => {
  it('creates, accepts, sends, and ends support chat', async () => {
    const buyer = await createUser({ role: 'buyer', verified: true })
    const csAgent = await createUser({ role: 'cs', email: 'cs@example.com', verified: true })

    const createRes = await request(app)
      .post('/api/chat/support')
      .set('Authorization', authHeader(buyer))

    expect(createRes.status).toBe(201)
    const chatId = createRes.body.chat._id

    const firstMessage = await request(app)
      .post(`/api/chat/${chatId}/messages`)
      .set('Authorization', authHeader(buyer))
      .send({ text: 'Need help' })

    expect(firstMessage.status).toBe(201)

    const inboxRes = await request(app)
      .get('/api/chat/support/inbox')
      .set('Authorization', authHeader(csAgent))

    expect(inboxRes.status).toBe(200)
    expect(inboxRes.body.chats.length).toBeGreaterThan(0)

    const acceptRes = await request(app)
      .post(`/api/chat/support/${chatId}/accept`)
      .set('Authorization', authHeader(csAgent))

    expect(acceptRes.status).toBe(200)

    const messageRes = await request(app)
      .post(`/api/chat/${chatId}/messages`)
      .set('Authorization', authHeader(csAgent))
      .send({ text: 'Hello' })

    expect(messageRes.status).toBe(201)

    const endRes = await request(app)
      .post(`/api/chat/support/${chatId}/end`)
      .set('Authorization', authHeader(csAgent))

    expect(endRes.status).toBe(200)
  })
})
