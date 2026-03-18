const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader, createLostFound } = require('./helpers')
const { LOST_FOUND_CATEGORIES } = require('../constants/categories')

describe('Lost & Found', () => {
  it('creates a lost item report', async () => {
    const user = await createUser()
    const res = await request(app)
      .post('/api/lostfound')
      .set('Authorization', authHeader(user))
      .send({
        type: 'lost',
        category: LOST_FOUND_CATEGORIES[0],
        title: 'Lost Wallet',
        description: 'Black wallet',
        location: 'Library',
      })

    expect(res.status).toBe(201)
    expect(res.body.item.title).toBe('Lost Wallet')
  })

  it('claims and resolves an item', async () => {
    const { item, reporter } = await createLostFound()
    const claimer = await createUser({ email: 'claimer@example.com' })

    const claimRes = await request(app)
      .post(`/api/lostfound/${item._id}/claim`)
      .set('Authorization', authHeader(claimer))
      .send({ message: 'I found it' })

    expect(claimRes.status).toBe(200)

    const resolveRes = await request(app)
      .post(`/api/lostfound/${item._id}/resolve`)
      .set('Authorization', authHeader(reporter))

    expect(resolveRes.status).toBe(200)
    expect(resolveRes.body.item.status).toBe('resolved')
  })
})
