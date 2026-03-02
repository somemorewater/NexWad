# NexWAD

NexWAD is an AFIT student platform for marketplace trading, social posting, lost-and-found, role-based seller tools, and admin moderation.

## Repository Layout

```text
Code/
├── web/      # React + Vite frontend
├── server/   # Express + MongoDB backend
├── mobile/   # Mobile workspace
└── python/   # Python workspace
```

## Stack

- Frontend: React 18, Vite, React Router, Axios, Socket.IO client.
- Backend: Node.js, Express, Mongoose, Redis, Socket.IO, Cloudinary.
- Security: JWT auth, rate limiting, API key gateway for `/api`, role-based access control.
- Payments: Paystack verification flows for subscriptions and pin credits.

## Documentation

- Technical stack and implementation details: [TECH_STACK_AND_TECHNICALS.md](/home/water/Documents/NexWAD/Code/TECH_STACK_AND_TECHNICALS.md)
- Full web app feature list: [WEB_APP_FEATURES.md](/home/water/Documents/NexWAD/Code/WEB_APP_FEATURES.md)

## Quick Start

### 1. Start backend

```bash
cd server
npm install
npm run dev
```

### 2. Start frontend

```bash
cd web
npm install
npm run dev
```

Frontend default dev URL is `http://localhost:5173`.
Backend default dev URL is `http://localhost:5000`.

## Required Environment

Set these before running full features:

- In `server/.env`: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `CLIENT_URL`, `PAYSTACK_SECRET_KEY`, `API_KEYS`, email + Cloudinary credentials.
- In `web/.env`: `VITE_API_URL`, `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_API_KEY`.

`VITE_API_KEY` must match one of the values in `server` `API_KEYS`.

## Core Routes (Web)

- Public: `/`, `/login`, `/signup`, `/marketplace`, `/marketplace/:listingId`, `/social`, `/lost-found`, `/legal`.
- Authenticated: `/home`, `/chat`, `/profile/:userId?`, `/profile/settings`, `/profile/account-manager`, `/profile/subscription`, `/profile/become-seller`.
- Seller-only: `/dashboard`.
- Admin: `/admin/*`, `/super-admin/*`.

## License

Internal AFIT student project.
