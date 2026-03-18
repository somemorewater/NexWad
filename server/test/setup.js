const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '1d'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.NODE_ENV = 'test'

jest.mock('../config/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}))

const mockResponseCache = new Map()
const mockGenericCache = new Map()

jest.mock('../utils/redis', () => ({
  storeOTP: jest.fn().mockResolvedValue(),
  verifyOTP: jest.fn().mockResolvedValue(true),
  deleteOTP: jest.fn().mockResolvedValue(),
  cacheFeed: jest.fn().mockResolvedValue(),
  getCachedFeed: jest.fn().mockResolvedValue(null),
  invalidateFeedCache: jest.fn().mockResolvedValue(),
  cacheSet: jest.fn(async (key, value) => {
    mockGenericCache.set(key, value)
  }),
  cacheGet: jest.fn(async (key) => mockGenericCache.get(key) || null),
  cacheDel: jest.fn(async (key) => {
    mockGenericCache.delete(key)
  }),
  responseCacheKey: (parts = []) => {
    const normalized = Array.isArray(parts) ? parts : [parts]
    return `rcache:${normalized.map((part) => String(part || '').trim()).join(':')}`
  },
  responseCacheSet: jest.fn(async (key, value) => {
    mockResponseCache.set(key, value)
  }),
  responseCacheGet: jest.fn(async (key) => mockResponseCache.get(key) || null),
  responseCacheRemember: jest.fn(async ({ compute }) => {
    const value = await compute()
    return { value, hit: false }
  }),
  responseCacheInvalidate: jest.fn().mockResolvedValue(),
  blacklistToken: jest.fn().mockResolvedValue(),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}))

jest.mock('../utils/cloudinary', () => ({
  handleUpload: () => (req, res, next) => {
    req.files = req.files || [{ path: 'https://example.com/mock.jpg', filename: 'mock-public-id' }]
    req.file = req.file || { path: 'https://example.com/mock.jpg', filename: 'mock-public-id', mimetype: 'image/jpeg' }
    next()
  },
  uploadListingImages: jest.fn(),
  uploadPostImage: jest.fn(),
  uploadAvatar: jest.fn(),
  uploadChatMedia: jest.fn(),
  deleteAsset: jest.fn(),
}))

jest.mock('../socket', () => ({
  emitToUser: jest.fn(),
  initSocket: jest.fn(),
}))

jest.mock('../utils/jobQueue', () => ({
  enqueueBackgroundJob: jest.fn(async (name, job) => job()),
}))

let mongo = null

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1', port: 27017 },
  })
  await mongoose.connect(mongo.getUri(), { dbName: 'nexwad_test' })
})

afterEach(async () => {
  if (mongoose.connection?.db) {
    const collections = await mongoose.connection.db.collections()
    for (const collection of collections) {
      await collection.deleteMany({})
    }
  }
  jest.clearAllMocks()
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})
