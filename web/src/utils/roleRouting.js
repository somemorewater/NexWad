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

export function isPremiumBuyer(user) {
  const plan = String(user?.subscription?.plan || '').toLowerCase()
  return plan === 'premium_buyer' || plan === 'premium'
}

export function getDefaultRouteForUser(user) {
  const role = normalizeRole(user?.role)
  if (isSuperAdminRole(role)) return '/super-admin'
  if (isAdminRole(role)) return '/admin'
  if (isSellerRole(role)) return '/dashboard'
  return '/home'
}

export function getPrimaryNavForUser(user) {
  const role = normalizeRole(user?.role)
  if (isSuperAdminRole(role)) return { label: 'Admin Panel', to: '/super-admin' }
  if (isAdminRole(role)) return { label: 'Admin Panel', to: '/admin' }
  if (isSellerRole(role)) return { label: 'Dashboard', to: '/dashboard' }
  return { label: 'Home', to: '/home' }
}
