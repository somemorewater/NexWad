# 08 - Mobile App

## Location

Primary mobile app lives in `mobile/nexwad-app`.

There is also a legacy placeholder at `mobile/` with a minimal README.

## Stack

- Expo (SDK 52)
- React Native
- Expo Router
- TypeScript

Key files:

- App entry: `mobile/nexwad-app/app`
- App config: `mobile/nexwad-app/app.json`
- Assets: `mobile/nexwad-app/assets`
- Source modules: `mobile/nexwad-app/src`

## Scripts

From `mobile/nexwad-app`:

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`

## Notes

- This repo includes wiring scripts in `mobile/nexwad-app/*.ps1` that appear to sync flows (chat, feed, listings, profile) with backend updates.
- Ensure your `.env` or config is aligned with the backend base URL used by the web app.
