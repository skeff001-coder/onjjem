---
name: expo-audio & permissions gotchas
description: SDK54 audio API choice and the silent microphone-permission trap that causes iOS App Store rejection
---

- SDK54 uses `expo-audio` (not `expo-av`). Playback uses `useAudioPlayer` + `setAudioModeAsync`.
- Requesting an undeclared native permission crashes iOS.

## expo-audio silently adds a microphone permission (App Store rejection risk)

Listing the plugin bare as `"expo-audio"` makes its config plugin add
`NSMicrophoneUsageDescription` (iOS) and `RECORD_AUDIO` (Android) **by default**,
even when the app only PLAYS sound and never records. On iOS this triggers a
"<App Name> would like to access your microphone" prompt and gets the build
rejected by Apple.

**Why:** the `withAudio` plugin defaults `microphonePermission` to a usage string
and `recordAudioAndroid` to `true` when no options are passed.

**How to apply:** for playback-only apps, configure the plugin explicitly:
```json
["expo-audio", { "microphonePermission": false, "recordAudioAndroid": false }]
```
Setting `microphonePermission: false` removes the iOS key entirely. Note this is
independent of `expo-camera`'s own `microphonePermission: false` — that does NOT
suppress the expo-audio one. After fixing config, bump the iOS `buildNumber`
(eas.json uses `appVersionSource: "local"`, so it is NOT auto-incremented) and
make a fresh build; an already-downloaded/old build keeps the old permission.
