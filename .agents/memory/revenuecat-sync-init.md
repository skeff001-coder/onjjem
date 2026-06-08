---
name: RevenueCat sync init required
description: SubscriptionProvider calls the RC SDK immediately on mount — configure() must run before any component renders or iOS crashes.
---

## The rule

Call `initializeRevenueCat()` synchronously at **module scope** in `_layout.tsx` (outside the component function), guarded by `Platform.OS !== "web"` and wrapped in `try/catch`.

Do NOT rely on a `useEffect` to configure RevenueCat — effects run after the first render, by which point `SubscriptionProvider` has already tried to call `Purchases.getCustomerInfo()` and `Purchases.getOfferings()`.

## Why

`useSubscriptionContext()` (called inside `SubscriptionProvider`) fires two React Query queries immediately on mount:
- `Purchases.getCustomerInfo()`
- `Purchases.getOfferings()`

On iOS, calling either of these before `Purchases.configure()` throws a native error that crashes the app before any screen renders — the user sees a blank white square and "App crashed" dialog.

## How to apply

In `artifacts/canine-encyclopedia/app/_layout.tsx`, at module level after imports:

```ts
if (Platform.OS !== "web") {
  try {
    initializeRevenueCat();
  } catch {
    // Keys not available in this build environment — safe to skip
  }
}
```

Keep `initializeRevenueCatAsync()` in a `useEffect` for the async region-restore work (AsyncStorage read + syncAttributesAndOfferingsIfNeeded). That part is safe to defer.
