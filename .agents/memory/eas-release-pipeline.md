---
name: EAS Release Pipeline
description: How to release owens-photofix to the iOS App Store from Replit
---

## Required environment setup before EAS submit
1. `EAS_NO_VCS=1` must be set (Replit blocks git commits; this uses shallow file copy)
2. ASC API key must be written to `/tmp/asc_key.p8` from the `ASC_API_KEY_P8` secret
   - The secret has spaces instead of newlines — extract header/body/footer with regex then restore newlines
   - The release script (Step 5) now writes this automatically from `process.env.ASC_API_KEY_P8`

## Release command
```
pnpm --filter @workspace/owens-photofix run release:ios -- --yes
```

## Build vs Submit failures
- If EAS submit shows "Something went wrong when submitting your app to Apple App Store Connect" consistently, check App Store Connect — the first submission may have succeeded (EAS times out waiting for Apple but the binary lands).
- The EAS CLI runs submission on Expo servers; "Something went wrong" with no detail means Apple rejected it, often because the binary was already received.

**Why:** Replit blocks git commits system-wide; EAS_NO_VCS=1 bypasses git requirement. ASC key secret is stored with spaces instead of newlines due to how Replit stores multiline secrets.
