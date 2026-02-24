require('dotenv').config()
const http = require('http')
const app = require('./config/server')
const { connectDB } = require('./config/db')
const { connectRedis } = require('./config/redis')
const { initSocket } = require('./socket')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 5000

async function bootstrap() {
  // Connect datastores
  await connectDB()
  await connectRedis()

  // Create HTTP server
  const server = http.createServer(app)

  // Attach Socket.io
  initSocket(server)

  server.listen(PORT, () => {
    logger.info(`NexWAD server running on port ${PORT} [${process.env.NODE_ENV}]`)
  })

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err)
    shutdown('UNHANDLED_REJECTION')
  })
}

bootstrap()
