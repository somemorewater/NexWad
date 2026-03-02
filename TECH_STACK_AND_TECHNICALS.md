# NexWAD Technical Stack and Implementation Guide

## 1. Overview

NexWAD is a full-stack web platform split into:

- `web/`: React SPA (Vite build tool).
- `server/`: Node.js API server (Express + MongoDB + Redis + Socket.IO).

The frontend consumes REST APIs under `/api/*` and opens WebSocket connections for realtime chat/notifications.

## 2. Frontend Technologies

### React 18

- Used for component-based UI and page composition.
- Implemented in `web/src/pages`, `web/src/components`, `web/src/context`.
- State handling is mainly React hooks and context providers.

### Vite

- Used as dev server and bundler.
- Configured in [vite.config.js](/home/water/Documents/NexWAD/Code/web/vite.config.js).
- Handles local proxy:
- `/api` -> backend.
- `/socket.io` -> backend websocket endpoint.

### React Router v6

- Used for SPA routing and role-based route partitioning.
- Defined in [App.jsx](/home/water/Documents/NexWAD/Code/web/src/App.jsx).
- Protected routes are enforced with `ProtectedRoute` and role checks.

### Axios

- Used for HTTP API requests through a central client.
- Configured in [web/src/api/index.js](/home/water/Documents/NexWAD/Code/web/src/api/index.js).
- Automatically attaches:
- `Authorization: Bearer <JWT>` when user is logged in.
- `X-API-Key: <VITE_API_KEY>` for API gateway protection.

### Socket.IO Client

- Used for realtime chat and notification transport.
- Integrated through `SocketContext`.

### date-fns

- Used for relative date formatting and time calculations in UI.

### react-hot-toast

- Used for user-facing success/error notifications.

## 3. Backend Technologies

### Node.js + Express

- Core HTTP API framework.
- Server bootstrap in [app.js](/home/water/Documents/NexWAD/Code/server/app.js).
- Express app configuration in [server/config/server.js](/home/water/Documents/NexWAD/Code/server/config/server.js).

### MongoDB + Mongoose

- Primary persistent database.
- Domain models in `server/models`:
- `User`, `Listing`, `Post`, `LostFound`, `Chat`, `Subscription`, `SellerApplication`, `Pin`, `UserLog`, `AdminLog`, and related models.
- Mongoose schema hooks/validation control data integrity and defaults.

### Redis

- Used for:
- OTP storage and verification.
- JWT blacklist on logout.
- Feed cache invalidation and short-term feed caching.

### Socket.IO Server

- Initialized in `server/socket.js`.
- Uses JWT auth handshake and user-specific rooms.
- Powers realtime message delivery and activity events.

### Cloudinary + Multer

- Used for media upload/storage and asset lifecycle.
- Different upload channels for:
- avatars
- listings
- posts
- lost/found
- chat media
- seller verification IDs
- Deletes old assets when replaced or removed.

### Nodemailer

- Used for transactional emails:
- OTP
- welcome
- password reset
- seller approval
- subscription confirmations

### PDFKit

- Used to generate downloadable receipts for subscription events.

### Paystack Integration

- Used for payment verification in:
- subscription flows
- pin credit purchases
- Includes verification and webhook handlers.

## 4. Security and Access Control

### JWT Authentication

- Middleware in `server/middleware/auth.js`.
- Supports:
- `protect` for required auth.
- `optionalAuth` for guest-capable endpoints.

### API Key Gateway

- Middleware in [apiKey.js](/home/water/Documents/NexWAD/Code/server/middleware/apiKey.js).
- Applied globally on `/api` in [server.js](/home/water/Documents/NexWAD/Code/server/config/server.js).
- Accepts comma-separated `API_KEYS` for key rotation.
- Frontend sends matching `VITE_API_KEY`.

### Role-Based Authorization

- Roles include buyer, seller, CS, moderator, admin, super admin variants.
- Admin routes require CS+ and escalate per action.
- Seller dashboard route enforces seller-only access.

### Rate Limiting and Headers

- `helmet` for common HTTP hardening headers.
- `cors` for controlled origin access.
- `express-rate-limit` for global and auth-specific throttling.

### Activity Logging

- Request activity logger middleware.
- Explicit user action logs via `userLogs` utilities and endpoints.
- Admin destructive actions stored in `AdminLog`.

## 5. Backend Architecture by Domain

### Auth Domain

- Signup with OTP initiation + verification phases.
- Login supports email or matric number identifier.
- Forgot/reset password flow.
- Logout token blacklist support.

### Listings Domain (Marketplace)

- Guest and personalized listing feeds.
- Save/unsave, report, owner CRUD.
- Feed sorting supports pin-aware ordering.

### Posts Domain (Social)

- Personalized and guest feed modes.
- Create/delete posts, likes, comments, reports.
- Feed caching via Redis.

### Lost & Found Domain

- Public listing view with authenticated claim workflow.
- Reporter-only update/resolve controls.

### Chat Domain

- Start-or-get chat based on listing and participants.
- Realtime message emission with unread tracking.
- Media messages supported.

### Subscription/Seller Domain

- Plan catalog and active subscription retrieval.
- Seller application workflow with admin approval.
- Prorated seller upgrade logic.
- Receipt generation and emailing.

### Pinning Domain

- Pin credits purchase and verification.
- Pin/extend/unpin operations.
- Auto-expiration handling.
- Pin data enrichment for UI previews.

### Admin Domain

- Stats, user management, seller applications, listings moderation, reports, logs.
- Super admin-only role changes.

## 6. Frontend Architecture

### Context Layer

- `AuthContext`: user session and auth state.
- `SocketContext`: websocket connection and realtime events.
- `LayoutContext` and `ThemeContext`: presentation state.

### Route Layer

- Public browsing routes for marketplace/social/lostfound/legal.
- Authenticated user routes for profile, settings, chat, subscriptions.
- Seller-only dashboard.
- Admin and super admin panels.

### API Layer

- Endpoint wrappers in `web/src/api/endpoints.js`.
- Central transport configuration in `web/src/api/index.js`.
- Consistent request auth and API key headers via interceptors.

## 7. Data and Event Observability

- `UserLog` captures user-level behavior events with timestamps and metadata.
- `/api/user-logs/admin` supports grouped view by user.
- `AdminLog` captures privileged actions with actor and request context.

## 8. Infrastructure and Runtime

### Local Development

- Run backend from `server`.
- Run frontend from `web`.
- Frontend proxy handles API and websocket development routing.

### Docker Compose (server scope)

- Services: Node server, MongoDB, Redis, mongo-express.
- Config in `server/docker-compose.yml`.

## 9. Environment Variable Mapping

### Server critical variables

- `PORT`
- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `PAYSTACK_SECRET_KEY`
- `API_KEY_PROTECTION`
- `API_KEYS`
- SMTP and Cloudinary credentials

### Frontend critical variables

- `VITE_API_URL`
- `VITE_PAYSTACK_PUBLIC_KEY`
- `VITE_API_KEY`

## 10. Notes and Current Design Decisions

- API key checks are enforced across `/api` and support key rotation.
- Some endpoints remain guest-accessible by design but still pass through API key middleware.
- Webhooks are excluded from API-key check to preserve payment provider callbacks.
- Route names and role behavior in docs map to current `App.jsx` and route middleware.
