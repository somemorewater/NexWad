import axios from 'axios'
import { getStoredToken, clearStoredToken } from '../utils/tokenStore'
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
    const apiKey = String(import.meta.env.VITE_API_KEY || '').trim()
    if (token) config.headers.Authorization = `Bearer ${token}`
    if (apiKey) config.headers['X-API-Key'] = apiKey
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
