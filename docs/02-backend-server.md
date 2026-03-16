# 02 - Backend Server

## Tech Stack

- Node.js
- Express 4
- Mongoose 8
- Redis 4
- Socket.IO 4
- Cloudinary + Multer
- express-validator

Main file references:

- Boot: `server/app.js`
- Express config/middleware/routes: `server/config/server.js`
- Models: `server/models/*.js`
- Routes: `server/routes/*.js`
- Utilities: `server/utils/*.js`

## Request Pipeline

1. Security middleware (`helmet`, `cors`)
2. Rate limiting (`readLimiter`, `writeLimiter`, `authLimiter`)
3. Compression
4. Body parsers
5. Request activity logger
6. Route handlers
7. 404 fallback
8. Global error handler

## Server-Side Caching (Implemented)

### Utility Modules

- `server/utils/redis.js`
  - `responseCacheKey(parts)`
  - `responseCacheRemember({ key, ttlSeconds, namespaces, compute })`
  - `responseCacheInvalidate(namespaces)`
- `server/utils/cacheKey.js`
  - stable query serialization for cache keys

### Cached Endpoints

1. Listings
   - `GET /api/listings` (public queries)
   - `GET /api/listings?seller=...` (public seller listing queries)
2. Lost & Found
   - `GET /api/lostfound`
3. Users
   - `GET /api/users/search` (guest requests)
   - `GET /api/users/:id` (guest profile requests)
4. Posts
   - `GET /api/posts/feed` (public feed path)
   - personalized feed cache remains in place via `feed:*`

### Invalidation Strategy

Namespace-based invalidation on mutations:

- `listings:list`
  - invalidated by listing create/update/delete and listing pin state changes
- `lostfound:list`
  - invalidated by lost/found create/update/delete/claim/resolve/report and lost/found pin changes
- `users:public-profile`
  - invalidated by profile/role/avatar/follow/report updates affecting public profile views
- `posts:public-feed`
  - invalidated by post create/update/delete/like/unlike/comment/delete-comment and post pin changes

## Auth and Access

Auth middleware:

- `protect` for authenticated requests
- `optionalAuth` for public routes with optional user context

Role checks appear in route-level logic for:

- admin/moderator operations
- seller-only operations (listing creation, poster tools, etc.)

## Media Handling

Cloudinary adapters are in `server/utils/cloudinary.js`.

Notable upload handlers:

- `uploadListingImages` (array, max 4 files, max 4MB each)
- `uploadPostImage` (single)
- `uploadAvatar` (single)
- `uploadChatMedia` (single)
- seller ID image (single)

Listing uploads use transformations optimized for delivery size and compatibility.

## Route Modules

### `auth.js`

- signup/login/me/logout
- forgot/reset password
- OTP resend

### `users.js`

- search/get profile
- profile update (`PUT /me`)
- password update
- account deletion
- avatar upload
- seller poster management
- follow/unfollow + followers/following
- report user

### `listings.js`

- list, get, create, update, delete
- saved listings APIs
- report listing
- listing edit supports image set mutation (retain/remove/add)

### `posts.js`

- feed, mine, by-user, by-id
- create/update/delete
- like/unlike
- comments create/list/delete
- report post
- edit supports image replace/remove

### `lostfound.js`

- list/get/create/update/delete
- claim, resolve, report
- now category-driven (no new image upload path in create/update)

### `pins.js`

- plans
- user pin stats and active pins
- pin credits initialize/verify/webhook
- initialize pin, extend pin, unpin
- pin mutations also invalidate target response-cache namespaces

### `subscriptions.js`

- plans/current
- subscribe/cancel
- apply seller + review flow
- receipt endpoint

### `admin.js`

- stats
- user moderation
- seller applications review
- listings moderation/feature
- reports resolution
- admin logs

### `chat.js`

- list chats
- start chat
- get/send messages
- mark as read
- support chat creation for buyers/sellers
- CS support inbox, accept, and end routes
- support-role access controls and assignment checks

### `notifications.js`

- get notifications
- mark all read

### `userLogs.js`

- get own logs
- create event
- admin log inspection

## Backend Notes on Subscription Expiry

`User.checkSubscription()` includes logic to:

- mark subscription status expired
- downgrade access for non-admin roles
- update related subscription records
- pause active listings and cancel listing pins when seller access expires

## Error Handling Behavior

Global handler maps:

- Mongoose `ValidationError` -> `400`
- JWT errors -> `401`
- Mongo duplicate key (`11000`) -> `409`
- fallback -> `500` (or provided `err.status`)

Production mode hides internal stack details.

## Background Job Queue (Implemented)

### Utility

- `server/utils/jobQueue.js`

Features:

- in-process FIFO job queue
- bounded worker concurrency
- per-job retry count

### Current Backgrounded Processes

1. User log persistence
   - `queueUserLog(...)` now enqueues DB write jobs
2. Notification delivery/persistence
   - `notify(...)` now enqueues socket emit + Redis persistence
