# 03 - Frontend Web

## Stack

- React 18
- React Router 6
- Axios
- Socket.IO client
- Vite
- date-fns
- react-hot-toast

Core files:

- App shell/routes: `web/src/App.jsx`
- API wrappers: `web/src/api/endpoints.js`
- Auth context: `web/src/context/AuthContext.jsx`
- Socket context: `web/src/context/SocketContext.jsx`
- Global styles: `web/src/styles/*`

## Routing Model

Public routes include:

- `/`
- `/login`, `/signup`
- `/marketplace`, `/marketplace/:listingId`
- `/social`, `/social/post/:postId`
- `/lost-found`
- `/search`
- profile routes (`/:username`, `/profile/:userId`)

Protected routes include:

- `/home`
- seller routes (`/dashboard`, `/profile/seller-tools`)
- `/chat`, `/notifications`
- `/cs-chat`
- profile management pages

Admin-protected routes:

- `/admin/*`
- `/super-admin/*`

Support role routes:

- `/cs` (CS desk)

## Major Page Modules

- `Marketplace.jsx`: listing discovery + create modal with image compression/upload progress/retry
- `ProductDetails.jsx`: listing detail and owner edit modal
- `Social.jsx` + `PostDetails.jsx`: social feed and per-post discussion
- `LostFound.jsx`: lost/found lifecycle UI
- `Profile.jsx`: user/seller profile, edit modal, social actions
- `Dashboard.jsx`: seller analytics + pin management
- `BuyerHub.jsx`: buyer shortcuts, previews, premium actions
- `CSChat.jsx`: customer care chat page for users
- `CSDesk.jsx`: customer support desk inbox for CS agents

## Shared UI Components

- `Card.jsx`
  - listing card
  - post card
  - owner actions in three-dot menus
  - edit/delete/pin actions integrated in dropdown
- `ReportActionMenu.jsx`
  - supports report flow and custom action lists
- `Modal.jsx`
  - common dialog shell

## API Access Pattern

- All API calls flow through `web/src/api/index.js` and `web/src/api/endpoints.js`
- `endpoints.js` exposes domain-specific client objects:
  - `usersAPI`, `listingsAPI`, `postsAPI`, `lostFoundAPI`, `chatAPI`, etc.
- Multipart is auto-detected for `FormData` payloads via helper config.

## PWA

- PWA manifest: `web/public/manifest.webmanifest`
- Service worker: `web/public/sw.js`
- Install UI: `web/src/utils/pwaInstall.js`, plus login/signup install toasts and sidebar install button.

## Category Constants

Frontend category source of truth:

- `web/src/constants/categories.js`

Used by:

- marketplace filters and creation select
- seller profile category picker
- lost/found category select + icon mapping

## UX Behavior Notes

- Listing creation enforces image constraints and frontend compression
- Upload progress is surfaced in create listing modal
- Failed listing upload attempts retry automatically
- Owner edit actions are grouped under three-dot menus on cards
- Some old flows still use full-page reload in lost/found edit/delete (see Known Issues doc)
