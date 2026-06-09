---
name: Canine-encyclopedia build blockers
description: Compounding issues that broke EAS iOS builds and Replit web deployment for the canine-encyclopedia (What's Up Dog!) app.
---

## Rule 1 — Any plugin in app.json breaks Replit's EAS build silently

Adding ANY entry to the `"plugins"` array in app.json causes Replit Expo Launch (EAS) builds to fail without appearing in expo.dev. Build 13 (no plugins) worked; builds 14–17 (various plugins) never appeared.

**Why:** Replit's EAS pipeline does not support arbitrary plugin configurations — the build silently fails before reaching Apple.

**How to apply:** Keep app.json plugin-free. Add iOS permissions directly to `ios.infoPlist` instead of using plugin-based permission injection.

## Rule 2 — react-native-reanimated imports break the Metro web bundle (EAS + web deploy)

Importing from `react-native-reanimated` in any screen file causes Metro bundling to fail when building the production iOS/Android bundles — even though the dev server works fine. Build 18 was the first to succeed in expo.dev after removing the reanimated import from shop.tsx.

**Why:** The rest of the app uses React Native's built-in `Animated` API. Adding a direct reanimated import is the only usage of that library's Babel worklet compilation, which fails in production bundling without the babel plugin.

**How to apply:** Only use React Native's built-in `Animated` for animations in this project. Never import from `react-native-reanimated` directly in screen files.

## Rule 3 — expo-audio requires NSMicrophoneUsageDescription or iOS kills the app on launch

expo-audio is used in `components/AmbientBarks.tsx` to play bark sounds. When expo-audio is installed (even without the plugin), iOS auto-links the microphone framework. Without `NSMicrophoneUsageDescription` in Info.plist, iOS terminates the app immediately on launch.

**Why:** iOS enforces that every linked framework with sensitive access must declare its purpose string. Missing mic permission = instant crash.

**How to apply:** Keep `NSMicrophoneUsageDescription` in `ios.infoPlist` in app.json permanently. Never remove expo-audio from dependencies — it IS used.

## Rule 4 — expo-camera version must match SDK (v17.x for SDK 54, not v55.x)

`expo-camera` was pinned to `^55.0.18` (SDK 55 version) in a SDK 54 project. This causes Metro to fail building the production bundle with HTTP 500, which fails the Replit web deployment. The correct version is `~17.0.10`.

**Why:** Package versions that don't match the SDK version have incompatible native APIs that Metro cannot resolve at bundle time.

**How to apply:** Always use `expo install` or verify expected versions against the warning in `expo start` output. The warning format is: `expo-camera@X.Y.Z - expected version: ~A.B.C`.

## Rule 5 — Deployment build failures show in Cloud Run build logs, not EAS

Replit web deployment (all artifacts) uses Cloud Run (`listDeploymentBuilds`). iOS TestFlight builds use EAS/Expo Launch (visible at expo.dev). These are completely separate systems with separate failure modes.

**How to apply:** Use `listDeploymentBuilds` + `getDeploymentBuild` to debug web deploy failures. Use expo.dev to debug EAS/TestFlight failures. "No new build record" in Cloud Run means the publish UI failed before queuing, not that EAS failed.

## Current working state (build 19)

- `app.json`: no plugins, buildNumber 19, infoPlist has Camera + PhotoLibrary + Microphone + ITSAppUsesNonExemptEncryption
- `expo-camera`: ~17.0.10
- `expo-audio`: ~1.1.1 (used in AmbientBarks.tsx)
- `shop.tsx`: uses React Native built-in `Animated` (no reanimated)
