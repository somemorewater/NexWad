import api from './index'

// ─── Users ───────────────────────────────────
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  deleteAccount: (data) => api.delete('/users/me', { data }),
  uploadAvatar: (formData) =>
    api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  search: (q) => api.get('/users/search', { params: { q } }),
}

// ─── User Logs ────────────────────────────────
export const userLogsAPI = {
  getMine: (params) => api.get('/user-logs/me', { params }),
  event: (data) => api.post('/user-logs/event', data),
  getAdmin: (params) => api.get('/user-logs/admin', { params }),
}

// ─── Listings ─────────────────────────────────
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (formData) =>
    api.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  save: (id) => api.post(`/listings/${id}/save`),
  unsave: (id) => api.delete(`/listings/${id}/save`),
  getSaved: () => api.get('/listings/saved'),
  getMyListings: () => api.get('/listings/mine'),
  report: (id, reason) => api.post(`/listings/${id}/report`, { reason }),
}

// ─── Posts (Social) ───────────────────────────
export const postsAPI = {
  getFeed: (params) => api.get('/posts/feed', { params }),
  getMine: () => api.get('/posts/mine'),
  getById: (id) => api.get(`/posts/${id}`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  create: (formData) =>
    api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
  comment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  report: (id, reason) => api.post(`/posts/${id}/report`, { reason }),
}

// ─── Lost & Found ─────────────────────────────
export const lostFoundAPI = {
  getAll: (params) => api.get('/lostfound', { params }),
  getById: (id) => api.get(`/lostfound/${id}`),
  create: (formData) =>
    api.post('/lostfound', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/lostfound/${id}`, data),
  delete: (id) => api.delete(`/lostfound/${id}`),
  claim: (id) => api.post(`/lostfound/${id}/claim`),
  markResolved: (id) => api.post(`/lostfound/${id}/resolve`),
}

// ─── Chat ─────────────────────────────────────
export const chatAPI = {
  getChats: () => api.get('/chat'),
  getOrCreate: (listingId, sellerId) =>
    api.post('/chat/start', { listingId, sellerId }),
  getMessages: (chatId, params) => api.get(`/chat/${chatId}/messages`, { params }),
  sendMessage: (chatId, formData) =>
    api.post(`/chat/${chatId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markRead: (chatId) => api.put(`/chat/${chatId}/read`),
}

// ─── Subscriptions ────────────────────────────
export const subscriptionsAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  subscribe: (planId, paymentData) =>
    api.post('/subscriptions', { planId, ...paymentData }),
  applySeller: (formData) =>
    api.post('/subscriptions/apply-seller', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMySellerApplication: () => api.get('/subscriptions/my-application'),
  cancel: () => api.delete('/subscriptions/current'),
  getReceipt: (subId) => api.get(`/subscriptions/${subId}/receipt`, { responseType: 'blob' }),
}

// ─── Pins ─────────────────────────────────────
export const pinsAPI = {
  getPlans: () => api.get('/pins/plans'),
  getMine: () => api.get('/pins/my'),
  initialize: (data) => api.post('/pins/initialize', data),
  extend: (pinId, data) => api.post(`/pins/${pinId}/extend`, data),
  initializeCredits: (data) => api.post('/pins/credits/initialize', data),
  verifyCredits: (data) => api.post('/pins/credits/verify', data),
  unpin: (pinId) => api.delete(`/pins/${pinId}`),
}

// ─── Admin ────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  banUser: (userId, reason) => api.post(`/admin/users/${userId}/ban`, { reason }),
  unbanUser: (userId) => api.delete(`/admin/users/${userId}/ban`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (reportId, action) => api.put(`/admin/reports/${reportId}`, { action }),
  getLogs: (params) => api.get('/admin/logs', { params }),
  getListings: (params) => api.get('/admin/listings', { params }),
  featureListing: (id, featured) => api.put(`/admin/listings/${id}/feature`, { featured }),
  getSellerApplications: (params) => api.get('/admin/seller-applications', { params }),
  approveSellerApplication: (id) => api.put(`/admin/seller-applications/${id}/approve`),
  rejectSellerApplication: (id, reason) => api.put(`/admin/seller-applications/${id}/reject`, { reason }),
}
