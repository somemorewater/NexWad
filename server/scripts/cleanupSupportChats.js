/* eslint-disable no-console */
const path = require('path')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { Chat, Message } = require('../models/Chat')
const User = require('../models/User')

const SUPPORT_ROLES = new Set(['cs', 'moderator', 'admin', 'superadmin', 'super_admin'])

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  await connectDB()

  const supportUsers = await User.find({
    role: { $in: Array.from(SUPPORT_ROLES) },
    banned: false,
  }).select('_id').lean()

  const supportIdSet = new Set(supportUsers.map(u => String(u._id)))
  if (!supportIdSet.size) {
    console.log('No support users found. Nothing to update.')
    await mongoose.disconnect()
    return
  }

  // 1) Ensure chats with any support user are marked as support.
  const markResult = await Chat.updateMany(
    { participants: { $in: Array.from(supportIdSet) } },
    { $set: { support: true } }
  )

  // 2) Remove incorrect support flags where no support user is a participant.
  const wronglyMarked = await Chat.find({ support: true })
    .select('_id participants')
    .lean()

  const toUnmark = wronglyMarked
    .filter(c => !c.participants?.some(p => supportIdSet.has(String(p))))
    .map(c => c._id)

  let unmarkResult = { modifiedCount: 0 }
  if (toUnmark.length) {
    unmarkResult = await Chat.updateMany(
      { _id: { $in: toUnmark } },
      { $set: { support: false } }
    )
  }

  // 3) Optional: clean messages in chats that are no longer marked as support.
  // (No message mutation needed; kept as a placeholder for future migrations.)
  await Message.updateMany({}, { $set: {} })

  console.log(`Marked support chats: ${markResult.modifiedCount || 0}`)
  console.log(`Unmarked non-support chats: ${unmarkResult.modifiedCount || 0}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Cleanup support chats failed:', err)
  mongoose.disconnect()
})
