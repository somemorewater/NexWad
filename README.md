# NexWAD

**The student platform for AFIT Kaduna** — buy, sell, find lost items, and share campus life.

Built with React (Vite) + Node.js/Express + MongoDB + Redis + Socket.io + Cloudinary.

---

## Project Structure

```
nexwad/
├── frontend/          # React (Vite) SPA
│   └── src/
│       ├── api/       # Axios helpers per domain
│       ├── components/# Shared UI components
│       ├── context/   # AuthContext, SocketContext
│       ├── hooks/     # useAuth
│       ├── pages/     # Route-level page components
│       ├── styles/    # main.css (design tokens), components.css
│       └── utils/     # feedAlgorithm, tokenStore
└── backend/           # Node.js + Express API
    ├── config/        # db, redis, email, server
    ├── middleware/     # auth (JWT), validate (express-validator)
    ├── models/        # User, Listing, Post, LostFound, Chat, Message, Subscription, Review, AdminLog
    ├── routes/        # auth, users, posts, listings, lostfound, chat, subscriptions, admin
    ├── utils/         # cloudinary, redis, notifications, feedAlgorithm, pdfGenerator, logger
    └── socket.js      # Socket.io server with auth middleware
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Cloudinary account
- SMTP credentials (Gmail app password works)

### 1. Backend

```bash
cd backend
npm install
cp .env .env.local   # edit with your real credentials
npm run dev          # starts on :5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts on :5173, proxies /api → :5000
```

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `CLIENT_URL` | Frontend origin (for CORS & email links) |

---

## Architecture

### Authentication
- JWT stored in `sessionStorage` (not localStorage) for XSS mitigation
- OTP email verification on signup (AFIT email domain enforced: `@afit.edu.ng`)
- Blacklisted tokens tracked in Redis on logout
- Role hierarchy: `user → cs → moderator → admin → super_admin`

### Feed Algorithm
Scores posts and listings using a weighted formula:
```
score = (likes×3) + (comments×5) + (shares×7) + (views×0.5) + (saves×4)
      + recency_decay(half_life=12h)
      + premium_boost(+20)
      + seller_tier_boost(gold=+8, silver=+4)
      + following_boost(+10)
```
Premium listings are additionally injected every 5 organic items.

### Real-time (Socket.io)
- Auth middleware verifies JWT on every connection
- Users auto-join a personal room (`user:{id}`) for notifications
- Chat rooms (`chat:{id}`) for message delivery
- Typing indicators emitted to room peers

### Media (Cloudinary)
- Separate storage folders per content type: `nexwad/listings`, `nexwad/posts`, `nexwad/avatars`, `nexwad/chat`, `nexwad/lostfound`, `nexwad/receipts`
- Old media deleted from Cloudinary when replaced or item removed
- PDF receipts uploaded as `raw` resource type

### Subscriptions
Plans: **Basic (free) → Silver (₦1,500) → Gold (₦3,500) → Premium (₦7,000)**

- Activating a plan generates a styled PDF receipt (uploaded to Cloudinary)
- Confirmation email sent via branded HTML template
- Subscription expiry checked on every authenticated request
- Expired subscriptions auto-downgrade to Basic

### Email Templates
All emails use an inline-CSS branded HTML wrapper matching NexWAD's design system:
- OTP verification
- Welcome email
- Subscription confirmation (with receipt summary)
- Purchase receipt
- Password reset

### Admin Panel
Roles with escalating permissions:
- **CS**: Read users, view reports
- **Moderator**: + Ban/unban users, resolve reports, feature listings
- **Admin**: + Change roles, view audit logs, full stats
- **Super Admin**: All permissions + platform analytics

Every destructive admin action is logged to `AdminLog` with IP, user agent, and details.

---

## API Reference (summary)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Initiate signup (sends OTP) |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/listings` | opt | Feed (ranked) |
| POST | `/api/listings` | ✓ | Create listing + image upload |
| GET | `/api/posts/feed` | ✓ | Ranked social feed |
| POST | `/api/posts` | ✓ | Create post |
| GET | `/api/lostfound` | opt | Lost & Found items |
| POST | `/api/lostfound` | ✓ | Report lost/found |
| GET | `/api/chat` | ✓ | All conversations |
| POST | `/api/chat/start` | ✓ | Start/find chat |
| POST | `/api/chat/:id/messages` | ✓ | Send message |
| GET | `/api/subscriptions/plans` | — | Available plans |
| POST | `/api/subscriptions` | ✓ | Subscribe to plan |
| GET | `/api/admin/stats` | admin | Platform analytics |
| GET | `/api/admin/users` | cs+ | User management |

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Replace JWT secrets with 256-bit random strings
- [ ] Configure real payment gateway (Paystack recommended for Nigeria)
- [ ] Set up MongoDB Atlas with IP allowlist
- [ ] Use Upstash Redis (serverless-friendly)
- [ ] Enable Cloudinary upload presets for size/format restrictions
- [ ] Configure custom SMTP domain (not Gmail for production volume)
- [ ] Set up log aggregation (Logtail, Papertrail, etc.)
- [ ] Add HTTPS / reverse proxy (nginx or Caddy)
- [ ] Schedule cron job to notify expiring subscriptions (3 days before)
- [ ] Run `npm audit fix` on both frontend and backend

---

© 2025 NexWAD · Built for AFIT Kaduna
