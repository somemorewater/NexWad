# 06 - Operations & Environment

## Repository Layout

- `server/` backend API
- `web/` frontend SPA
- `mobile/` mobile code (out of scope for this web/backend doc set)

## Backend Setup

From `server/package.json`:

- `npm run dev` -> nodemon `app.js`
- `npm start` -> node `app.js`

Required integrations:

- MongoDB
- Redis
- Cloudinary
- JWT secret
- Paystack keys (for subscription/pin payments)

Typical local run:

1. Copy `.env` values into `server/.env`
2. Start MongoDB/Redis
3. Run backend (`npm run dev`)

## Frontend Setup

From `web/package.json`:

- `npm run dev` -> Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview build

Typical local run:

1. Ensure API base URL config is set in frontend env
2. Run `npm run dev`

## Timeouts and Slow Network Support

Current backend timeout tuning (`server/app.js`):

- request timeout: 120s
- headers timeout: 125s

This supports slower uploads and high-latency mobile networks.

## Redis Cache Operations

Current Redis-backed responsibilities:

- OTP storage
- personalized feed cache
- response cache for selected read-heavy endpoints
- notification store

### Response Cache Keys

- data keys: `rcache:*`
- namespace index keys: `rcacheidx:*`

### Common Invalidation Namespaces

- `listings:list`
- `lostfound:list`
- `users:public-profile`
- `posts:public-feed`

## Rate Limit Defaults

Configured in `server/config/server.js`:

- read/write split limiters
- stricter auth limiter
- env-driven override via `RATE_LIMIT_*` and `AUTH_RATE_LIMIT_*`

## Logging and Monitoring

- request logs: morgan
- activity log middleware
- central logger utility (`utils/logger.js`)
- user action logs via `/api/user-logs`
- admin logs via `/api/admin/logs`

## Background Queue Operations

Background queue utility:

- `server/utils/jobQueue.js`

Environment tuning:

- `BG_QUEUE_CONCURRENCY` (default 2)

Used for:

- asynchronous user log writes
- asynchronous notification delivery/persistence

## Deployment Notes

- Backend serves API under `/api/*`
- In production mode, backend can serve static frontend build from `../../frontend/dist` (see `config/server.js`)
- Confirm your actual deployed frontend path matches this behavior

## Safe Change Procedure (Recommended)

1. Update constants/shared enums first
2. Update schema and validators
3. Update route handlers
4. Update frontend options and form payloads
5. Run migration scripts for existing data when enum/required fields change
6. Test key flows:
   - signup/login
   - listing create/edit/delete
   - post create/edit/delete
   - lost/found create/edit/claim/resolve
   - seller profile edit
7. Validate cache behavior:
   - verify cache hit paths for guest listing/feed/lostfound/profile requests
   - verify namespace invalidations on create/update/delete actions
8. Validate background queue behavior:
   - check notification and user log jobs still complete under load
