const DAY_MS = 24 * 60 * 60 * 1000

export function canPinContent(user) {
  if (!user) return false
  const role = String(user.role || '').toLowerCase()
  const buyerType = String(user.buyerType || '').toLowerCase()
  const plan = String(user.subscription?.plan || '').toLowerCase()
  return role === 'seller' || buyerType === 'premium' || plan === 'premium_buyer' || plan === 'silver'
}

export function formatPinTimeLeft(expiresAt) {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const hours = Math.ceil(ms / (60 * 60 * 1000))
  if (hours < 24) return `${hours}h left`
  const days = Math.ceil(ms / DAY_MS)
  return `${days}d left`
}

export async function ensurePaystackLoaded() {
  if (typeof window === 'undefined') throw new Error('Paystack unavailable')
  if (window.PaystackPop) return

  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export async function runPaystackCharge({
  publicKey,
  email,
  amountKobo,
  reference,
  metadata,
}) {
  await ensurePaystackLoaded()
  if (!window.PaystackPop) throw new Error('Payment gateway not loaded')
  if (!publicKey) throw new Error('Missing Paystack public key')

  return new Promise((resolve, reject) => {
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: amountKobo,
      currency: 'NGN',
      ref: reference,
      metadata,
      callback: (response) => resolve(response),
      onClose: () => reject(new Error('Payment window closed')),
    })
    handler.openIframe()
  })
}
