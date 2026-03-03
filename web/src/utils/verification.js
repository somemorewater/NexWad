export function getVerificationBadge(user) {
  if (!user) return null

  const role = String(user.role || '').toLowerCase()
  const tier = String(user.sellerTier || '').toLowerCase()

  if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
    return { variant: 'black', label: 'Admin verified' }
  }

  if (role === 'seller' && tier === 'elite') {
    return { variant: 'gold', label: 'Elite seller verified' }
  }

  if (role === 'seller' && tier === 'pro') {
    return { variant: 'blue', label: 'Pro seller verified' }
  }

  return null
}

