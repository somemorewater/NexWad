/* eslint-disable no-console */
const path = require('path')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { Chat, Message } = require('../models/Chat')

function extractObjectId(value) {
  if (!value) return null
  if (value instanceof mongoose.Types.ObjectId) return value

  if (typeof value === 'object') {
    const raw = value._id || value.id
    if (raw instanceof mongoose.Types.ObjectId) return raw
    if (typeof raw === 'string') return extractObjectId(raw)
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
    return new mongoose.Types.ObjectId(trimmed)
  }

  const match = trimmed.match(/[a-fA-F0-9]{24}/)
  if (match) {
    return new mongoose.Types.ObjectId(match[0])
  }

  return null
}

function normalizeIdArray(values = []) {
  const out = []
  const seen = new Set()
  for (const value of values) {
    const oid = extractObjectId(value)
    if (!oid) continue
    const key = oid.toString()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(oid)
  }
  return out
}

async function fixCollection(model, field) {
  let scanned = 0
  let updated = 0

  const cursor = model.find({ [field]: { $exists: true, $ne: [] } }).cursor()
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned += 1
    const original = doc[field] || []
    const normalized = normalizeIdArray(original)
    const sameLength = normalized.length === original.length
    const sameValues = sameLength && normalized.every((id, i) => id.toString() === original[i]?.toString?.())
    if (sameValues) continue

    doc[field] = normalized
    await doc.save()
    updated += 1
  }

  return { scanned, updated }
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  await connectDB()

  const chatResult = await fixCollection(Chat, 'deletedBy')
  const messageResult = await fixCollection(Message, 'deletedBy')

  console.log(`Chats scanned: ${chatResult.scanned}, fixed: ${chatResult.updated}`)
  console.log(`Messages scanned: ${messageResult.scanned}, fixed: ${messageResult.updated}`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Cleanup deletedBy failed:', err)
  mongoose.disconnect()
})
