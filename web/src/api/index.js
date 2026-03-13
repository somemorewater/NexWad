import axios from 'axios'
import { getStoredToken, clearStoredToken } from '../utils/tokenStore'
import { setBanInfo } from '../utils/banStore'
import { getRuntimeApiBaseUrl } from '../utils/networkConfig'

const api = axios.create({
  baseURL: getRuntimeApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'Account suspended') {
      setBanInfo(error.response.data)
      if (window.location.pathname !== '/banned') {
        window.location.href = '/banned'
      }
    }
    if (error.response?.status === 401) {
      const token = getStoredToken()
      if (token) {
        clearStoredToken()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
