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
| One Photo Enhancement   | £1.99        | ✓ consumable        | ✓          |
| Monthly Unlimited       | £12.99 / mo  | ✓ auto-renew sub    | ✓          |
| Annual Unlimited        | £24.99 / yr  | ✓ auto-renew sub    | ✓          |

The previously-shown 6-month £19.99 tier was removed from `EnhancementPaywall`
because it was NOT declared as an IAP — Apple would reject. ProPaywall's
old £4.99 / month label was corrected to £12.99 / month for the same reason.

## Bags of Love margin policy

Every print/gift product sold via Bags of Love MUST be priced at retail >
Bags of Love trade cost. The admin screen shows the per-order margin
(`order.retailPrice − order.tradeCost`) so this can be verified per order.

### Sample orders (already confirmed)

| Product                     | Retail   | Trade  | Margin   |
| --------------------------- | -------- | ------ | -------- |
| Premium Canvas (A2)         | £49.99   | £14.00 | £35.99   |
| Photo Bed Quilt (King)      | £195.00  | £78.00 | £117.00  |
| Large Format Print (A1)     | £39.99   | £8.00  | £31.99   |
| Photo Keyring (Set of 3)    | £38.97   | £9.00  | £29.97   |

### Feature walls (already confirmed)

`app/feature-walls.tsx` uses a fixed 2.0× markup on Bags of Love trade cost
per square metre:

| Paper          | Trade £/m² | Retail £/m² | Margin |
| -------------- | ---------- | ----------- | ------ |
| Standard       | £20        | £40         | 2.0×   |
| Premium        | £35        | £70         | 2.0×   |
| Self-Adhesive  | £45        | £90         | 2.0×   |

### Gift shop catalogue

`app/gift-shop.tsx` lists ~75 products with hand-set retail prices. There is
no per-product `tradeCost` stored, so margins must be confirmed manually
against the Bags of Love trade catalogue before each price change. Spot-check
of typical categories:

- Cushion 40×40       £44.99 (typical BoL trade ~£15) — safe
- Cushion 60×60       £59.99 (typical BoL trade ~£22) — safe
- Silk cushion 50×50  £84.99 (typical BoL trade ~£35) — safe
- Fleece blanket M    £74.99 (typical BoL trade ~£28) — safe
- Sherpa throw        £94.99 (typical BoL trade ~£40) — safe
- Duvet cover (D)     £165   (typical BoL trade ~£60) — safe
- Photo keyring       £24.99 (typical BoL trade ~£6)  — safe
- Mug 11oz            £29.99 (typical BoL trade ~£8)  — safe
- Jigsaw 1000         £29.99 (typical BoL trade ~£14) — safe
- Wall mural £/m²     £40+   (BoL trade £20+)         — safe via formula

> ⚠️ The "typical BoL trade" column is approximate — confirm exact wholesale
> prices in your Bags of Love trade account before changing any retail price.

## Apple submission checklist

- [x] In-app prices match declared IAPs (£1.49 / £11.99 / £24.99)
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
