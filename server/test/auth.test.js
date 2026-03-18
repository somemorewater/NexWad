const request = require('supertest')
const app = require('../config/server')
const User = require('../models/User')
const { createUser, authHeader } = require('./helpers')

describe('Auth', () => {
  it('initiates signup and creates pending user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        _step: 'initiate',
        name: 'New User',
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      })

    expect(res.status).toBe(200)
    const user = await User.findOne({ email: 'newuser@example.com' })
    expect(user).toBeTruthy()
    expect(user.verified).toBe(false)
  })

  it('verifies signup with otp', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        _step: 'initiate',
        name: 'Otp User',
        username: 'otpuser',
        email: 'otpuser@example.com',
        password: 'password123',
      })

    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        _step: 'verify',
        email: 'otpuser@example.com',
        otp: '123456',
      })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.verified).toBe(true)
  })

  it('logs in verified user', async () => {
    await createUser({ email: 'login@example.com', password: 'password123', verified: true })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })

  it('logs out authenticated user', async () => {
    const user = await createUser({ email: 'logout@example.com', verified: true })
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', authHeader(user))

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/Logged out/i)
  })
})
