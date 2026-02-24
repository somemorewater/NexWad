const { createLogger, format, transports } = require('winston')
const path = require('path')

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'nexwad-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const numericKeys = Object.keys(meta).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
          const extraText = numericKeys.length ? ` ${numericKeys.map((k) => meta[k]).join('')}` : ''
          numericKeys.forEach((k) => delete meta[k])
          const hasMeta = Object.keys(meta).length > 0
          const metaText = hasMeta ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${level}]: ${stack || message}${extraText}${metaText}`
        })
      ),
    }),
  ],
})

if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }))
  logger.add(new transports.File({ filename: 'logs/combined.log' }))
}

module.exports = logger
