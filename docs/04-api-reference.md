# 04 - API Reference

Base URL prefix: `/api`

## Health

- `GET /health`

## Auth (`/auth`)

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/resend-otp`

## Users (`/users`)

- `GET /users/search`
- `GET /users/:id`
- `PUT /users/me`
- `PUT /users/me/password`
- `POST /users/me/upgrade-seller`
- `DELETE /users/me`
- `POST /users/me/avatar`
- `PUT /users/me/poster/featured`
- `POST /users/me/poster/generate`
- `DELETE /users/me/poster`
- `GET /users/:id/poster`
- `GET /users/:id/poster/image`
- `POST /users/:id/report`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /users/:id/followers`
- `GET /users/:id/following`

## Listings (`/listings`)

- `GET /listings`
- `GET /listings/saved`
- `GET /listings/mine`
- `GET /listings/:id`
- `POST /listings`
- `PUT /listings/:id`
- `DELETE /listings/:id`
- `POST /listings/:id/save`
- `DELETE /listings/:id/save`
- `POST /listings/:id/report`

## Posts (`/posts`)

- `GET /posts/feed`
- `GET /posts/mine`
- `GET /posts/user/:id`
- `GET /posts/:id`
- `POST /posts`
- `PUT /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/like`
- `DELETE /posts/:id/like`
- `POST /posts/:id/comments`
- `GET /posts/:id/comments`
- `POST /posts/:postId/comments/:commentId/like`
- `DELETE /posts/:postId/comments/:commentId/like`
- `POST /posts/:postId/comments/:commentId/share`
- `POST /posts/:postId/comments/:commentId/replies`
- `DELETE /posts/:postId/comments/:commentId`
- `POST /posts/:id/report`

## Lost & Found (`/lostfound`)

- `GET /lostfound`
- `GET /lostfound/:id`
- `POST /lostfound`
- `PUT /lostfound/:id`
- `DELETE /lostfound/:id`
- `POST /lostfound/:id/claim`
- `POST /lostfound/:id/resolve`
- `POST /lostfound/:id/report`

## Chat (`/chat`)

- `GET /chat`
- `POST /chat/start`
- `GET /chat/:chatId/messages`
- `POST /chat/:chatId/messages`
- `PUT /chat/:chatId/read`
- `POST /chat/support`

## Subscriptions (`/subscriptions`)

- `GET /subscriptions/plans`
- `GET /subscriptions/current`
- `POST /subscriptions`
- `POST /subscriptions/apply-seller`
- `GET /subscriptions/my-application`
- `DELETE /subscriptions/current`
- `GET /subscriptions/:id/receipt`

## Pins (`/pins`)

- `GET /pins/plans`
- `GET /pins/my`
- `POST /pins/credits/initialize`
- `POST /pins/credits/verify`
- `POST /pins/credits/paystack-webhook`
- `POST /pins/initialize`
- `POST /pins/:id/extend`
- `DELETE /pins/:id`

## User Logs (`/user-logs`)

- `GET /user-logs/me`
- `POST /user-logs/event`
- `GET /user-logs/admin`
- `GET /user-logs/analytics` (API key required)
- `GET /user-logs/analytics/summary` (API key required)

## Notifications (`/notifications`)

- `GET /notifications`
- `PUT /notifications/read-all`

## Admin (`/admin`)

- `GET /admin/stats`
- `GET /admin/users`
- `PUT /admin/users/:id/role`
- `GET /admin/seller-applications`
- `PUT /admin/seller-applications/:id/approve`
- `PUT /admin/seller-applications/:id/reject`
- `POST /admin/users/:id/ban`
- `POST /admin/users/:id/warn`
- `DELETE /admin/users/:id/ban`
- `GET /admin/listings`
- `PUT /admin/listings/:id/feature`
- `GET /admin/reports`
- `PUT /admin/reports/:id`
- `GET /admin/logs`

## Notes

- Most mutating routes require Bearer token auth.
- Multipart is required for endpoints that upload files.
- Validation errors are returned as:

```json
{
  "error": "Validation failed",
  "details": [{ "field": "...", "message": "..." }]
}
```
