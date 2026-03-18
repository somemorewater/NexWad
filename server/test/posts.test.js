const request = require('supertest')
const app = require('../config/server')
const { createUser, authHeader, createPost } = require('./helpers')


describe('Posts', () => {
  it('returns feed posts', async () => {
    await createPost({ content: 'Feed post' })
    const res = await request(app).get('/api/posts/feed')
    expect(res.status).toBe(200)
    expect(res.body.posts.length).toBeGreaterThan(0)
  })

  it('creates a post for authenticated user', async () => {
    const user = await createUser()
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', authHeader(user))
      .send({ content: 'My post' })

    expect(res.status).toBe(201)
    expect(res.body.post.content).toBe('My post')
  })

  it('likes and comments on a post', async () => {
    const { post, author } = await createPost()
    const liker = await createUser({ email: 'liker@example.com' })

    const likeRes = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', authHeader(liker))

    expect(likeRes.status).toBe(200)
    expect(likeRes.body.likeCount).toBe(1)

    const commentRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', authHeader(author))
      .send({ text: 'Nice!' })

    expect(commentRes.status).toBe(201)
    expect(commentRes.body.comment.text).toBe('Nice!')
  })
})
