const CACHE_NAME = 'nexwad-pwa-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/nexwad-logo.png',
  '/nexwad-logo-full.png',
  '/nexwad-social.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
    ))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  )
})
