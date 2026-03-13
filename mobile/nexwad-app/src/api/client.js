// ============================================================
// NEXWAD API CLIENT
// Drop this in: src/api/client.js (in your Expo project)
//
// Usage:
//   import api from '../api/client';
//   const { listings } = await api.listings.list();
//   const { user, token } = await api.auth.login(email, password);
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL       = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const SUPABASE_URL   = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ── Supabase client (for Realtime chat/notifications) ─────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Token management ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'nexwad_token';
const USER_KEY  = 'nexwad_user';

export const tokenStore = {
  get:    () => AsyncStorage.getItem(TOKEN_KEY),
  set:    (t) => AsyncStorage.setItem(TOKEN_KEY, t),
  remove: () => AsyncStorage.removeItem(TOKEN_KEY),
};

export const userStore = {
  get:    async () => { const u = await AsyncStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; },
  set:    (u) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
  remove: () => AsyncStorage.removeItem(USER_KEY),
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const request = async (method, path, body = null, isFormData = false) => {
  const token = await tokenStore.get();

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const config = {
    method,
    headers,
    body: body
      ? isFormData ? body : JSON.stringify(body)
      : undefined,
  };

  const response = await fetch(`${BASE_URL}${path}`, config);
  const data     = await response.json();

  if (!response.ok) {
    const error    = new Error(data.error || data.message || 'Request failed');
    error.status   = response.status;
    error.data     = data;
    throw error;
  }

  return data;
};

const get    = (path)         => request('GET',    path);
const post   = (path, body)   => request('POST',   path, body);
const put    = (path, body)   => request('PUT',    path, body);
const patch  = (path, body)   => request('PATCH',  path, body);
const del    = (path)         => request('DELETE', path);
const upload = (path, form)   => request('POST',   path, form, true);

// ============================================================
// ── AUTH ─────────────────────────────────────────────────────
// ============================================================
export const auth = {
  signup: async ({ name, username, email, password, matric, dept }) => {
    const data = await post('/auth/signup', { name, username, email, password, matric, dept });
    if (data.token) await tokenStore.set(data.token);
    if (data.user)  await userStore.set(data.user);
    return data;
  },

  login: async (email, password) => {
    const data = await post('/auth/login', { email, password });
    if (data.token) await tokenStore.set(data.token);
    if (data.user)  await userStore.set(data.user);
    return data;
  },

  logout: async () => {
    await tokenStore.remove();
    await userStore.remove();
  },

  me: () => get('/auth/me'),

  verifyOtp: (otp, type = 'email_verify') => post('/auth/verify-otp', { otp, type }),
  resendOtp: () => post('/auth/resend-otp', {}),

  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword:  (email, otp, newPassword) => post('/auth/reset-password', { email, otp, newPassword }),

  savePushToken: (pushToken) => post('/auth/push-token', { pushToken }),
};

// ============================================================
// ── LISTINGS ─────────────────────────────────────────────────
// ============================================================
export const listings = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/listings${q ? `?${q}` : ''}`);
  },

  search: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/listings/search${q ? `?${q}` : ''}`);
  },

  get:    (id) => get(`/listings/${id}`),
  create: (data) => post('/listings', data),
  update: (id, data) => put(`/listings/${id}`, data),
  delete: (id) => del(`/listings/${id}`),

  like:   (id) => post(`/listings/${id}/like`, {}),

  bySeller: (sellerId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/listings/seller/${sellerId}${q ? `?${q}` : ''}`);
  },
};

// ============================================================
// ── ORDERS ───────────────────────────────────────────────────
// ============================================================
export const orders = {
  list:         (params = {}) => get(`/orders?${new URLSearchParams(params)}`),
  get:          (id) => get(`/orders/${id}`),
  create:       (data) => post('/orders', data),
  updateStatus: (id, status) => patch(`/orders/${id}/status`, { status }),
};

// ============================================================
// ── CONVERSATIONS & MESSAGES ─────────────────────────────────
// ============================================================
export const conversations = {
  list:   () => get('/conversations'),
  start:  (sellerId, listingId) => post('/conversations', { sellerId, listingId }),
  messages: (conversationId) => get(`/conversations/${conversationId}`),
  send:   (conversationId, text) => post('/messages', { conversationId, text }),
};

// ── Realtime chat subscription ────────────────────────────────────────────────
export const subscribeToMessages = (conversationId, callback) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, payload => callback(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel); // call this to unsubscribe
};

// ── Realtime notification subscription ───────────────────────────────────────
export const subscribeToNotifications = (userId, callback) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'notifications',
      filter: `user_id=eq.${userId}`,
    }, payload => callback(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// ============================================================
// ── COMMENTS ─────────────────────────────────────────────────
// ============================================================
export const comments = {
  list:   (listingId) => get(`/comments/${listingId}`),
  post:   (listingId, body, parentId = null) => post('/comments', { listingId, body, parentId }),
  update: (id, body) => put(`/comments/${id}`, { body }),
  delete: (id) => del(`/comments/${id}`),
  like:   (id) => post(`/comments/${id}/like`, {}),
};

// ============================================================
// ── NOTIFICATIONS ────────────────────────────────────────────
// ============================================================
export const notifications = {
  list:    () => get('/notifications'),
  readAll: () => patch('/notifications/read-all', {}),
  read:    (id) => patch(`/notifications/${id}/read`, {}),
};

// ============================================================
// ── LOST & FOUND ─────────────────────────────────────────────
// ============================================================
export const lostFound = {
  list:         (params = {}) => get(`/lost-found?${new URLSearchParams(params)}`),
  get:          (id) => get(`/lost-found/${id}`),
  create:       (data) => post('/lost-found', data),
  updateStatus: (id, status) => patch(`/lost-found/${id}/status`, { status }),
};

// ============================================================
// ── SELLERS ──────────────────────────────────────────────────
// ============================================================
export const sellers = {
  list:   (params = {}) => get(`/sellers?${new URLSearchParams(params)}`),
  get:    (id) => get(`/sellers/${id}`),
  apply:  (data) => post('/sellers/apply', data),
  follow: (id) => patch(`/sellers/${id}/follow`, {}),
};

// ============================================================
// ── USERS ────────────────────────────────────────────────────
// ============================================================
export const users = {
  me:     () => get('/users/me'),
  get:    (id) => get(`/users/${id}`),
  update: (data) => put('/users/me', data),
};

// ============================================================
// ── CART ─────────────────────────────────────────────────────
// ============================================================
export const cart = {
  list:   () => get('/cart'),
  add:    (listingId) => post('/cart', { listingId }),
  remove: (listingId) => del(`/cart/${listingId}`),
  clear:  () => del('/cart'),
};

// ============================================================
// ── SAVED ────────────────────────────────────────────────────
// ============================================================
export const saved = {
  listings: {
    list:   () => get('/saved/listings'),
    toggle: (listingId) => post('/saved/listings', { listingId }),
    remove: (listingId) => del(`/saved/listings/${listingId}`),
  },
  sellers: {
    list:   () => get('/saved/sellers'),
    toggle: (sellerId) => post('/saved/sellers', { sellerId }),
    remove: (sellerId) => del(`/saved/sellers/${sellerId}`),
  },
};

// ============================================================
// ── REVIEWS ──────────────────────────────────────────────────
// ============================================================
export const reviews = {
  list:   (sellerId, params = {}) => get(`/reviews/${sellerId}?${new URLSearchParams(params)}`),
  create: (data) => post('/reviews', data),
};

// ============================================================
// ── PAYMENTS ─────────────────────────────────────────────────
// ============================================================
export const payments = {
  initiateOrder:        (orderId) => post('/payments/initiate-order', { orderId }),
  initiateSubscription: (plan)    => post('/payments/initiate-subscription', { plan }),
  initiatePin:          (listingId, duration) => post('/payments/initiate-pin', { listingId, duration }),
  verify:               (reference) => post('/payments/verify', { reference }),
};

// ============================================================
// ── PINS ─────────────────────────────────────────────────────
// ============================================================
export const pins = {
  active:        () => get('/pins/active'),
  pinnedListings:() => get('/pins/pinned-listings'),
  status:        (listingId) => get(`/pins/status/${listingId}`),
};

// ============================================================
// ── REPORTS ──────────────────────────────────────────────────
// ============================================================
export const reports = {
  submit: (targetType, targetId, reason) => post('/reports', { targetType, targetId, reason }),
};

// ============================================================
// ── UPLOAD ───────────────────────────────────────────────────
// ============================================================
export const uploads = {
  listingImages: async (imageUris) => {
    const formData = new FormData();
    imageUris.forEach((uri, i) => {
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: `listing-${i}.jpg`,
      });
    });
    return upload('/upload/listing', formData);
  },

  avatar: async (imageUri) => {
    const formData = new FormData();
    formData.append('avatar', { uri: imageUri, type: 'image/jpeg', name: 'avatar.jpg' });
    return upload('/upload/avatar', formData);
  },

  lostFoundImages: async (imageUris) => {
    const formData = new FormData();
    imageUris.forEach((uri, i) => {
      formData.append('images', { uri, type: 'image/jpeg', name: `item-${i}.jpg` });
    });
    return upload('/upload/lost-found', formData);
  },
};

// ============================================================
// ── ADMIN ────────────────────────────────────────────────────
// ============================================================
export const admin = {
  dashboard:          () => get('/admin/dashboard'),
  approvals:          () => get('/admin/approvals'),
  processApproval:    (userId, action, note) => patch(`/admin/approvals/${userId}`, { action, note }),
  reports:            (status = 'pending') => get(`/admin/reports?status=${status}`),
  updateReport:       (id, status, adminNote) => patch(`/admin/reports/${id}`, { status, adminNote }),
  users:              (params = {}) => get(`/admin/users?${new URLSearchParams(params)}`),
  updateUser:         (id, action) => patch(`/admin/users/${id}`, { action }),
};

// ── Default export ────────────────────────────────────────────────────────────
export default {
  auth,
  listings,
  orders,
  conversations,
  comments,
  notifications,
  lostFound,
  sellers,
  users,
  cart,
  saved,
  reviews,
  payments,
  pins,
  reports,
  uploads,
  admin,
  subscribeToMessages,
  subscribeToNotifications,
};
