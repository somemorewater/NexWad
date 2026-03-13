# NexWAD Web App Features

## 1. Access Modes

- Guest access to major content pages without login.
- Authenticated user mode with buyer hub and personal tools.
- Seller mode with seller dashboard and seller controls.
- Admin and super admin control panels.

## 2. Authentication and Account

- Signup with OTP email verification.
- Login using email, username, or matric number.
- Resend OTP.
- Forgot password and reset password.
- Logout.
- Update profile details.
- Change password.
- Upload/update avatar.
- Delete account with password confirmation.

## 3. Role and Permission Model

- Buyer default user flow.
- Premium buyer capability support.
- Seller-only dashboard route and controls.
- Admin routes protected by role.
- Super admin-only role changes.

## 4. Buyer Hub and Navigation

- Buyer Hub as main landing page for buyers.
- Section previews for Marketplace, Social, and Lost & Found.
- Quick links to major platform sections.
- Role-adaptive navbar labels and paths.
- Sidebar-based app navigation across pages.
- PWA install prompt on sign-in and sign-up.
- Sidebar install button for supported devices.

## 5. Marketplace Features

- Public marketplace browsing.
- Product detail page with image gallery.
- Category filtering and sorting.
- Search support.
- Guest browsing notice and gated actions.
- Save/unsave listings.
- Report listing.
- Listing view tracking.
- Seller listing creation (seller-only).
- Seller listing management (edit/delete own listing).
- Pinned listings strip at top with visual highlight.
- Pinned listing modal with product details and seller action.
- `Get Product` action to open chat with seller.

## 6. Social Feed Features

- Public and authenticated social feed modes.
- Create post with text and optional image.
- Like/unlike posts.
- Add/delete comments.
- Comment likes, replies, shares, and views.
- Delete own post.
- Report post.
- Post detail and view tracking.
- Pinned posts support in feed ordering.
- New-posts toast prompt for refresh.

## 7. Lost & Found Features

- Public list of lost/found reports.
- Post lost/found item (authenticated).
- Edit/delete own item.
- Claim item workflow.
- Reporter can resolve item.
- Item detail views and tracking.
- Pinned lost/found items support.

## 8. Chat and Messaging

- Start or reuse direct chat from listing/product flows.
- Chat list with participants and listing context.
- Message sending with text and media support.
- Read/unread tracking.
- Realtime message delivery via websockets.
- Customer care chat on dedicated CS chat page (separate from normal chats).

## 9. Seller Experience

- Seller application flow with document upload and payment reference.
- Seller application ID: Matric No or NIN with corresponding ID image.
- One-time approval model for first seller activation.
- Seller subscription plans and renewals.
- Seller upgrade logic with proration (no full rebill when applicable).
- Seller dashboard with:
- analytics summaries
- active/expired listings status
- pin management/usage visibility
- subscription status
- revenue-related overview cards

## 10. Pinning System

- Pin-eligible user types: sellers and premium users.
- Pin credits purchase flow.
- Pin credits balance tracking.
- Pin content types:
- marketplace listings
- social posts
- lost/found posts
- Pin duration in 24-hour units.
- Extend active pin duration.
- Unpin action.
- Pin expiry handling and automatic hide behavior.
- Pinned content displayed prominently for all viewers.
- Owner-only remaining-time visibility.

## 11. Subscription and Billing

- Plan listing and current subscription view.
- Buyer premium subscription support.
- Seller tiers with durations.
- Subscription receipt generation.
- Receipt download endpoint.
- Subscription confirmation email notifications.
- Seller approval email notification.

## 12. Legal and Compliance Pages

- Unified legal page route.
- Terms and Conditions section.
- Privacy Policy section.
- Cookies Policy section.
- Data Retention Policy section.
- Legacy legal paths redirect to unified legal page.

## 13. Admin Panel Features

- Platform stats overview.
- User search and filtering.
- Ban/unban user controls.
- Seller applications review:
- view submitted details
- inspect uploaded verification image
- approve/reject actions
- Listings moderation and featuring.
- Reports queue and resolution actions.
- Audit log viewing.
- Navigation path back to normal app area from admin panel.

## 14. User Activity Logging

- Client activity event reporting endpoint.
- Server request activity logging middleware.
- User-level activity storage with timestamp and metadata.
- Admin access to user logs.
- Grouped-by-user activity summary mode.
- Private analytics endpoints protected by API key.

## 15. Security and Reliability Features

- JWT auth guards on protected routes.
- Role-based middleware for restricted resources.
- API key protection for backend APIs.
- Rate limiting for global and auth endpoints.
- CORS and security headers.
- Cloudinary asset cleanup on content deletion.
- PWA manifest + service worker for offline fallback.

## 16. Guest vs Authenticated Differences

- Guests can browse marketplace, social, lost/found, and legal pages.
- Guests cannot perform protected actions like chat start, posting, saving, pinning, or account operations.
- Protected actions display guidance and redirect to login when required.
