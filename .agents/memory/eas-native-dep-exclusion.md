---
name: EAS worker package.json exclusions
description: Packages that must be excluded from the standalone package.json sent to EAS build workers to prevent npm ci from crashing.
---

## Rule
`eas-cli` must never appear in the standalone `package.json` that the release script sends to EAS.

**Why:** `eas-cli` pulls in `better-sqlite3` (a native C++ add-on). When `npm ci --include=dev` runs on the EAS Mac build worker, node-gyp compiles `better-sqlite3` and can trigger `npm error Exit handler never called!`, crashing npm before any packages are installed. The empty `node_modules` then causes "Read app config" to fail with `PLUGIN_NOT_FOUND` for `expo-router`.

**How to apply:** The release script's `buildStandalonePackageJson` maintains an `EAS_WORKER_EXCLUDE` Set. Add any future package that has native addons or is only needed locally (not on the EAS worker) to this Set.

## Confirmed root cause
Log phase: `INSTALL_DEPENDENCIES` — `npm ci --include=dev` exits with "Exit handler never called!", then `READ_APP_CONFIG` fails because `node_modules` is empty.
