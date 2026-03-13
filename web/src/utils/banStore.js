const STORAGE_KEY = 'nexwad_ban_info'

export function setBanInfo(info) {
  try {
    const payload = JSON.stringify(info || {})
    sessionStorage.setItem(STORAGE_KEY, payload)
  } catch { /* ignore */ }
}

export function getBanInfo() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearBanInfo() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

