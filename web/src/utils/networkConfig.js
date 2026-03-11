function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isLoopbackUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(url)
}

export function getRuntimeApiOrigin() {
  const runtimeUrl = typeof window !== 'undefined'
    ? trimTrailingSlash(window.__RUNTIME_API_URL__ || '')
    : ''
  const raw = runtimeUrl || trimTrailingSlash(import.meta.env.VITE_API_URL || '')
  if (!raw) return ''

  if (typeof window === 'undefined') return raw

  // If app is opened over LAN/IP (phone, tablet, another device),
  // ignore loopback API URLs so browser uses same-origin Vite proxy.
  if (!isLoopbackHost(window.location.hostname) && isLoopbackUrl(raw)) {
    return ''
  }

  return raw
}

export function getRuntimeApiBaseUrl() {
  const origin = getRuntimeApiOrigin()
  return origin ? `${origin}/api` : '/api'
}
