# 01 - Architecture

## High-Level Overview

NexWAD is a full-stack marketplace/social campus platform with:

- `server/`: Node.js + Express API server
- `web/`: React + Vite web app
- MongoDB as primary datastore
- Redis for cache/session-like optimizations
- Cloudinary for media storage/transformation
- Socket.IO for real-time chat/events

## Runtime Topology

### Backend

Entry point:

- `server/app.js`

Boot sequence:

1. Load `.env`
2. Connect MongoDB (`config/db.js`)
3. Connect Redis (`config/redis.js`)
4. Create HTTP server from Express app (`config/server.js`)
5. Apply request timeout settings:
   - `requestTimeout = 120000`
   - `headersTimeout = 125000`
   - `timeout = 120000`
6. Initialize Socket.IO (`socket.js`)

### Frontend

Entry points:

- `web/src/main.jsx`
- `web/src/App.jsx`

The frontend is a single-page app using React Router and context providers:

- `AuthProvider`
- `SocketProvider`
- `LayoutProvider`
- `ThemeProvider`

## Backend Routing Surface

Mounted API groups in `server/config/server.js`:

- `/api/auth`
- `/api/users`
- `/api/posts`
- `/api/listings`
- `/api/lostfound`
- `/api/chat`
- `/api/subscriptions`
- `/api/pins`
- `/api/user-logs`
- `/api/notifications`
- `/api/admin`
- `/api/health`

## Security & Platform Controls

From `server/config/server.js`:

- `helmet()` for security headers
- `cors()` with `CLIENT_URL` allowlist
- read/write rate limiting via `express-rate-limit`
- stricter auth limiter on `/api/auth/*`
- `compression()` enabled
- request activity logging middleware
- morgan request logging (except test env)
- centralized error handler

## Caching & Async Processing Layer

### Redis Caching Layers

1. OTP cache
   - prefix: `otp:*`
2. Personalized feed cache
   - prefix: `feed:*`
3. Generic response cache (new)
   - response keys prefix: `rcache:*`
   - namespace index prefix: `rcacheidx:*`

Response cache supports:

- key generation (`responseCacheKey`)
- read-through caching (`responseCacheRemember`)
- namespace invalidation (`responseCacheInvalidate`)

Implemented in:

- `server/utils/redis.js`
- key serialization helper: `server/utils/cacheKey.js`

### Background Job Queue (new)

A lightweight in-process queue is used for non-critical async work:

- utility: `server/utils/jobQueue.js`
- configurable concurrency via `BG_QUEUE_CONCURRENCY` (default 2)
- retry support per job

Current consumers:

- user log writes (`server/utils/userLogs.js`)
- notification delivery/persistence (`server/utils/notifications.js`)

## Core Domain Areas

1. Marketplace
   - Listings CRUD, save/unsave, reporting
2. Social
   - Posts, likes, comments, reporting
3. Lost & Found
   - Reports, claims, resolve flow
4. Subscription & Seller lifecycle
   - seller applications, plan upgrades, access transitions
5. Pinning
   - pin plans, credits, paystack verification, active pin overlays
6. Messaging
   - chat creation and message exchange with media support
7. User Profiles
   - social graph (follow/unfollow), profile edits, seller poster tooling

## Category Taxonomy (Current)

Shared product category constants are defined in:

- Backend: `server/constants/categories.js`
- Frontend: `web/src/constants/categories.js`

Current listing/seller categories:

- Fashion
- Footwares
- Fragrance
- Electronics
- Phones
- Laptops
- Accessories
- Food
- Services
- Beauty
- Home Appliances
- Gaming
- Other

Lost & Found categories:

- Documents
- ID Cards
- Keys
- Wallets
- Bags
- Electronics
- Accessories
- Clothing
- Other
