---
name: Reanimated 4 Expo plugin incompatibility
description: react-native-reanimated 4.x cannot be listed as an Expo config plugin in app.json
---

## Rule
Do NOT add `react-native-reanimated` to the `plugins` array in `app.json` when using version 4.x.

**Why:** Reanimated 4 removed the `app.plugin.js` file. Expo's plugin resolver tries to import the main module as a fallback, which fails because it imports `publicGlobals` — an internal module that doesn't exist in the ESM build. This causes `PluginError: Unable to resolve a valid config plugin` and crashes `expo start`.

**How to apply:** Reanimated 4 auto-links on iOS and Android without any plugin entry. The babel plugin is also NOT needed for Reanimated 4 — do not add `react-native-reanimated/plugin` to babel.config.js. Only Reanimated 3.x needed both the Expo plugin and the babel plugin.
