let deferredPrompt = null
const listeners = new Set()

export function isInstalled() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)')?.matches
    || window.navigator?.standalone === true
}

export function setInstallPrompt(event) {
  deferredPrompt = event
  listeners.forEach((cb) => cb(true))
}

export function clearInstallPrompt() {
  deferredPrompt = null
  listeners.forEach((cb) => cb(false))
}

export function canInstall() {
  return Boolean(deferredPrompt)
}

export async function promptInstall() {
  if (!deferredPrompt) return null
  deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  clearInstallPrompt()
  return choice
}

export function subscribeInstallAvailability(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
