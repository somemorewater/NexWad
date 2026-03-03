const crypto = require('crypto')
const http = require('http')
const https = require('https')
const sharp = require('sharp')
const QRCode = require('qrcode')
const Listing = require('../models/Listing')
const User = require('../models/User')
const { uploadImageBuffer } = require('./cloudinary')

const DIMENSIONS = { width: 1080, height: 1350 }

const TIER_STYLES = {
  basic: {
    name: 'Basic',
    bgStart: '#F8FAFC',
    bgEnd: '#E2E8F0',
    accent: '#2563FF',
    accentSoft: '#DBEAFE',
    badgeText: '#1E40AF',
  },
  pro: {
    name: 'Pro',
    bgStart: '#EEF2FF',
    bgEnd: '#BFDBFE',
    accent: '#2563FF',
    accentSoft: '#E0E7FF',
    badgeText: '#1D4ED8',
  },
  elite: {
    name: 'Elite',
    bgStart: '#FFF7ED',
    bgEnd: '#FDE68A',
    accent: '#B7791F',
    accentSoft: '#FEF3C7',
    badgeText: '#92400E',
  },
}

function toTierStyle(tier) {
  if (tier === 'elite') return 'elite'
  if (tier === 'pro') return 'pro'
  return 'basic'
}

function canExposeSellerPoster(user) {
  if (!user || user.role !== 'seller') return false
  if (user.subscriptionStatus !== 'active') return false
  if (!user.subscription?.active) return false
  return true
}

function clampText(text, max = 120) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function escapeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toPosterImageUrl(rawUrl, { width = 512, height = 512 } = {}) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_png,q_auto:good,c_fill,w_${width},h_${height}/`)
  }
  return url
}

function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Asset request failed (${res.statusCode})`))
        return
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.setTimeout(8000, () => req.destroy(new Error('Asset request timeout')))
    req.on('error', reject)
  })
}

