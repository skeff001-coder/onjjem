# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- **RevenueCat sandbox routing via env vars**: `eas.json` controls which RevenueCat key each build profile receives. The `preview` profile sets only `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` (never the iOS or Android live keys), so TestFlight testers and Android internal testers always go through the platform sandbox — they are never charged real money. The `production` profile sets `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (App Store) and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (Google Play), triggering live billing on each platform. `getRevenueCatApiKey()` routes to the correct key: if the platform-specific key is absent (as in `preview`), it falls through to the test key, guaranteeing sandbox on both iOS and Android. Any new EAS profile that should stay in sandbox must follow the same pattern: set the test key, omit both platform keys. See `artifacts/canine-encyclopedia/lib/revenuecat.tsx` → `getRevenueCatApiKey()` for the full routing logic.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
