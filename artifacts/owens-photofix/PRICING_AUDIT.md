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

### Feature walls (updated May 2026)

`app/feature-walls.tsx` uses fixed retail prices per square metre (AI restoration included):

| Paper                    | gsm  | Trade £/m² | Retail £/m² | Margin  | Notes |
| ------------------------ | ---- | ---------- | ----------- | ------- | ----- |
| Standard 120gsm          | 120  | £18        | £59         | £41/m²  | Confirmed: £288 trade for 4×4m (16m²). BoL public from £14/m². |
| Premium 173gsm           | 173  | ~£22       | £75         | ~£53/m² | Spray the wall. Estimate — confirm in BoL portal. |
| Royal Gold 173gsm        | 173  | ~£24       | £82         | ~£58/m² | Metallic shimmer finish. Estimate — confirm in BoL portal. |
| Faux Grasscloth 275gsm   | 275  | ~£30       | £85         | ~£55/m² | Natural woven texture. Estimate — confirm in BoL portal. |
| Self-Adhesive 350gsm     | 350  | ~£38       | £89         | ~£51/m² | Peel-and-stick. Estimate — confirm in BoL portal. |
| Silk Vista 350gsm        | 350  | £27        | £95         | £68/m²  | Confirmed: £302.58 trade for 408×274cm (11.18m²). BoL RRP £49/m². |

Pricing rationale: BoL's public retail is from £14/m² (repeat patterns) to ~£49/m² (Silk Vista large).
ONJJEM adds AI restoration + bespoke London service, justifying a clear premium above BoL's own retail.
Previous prices (£85/£99/£119 for 3 tiers) replaced with accurate 6-tier range (£59–£95) after BoL portal review.

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
