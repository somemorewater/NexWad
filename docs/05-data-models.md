# 05 - Data Models

This section summarizes main Mongoose models and important fields.

## User (`models/User.js`)

Primary profile/auth/subscription model.

Key fields:

- Identity: `name`, `username`, `email`, `password`, `matricNumber`
- Academic profile: `department`, `level`
- Seller profile: `sellerCategories` (array of listing categories)
- Media/profile: `avatar`, `bio`, poster fields
- Access: `role`, `buyerType`, `sellerTier`
- Subscription: `subscription`, `subscriptionStatus`, `subscriptionExpiry`
- Social graph: `followers`, `following`
- Metrics: `savedListings`, `totalSales`, `rating`, pin credit fields

Behavioral methods:

- `comparePassword`
- `applyPlanAccess`
- `checkSubscription` (handles expiry downgrade and related listing/pin changes)

## Listing (`models/Listing.js`)

Marketplace product listing.

Key fields:

- `title`, `description`, `price`, `originalPrice`
- `category` (enum from shared category constants)
- `condition`
- `images[]`, `imagePublicIds[]`
- `seller` (ref User)
- status fields: `status`, `subscriptionPaused`
- boost fields: `isPremium`, `premiumUntil`, `boostScore`
- engagement fields: `views`, `saves`, `chatCount`

## Post (`models/Post.js`)

Social post with optional image and comments.

Key fields:

- `author` (ref User)
- `content`
- `image`, `imagePublicId`
- `likes[]`
- `comments[]`
- `views`, `shares`, `engagementScore`
- moderation fields: `reports[]`, `reportCount`, `removed`

## LostFound (`models/LostFound.js`)

Lost and found report.

Key fields:

- `type`: `lost | found`
- `category`: required enum (lost/found categories)
- `title`, `description`, `location`
- `reporter` (ref User)
- status: `active | resolved | expired`
- `claimants[]`
- `reports[]`, `reportCount`
- `expiresAt`

Note:

- Model currently still contains `image` and `imagePublicId` fields for legacy data compatibility.

## Pin (`models/Pin.js`)

Pin records for visibility boosts.

Key concepts:

- `targetType`: `listing | post | lostfound`
- `targetId`
- `status`: active/cancelled/expired
- lifecycle timestamps: `pinnedAt`, `activatedAt`, `expiresAt`
- billing fields including payment reference

## Subscription (`models/Subscription.js`)

Plan/subscription record tied to user and payment lifecycle.

## Other Models

- `Chat`, `Review`, `SellerApplication`, `Notification`, `UserLog`, `AdminLog`, `PinCreditPurchase`

For exact schema shape, use:

- `server/models/*.js`
