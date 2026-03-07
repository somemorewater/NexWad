# 07 - Known Issues & Audit Checklist

This file tracks current technical risks observed in the present code state and gives a repeatable audit checklist.

## Current Known Issues

### 1. Data migration risk after category/schema changes

Risk:

- Existing documents with old categories or missing required new fields may fail on update (`save()` validation).

Impact areas:

- `Listing.category` enum updates
- `LostFound.category` required field
- user seller category move from single -> array

Mitigation:

- Add and run migration scripts to normalize:
  - listing categories
  - lostfound category defaults
  - `sellerCategory` -> `sellerCategories`

### 2. Legacy lost/found image fields still present

Status:

- Lost/found create/edit now category/icon based, but model still includes `image` fields for compatibility.

Action:

- Decide whether to remove fields after migration window.

### 3. Lost/found page uses hard reload in edit/delete

Status:

- UI still uses `window.location.reload()` after mutation.

Action:

- Replace with local state updates for smoother UX.

### 4. In-process queue is not distributed

Status:

- Background queue currently runs in-process (`jobQueue.js`), not in a dedicated worker service.

Implication:

- Jobs are not shared across horizontally scaled instances and are not durable across process restarts.

Action:

- For high scale or strict durability needs, move to Redis-backed worker queue (BullMQ or equivalent).

## Audit Checklist

Run this checklist before releasing:

1. Syntax safety
   - `node -c` on touched backend route/model files
2. Route inventory sanity
   - verify no duplicate/conflicting route definitions
3. Category consistency
   - backend constants match frontend constants
4. Auth/role checks
   - mutating routes protected correctly
5. Upload constraints
   - size/count validation enforced both client and server
6. Error shape consistency
   - validation and auth errors return expected JSON shape
7. Critical user journeys
   - auth, listing, post, lost/found, chat, subscription, pins, profile edit
8. Data compatibility
   - migrations applied on staging/prod before strict enum changes
9. Caching correctness
   - verify cached endpoints return expected freshness
   - verify namespace invalidation after every relevant mutation path
10. Background processing correctness
   - verify user logs and notifications continue working when queue is busy

## Suggested Migration Tasks

- `users`: map `sellerCategory` -> `sellerCategories[]`
- `listings`: remap retired categories to new taxonomy values
- `lostfound`: set default category for old records with null/undefined

## Post-Migration Cleanup

After all environments are migrated:

- remove `sellerCategory` fallback input handling
- remove legacy lost/found `image` and `imagePublicId` fields if truly deprecated
- remove dead Cloudinary cleanup paths tied only to deprecated fields
