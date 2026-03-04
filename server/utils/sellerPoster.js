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

const DIMENSIONS = { width: 1080, height: 1350 }
const MAX_FEATURED = 3
const REGEN_COOLDOWN_MS = 60_000
const ASSET_TIMEOUT_MS = 8_000

const CARD  = { width: 284, height: 290, gap: 20, top: 886, imageHeight: 178 }
const CARD_START_X = 90
const AVATAR = { size: 156, x: 97, y: 150 }   // center = 175, 228
const QR     = { size: 136, x: 872, y: 1162 }

// ─── Tier Styles ──────────────────────────────────────────────────────────────

const TIER_STYLES = {
  basic: {
    label: 'Basic',
    bgBase: '#060C1A', bgPanel: '#0A1020',
    headerFrom: '#0D1829', headerTo: '#0F2545',
    // Mesh blob colors (radial gradients painted full-canvas, then blurred)
    blob1: '#1D4ED8', blob2: '#1E40AF', blob3: '#0EA5E9',
    accent: '#3B82F6', accentAlt: '#60A5FA',
    accentGlowRgba: 'rgba(59,130,246,0.45)',
    badgeBg: 'rgba(59,130,246,0.12)', badgeBorder: 'rgba(59,130,246,0.4)',
    badgeText: '#93C5FD',
    chipBg: 'rgba(59,130,246,0.10)', chipBorder: 'rgba(59,130,246,0.35)',
    chipText: '#60A5FA',
    cardBase: '#111C30',
    cardGradTop: '#1E3A5F', cardGradMid: '#111827', cardGradBot: '#0A1020',
    cardBorder: 'rgba(59,130,246,0.22)',
    imgBase: '#0D1829',
    imgShineSide: 'rgba(59,130,246,0.15)',
    priceFrom: '#1D4ED8', priceTo: '#0EA5E9',
    statBase1: '#1E293B', statBase2: '#0F172A',
    statBorder: 'rgba(59,130,246,0.12)', statBar: null, // null = use priceFrom/priceTo
    textPrimary: '#EFF6FF', textSecondary: '#94A3B8', textMuted: '#475569',
    priceMuted: '#64748B',
    divider: 'rgba(59,130,246,0.15)', divider2: 'rgba(59,130,246,0.10)',
    beamColor: '#3B82F6', beamAlt: '#60A5FA',
    gridColor: '#3B82F6',
    footBase: '#0A1020', footEnd: '#060C1A',
    footText: '#334155', footDivider: 'rgba(59,130,246,0.12)',
    outerBorder: 'rgba(59,130,246,0.14)',
    sectionLabel: '#3B82F6',
    nexwadColor: '#3B82F6',
    avatarShine: 'rgba(255,255,255,0.18)',
    imgTopShine: 'rgba(255,255,255,0.14)',
    cardTopShine: 'rgba(255,255,255,0.09)',
    cardTopShineEnd: 'rgba(255,210,80,0)', // not golden for basic
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
    cardGradTop: '#2D1B69', cardGradMid: '#1A1040', cardGradBot: '#080418',
    cardBorder: 'rgba(139,92,246,0.22)',
    imgBase: '#110A2E',
    imgShineSide: 'rgba(139,92,246,0.18)',
    priceFrom: '#6D28D9', priceTo: '#A78BFA',
    statBase1: '#1E1B2E', statBase2: '#110A2E',
    statBorder: 'rgba(139,92,246,0.12)',
    textPrimary: '#F5F3FF', textSecondary: '#7C6FA8', textMuted: '#4C4068',
    priceMuted: '#4C4068',
    divider: 'rgba(139,92,246,0.15)', divider2: 'rgba(139,92,246,0.10)',
    beamColor: '#8B5CF6', beamAlt: '#C4B5FD',
    gridColor: '#8B5CF6',
    footBase: '#0D0A22', footEnd: '#08041A',
    footText: '#2D2540', footDivider: 'rgba(139,92,246,0.12)',
    outerBorder: 'rgba(139,92,246,0.14)',
    sectionLabel: '#8B5CF6',
    nexwadColor: '#8B5CF6',
    avatarShine: 'rgba(255,255,255,0.18)',
    imgTopShine: 'rgba(255,255,255,0.14)',
    cardTopShine: 'rgba(255,255,255,0.09)',
    cardTopShineEnd: 'rgba(255,255,255,0)',
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
    cardGradTop: '#3D2E00', cardGradMid: '#1C1800', cardGradBot: '#080600',
    cardBorder: 'rgba(245,158,11,0.25)',
    imgBase: '#161100',
    imgShineSide: 'rgba(245,158,11,0.18)',
    priceFrom: '#B45309', priceTo: '#FBBF24',
    statBase1: '#1C1800', statBase2: '#0F0B00',
    statBorder: 'rgba(245,158,11,0.10)',
    textPrimary: '#FFFBEB', textSecondary: '#92834A', textMuted: '#4A3A00',
    priceMuted: '#4A3A00',
    divider: 'rgba(245,158,11,0.15)', divider2: 'rgba(245,158,11,0.10)',
    beamColor: '#F59E0B', beamAlt: '#FBBF24',
    gridColor: '#F59E0B',
    footBase: '#0F0D00', footEnd: '#0A0800',
    footText: '#2A2000', footDivider: 'rgba(245,158,11,0.12)',
    outerBorder: 'rgba(245,158,11,0.14)',
    sectionLabel: '#F59E0B',
    nexwadColor: '#F59E0B',
    avatarShine: 'rgba(255,210,80,0.25)',
    imgTopShine: 'rgba(255,210,80,0.22)',
    cardTopShine: 'rgba(255,210,80,0.11)',
    cardTopShineEnd: 'rgba(255,210,80,0)',
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

// ─── Layout ───────────────────────────────────────────────────────────────────

function cardX(index) {
  return CARD_START_X + index * (CARD.width + CARD.gap)
}

// ─── SVG Defs ─────────────────────────────────────────────────────────────────

function buildDefs(s, p) {
  // p = unique prefix per render to avoid ID collisions if SVGs are ever inlined together
  return `<defs>
  <!-- Background gradients -->
  <linearGradient id="${p}Bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="${s.bgBase}"/>
    <stop offset="100%" stop-color="${s.bgPanel}"/>
  </linearGradient>
  <linearGradient id="${p}Header" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${s.headerFrom}"/>
    <stop offset="100%" stop-color="${s.headerTo}"/>
  </linearGradient>

  <!-- Card gradient overlay: top accent → midpoint fade → dark base -->
  <linearGradient id="${p}Card" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="${s.cardGradTop}" stop-opacity="0.45"/>
    <stop offset="55%"  stop-color="${s.cardGradMid}" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="${s.cardGradBot}" stop-opacity="0.55"/>
  </linearGradient>
  <!-- Card face shine: bright top → transparent -->
  <linearGradient id="${p}CardShine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="${s.cardTopShine}"/>
    <stop offset="40%"  stop-color="rgba(255,255,255,0.02)"/>
    <stop offset="100%" stop-color="${s.cardTopShineEnd}"/>
  </linearGradient>

  <!-- Image shine: diagonal top-left highlight -->
  <linearGradient id="${p}ImgShine" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="rgba(255,255,255,0.18)"/>
    <stop offset="35%"  stop-color="rgba(255,255,255,0.03)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  </linearGradient>
  <!-- Image side accent light leak -->
  <linearGradient id="${p}ImgSide" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0%"   stop-color="${s.imgShineSide}"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  </linearGradient>

  <!-- Accent fade line for underlines -->
  <linearGradient id="${p}AccLine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${s.accent}"/>
    <stop offset="55%"  stop-color="${s.accentAlt}"/>
    <stop offset="100%" stop-color="transparent"/>
  </linearGradient>

  <!-- Price pill gradient -->
  <linearGradient id="${p}Price" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${s.priceFrom}"/>
    <stop offset="100%" stop-color="${s.priceTo}"/>
  </linearGradient>

  <!-- Stat card gradient -->
  <linearGradient id="${p}Stat" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="${s.statBase1}" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="${s.statBase2}" stop-opacity="0.90"/>
  </linearGradient>

  <!-- Footer gradient -->
  <linearGradient id="${p}Foot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="${s.footBase}"/>
    <stop offset="100%" stop-color="${s.footEnd}"/>
  </linearGradient>

  <!-- Mesh blobs: full-canvas radial, then blurred via filter -->
  <radialGradient id="${p}Blob1" cx="82%" cy="8%"  r="50%">
    <stop offset="0%"   stop-color="${s.blob1}" stop-opacity="0.38"/>
    <stop offset="100%" stop-color="${s.blob1}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${p}Blob2" cx="8%"  cy="88%" r="45%">
    <stop offset="0%"   stop-color="${s.blob2}" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="${s.blob2}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${p}Blob3" cx="50%" cy="50%" r="38%">
    <stop offset="0%"   stop-color="${s.blob3}" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="${s.blob3}" stop-opacity="0"/>
  </radialGradient>

  <!-- Avatar glow -->
  <radialGradient id="${p}AvGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="${s.accent}" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="${s.accent}" stop-opacity="0"/>
  </radialGradient>

  <!-- Filters -->
  <filter id="${p}BlurHeavy" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="90"/>
  </filter>
  <filter id="${p}BlurMed" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="60"/>
  </filter>
  <filter id="${p}AvatarShadow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="8"  stdDeviation="20" flood-color="${s.accent}" flood-opacity="0.45"/>
    <feDropShadow dx="0" dy="20" stdDeviation="40" flood-color="#000"        flood-opacity="0.70"/>
  </filter>
  <filter id="${p}ImgShadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="${s.priceFrom}" flood-opacity="0.30"/>
    <feDropShadow dx="0" dy="4"  stdDeviation="6"  flood-color="#000"           flood-opacity="0.50"/>
  </filter>
  <filter id="${p}CardShadow" x="-15%" y="-10%" width="130%" height="140%">
    <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000"      flood-opacity="0.70"/>
    <feDropShadow dx="0" dy="4"  stdDeviation="8"  flood-color="${s.accent}" flood-opacity="0.12"/>
  </filter>

  <!-- Clip paths -->
  <clipPath id="${p}AvClip">
    <circle cx="${AVATAR.x + AVATAR.size / 2}" cy="${AVATAR.y + AVATAR.size / 2}" r="${AVATAR.size / 2}"/>
  </clipPath>
  ${[0, 1, 2].map(i => {
    const cx = cardX(i)
    return `<clipPath id="${p}C${i}">
    <rect x="${cx + 14}" y="${CARD.top + 18}" width="254" height="${CARD.imageHeight}" rx="14"/>
  </clipPath>`
  }).join('\n  ')}
  <clipPath id="${p}QrClip">
    <rect x="${QR.x}" y="${QR.y}" width="${QR.size}" height="${QR.size}" rx="16"/>
  </clipPath>
</defs>`
}

// ─── Background Layer ─────────────────────────────────────────────────────────

function buildBackground(s, p) {
  const { width: W, height: H } = DIMENSIONS
  return `
<!-- ░░ Base + mesh blobs ░░ -->
<rect width="${W}" height="${H}" fill="url(#${p}Bg)"/>
<rect width="${W}" height="${H}" fill="url(#${p}Blob1)" filter="url(#${p}BlurHeavy)"/>
<rect width="${W}" height="${H}" fill="url(#${p}Blob2)" filter="url(#${p}BlurHeavy)"/>
<rect width="${W}" height="${H}" fill="url(#${p}Blob3)" filter="url(#${p}BlurMed)"/>

<!-- Diagonal beams -->
<line x1="860" y1="0" x2="1180" y2="440" stroke="${s.beamColor}" stroke-width="1.5" opacity="0.09"/>
<line x1="910" y1="0" x2="1230" y2="440" stroke="${s.beamAlt}"   stroke-width="0.8" opacity="0.06"/>
<line x1="960" y1="0" x2="1280" y2="440" stroke="${s.beamColor}" stroke-width="0.5" opacity="0.04"/>

<!-- Sparse structural grid -->
<g opacity="0.035" stroke="${s.gridColor}" stroke-width="1">
  <line x1="90"  y1="0"    x2="90"   y2="${H}"/>
  <line x1="270" y1="0"    x2="270"  y2="${H}"/>
  <line x1="0"   y1="420"  x2="${W}" y2="420"/>
  <line x1="0"   y1="840"  x2="${W}" y2="840"/>
</g>

<!-- Header zone -->
<rect x="0" y="0" width="${W}" height="690" fill="url(#${p}Header)"/>`
}

// ─── Avatar Section ───────────────────────────────────────────────────────────

function buildAvatar(s, p, user) {
  const cx = AVATAR.x + AVATAR.size / 2   // 175
  const cy = AVATAR.y + AVATAR.size / 2   // 228
  const r  = AVATAR.size / 2              // 78
  return `
<!-- Avatar glow halo -->
<circle cx="${cx}" cy="${cy}" r="130" fill="url(#${p}AvGlow)" filter="url(#${p}BlurMed)"/>
<!-- Layered shadow rings -->
<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="rgba(0,0,0,0.5)" filter="url(#${p}AvatarShadow)"/>
<!-- Color ring -->
<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${s.accent}" opacity="0.18"/>
<!-- White separation ring -->
<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="${s.accent}" stroke-width="2" opacity="0.8"/>
<!-- Avatar fill (replaced by sharp composite at runtime) -->
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${s.imgBase}" clip-path="url(#${p}AvClip)"/>
<!-- Specular arc — simulates top-lighting on a sphere -->
<path d="M ${cx - 58} ${cy - 60} A 62 62 0 0 1 ${cx + 58} ${cy - 60}"
  fill="none" stroke="${s.avatarShine}" stroke-width="3" stroke-linecap="round"/>`
}

// ─── Header Text ──────────────────────────────────────────────────────────────

function buildHeaderText(s, p, user) {
  const name     = escapeXml(clamp(user.name || 'NexWAD Seller', 40))
  const handle   = escapeXml(clamp(user.username ? `@${user.username}` : '@seller', 30))
  const bioLines = wrapText(clamp(user.bio || 'Trusted campus seller on NexWAD.', 200), 52, 3)
  const tierLabel = s.label.toUpperCase()

  return `
<!-- Tier badge -->
<rect x="90" y="88" width="${tierLabel.length * 11 + 56}" height="36" rx="18"
  fill="${s.badgeBg}" stroke="${s.badgeBorder}" stroke-width="1.2"/>
<circle cx="110" cy="106" r="5" fill="${s.accent}"/>
<text x="124" y="112"
  font-family="Syne,'Helvetica Neue',sans-serif"
  font-size="12" font-weight="800" letter-spacing="2.5" fill="${s.badgeText}">${tierLabel} SELLER</text>

<!-- Name — DM Serif Display for personality -->
<text x="272" y="204"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="54" fill="${s.textPrimary}">${name}</text>

<!-- Handle — Syne medium weight -->
<text x="274" y="248"
  font-family="Syne,'Helvetica Neue',sans-serif"
  font-size="22" font-weight="600" fill="${s.accent}" letter-spacing="0.5">${handle}</text>

<!-- Accent underline -->
<rect x="274" y="258" width="190" height="2.5" rx="1.5" fill="url(#${p}AccLine)"/>

<!-- Bio — lighter weight, muted -->
${svgMultiline({
  x: 274, y: 296, lineHeight: 30, lines: bioLines,
  attrs: `font-family="Syne,'Helvetica Neue',sans-serif" font-size="18" font-weight="400" fill="${s.textSecondary}"`
})}

<!-- Separator -->
<rect x="90" y="400" width="900" height="1" fill="${s.divider}"/>

<!-- Trust chips -->
<rect x="90"  y="420" width="194" height="36" rx="18" fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="1"/>
<circle cx="113" cy="438" r="6" fill="${s.accent}" opacity="0.9"/>
<text x="128" y="444" font-family="Syne,sans-serif" font-size="13" font-weight="700" fill="${s.chipText}">✓ Verified Seller</text>

<rect x="300" y="420" width="168" height="36" rx="18" fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="1"/>
<text x="320" y="444" font-family="Syne,sans-serif" font-size="15" fill="#FBBF24">★★★★★</text>

<rect x="484" y="420" width="204" height="36" rx="18" fill="${s.chipBg}" stroke="${s.chipBorder}" stroke-width="1"/>
<text x="505" y="444" font-family="Syne,sans-serif" font-size="13" font-weight="700" fill="${s.badgeText}">⚡ NexWAD Certified</text>

<!-- Separator -->
<rect x="90" y="478" width="900" height="1" fill="${s.divider2}"/>

<!-- Section label + heading -->
<text x="90" y="524"
  font-family="Syne,sans-serif" font-size="11" font-weight="700" letter-spacing="4"
  fill="${s.sectionLabel}" opacity="0.7">FEATURED PRODUCTS</text>
<text x="90" y="564"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="36" fill="${s.textPrimary}">Top Picks For You</text>
<rect x="90" y="574" width="270" height="3" rx="1.5" fill="url(#${p}AccLine)"/>`
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function buildStatsBar(s, p, user) {
  const tier   = s.label
  const rating = user.rating ? Number(user.rating).toFixed(1) : '5.0'
  const stats  = [
    { value: rating,    label: 'RATING',      w: 200, x: 90  },
    { value: 'Verified', label: 'SELLER',     w: 200, x: 306 },
    { value: tier,       label: 'TIER',       w: 200, x: 522 },
    { value: 'NexWAD',   label: 'MARKETPLACE',w: 252, x: 738 },
  ]
  return stats.map(st => `
<rect x="${st.x}" y="596" width="${st.w}" height="82" rx="14"
  fill="url(#${p}Stat)" stroke="${s.statBorder}" stroke-width="1"/>
<!-- Left accent bar on stat card -->
<rect x="${st.x}" y="596" width="3" height="82" rx="1.5" fill="url(#${p}Price)"/>
<text x="${st.x + 22}" y="631"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="26" fill="${s.accentAlt}">${escapeXml(st.value)}</text>
<text x="${st.x + 22}" y="659"
  font-family="Syne,sans-serif" font-size="11" font-weight="600" letter-spacing="1.5"
  fill="${s.priceMuted}">${st.label}</text>`).join('\n')
}

// ─── Product Cards ────────────────────────────────────────────────────────────

function buildProductCards(products, s, p) {
  if (!products.length) {
    return `
<rect x="90" y="${CARD.top}" width="900" height="${CARD.height}" rx="20"
  fill="${s.cardBase}" stroke="${s.cardBorder}" stroke-width="1.5"/>
<text x="540" y="${CARD.top + CARD.height / 2 - 12}"
  font-family="'DM Serif Display',serif" font-size="24" fill="${s.textSecondary}" text-anchor="middle">No featured products yet</text>
<text x="540" y="${CARD.top + CARD.height / 2 + 20}"
  font-family="Syne,sans-serif" font-size="15" fill="${s.textMuted}" text-anchor="middle">Add listings to showcase them here</text>`
  }

  // Card tilts: alternate left/right/left for a fanned look
  const tilts = [-1.8, 1.2, -0.8]

  return products.map((product, i) => {
    const x      = cardX(i)
    const cx     = x + CARD.width / 2
    const cy     = CARD.top + CARD.height / 2
    const tilt   = tilts[i] ?? 0
    const titleLines = wrapText(clamp(product.title, 50), 21, 2)
    const price  = `₦${Number(product.price ?? 0).toLocaleString()}`
    const priceW = Math.min(price.length * 10 + 32, 200)

    return `
<!-- Card ${i} — rotate(${tilt}deg) around card center -->
<g transform="rotate(${tilt}, ${cx}, ${cy})" filter="url(#${p}CardShadow)">
  <!-- Card base color -->
  <rect x="${x}"   y="${CARD.top}" width="${CARD.width}" height="${CARD.height}" rx="20" fill="${s.cardBase}"/>
  <!-- Card gradient overlay (top tinted → mid fade → dark base) -->
  <rect x="${x}"   y="${CARD.top}" width="${CARD.width}" height="${CARD.height}" rx="20" fill="url(#${p}Card)"/>
  <!-- Card top-face shine -->
  <rect x="${x}"   y="${CARD.top}" width="${CARD.width}" height="${CARD.height}" rx="20" fill="url(#${p}CardShine)"/>
  <!-- Card border -->
  <rect x="${x}"   y="${CARD.top}" width="${CARD.width}" height="${CARD.height}" rx="20"
    fill="none" stroke="${s.cardBorder}" stroke-width="1.5"/>

  <!-- Image: layered shadow + fill + shine effects -->
  <!-- Shadow behind image -->
  <rect x="${x + 14}" y="${CARD.top + 18}" width="254" height="${CARD.imageHeight}" rx="14"
    fill="rgba(0,0,0,0.55)" filter="url(#${p}ImgShadow)"/>
  <!-- Image fill (replaced by sharp composite at runtime) -->
  <rect x="${x + 14}" y="${CARD.top + 18}" width="254" height="${CARD.imageHeight}" rx="14"
    fill="${s.imgBase}" clip-path="url(#${p}C${i})"/>
  <!-- Placeholder diagonal lines -->
  <line x1="${x + 14}" y1="${CARD.top + 18}" x2="${x + 268}" y2="${CARD.top + 18 + CARD.imageHeight}"
    stroke="${s.accent}" stroke-width="0.6" opacity="0.12" clip-path="url(#${p}C${i})"/>
  <line x1="${x + 268}" y1="${CARD.top + 18}" x2="${x + 14}" y2="${CARD.top + 18 + CARD.imageHeight}"
    stroke="${s.accent}" stroke-width="0.6" opacity="0.12" clip-path="url(#${p}C${i})"/>
  <!-- Diagonal shine overlay (simulates top-left studio light) -->
  <rect x="${x + 14}" y="${CARD.top + 18}" width="254" height="${CARD.imageHeight}" rx="14"
    fill="url(#${p}ImgShine)" clip-path="url(#${p}C${i})"/>
  <!-- Right-edge accent light leak -->
  <rect x="${x + 14}" y="${CARD.top + 18}" width="254" height="${CARD.imageHeight}" rx="14"
    fill="url(#${p}ImgSide)" clip-path="url(#${p}C${i})"/>
  <!-- Highlight stroke along top of image (simulates specular edge) -->
  <line x1="${x + 28}" y1="${CARD.top + 19}" x2="${x + 254}" y2="${CARD.top + 19}"
    stroke="${s.imgTopShine}" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Product title — Syne bold -->
  ${svgMultiline({
    x: x + 14, y: CARD.top + CARD.imageHeight + 36,
    lineHeight: 26,
    lines: titleLines,
    attrs: `font-family="Syne,'Helvetica Neue',sans-serif" font-size="17" font-weight="700" fill="${s.textPrimary}"`
  })}

  <!-- Price — DM Serif Display for accent contrast with Syne labels -->
  <rect x="${x + 14}" y="${CARD.top + CARD.imageHeight + 72}" width="${priceW}" height="28" rx="14"
    fill="url(#${p}Price)"/>
  <text x="${x + 28}" y="${CARD.top + CARD.imageHeight + 92}"
    font-family="'DM Serif Display','Georgia',serif"
    font-size="16" fill="#fff">${escapeXml(price)}</text>
</g>`
  }).join('\n')
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function buildFooter(s, p, user) {
  const url = escapeXml(profileUrl(user))
  return `
<!-- Footer background -->
<rect x="48" y="1210" width="984" height="100" fill="url(#${p}Foot)"/>
<rect x="48" y="1292" width="984" height="22" rx="18" fill="url(#${p}Foot)"/>

<!-- NexWAD wordmark — DM Serif for brand consistency -->
<text x="90" y="1258"
  font-family="'DM Serif Display','Georgia',serif"
  font-size="34" fill="${s.nexwadColor}">NexWAD</text>
<text x="90" y="1282"
  font-family="Syne,sans-serif"
  font-size="11" font-weight="700" letter-spacing="3" fill="${s.footText}">CAMPUS MARKETPLACE</text>

<!-- Vertical divider -->
<line x1="254" y1="1228" x2="254" y2="1290" stroke="${s.footDivider}" stroke-width="1.5"/>

<!-- Profile URL -->
<text x="274" y="1256"
  font-family="Syne,sans-serif" font-size="14" fill="${s.footText}">${url}</text>

<!-- QR placeholder (replaced by sharp composite at runtime) -->
<rect x="${QR.x}" y="${QR.y}" width="${QR.size}" height="${QR.size}" rx="16"
  fill="white" stroke="${s.cardBorder}" stroke-width="1.5"/>
<text x="${QR.x + QR.size / 2}" y="${QR.y + QR.size / 2 + 5}"
  font-family="Syne,sans-serif" font-size="11" fill="#94A3B8" text-anchor="middle">QR CODE</text>
<text x="${QR.x + QR.size / 2}" y="${QR.y + QR.size + 22}"
  font-family="Syne,sans-serif" font-size="11" letter-spacing="1"
  fill="${s.footText}" text-anchor="middle">SCAN TO VISIT</text>

<!-- Outer poster border -->
<rect x="48" y="64" width="984" height="1248" rx="36"
  fill="none" stroke="${s.outerBorder}" stroke-width="1.5"/>`
}

// ─── Master SVG Builder ───────────────────────────────────────────────────────

function buildSvg({ user, styleKey, featured }) {
  const s = TIER_STYLES[styleKey]
  const p = styleKey[0]  // 'b', 'p', or 'e' — short ID prefix
  const { width: W, height: H } = DIMENSIONS

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${buildDefs(s, p)}
${buildBackground(s, p)}
${buildAvatar(s, p, user)}
${buildHeaderText(s, p, user)}
${buildStatsBar(s, p, user)}
${buildProductCards(featured, s, p)}
${buildFooter(s, p, user)}
</svg>`.trim()
}

// ─── Composite Builder ────────────────────────────────────────────────────────

async function buildComposites(user, featured) {
  const composites = []
  const cx = AVATAR.x
  const cy = AVATAR.y

  const avatarRaw = await safeAssetBuffer(cloudinaryTransform(user.avatar, { width: 240, height: 240 }))
  if (avatarRaw) {
    try {
      const buf = await sharp(avatarRaw)
        .resize(AVATAR.size, AVATAR.size)
        .png()
        .toBuffer()
      composites.push({ input: buf, top: cy, left: cx })
    } catch { /* skip */ }
  }

  const imageBuffers = await Promise.all(
    featured.map((p) => safeAssetBuffer(cloudinaryTransform(p?.images?.[0], { width: 360, height: 260 })))
  )
  for (let i = 0; i < featured.length; i++) {
    if (!imageBuffers[i]) continue
    try {
      const buf = await sharp(imageBuffers[i])
        .resize(254, CARD.imageHeight)
        .png()
        .toBuffer()
      composites.push({ input: buf, top: CARD.top + 18, left: cardX(i) + 14 })
    } catch { /* skip */ }
  }

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
  cardX,
}