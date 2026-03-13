export function normalizeRole(role) {
  return String(role || '').toLowerCase()
}

export function isSuperAdminRole(role) {
  const r = normalizeRole(role)
  return r === 'superadmin' || r === 'super_admin'
}

export function isAdminRole(role) {
  const r = normalizeRole(role)
  return r === 'admin' || isSuperAdminRole(r)
}

export function isSellerRole(role) {
  return normalizeRole(role) === 'seller'
}

export function isModeratorRole(role) {
  return normalizeRole(role) === 'moderator'
}

export function isCSRole(role) {
  return normalizeRole(role) === 'cs'
}

export function isPremiumBuyer(user) {
  const plan = String(user?.subscription?.plan || '').toLowerCase()
  return plan === 'premium_buyer' || plan === 'premium'
}

export function getDefaultRouteForUser(user) {
  const role = normalizeRole(user?.role)
  if (isSuperAdminRole(role)) return '/super-admin'
  if (isAdminRole(role)) return '/admin'
  if (isModeratorRole(role)) return '/moderator'
  if (isCSRole(role)) return '/cs'
  if (isSellerRole(role)) return '/dashboard'
  return '/home'
}

export function getPrimaryNavForUser(user) {
  const role = normalizeRole(user?.role)
  if (isSuperAdminRole(role)) return { label: 'Admin Panel', to: '/super-admin' }
  if (isAdminRole(role)) return { label: 'Admin Panel', to: '/admin' }
  if (isModeratorRole(role)) return { label: 'Moderator', to: '/moderator' }
  if (isCSRole(role)) return { label: 'CS Desk', to: '/cs' }
  if (isSellerRole(role)) return { label: 'Dashboard', to: '/dashboard' }
  return { label: 'Home', to: '/home' }
}
