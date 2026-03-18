const request = require('supertest')
const app = require('../config/server')
const Listing = require('../models/Listing')
const { createUser, authHeader, createListing } = require('./helpers')

const { LISTING_CATEGORIES } = require('../constants/categories')

describe('Listings', () => {
  it('lists public listings', async () => {
    await createListing({ title: 'Public Listing' })

    const res = await request(app).get('/api/listings')
    expect(res.status).toBe(200)
    expect(res.body.listings.length).toBeGreaterThan(0)
  })

  it('creates listing for seller with images', async () => {
    const seller = await createUser({ role: 'seller', verified: true })
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', authHeader(seller))
      .send({
        title: 'New Listing',
        description: 'Great product',
        price: 1000,
        category: LISTING_CATEGORIES[0],
        condition: 'good',
      })

    expect(res.status).toBe(201)
    expect(res.body.listing.title).toBe('New Listing')
    const listing = await Listing.findById(res.body.listing._id)
    expect(listing).toBeTruthy()
  })

  it('saves and returns saved listings', async () => {
    const buyer = await createUser({ role: 'buyer', verified: true })
    const { listing } = await createListing()

    const saveRes = await request(app)
      .post(`/api/listings/${listing._id}/save`)
      .set('Authorization', authHeader(buyer))

    expect(saveRes.status).toBe(200)

    const savedRes = await request(app)
      .get('/api/listings/saved')
      .set('Authorization', authHeader(buyer))

    expect(savedRes.status).toBe(200)
    expect(savedRes.body.listings.length).toBe(1)
  })
})
