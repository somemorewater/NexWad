'use strict'

const crypto = require('crypto')
const http = require('http')
const https = require('https')
const sharp = require('sharp')
const QRCode = require('qrcode')
const Listing = require('../models/Listing')
const User = require('../models/User')
const { uploadImageBuffer } = require('./cloudinary')

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMENSIONS = { width: 600, height: 381 }
const MAX_FEATURED = 3
const REGEN_COOLDOWN_MS = 60_000
const ASSET_TIMEOUT_MS = 8_000

// Phone illustration avatar composite area (left panel, inside the phone screen)
// These coordinates map to the phone screen area in the 600×381 SVG
const AVATAR  = { size: 72, x: 68,  y: 108 }   // avatar circle inside phone screen
const QR      = { size: 72, x: 492, y: 290 }    // QR in bottom-right corner

// ─── Tier Styles ──────────────────────────────────────────────────────────────

const TIER_STYLES = {
  basic: {
    label: 'Basic',
    bgBase: '#060C1A', bgPanel: '#0A1020',
    headerFrom: '#0D1829', headerTo: '#0F2545',
    blob1: '#1D4ED8', blob2: '#1E40AF', blob3: '#0EA5E9',
    accent: '#3B82F6', accentAlt: '#60A5FA',
    accentGlowRgba: 'rgba(59,130,246,0.45)',
    badgeBg: 'rgba(59,130,246,0.12)', badgeBorder: 'rgba(59,130,246,0.4)',
    badgeText: '#93C5FD',
    chipBg: 'rgba(59,130,246,0.10)', chipBorder: 'rgba(59,130,246,0.35)',
    chipText: '#60A5FA',
    cardBase: '#111C30',
    priceFrom: '#1D4ED8', priceTo: '#0EA5E9',
    textPrimary: '#EFF6FF', textSecondary: '#94A3B8', textMuted: '#475569',
    priceMuted: '#64748B',
    divider: 'rgba(59,130,246,0.15)',
    footText: '#334155',
    sectionLabel: '#3B82F6',
    nexwadColor: '#3B82F6',
    avatarShine: 'rgba(255,255,255,0.18)',
    outerBorder: 'rgba(59,130,246,0.14)',
  },
  pro: {
    label: 'Pro',
    bgBase: '#08041A', bgPanel: '#0D0A22',
    headerFrom: '#110A2E', headerTo: '#1E0F4A',
    blob1: '#5B21B6', blob2: '#4C1D95', blob3: '#7C3AED',
    accent: '#8B5CF6', accentAlt: '#A78BFA',
    accentGlowRgba: 'rgba(139,92,246,0.45)',
    badgeBg: 'rgba(139,92,246,0.12)', badgeBorder: 'rgba(139,92,246,0.4)',
    badgeText: '#C4B5FD',
    chipBg: 'rgba(139,92,246,0.10)', chipBorder: 'rgba(139,92,246,0.35)',
    chipText: '#A78BFA',
    cardBase: '#160D36',
    priceFrom: '#6D28D9', priceTo: '#A78BFA',
    textPrimary: '#F5F3FF', textSecondary: '#7C6FA8', textMuted: '#4C4068',
    priceMuted: '#4C4068',
    divider: 'rgba(139,92,246,0.15)',
    footText: '#2D2540',
    sectionLabel: '#8B5CF6',
    nexwadColor: '#8B5CF6',
    avatarShine: 'rgba(255,255,255,0.18)',
    outerBorder: 'rgba(139,92,246,0.14)',
  },
  elite: {
    label: 'Elite',
    bgBase: '#0A0800', bgPanel: '#0F0D00',
    headerFrom: '#161100', headerTo: '#2C2200',
    blob1: '#B45309', blob2: '#92400E', blob3: '#D97706',
    accent: '#F59E0B', accentAlt: '#FBBF24',
    accentGlowRgba: 'rgba(245,158,11,0.45)',
    badgeBg: 'rgba(245,158,11,0.10)', badgeBorder: 'rgba(245,158,11,0.4)',
    badgeText: '#FCD34D',
    chipBg: 'rgba(245,158,11,0.08)', chipBorder: 'rgba(245,158,11,0.35)',
    chipText: '#FBBF24',
    cardBase: '#181400',
    priceFrom: '#B45309', priceTo: '#FBBF24',
    textPrimary: '#FFFBEB', textSecondary: '#92834A', textMuted: '#4A3A00',
    priceMuted: '#4A3A00',
    divider: 'rgba(245,158,11,0.15)',
    footText: '#2A2000',
    sectionLabel: '#F59E0B',
    nexwadColor: '#F59E0B',
    avatarShine: 'rgba(255,210,80,0.25)',
    outerBorder: 'rgba(245,158,11,0.14)',
  },
}