async function fetchAssetBuffer(url) {
  const safeUrl = String(url || '').trim()
  if (!safeUrl) return null
  try {
    if (typeof fetch === 'function') {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(safeUrl, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
    return await requestBuffer(safeUrl)
  } catch {
    return null
  }
}

function posterProfileLink(user) {
  const base = String(process.env.CLIENT_URL || 'https://nexwad.com').replace(/\/+$/, '')
  if (user?.username) return `${base}/${user.username}`
  return `${base}/profile/${user?._id || ''}`
}

async function resolveFeaturedProducts(user, maxItems = 3) {
  const configuredIds = (user.featuredProducts || []).slice(0, maxItems)
  const configured = configuredIds.length
    ? await Listing.find({
      _id: { $in: configuredIds },
      seller: user._id,
      status: 'active',
    }).select('title price images updatedAt').lean()
    : []

  if (configured.length) {
    const byId = new Map(configured.map((item) => [String(item._id), item]))
    return configuredIds.map((id) => byId.get(String(id))).filter(Boolean).slice(0, maxItems)
  }

  return Listing.find({ seller: user._id, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(maxItems)
    .select('title price images updatedAt')
    .lean()
}

async function computePosterSignature(user, featuredProducts) {
  const style = toTierStyle(user.sellerTier)
  const payload = {
    id: String(user._id),
    style,
    name: clampText(user.name, 100),
    username: clampText(user.username, 40),
    bio: clampText(user.bio, 280),
    avatar: String(user.avatar || ''),
    tier: String(user.sellerTier || 'basic'),
    featured: featuredProducts.map((item) => ({
      id: String(item._id),
      title: clampText(item.title, 100),
      price: item.price || 0,
      image: String(item.images?.[0] || ''),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
    })),
  }
  return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')
}

function buildBaseSvg({ user, styleKey, featuredProducts }) {
  const style = TIER_STYLES[styleKey]
  const brandName = escapeXml(clampText(user.name || 'NexWAD Seller', 52))
  const username = escapeXml(clampText(user.username ? `@${user.username}` : '@seller', 32))
  const bio = escapeXml(clampText(user.bio || 'Trusted campus seller on NexWAD.', 140))
  const profileLink = escapeXml(posterProfileLink(user))

  const productCards = featuredProducts.map((product, idx) => {
    const x = 90 + (idx * 300)
    return `
      <g>
        <rect x="${x}" y="820" width="284" height="260" rx="18" fill="#FFFFFF" stroke="#E5E7EB" />
        <rect x="${x + 18}" y="842" width="264" height="176" rx="14" fill="#E5E7EB" />
        <text x="${x + 20}" y="1048" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#0F172A">
          ${escapeXml(clampText(product.title, 24))}
        </text>
        <text x="${x + 20}" y="1074" font-family="Arial, sans-serif" font-size="18" fill="#475569">
          ₦${Number(product.price || 0).toLocaleString()}
        </text>
      </g>
    `
  }).join('\n')

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${DIMENSIONS.width}" height="${DIMENSIONS.height}" viewBox="0 0 ${DIMENSIONS.width} ${DIMENSIONS.height}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${style.bgStart}" />
      <stop offset="100%" stop-color="${style.bgEnd}" />
    </linearGradient>
  </defs>

  <rect width="${DIMENSIONS.width}" height="${DIMENSIONS.height}" fill="url(#bgGrad)" />
  <circle cx="930" cy="150" r="220" fill="${style.accentSoft}" opacity="0.45" />
  <circle cx="120" cy="1120" r="160" fill="${style.accentSoft}" opacity="0.35" />

  <rect x="60" y="80" width="960" height="1220" rx="34" fill="rgba(255,255,255,0.86)" />
  <rect x="90" y="120" width="220" height="40" rx="20" fill="${style.accentSoft}" />
  <text x="112" y="147" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${style.badgeText}">
    ${style.name.toUpperCase()} SELLER
  </text>

  <rect x="90" y="180" width="170" height="170" rx="85" fill="${style.accentSoft}" />

  <text x="290" y="245" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#0F172A">${brandName}</text>
  <text x="290" y="285" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="${style.accent}">${username}</text>
  <text x="290" y="332" font-family="Arial, sans-serif" font-size="24" fill="#334155">${bio}</text>

  <rect x="90" y="380" width="880" height="2" fill="#E2E8F0" />

  <text x="90" y="430" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0F172A">Featured Products</text>
  ${productCards || '<text x="90" y="472" font-family="Arial, sans-serif" font-size="22" fill="#64748B">No featured products selected.</text>'}

  <rect x="90" y="1080" width="720" height="170" rx="24" fill="#FFFFFF" stroke="#D1D5DB" />
  <rect x="830" y="1080" width="170" height="170" rx="16" fill="#FFFFFF" stroke="#D1D5DB" />
  <text x="120" y="1138" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${style.accent}">NexWAD</text>
  <text x="120" y="1172" font-family="Arial, sans-serif" font-size="22" fill="#334155">Campus marketplace brand poster</text>
  <text x="120" y="1204" font-family="Arial, sans-serif" font-size="20" fill="#475569">${profileLink}</text>
</svg>
  `.trim()
}

async function generateSellerPoster(userDoc, { force = false } = {}) {
  const user = userDoc?.toObject ? userDoc.toObject() : userDoc
  if (!canExposeSellerPoster(user)) {
    const err = new Error('Poster unavailable for this seller tier/status')
    err.status = 403
    throw err
  }

  const featuredProducts = await resolveFeaturedProducts(user)
  const signature = await computePosterSignature(user, featuredProducts)
  if (!force && user.posterImageUrl && user.posterSignature === signature) {
    return {
      url: user.posterImageUrl,
      signature,
      regenerated: false,
      style: toTierStyle(user.sellerTier),
      featuredProducts,
      generatedAt: user.posterLastGeneratedAt,
    }
  }

  const style = toTierStyle(user.sellerTier)
  const baseSvg = buildBaseSvg({ user, styleKey: style, featuredProducts })
  const composites = []

  const avatarBuffer = await fetchAssetBuffer(toPosterImageUrl(user.avatar, { width: 220, height: 220 }))
  if (avatarBuffer) {
    const avatarReady = await sharp(avatarBuffer).resize(170, 170).png().toBuffer()
    composites.push({ input: avatarReady, top: 180, left: 90 })
  }

  for (let i = 0; i < featuredProducts.length; i += 1) {
    const x = 90 + (i * 300)
    const imageBuffer = await fetchAssetBuffer(toPosterImageUrl(featuredProducts[i]?.images?.[0], { width: 360, height: 260 }))
    if (!imageBuffer) continue
    const imageReady = await sharp(imageBuffer).resize(264, 176).png().toBuffer()
    composites.push({ input: imageReady, top: 842, left: x + 18 })
  }

  const qrValue = `${posterProfileLink(user)}?ref=poster`
  const qrBuffer = await QRCode.toBuffer(qrValue, {
    width: 170,
    margin: 0,
    color: { dark: '#0F172A', light: '#FFFFFF' },
    type: 'png',
  })
  composites.push({ input: qrBuffer, top: 1080, left: 830 })

  const finalPng = await sharp(Buffer.from(baseSvg))
    .composite(composites)
    .png()
    .toBuffer()

  const upload = await uploadImageBuffer(finalPng, 'seller-posters', {
    public_id: `seller-brand-${user._id}`,
    overwrite: true,
    invalidate: true,
    format: 'png',
  })

  await User.findByIdAndUpdate(user._id, {
    posterImageUrl: upload.secure_url,
    posterPublicId: upload.public_id,
    posterSignature: signature,
    posterTemplateStyle: style,
    posterLastGeneratedAt: new Date(),
  })

  return {
    url: upload.secure_url,
    signature,
    regenerated: true,
    style,
    featuredProducts,
    generatedAt: new Date(),
  }
}

async function ensureSellerPoster(userDoc) {
  try {
    return await generateSellerPoster(userDoc, { force: false })
  } catch (err) {
    if (userDoc?.posterImageUrl) {
      return {
        url: userDoc.posterImageUrl,
        signature: userDoc.posterSignature,
        regenerated: false,
        style: userDoc.posterTemplateStyle || toTierStyle(userDoc.sellerTier),
        generatedAt: userDoc.posterLastGeneratedAt,
      }
    }
    throw err
  }
}

module.exports = {
  canExposeSellerPoster,
  ensureSellerPoster,
  generateSellerPoster,
  posterProfileLink,
  fetchAssetBuffer,
}
