/* eslint-disable no-console */
const path = require('path')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { Chat, Message } = require('../models/Chat')
const User = require('../models/User')

const SUPPORT_ROLES = new Set(['cs', 'moderator', 'admin', 'superadmin', 'super_admin'])

function getParticipantKey(participants = []) {
  const ids = participants.map((id) => id.toString()).sort()
  return ids.join('|')
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  await connectDB()

  const chats = await Chat.find({ participants: { $size: 2 } }).lean()
  if (!chats.length) {
    console.log('No chats found.')
    await mongoose.disconnect()
    return
  }

  const userIds = Array.from(new Set(chats.flatMap(c => c.participants.map(id => id.toString()))))
  const users = await User.find({ _id: { $in: userIds } }).select('_id role').lean()
  const roleByUser = new Map(users.map(u => [u._id.toString(), u.role]))

  const groups = new Map()
  for (const chat of chats) {
    const key = getParticipantKey(chat.participants)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(chat)
  }

  let mergedGroups = 0
  let removedChats = 0
  let movedMessages = 0

  for (const [key, group] of groups.entries()) {
    if (group.length < 2) continue

    // Pick canonical chat by latest activity
    const sorted = group.slice().sort((a, b) => {
      const aTime = new Date(a.lastActivity || a.updatedAt || 0).getTime()
      const bTime = new Date(b.lastActivity || b.updatedAt || 0).getTime()
      return bTime - aTime
    })
    const canonical = sorted[0]
    const dupes = sorted.slice(1)

    // Merge dupes into canonical
    let mergedUnread = { ...(canonical.unreadCounts || {}) }
    let mergedDeletedBy = new Set((canonical.deletedBy || []).map(id => id.toString()))
    let chosenListing = canonical.listing || null
    let latestListingTime = new Date(canonical.lastActivity || canonical.updatedAt || 0).getTime()

    for (const dup of dupes) {
      const updated = await Message.updateMany(
        { chat: dup._id },
        { $set: { chat: canonical._id } }
      )
      movedMessages += updated.modifiedCount || 0

      // Merge unread counts
      if (dup.unreadCounts) {
        for (const [uid, count] of Object.entries(dup.unreadCounts)) {
          mergedUnread[uid] = (mergedUnread[uid] || 0) + (Number(count) || 0)
        }
      }

      // Merge deletedBy
      if (Array.isArray(dup.deletedBy)) {
        dup.deletedBy.forEach(id => mergedDeletedBy.add(id.toString()))
      }

      // Choose most recent listing context
      const dupTime = new Date(dup.lastActivity || dup.updatedAt || 0).getTime()
      if (dup.listing && dupTime >= latestListingTime) {
        chosenListing = dup.listing
        latestListingTime = dupTime
      }

      await Chat.deleteOne({ _id: dup._id })
      removedChats += 1
    }

    // Recompute last message + activity
    const lastMsg = await Message.findOne({ chat: canonical._id })
      .sort({ createdAt: -1 })
      .select('_id createdAt')
      .lean()

    await Chat.updateOne(
      { _id: canonical._id },
      {
        $set: {
          unreadCounts: mergedUnread,
          deletedBy: Array.from(mergedDeletedBy),
          listing: chosenListing || undefined,
          lastMessage: lastMsg?._id || canonical.lastMessage || undefined,
          lastActivity: lastMsg?.createdAt || canonical.lastActivity || undefined,
        },
      }
    )

    mergedGroups += 1
  }

  console.log(`Deduped groups: ${mergedGroups}`)
  console.log(`Removed chats: ${removedChats}`)
  console.log(`Moved messages: ${movedMessages}`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Dedupe failed:', err)
  mongoose.disconnect()
})

