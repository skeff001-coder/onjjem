# ONJJEM Pricing Audit

Last reviewed: May 2026

## Source of truth

All subscription / IAP prices live in `lib/pricing.ts`. The three paywalls
(`SubscribeModal`, `EnhancementPaywall`, `ProPaywall`) and `app/index.tsx`
upgrade alerts read amounts from this constant. `app-store-listing.md` is
markdown and cannot import TS — it is a manually-maintained duplicate that
MUST be kept in sync by hand. Period strings such as "/month", "/year",
"per photo" are currently still inlined at the call sites for readability.

## Subscription / IAP pricing (matches declared App Store IAPs)

| Plan                    | Price        | Declared in listing | Apple-safe |
| ----------------------- | ------------ | ------------------- | ---------- |
| One Photo Enhancement   | £1.49        | ✓ consumable        | ✓          |
| Monthly Access          | £12.99 / mo  | ✓ auto-renew sub    | ✓          |

The previously-shown 6-month £19.99 tier was removed from `EnhancementPaywall`
because it was NOT declared as an IAP — Apple would reject. ProPaywall's
old £4.99 / month label was corrected to £12.99 / month for the same reason.

## Print-on-Demand (Prodigi)

Print ordering is handled via Prodigi Print-on-Demand for fully automatic
fulfillment. Products and pricing are managed in Prodigi's dashboard.
No margin tracking is stored in this app.

## Apple submission checklist

- [x] In-app prices match declared IAPs (£1.49 / £12.99)
- [x] No undeclared paywall tiers (6-month removed)
- [x] All paywalls use the shared `PRICING` source
- [x] Subscription auto-renew terms shown on every sub paywall
- [x] Restore Purchases button present (ProPaywall)
- [x] Privacy policy link present
- [x] App Store listing mentions Apple as payment processor
- [ ] Real StoreKit / IAP integration wired up — paywalls and the upgrade
       alerts in `app/index.tsx` currently show placeholder confirmation
       dialogs only. The App Review note in `app-store-listing.md` must be
       revised before submission to honestly state that the buttons show a
       confirmation dialog (not the Apple sheet) until StoreKit is wired in,
       OR StoreKit must be implemented before submission.
