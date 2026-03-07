export const LISTING_CATEGORIES = [
  'Fashion',
  'Footwares',
  'Fragrance',
  'Electronics',
  'Phones',
  'Laptops',
  'Accessories',
  'Food',
  'Services',
  'Beauty',
  'Home Appliances',
  'Gaming',
  'Other',
]

export const MARKETPLACE_FILTER_CATEGORIES = ['All', ...LISTING_CATEGORIES]

export const LOST_FOUND_CATEGORIES = [
  'Documents',
  'ID Cards',
  'Keys',
  'Wallets',
  'Bags',
  'Electronics',
  'Accessories',
  'Clothing',
  'Other',
]

export function lostFoundCategoryIcon(category) {
  const normalized = String(category || '').toLowerCase()
  if (normalized === 'documents') return 'fa-solid fa-file-lines'
  if (normalized === 'id cards') return 'fa-solid fa-id-card'
  if (normalized === 'keys') return 'fa-solid fa-key'
  if (normalized === 'wallets') return 'fa-solid fa-wallet'
  if (normalized === 'bags') return 'fa-solid fa-briefcase'
  if (normalized === 'electronics') return 'fa-solid fa-plug-circle-bolt'
  if (normalized === 'accessories') return 'fa-solid fa-glasses'
  if (normalized === 'clothing') return 'fa-solid fa-shirt'
  return 'fa-solid fa-box-open'
}
