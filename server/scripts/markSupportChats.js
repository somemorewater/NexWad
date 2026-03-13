/* eslint-disable no-console */
const path = require('path')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { Chat } = require('../models/Chat')
const User = require('../models/User')

const SUPPORT_ROLES = new Set(['cs', 'moderator', 'admin', 'superadmin', 'super_admin'])

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  await connectDB()

  const supportUsers = await User.find({ role: { $in: Array.from(SUPPORT_ROLES) } }).select('_id').lean()
  const supportIds = supportUsers.map(u => u._id)
  if (!supportIds.length) {
    console.log('No support users found. Nothing to update.')
    await mongoose.disconnect()
    return
  }

  const result = await Chat.updateMany(
    { participants: { $in: supportIds } },
    { $set: { support: true } }
  )

  console.log(`Marked support chats: ${result.modifiedCount || 0}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Mark support chats failed:', err)
  mongoose.disconnect()
})

