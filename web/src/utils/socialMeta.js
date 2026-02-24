const DEFAULT_SOCIAL = {
  title: 'NexWAD',
  description: 'NexWAD - Buy, sell, find lost items, and connect with campus.',
  image: '/nexwad-social.png',
  url: '',
  type: 'website',
}

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function absoluteUrl(input) {
  if (!input) return window.location.href
  if (/^https?:\/\//i.test(input)) return input
  return `${window.location.origin}${input.startsWith('/') ? '' : '/'}${input}`
}

export function setSocialMeta({ title, description, image, url, type = 'website' }) {
  const metaTitle = title || DEFAULT_SOCIAL.title
  const metaDescription = description || DEFAULT_SOCIAL.description
  const metaImage = absoluteUrl(image || DEFAULT_SOCIAL.image)
  const metaUrl = absoluteUrl(url || DEFAULT_SOCIAL.url || window.location.pathname)

  document.title = metaTitle

  upsertMeta('name', 'description', metaDescription)

  upsertMeta('property', 'og:title', metaTitle)
  upsertMeta('property', 'og:description', metaDescription)
  upsertMeta('property', 'og:image', metaImage)
  upsertMeta('property', 'og:url', metaUrl)
  upsertMeta('property', 'og:type', type)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', metaTitle)
  upsertMeta('name', 'twitter:description', metaDescription)
  upsertMeta('name', 'twitter:image', metaImage)
}

export function resetSocialMeta() {
  setSocialMeta(DEFAULT_SOCIAL)
}

export async function shareLink({ title, text, url }) {
  const payload = { title, text, url: absoluteUrl(url) }

  if (navigator.share) {
    await navigator.share(payload)
    return 'shared'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.url)
    return 'copied'
  }

  return 'unsupported'
}
