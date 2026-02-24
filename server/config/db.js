const mongoose = require('mongoose')
const logger = require('../utils/logger')

let isConnected = false

async function connectDB() {
  if (isConnected) return

  if (!process.env.MONGODB_URI) {
    logger.error('MongoDB connection failed: MONGODB_URI is not set')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    logger.info(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
  isConnected = false
})

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected')
  isConnected = true
})

module.exports = { connectDB }
