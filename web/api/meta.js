export const config = {
  runtime: 'edge',
}

const RESERVED_PATHS = new Set([
  'login', 'signup', 'marketplace', 'social', 'lost-found', 'search', 'chat',
  'notifications', 'profile', 'admin', 'moderator', 'cs', 'legal',
  'terms-and-conditions', 'privacy-policy', 'cookies-policy', 'data-retention-policy',
  'home', 'dashboard', 'banned', 'cs-chat', 'settings',
])

function getBackendBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  )
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') || '/'
  const cleaned = path.startsWith('/') ? path : `/${path}`
  const backend = getBackendBase()
  if (!backend) {
    return new Response('Backend URL not configured', { status: 500 })
  }

  const first = cleaned.split('/').filter(Boolean)[0] || ''
  if (RESERVED_PATHS.has(first)) {
    return new Response(renderMetaHtml({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: absoluteUrl(req, DEFAULT_IMAGE),
      url: absoluteUrl(req, cleaned),
      type: 'website',
    }), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  }

  const target = `${backend}${cleaned}`
  const upstream = await fetch(target, {
    headers: { 'user-agent': req.headers.get('user-agent') || 'vercel-edge' },
  })

  const html = await upstream.text()
  return new Response(html, {
    status: upstream.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
