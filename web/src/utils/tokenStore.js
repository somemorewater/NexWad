// Token is stored in sessionStorage (not localStorage) for XSS mitigation.
// For maximum security in production, use httpOnly cookies via the backend.

const TOKEN_KEY = 'nw_access_token'

export const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY)

export const setStoredToken = (token) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredToken = () => sessionStorage.removeItem(TOKEN_KEY)
