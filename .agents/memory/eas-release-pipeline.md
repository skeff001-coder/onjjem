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

## Run long builds as a Replit workflow, NOT a bash background process
The release script runs ~25–40 min (npm install + EAS cloud build + submit), far past
the 2-min bash tool limit. `nohup ... &` and even `setsid` get reaped when the bash tool
call returns (the sandbox kills processes spawned within a call), so the build dies during
npm install every time. Run it via `configureWorkflow({ name, command, outputType:"console" })`
(no waitForPort) — the workflow persists across tool calls. Poll with `getWorkflowStatus`,
and `removeWorkflow` when finished so it can't auto-re-trigger on package installs.
**Why:** background processes started in a bash tool call do not survive the call ending,
regardless of nohup/setsid; workflows are Replit-managed and persist.

## --skip-bump quirk
`--skip-bump` keeps app.json version but the changelog step still computes the *next* patch
version and inserts a spurious generic entry (e.g. v1.0.29 while building 1.0.28). Harmless
(dormant since it doesn't match app.json) but delete it from WhatsNewModal.tsx afterward.

## Build vs Submit failures
- If EAS submit shows "Something went wrong when submitting your app to Apple App Store Connect" consistently, check App Store Connect — the first submission may have succeeded (EAS times out waiting for Apple but the binary lands).
- The EAS CLI runs submission on Expo servers; "Something went wrong" with no detail means Apple rejected it, often because the binary was already received.

**Why:** Replit blocks git commits system-wide; EAS_NO_VCS=1 bypasses git requirement. ASC key secret is stored with spaces instead of newlines due to how Replit stores multiline secrets.