function toTierStyle(tier) {
  return TIER_STYLES[tier] ? tier : 'basic'
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function canGeneratePoster(user) {
  return user?.role === 'seller' && user?.subscription?.active === true
}

// ─── Text Utilities ───────────────────────────────────────────────────────────

function clamp(text, max) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function escapeXml(val) {
  return String(val ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

function wrapText(text, maxCharsPerLine, maxLines) {
  const words = String(text ?? '').split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    if (lines.length >= maxLines) break
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine) {
      if (current) lines.push(current)
      current = word.slice(0, maxCharsPerLine)
    } else {
      current = candidate
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

function svgMultiline({ x, y, lineHeight, lines, attrs = '' }) {
  return lines
    .map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${escapeXml(line)}</text>`)
    .join('\n')
}

// ─── Asset Utilities ──────────────────────────────────────────────────────────

function cloudinaryTransform(url, { width, height }) {
  const u = String(url ?? '').trim()
  if (!u) return ''
  if (u.includes('res.cloudinary.com') && u.includes('/upload/')) {
    return u.replace('/upload/', `/upload/f_png,q_auto:good,c_fill,w_${width},h_${height}/`)
  }
  return u
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http
    const req = client.get(url, (res) => {
      if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.setTimeout(ASSET_TIMEOUT_MS, () => req.destroy(new Error('Timeout')))
    req.on('error', reject)
  })
}

async function safeAssetBuffer(url) {
  const u = String(url ?? '').trim()
  if (!u) return null
  try {
    if (typeof fetch === 'function') {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), ASSET_TIMEOUT_MS)
      const res = await fetch(u, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    }
    return await fetchBuffer(u)
  } catch { return null }
}

// ─── Profile Link ─────────────────────────────────────────────────────────────

function profileUrl(user) {
  const base = String(process.env.CLIENT_URL ?? 'https://nexwad.com').replace(/\/+$/, '')
  return user?.username ? `${base}/${user.username}` : `${base}/profile/${user?._id ?? ''}`
}

// ─── Featured Products ────────────────────────────────────────────────────────

async function resolveFeatured(user) {
  const ids = (user.featuredProducts ?? []).slice(0, MAX_FEATURED)
  if (ids.length) {
    const docs = await Listing.find({
      _id: { $in: ids }, seller: user._id, status: 'active',
    }).select('title price images updatedAt').lean()
    const map = new Map(docs.map((d) => [String(d._id), d]))
    const ordered = ids.map((id) => map.get(String(id))).filter(Boolean)
    if (ordered.length) return ordered
  }
  return Listing.find({ seller: user._id, status: 'active' })
    .sort({ createdAt: -1 }).limit(MAX_FEATURED)
    .select('title price images updatedAt').lean()
}

// ─── Cache Signature ──────────────────────────────────────────────────────────

function buildSignature(user, featured) {
  const payload = {
    id: String(user._id), tier: String(user.sellerTier ?? 'basic'),
    name: clamp(user.name, 100), username: clamp(user.username, 40),
    bio: clamp(user.bio, 280), avatar: String(user.avatar ?? ''),
    featured: featured.map((p) => ({
      id: String(p._id), title: clamp(p.title, 100), price: p.price ?? 0,
      image: String(p.images?.[0] ?? ''),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
    })),
  }
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

// ─── SVG Defs ─────────────────────────────────────────────────────────────────

function buildDefs(s, p) {
  return `<defs>
  <linearGradient id="${p}Price" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${s.priceFrom}"/>
    <stop offset="100%" stop-color="${s.priceTo}"/>
  </linearGradient>
  <linearGradient id="${p}AccLine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${s.accent}"/>
    <stop offset="55%"  stop-color="${s.accentAlt}"/>
    <stop offset="100%" stop-color="transparent"/>
  </linearGradient>
  <radialGradient id="${p}AvGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="${s.accent}" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="${s.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="${p}AvatarShadow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${s.accent}" flood-opacity="0.4"/>
    <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/>
  </filter>
  <filter id="${p}TextShadow" x="-10%" y="-10%" width="120%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <clipPath id="${p}AvClip">
    <circle cx="${AVATAR.x + AVATAR.size / 2}" cy="${AVATAR.y + AVATAR.size / 2}" r="${AVATAR.size / 2}"/>
  </clipPath>
  <clipPath id="${p}QrClip">
    <rect x="${QR.x}" y="${QR.y}" width="${QR.size}" height="${QR.size}" rx="8"/>
  </clipPath>
  <!-- Phone screen clip: the inner screen area of the phone illustration -->
  <clipPath id="${p}PhoneScreen">
    <rect x="44" y="28" width="222" height="325" rx="14"/>
  </clipPath>
</defs>`
}

// ─── Master SVG Builder ───────────────────────────────────────────────────────
// Uses the provided 600×381 phone illustration as the base, then overlays
// dynamic seller content on top.

function buildSvg({ user, styleKey, featured }) {
  const s = TIER_STYLES[styleKey]
  const p = styleKey[0]  // 'b', 'p', or 'e' — short ID prefix

  const name       = escapeXml(clamp(user.name || 'NexWAD Seller', 26))
  const handle     = escapeXml(clamp(user.username ? `@${user.username}` : '@seller', 22))
  const bioLines   = wrapText(clamp(user.bio || 'Trusted campus seller on NexWAD.', 160), 34, 3)
  const tierLabel  = s.label.toUpperCase()
  const rating     = user.rating ? Number(user.rating).toFixed(1) : '5.0'
  const url        = escapeXml(profileUrl(user))

  // Featured product listing (up to 3, right panel)
  const featuredItems = featured.slice(0, 3)

  // Category derived from first featured product title or fallback
  const category = escapeXml(clamp(
    user.category || (featuredItems[0]?.category) || 'Campus Marketplace',
    30
  ))

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${DIMENSIONS.width}" height="${DIMENSIONS.height}"
  viewBox="0 0 ${DIMENSIONS.width} ${DIMENSIONS.height}">

${buildDefs(s, p)}

<!-- ░░░░ BASE: Original phone illustration SVG (600×381) ░░░░ -->
<g transform="scale(1)">
<!-- Background fill behind the illustration -->
<rect width="600" height="381" fill="#0a0a0a"/>

<!-- ── Original illustration paths (verbatim, scaled from 6000×3810 → 600×381) ── -->
<g transform="translate(0,381) scale(0.1,-0.1)" fill="#1a1a2e" stroke="none">
<path d="M1740 3406 c0 -2 7 -7 16 -10 8 -3 12 -2 9 4 -6 10 -25 14 -25 6z"/>
<path d="M1150 3351 c-101 -22 -177 -78 -217 -159 -27 -55 -28 -64 -31 -221
-1 -91 -4 -167 -7 -169 -10 -11 -5 -371 5 -377 6 -4 8 -15 5 -25 -4 -13 0 -17
17 -16 13 0 26 6 30 11 9 12 11 396 2 419 -3 8 -12 12 -20 9 -12 -5 -14 18
-13 147 2 138 15 230 32 214 3 -3 3 -13 0 -22 -4 -14 -3 -15 5 -2 7 9 7 18 1
26 -12 15 65 99 82 88 7 -4 9 -3 6 3 -4 6 16 21 46 34 52 24 55 24 412 24 361
0 579 -10 570 -25 -3 -5 0 -12 6 -16 8 -4 9 -3 5 4 -11 18 13 14 50 -9 52 -32
102 -103 128 -181 3 -10 1 -18 -4 -18 -6 0 -10 6 -10 14 0 22 -80 105 -122
127 -60 31 -189 41 -543 42 -344 2 -386 -3 -440 -49 -20 -17 -29 -35 -31 -66
-3 -30 -1 -39 6 -28 5 8 10 11 10 5 0 -5 -4 -16 -9 -23 -12 -19 -24 14 -15 42
6 18 5 19 -9 8 -22 -18 -39 -108 -36 -184 2 -35 0 -68 -4 -75 -4 -7 5 -26 23
-46 27 -32 28 -36 14 -48 -15 -12 -16 -11 -10 7 4 15 2 24 -9 28 -17 6 -18 -4
-5 -79 5 -29 4 -82 -1 -125 -6 -46 -6 -110 -1 -165 5 -49 11 -76 12 -60 3 28
3 27 10 -10 5 -30 7 -20 7 45 0 66 -1 75 -7 40 -3 -25 -5 31 -4 123 1 110 5
172 13 180 8 8 11 -239 9 -971 -2 -583 1 -983 6 -985 5 -2 4 -12 -2 -23 -15
-25 -14 -62 -12 429 1 281 -2 407 -9 407 -6 0 -11 5 -11 11 0 5 5 7 10 4 6 -4
10 7 10 25 0 18 -4 29 -10 25 -6 -4 -10 6 -9 22 0 25 1 26 9 8 6 -13 9 8 9 65
1 62 -2 81 -10 70 -8 -11 -8 -9 -3 10 5 14 7 34 5 45 -1 11 -6 115 -9 230 -4
116 -9 206 -12 200 -3 -5 -5 -343 -5 -750 0 -709 1 -742 19 -793 19 -50 20
-51 30 -28 l11 25 19 -26 c11 -15 13 -23 6 -18 -10 6 -12 4 -7 -8 4 -10 2 -17
-4 -17 -6 0 -9 9 -6 20 3 11 1 20 -4 20 -11 0 -12 -31 0 -48 7 -11 11 -11 23
1 12 13 17 13 34 0 13 -10 15 -14 4 -13 -27 4 -40 0 -40 -11 0 -5 5 -7 11 -3
6 3 15 0 20 -7 6 -10 9 -11 9 -1 0 6 5 12 11 12 5 0 7 -5 3 -11 -4 -7 1 -7 16
1 15 8 20 8 16 1 -4 -6 -1 -12 6 -12 41 -4 328 -3 328 1 0 3 42 5 92 4 58 -1
96 3 100 10 5 8 8 7 8 -1 0 -8 14 -13 38 -12 30 0 33 2 17 9 -19 8 -19 9 2 9
12 1 27 -7 32 -16 6 -11 11 -13 11 -5 0 7 4 10 10 7 6 -4 5 -13 -2 -25 -9 -14
-15 -16 -21 -7 -5 7 -6 3 -2 -10 4 -15 -1 -29 -14 -42 -12 -12 -17 -21 -12
-21 6 0 12 4 16 9 3 5 17 7 31 5 24 -4 25 -3 10 11 -18 19 -19 25 -7 44 10 15
38 4 62 -25 12 -16 12 -17 -1 -12 -11 4 -16 0 -17 -13 -1 -10 3 -19 8 -19 6 0
7 5 3 12 -4 6 -3 8 3 5 6 -4 9 -20 7 -37 -2 -16 1 -30 7 -30 6 0 8 -4 5 -9 -3
-5 0 -9 7 -8 35 1 46 -4 41 -18 -4 -9 0 -15 9 -15 20 0 37 75 25 108 -9 26 -2
46 14 36 5 -3 8 -15 5 -25 -3 -11 -1 -17 4 -13 5 3 9 1 9 -4 0 -6 29 -20 65
-33 35 -12 62 -25 60 -28 -2 -4 11 -6 28 -6 30 0 32 -3 33 -35 2 -74 4 -91 12
-86 5 3 9 24 10 48 2 47 18 71 31 49 5 -7 7 -21 6 -30 -2 -9 -4 -19 -4 -23 -1
-5 -9 -8 -18 -9 -16 0 -16 -1 1 -8 17 -7 18 -8 3 -14 -9 -3 -14 -13 -11 -21 7
-18 -17 -16 -40 3 -12 10 -16 11 -16 1 0 -8 -9 -11 -25 -8 -14 3 -25 1 -25 -4
0 -15 28 -20 49 -8 17 9 21 8 21 -5 0 -11 4 -13 12 -8 7 4 21 8 31 9 33 3 37
4 37 14 0 5 -8 6 -17 3 -15 -6 -14 -3 3 20 16 19 20 36 17 64 -6 54 -20 68
-46 46 -20 -18 -20 -18 -3 9 21 32 40 28 56 -12 11 -27 31 -41 54 -39 5 0 12
-3 15 -8 10 -14 89 -31 103 -22 7 5 16 3 20 -4 6 -9 8 -9 8 1 0 7 13 12 29 12
36 0 51 18 58 69 10 71 -36 134 -68 95 -10 -12 -7 -20 14 -42 53 -55 24 -102
-61 -102 -80 0 -151 20 -158 44 -4 12 -16 29 -27 39 -20 17 -21 16 -47 -8 -15
-15 -30 -21 -36 -16 -5 5 -34 16 -64 26 -79 25 -107 41 -113 65 -3 11 -4 20
-3 20 1 0 37 -15 81 -33 96 -41 132 -50 139 -38 4 5 -7 12 -24 16 -17 4 -28
10 -25 15 3 4 -4 6 -15 3 -13 -4 -20 0 -20 9 0 11 -9 13 -31 10 -23 -3 -30 -1
-24 7 4 7 9 10 11 8 6 -6 84 71 84 82 0 14 -76 24 -98 12 -11 -6 -57 -11 -102
-12 -71 -1 -84 1 -94 17 -6 11 -11 24 -11 29 0 6 -4 16 -8 22 -6 10 -2 11 20
3 15 -6 34 -13 42 -15 11 -4 11 -8 0 -23 -13 -15 -12 -16 3 -3 10 7 16 17 13
21 -3 5 4 6 15 3 11 -3 18 -8 16 -12 -2 -3 6 -6 17 -7 12 -1 38 -4 57 -8 33
-7 34 -7 16 8 -11 9 -27 16 -35 16 -9 1 -54 14 -101 30 -47 15 -87 27 -89 25
-2 -2 5 -29 14 -60 14 -43 25 -60 48 -71 27 -14 28 -17 14 -32 -15 -14 -20
-14 -43 -1 -15 8 -35 32 -45 55 -20 43 -91 379 -108 504 -9 63 -18 109 -34
176 -4 14 -36 64 -56 85 -9 10 -40 26 -68 37 -52 20 -53 20 -53 1 0 -15 7 -19
35 -19 64 0 145 -113 145 -202 0 -15 3 -29 8 -31 4 -3 7 -37 7 -75 0 -39 3
-68 7 -66 13 8 9 -21 -4 -35 -9 -9 -9 -12 -1 -7 6 3 14 -1 16 -11 3 -10 9 -29
12 -42 5 -17 4 -21 -5 -16 -9 6 -9 3 -1 -13 6 -11 11 -32 11 -46 0 -14 4 -27
10 -31 5 -3 7 -12 3 -20 -3 -8 0 -15 6 -15 6 0 11 -7 11 -15 0 -8 -6 -15 -12
-15 -9 0 -10 -2 -2 -8 12 -7 29 -52 26 -65 -1 -4 4 -20 13 -36 14 -27 13 -29
-8 -35 -12 -3 -148 -6 -302 -6 -251 0 -284 2 -321 19 -47 22 -80 59 -94 110
-7 24 -10 355 -8 1013 l3 976 -27 22 c-35 28 -35 40 0 40 l28 0 -4 69 c-6 97
16 159 75 211 26 23 60 42 82 46 20 4 210 2 423 -3 366 -11 391 -12 433 -33
24 -12 59 -40 77 -63 32 -40 33 -44 37 -151 2 -73 8 -114 16 -123 8 -7 15 -13
17 -13 2 0 1 64 -2 142 -6 160 -15 191 -76 258 -58 64 -102 82 -229 91 -156
12 -783 19 -825 10z"/>
<path d="M1240 2898 c8 -8 60 -53 115 -100 156 -134 144 -110 146 -275 1 -154
-3 -165 -53 -178 -14 -4 -41 0 -61 9 l-36 14 -3 125 c-2 69 0 123 5 120 4 -2
7 7 7 21 0 18 -18 40 -67 83 -37 32 -86 75 -110 97 -30 27 -43 34 -43 23 0 -9
7 -22 15 -29 51 -44 125 -122 125 -131 0 -8 3 -8 9 1 6 10 11 9 22 -4 10 -12
15 -55 17 -158 3 -126 6 -143 25 -163 11 -13 28 -23 36 -23 14 0 14 -2 1 -11
-12 -9 -12 -10 4 -5 11 4 35 9 55 12 64 10 71 26 71 173 l0 129 39 -5 c21 -3
47 0 57 6 13 8 15 11 4 10 -51 -5 -100 2 -100 14 0 8 -21 35 -46 60 -27 28
-43 51 -38 58 4 8 3 9 -4 5 -15 -9 -74 35 -68 51 3 7 -1 10 -8 7 -8 -3 -20 3
-27 13 -8 11 -23 23 -34 28 -16 8 -8 10 35 13 54 3 56 2 113 -52 31 -30 57
-59 57 -65 0 -5 5 -13 12 -17 7 -5 8 -2 3 7 -5 8 5 3 21 -11 16 -14 30 -28 32
-32 2 -5 7 -8 12 -8 5 0 21 -13 37 -28 l28 -28 -3 -135 c-2 -113 -5 -136 -20
-148 -15 -12 -15 -12 6 -6 16 4 22 2 22 -9 0 -17 58 -39 92 -33 65 11 71 24
73 162 1 55 3 107 3 116 2 13 14 17 61 17 40 0 58 -4 56 -12 -2 -6 -6 -63 -9
-126 -4 -114 -4 -114 22 -137 37 -32 104 -32 124 -1 14 21 18 22 41 9 27 -14
61 -10 88 12 13 10 17 39 21 149 l5 137 -119 117 c-117 117 -118 117 -170 120
l-53 3 47 -10 c40 -9 62 -26 154 -115 59 -57 111 -104 115 -104 5 0 9 -7 9
-15 0 -11 -11 -15 -42 -14 -24 1 -49 0 -57 -2 -8 -2 -17 4 -19 15 -2 10 -14
29 -26 41 -11 12 -35 37 -52 56 -18 19 -55 56 -83 83 -28 27 -51 53 -51 58 0
4 -9 8 -21 8 -16 0 9 -30 100 -119 l121 -119 0 -144 0 -145 -25 -11 c-33 -15
-57 -15 -90 0 -19 9 -25 17 -21 32 3 12 6 77 7 146 l1 124 -118 114 c-66 63
-129 118 -142 123 -20 8 -142 10 -142 2 0 -2 19 -20 42 -41 24 -20 80 -73 125
-117 l83 -80 0 -139 c0 -129 -1 -140 -22 -157 -26 -23 -66 -24 -97 -3 -22 16
-23 19 -20 161 l4 144 -64 57 c-36 31 -94 85 -130 119 -63 59 -69 62 -116 63
-27 0 -68 3 -90 6 -35 6 -38 5 -25 -8z"/>
</g>

<!-- ░░░░ PHONE SCREEN OVERLAY: semi-transparent dark fill ░░░░ -->
<!-- This sits over the phone screen area to provide a dark backdrop -->
<rect x="44" y="28" width="222" height="325" rx="14"
  fill="${s.bgBase}" opacity="0.92"/>

<!-- ░░░░ LEFT PANEL: Seller Profile Card (inside phone screen) ░░░░ -->

<!-- Avatar glow halo -->
<circle cx="${AVATAR.x + AVATAR.size / 2}" cy="${AVATAR.y + AVATAR.size / 2}" r="${AVATAR.size / 2 + 20}"
  fill="url(#${p}AvGlow)" opacity="0.6"/>

<!-- Avatar ring -->
<circle cx="${AVATAR.x + AVATAR.size / 2}" cy="${AVATAR.y + AVATAR.size / 2}" r="${AVATAR.size / 2 + 3}"
  fill="none" stroke="${s.accent}" stroke-width="2" opacity="0.85"/>

<!-- Avatar fill placeholder (composited at runtime by sharp) -->
<circle cx="${AVATAR.x + AVATAR.size / 2}" cy="${AVATAR.y + AVATAR.size / 2}" r="${AVATAR.size / 2}"
  fill="${s.cardBase}" filter="url(#${p}AvatarShadow)" clip-path="url(#${p}AvClip)"/>

<!-- Tier / Premium badge — pill below avatar -->
<rect x="${AVATAR.x}" y="${AVATAR.y + AVATAR.size + 6}" width="${AVATAR.size}" height="18" rx="9"
  fill="${s.badgeBg}" stroke="${s.badgeBorder}" stroke-width="1"/>
<circle cx="${AVATAR.x + 10}" cy="${AVATAR.y + AVATAR.size + 15}" r="4" fill="${s.accent}"/>
<text x="${AVATAR.x + 18}" y="${AVATAR.y + AVATAR.size + 19.5}"
  font-family="Syne,'Helvetica Neue',sans-serif"
  font-size="8" font-weight="800" letter-spacing="1.5"
  fill="${s.badgeText}">${tierLabel}</text>

<!-- Rating stars row -->
<text x="${AVATAR.x}" y="${AVATAR.y + AVATAR.size + 38}"
  font-family="Syne,sans-serif" font-size="10" fill="#FBBF24">★★★★★</text>
<text x="${AVATAR.x + 56}" y="${AVATAR.y + AVATAR.size + 38}"
  font-family="Syne,sans-serif" font-size="9" font-weight="700" fill="${s.accentAlt}">${escapeXml(rating)}</text>

<!-- Divider under avatar section -->
<rect x="54" y="${AVATAR.y + AVATAR.size + 46}" width="202" height="1" fill="${s.divider}"/>

<!-- Featured product listing (mini cards inside phone screen) -->
${featuredItems.map((product, i) => {
  const py = AVATAR.y + AVATAR.size + 56 + i * 72
  const title = wrapText(clamp(product.title, 28), 20, 1)
  const price = `₦${Number(product.price ?? 0).toLocaleString()}`
  return `
<!-- Mini product card ${i} -->
<rect x="54" y="${py}" width="202" height="60" rx="8"
  fill="${s.cardBase}" stroke="${s.divider}" stroke-width="0.8" opacity="0.9"/>
<!-- Product image placeholder (composited at runtime) -->
<rect x="60" y="${py + 7}" width="42" height="46" rx="6" fill="${s.bgPanel}"/>
<!-- Product title -->
${svgMultiline({
  x: 110, y: py + 20,
  lineHeight: 14, lines: title,
  attrs: `font-family="Syne,sans-serif" font-size="10" font-weight="700" fill="${s.textPrimary}"`
})}
<!-- Price pill -->
<rect x="110" y="${py + 34}" width="${Math.min(price.length * 6 + 16, 90)}" height="16" rx="8"
  fill="url(#${p}Price)"/>
<text x="118" y="${py + 46}"
  font-family="'DM Serif Display',serif"
  font-size="9" fill="#fff">${escapeXml(price)}</text>`
}).join('\n')}

<!-- Profile URL at the bottom of the phone screen -->
<text x="155" y="330"
  font-family="Syne,sans-serif" font-size="7" fill="${s.footText}"
  text-anchor="middle">${url}</text>

<!-- ░░░░ RIGHT PANEL: Seller Info & Brand (right ~310px wide) ░░░░ -->

<!-- NexWAD brand logo — top-right corner -->
<text x="572" y="30"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="18" fill="${s.nexwadColor}" text-anchor="end">NexWAD</text>
<text x="572" y="44"
  font-family="Syne,sans-serif"
  font-size="7" font-weight="700" letter-spacing="2.5"
  fill="${s.footText}" text-anchor="end">CAMPUS MARKETPLACE</text>

<!-- Accent underline beneath brand -->
<rect x="420" y="47" width="152" height="1.5" rx="1" fill="url(#${p}AccLine)"/>

<!-- Seller name — large display font -->
<text x="310" y="100"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="32" fill="${s.textPrimary}">${name}</text>

<!-- Handle -->
<text x="312" y="122"
  font-family="Syne,'Helvetica Neue',sans-serif"
  font-size="13" font-weight="600" fill="${s.accent}" letter-spacing="0.3">${handle}</text>

<!-- Accent underline beneath name -->
<rect x="312" y="128" width="160" height="2" rx="1" fill="url(#${p}AccLine)"/>

<!-- Category chip -->
<rect x="312" y="136" width="${category.length * 7 + 28}" height="20" rx="10"
  fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="0.8"/>
<text x="326" y="150"
  font-family="Syne,sans-serif" font-size="10" font-weight="700" fill="${s.chipText}">${category}</text>

<!-- Bio text -->
${svgMultiline({
  x: 312, y: 175, lineHeight: 18, lines: bioLines,
  attrs: `font-family="Syne,'Helvetica Neue',sans-serif" font-size="11" font-weight="400" fill="${s.textSecondary}"`
})}

<!-- Trust badges row -->
<rect x="312" y="234" width="108" height="22" rx="11"
  fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="0.8"/>
<circle cx="325" cy="245" r="4" fill="${s.accent}" opacity="0.9"/>
<text x="334" y="249"
  font-family="Syne,sans-serif" font-size="9" font-weight="700" fill="${s.chipText}">✓ Verified Seller</text>

<rect x="428" y="234" width="110" height="22" rx="11"
  fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="0.8"/>
<text x="441" y="249"
  font-family="Syne,sans-serif" font-size="9" font-weight="700" fill="${s.badgeText}">⚡ NexWAD Certified</text>

<!-- Horizontal divider -->
<rect x="312" y="264" width="270" height="1" fill="${s.divider}"/>

<!-- Stat mini-cards row -->
<rect x="312" y="272" width="80" height="48" rx="8"
  fill="${s.cardBase}" stroke="${s.divider}" stroke-width="0.8"/>
<text x="352" y="291" font-family="'DM Serif Display',serif"
  font-size="16" fill="${s.accentAlt}" text-anchor="middle">${escapeXml(rating)}</text>
<text x="352" y="307" font-family="Syne,sans-serif"
  font-size="7" font-weight="600" letter-spacing="1" fill="${s.priceMuted}" text-anchor="middle">RATING</text>

<rect x="400" y="272" width="80" height="48" rx="8"
  fill="${s.cardBase}" stroke="${s.divider}" stroke-width="0.8"/>
<text x="440" y="291" font-family="'DM Serif Display',serif"
  font-size="16" fill="${s.accentAlt}" text-anchor="middle">${escapeXml(s.label)}</text>
<text x="440" y="307" font-family="Syne,sans-serif"
  font-size="7" font-weight="600" letter-spacing="1" fill="${s.priceMuted}" text-anchor="middle">TIER</text>

<rect x="488" y="272" width="94" height="48" rx="8"
  fill="${s.cardBase}" stroke="${s.divider}" stroke-width="0.8"/>
<text x="535" y="291" font-family="'DM Serif Display',serif"
  font-size="13" fill="${s.accentAlt}" text-anchor="middle">Verified</text>
<text x="535" y="307" font-family="Syne,sans-serif"
  font-size="7" font-weight="600" letter-spacing="1" fill="${s.priceMuted}" text-anchor="middle">SELLER</text>

<!-- QR code placeholder (composited at runtime) -->
<rect x="${QR.x}" y="${QR.y}" width="${QR.size}" height="${QR.size}" rx="8"
  fill="white" stroke="${s.divider}" stroke-width="1" clip-path="url(#${p}QrClip)"/>
<text x="${QR.x + QR.size / 2}" y="${QR.y + QR.size / 2 + 3}"
  font-family="Syne,sans-serif" font-size="7" fill="#94A3B8" text-anchor="middle">QR CODE</text>
<text x="${QR.x + QR.size / 2}" y="${QR.y + QR.size + 12}"
  font-family="Syne,sans-serif" font-size="7" letter-spacing="0.5"
  fill="${s.footText}" text-anchor="middle">SCAN TO VISIT</text>

<!-- Outer poster border -->
<rect x="2" y="2" width="596" height="377" rx="18"
  fill="none" stroke="${s.outerBorder}" stroke-width="1.5"/>

</g>
</svg>`.trim()
}

// ─── Composite Builder ────────────────────────────────────────────────────────

async function buildComposites(user, featured) {
  const composites = []

  // Avatar inside left panel (phone screen)
  const avatarRaw = await safeAssetBuffer(
    cloudinaryTransform(user.avatar, { width: AVATAR.size * 2, height: AVATAR.size * 2 })
  )
  if (avatarRaw) {
    try {
      const buf = await sharp(avatarRaw)
        .resize(AVATAR.size, AVATAR.size)
        .png()
        .toBuffer()
      composites.push({ input: buf, top: AVATAR.y, left: AVATAR.x })
    } catch { /* skip */ }
  }

  // Mini product images inside the left panel cards
  const imageBuffers = await Promise.all(
    featured.slice(0, 3).map((p) =>
      safeAssetBuffer(cloudinaryTransform(p?.images?.[0], { width: 84, height: 92 }))
    )
  )
  for (let i = 0; i < Math.min(featured.length, 3); i++) {
    if (!imageBuffers[i]) continue
    try {
      const py = AVATAR.y + AVATAR.size + 56 + i * 72
      const buf = await sharp(imageBuffers[i])
        .resize(42, 46)
        .png()
        .toBuffer()
      composites.push({ input: buf, top: py + 7, left: 60 })
    } catch { /* skip */ }
  }

  // QR code — bottom-right corner
  const qrBuf = await QRCode.toBuffer(`${profileUrl(user)}?ref=poster`, {
    width: QR.size, margin: 1, type: 'png',
    color: { dark: '#0F172A', light: '#FFFFFF' },
  })
  composites.push({ input: qrBuf, top: QR.y, left: QR.x })

  return composites
}

// ─── Cache Helper ─────────────────────────────────────────────────────────────

function cachedResult(user, featured, signature, styleKey, cacheReason) {
  return {
    url: user.posterImageUrl, signature, regenerated: false,
    style: styleKey, featured: featured ?? [], generatedAt: user.posterLastGeneratedAt, cacheReason,
  }
}

// ─── Core Generator ───────────────────────────────────────────────────────────

async function generateSellerPoster(userDoc, { force = false } = {}) {
  const user = userDoc?.toObject ? userDoc.toObject() : { ...userDoc }

  if (!canGeneratePoster(user)) {
    const err = new Error('Poster unavailable: seller must have an active subscription')
    err.status = 403
    throw err
  }

  const featured  = await resolveFeatured(user)
  const signature = buildSignature(user, featured)
  const styleKey  = toTierStyle(user.sellerTier)

  if (!force && user.posterImageUrl && user.posterSignature === signature) {
    return cachedResult(user, featured, signature, styleKey, 'signature_match')
  }

  const lastGen = user.posterLastGeneratedAt ? new Date(user.posterLastGeneratedAt).getTime() : 0
  if (Date.now() - lastGen < REGEN_COOLDOWN_MS && user.posterImageUrl) {
    return cachedResult(user, featured, signature, styleKey, 'cooldown')
  }

  const svg        = buildSvg({ user, styleKey, featured })
  const composites = await buildComposites(user, featured)
  const finalPng   = await sharp(Buffer.from(svg))
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer()

  const upload = await uploadImageBuffer(finalPng, 'seller-posters', {
    public_id: `seller-brand-${user._id}`, overwrite: true, invalidate: true, format: 'png',
  })

  await User.findByIdAndUpdate(user._id, {
    posterImageUrl:        upload.secure_url,
    posterPublicId:        upload.public_id,
    posterSignature:       signature,
    posterTemplateStyle:   styleKey,
    posterLastGeneratedAt: new Date(),
  })

  return {
    url: upload.secure_url, signature, regenerated: true,
    style: styleKey, featured, generatedAt: new Date(),
  }
}

// ─── Safe Wrapper ─────────────────────────────────────────────────────────────

async function ensureSellerPoster(userDoc) {
  try {
    return await generateSellerPoster(userDoc, { force: false })
  } catch (err) {
    if (userDoc?.posterImageUrl) {
      return {
        url:         userDoc.posterImageUrl,
        signature:   userDoc.posterSignature,
        regenerated: false,
        style:       userDoc.posterTemplateStyle ?? toTierStyle(userDoc.sellerTier),
        generatedAt: userDoc.posterLastGeneratedAt,
        cacheReason: 'fallback_on_error',
      }
    }
    throw err
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  canGeneratePoster,
  generateSellerPoster,
  ensureSellerPoster,
  profileUrl,
  safeAssetBuffer,
  // Exported for unit testing
  buildSignature,
  buildSvg,
  wrapText,
}