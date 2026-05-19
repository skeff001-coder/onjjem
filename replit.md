# Owens Photofix

A mobile iPhone app that uses AI to sharpen blurry photos and add colour to old black-and-white photos, then lets you share the result directly to WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from workflow)
- `pnpm --filter @workspace/owens-photofix run dev` — run the Expo mobile app (via workflow)
- `pnpm run typecheck` — full typecheck across all packages
- No external API keys required — image processing runs entirely on the server with `sharp`

## Releasing to the App Store

Run from the Replit shell (after Apple credentials have been stored via the one-time Mac setup):

```bash
pnpm --filter @workspace/owens-photofix run release:ios
```

This automatically bumps the **patch** version and **buildNumber** in `app.json`
(e.g. version 1.0.0 → 1.0.1, buildNumber 9 → 10), copies the artifact to a clean `/tmp`
directory (avoiding Replit's large workspace and git restrictions), then chains
`eas build --platform ios --profile production --non-interactive` followed by
`eas submit --platform ios --profile production --non-interactive`.

For new-feature or breaking-change releases, pass the flag directly to `release:ios`:

```bash
# minor bump (e.g. 1.0.1 → 1.1.0) — new features
pnpm --filter @workspace/owens-photofix run release:ios -- --minor

# major bump (e.g. 1.1.0 → 2.0.0) — breaking changes
pnpm --filter @workspace/owens-photofix run release:ios -- --major
```

To verify the whole pipeline is healthy without spending EAS build credits, use `--dry-run`:

```bash
pnpm --filter @workspace/owens-photofix run release:ios -- --dry-run
```

This runs Steps 1-4 (version bump, rsync copy to /tmp, standalone package.json generation, git init) and prints the resolved `package.json` to stdout, then exits cleanly without calling EAS.

Requirements: `EXPO_TOKEN` must be set in Replit Secrets (already stored), `eas-cli` is installed.
The first-time interactive build (Apple 2FA) must be done from a Mac — see `artifacts/owens-photofix/APP_STORE_SUBMISSION.md`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, Expo Router (file-based routing)
- API: Express 5 (handles Replicate AI calls server-side)
- Image processing: `sharp` (Node.js, no external service needed) — unsharp mask sharpening, colour restoration
- Sharing: expo-sharing (native share sheet, includes WhatsApp)
- Image picking: expo-image-picker

## Where things live

- Mobile screens: `artifacts/owens-photofix/app/index.tsx` — single main screen
- Theme: `artifacts/owens-photofix/constants/colors.ts` — dark photo editor palette
- AI processing route: `artifacts/api-server/src/routes/process.ts`
- API routes: `artifacts/api-server/src/routes/index.ts`

## Architecture decisions

- API server proxies Replicate calls to keep the API key server-side (not exposed to client)
- Single-screen app (no tabs) — photo tool doesn't need multi-section navigation
- Dark theme (near-black background) fits the photo editing aesthetic
- `expo-sharing` native share sheet used for WhatsApp — works without installing extra SDKs
- Express body limit raised to 30MB to handle base64 image payloads

## Product

Users upload a photo from their library, choose between "Sharpen" (fix blurry/low-res photos using Real-ESRGAN) or "Colorize" (add colour to old black-and-white photos using DDColor), process with one tap, then share the enhanced result to WhatsApp via the native share sheet.

## User preferences

- Big, easy-to-see buttons (large padding, prominent colours)
- iPhone-first design

## Gotchas

- Replicate processing can take 30-60 seconds — the route uses `Prefer: wait=30` then polls
- expo-file-system 18.1.11 may show a version warning at startup (expected ~19.0.22) — this is cosmetic only, the app works fine
- REPLICATE_API_TOKEN must be set in Replit Secrets before AI processing will work
