import api from './index'

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (data) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyOtp: (otp, email) => api.post('/auth/verify-otp', { otp, email }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  refreshToken: () => api.post('/auth/refresh'),
}
