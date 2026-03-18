const request = require('supertest')
const app = require('../config/server')

describe('Pins', () => {
  it('returns pin plans', async () => {
    const res = await request(app).get('/api/pins/plans')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.plans)).toBe(true)
  })
})
