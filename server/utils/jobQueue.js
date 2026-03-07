const logger = require('./logger')

const DEFAULT_CONCURRENCY = Number.parseInt(process.env.BG_QUEUE_CONCURRENCY || '2', 10)
const concurrency = Number.isFinite(DEFAULT_CONCURRENCY) && DEFAULT_CONCURRENCY > 0 ? DEFAULT_CONCURRENCY : 2

const queue = []
let activeWorkers = 0

function scheduleRun() {
  setImmediate(runQueue)
}

async function runJob(job) {
  const { name, task, retries } = job
  let attempt = 0
  // Retry transient failures for non-critical async work.
  while (attempt <= retries) {
    try {
      await task()
      return
    } catch (err) {
      attempt += 1
      if (attempt > retries) {
        logger.warn('Background job failed', { job: name, error: err?.message || String(err) })
        return
      }
    }
  }
}

async function runQueue() {
  if (activeWorkers >= concurrency) return
  if (!queue.length) return

  const job = queue.shift()
  activeWorkers += 1
  try {
    await runJob(job)
  } finally {
    activeWorkers -= 1
    if (queue.length) scheduleRun()
  }
}

function enqueueBackgroundJob(name, task, options = {}) {
  if (typeof task !== 'function') return
  const retries = Number.isInteger(options.retries) ? Math.max(0, options.retries) : 1
  queue.push({ name: String(name || 'job'), task, retries })
  scheduleRun()
}

module.exports = {
  enqueueBackgroundJob,
}
