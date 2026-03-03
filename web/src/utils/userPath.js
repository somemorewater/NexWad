export function getUserPath(user) {
  if (!user) return '/profile'

  const username = typeof user === 'object' ? user.username : null
  if (username) return `/${encodeURIComponent(String(username).toLowerCase())}`

  const id = typeof user === 'object' ? user._id : user
  if (id) return `/profile/${encodeURIComponent(String(id))}`

  return '/profile'
}

