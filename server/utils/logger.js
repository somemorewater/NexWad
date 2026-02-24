const { createLogger, format, transports } = require('winston')
const path = require('path')

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'nexwad-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack }) =>
          `${timestamp} [${level}]: ${stack || message}`
        )
      ),
    }),
  ],
})

if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }))
  logger.add(new transports.File({ filename: 'logs/combined.log' }))
}

module.exports = logger
