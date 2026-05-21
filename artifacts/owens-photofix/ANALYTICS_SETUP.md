# Analytics Setup: Country & Device Breakdown via RevenueCat → Mixpanel

## What this gives you

Once connected, every RevenueCat event (purchase, trial start, cancellation, etc.) is
forwarded to Mixpanel in real time. Subscriber attributes set by the app — including
`locale`, `device_model`, `os_version`, `paywall_name`, and the paywall timestamps —
appear as Mixpanel user properties automatically.

From that you can answer:
- Which **countries** (via `locale` region tag, e.g. `en-GB` → UK) convert best
- Which **device models** (e.g. iPhone 15 vs iPhone 14) are most common among subscribers
- Which **iOS version** your subscribers run
- How the `paywall_name` correlates with plan choice (monthly / annual / one_photo)
- A full funnel: **paywall viewed → purchase** per plan, per country, per device

---

## Step 1 — Create a free Mixpanel project

1. Go to [https://mixpanel.com](https://mixpanel.com) and sign up for a free account.
2. Create a new **project** (name it something like "Owens Photofix").
3. In **Project Settings → Access Keys**, copy your **Project Token** (looks like `abc123…`).
   Keep this handy — you'll paste it into RevenueCat in Step 2.

---

## Step 2 — Enable the Mixpanel integration in RevenueCat

1. Open [https://app.revenuecat.com](https://app.revenuecat.com) and select your project
   (app ID **6770767370**).
2. In the left sidebar, click **Integrations**.
3. Click **+ New** and choose **Mixpanel**.
4. Paste your Mixpanel **Project Token** from Step 1.
5. Leave "Send subscriber attributes as user properties" **checked** (it is by default).
6. Click **Save**.

That's it — RevenueCat will now forward all events and subscriber attributes to Mixpanel.
Existing subscribers' attributes will appear as new events come in; historical data is not
back-filled.

---

## Step 3 — Verify attributes appear in Mixpanel

1. Open a test device (or Expo Go) and make sure the app cold-starts at least once so
   `trackAppInstall` fires.
2. In Mixpanel, go to **Users → User Activity** and look up the test user (identified by
   their RevenueCat `app_user_id`).
3. You should see user properties: `locale`, `device_model`, `os_version`, `platform`,
   `install_first_seen_at`.
4. After opening a paywall, you should also see `paywall_name`, `paywall_first_seen_at`,
   `paywall_last_seen_at`, `paywall_view_count`.

---

## Step 4 — Build the paywall → purchase funnel in Mixpanel

1. In Mixpanel, go to **Funnels** and click **+ New Funnel**.
2. Add these steps in order:

   | Step | Event name (as sent by RevenueCat) | Notes |
   |------|--------------------------------------|-------|
   | 1 | `rc_paywall_impression_event` | paywall shown to user |
   | 2 | `rc_initial_purchase_event` | first subscription or one-time purchase |

3. Click **Breakdown** → add `$product_id` to see conversion split by plan:
   - `com.onjjem.photorestoration.monthly`
   - `com.onjjem.photorestoration.annual`
   - `one_photo`

4. Add a second breakdown for `$country_code` (populated automatically by RevenueCat
   from the App Store storefront) to see which countries convert best.

5. Add a third breakdown for `device_model` (subscriber attribute) to compare device types.

---

## Step 5 — Track which paywall screen converts best across countries

This is the core conversion intelligence report. It answers: "Which paywall surface, in
which country, converts visitors to paying subscribers most efficiently?"

### Paywall surfaces in this app

| `paywall_name` value | Component | Plans offered | Has dismissal tracking |
|----------------------|-----------|---------------|------------------------|
| `pro_paywall` | `ProPaywall.tsx` | Monthly only | Yes |
| `enhancement_paywall` | `EnhancementPaywall.tsx` | Monthly / Annual / Per-photo | No (inline wall, no close button) |
| `subscribe_modal` | `SubscribeModal.tsx` | Monthly / Annual / Per-photo | Yes |

### Build the per-surface conversion funnel

1. In Mixpanel, go to **Funnels → + New Funnel**.

2. Add these three steps:

   | # | Event | What it represents |
   |---|-------|--------------------|
   | 1 | `rc_paywall_impression_event` | User saw a paywall |
   | 2 | `rc_initial_purchase_event` | User completed a purchase |

3. Under **Conversion Window**, set **7 days** (RevenueCat's default attribution window).

4. Click **Breakdown** and add `paywall_name` (subscriber attribute). You'll see three rows:
   - `pro_paywall` — e.g. 12 % conversion
   - `enhancement_paywall` — e.g. 18 % conversion
   - `subscribe_modal` — e.g. 9 % conversion

5. Add a **second breakdown** for `$country_code` (auto-populated by RevenueCat from the
   App Store storefront). The table now shows conversion per surface per country:

   | paywall_name | $country_code | Entered | Converted | Rate |
   |--------------|---------------|---------|-----------|------|
   | enhancement_paywall | GB | 120 | 22 | 18 % |
   | pro_paywall | US | 80 | 10 | 12 % |
   | subscribe_modal | AU | 45 | 4 | 9 % |

6. Click **Save Report** and name it **"Paywall conversion by surface × country"**.

### Add a dismissal-rate comparison (optional but valuable)

The `pro_paywall` and `subscribe_modal` surfaces also track dismissals. To see the
abandonment rate per surface:

1. Create a new **Funnel** with steps:
   - Step 1: `rc_paywall_impression_event`
   - Step 2: `rc_paywall_dismissed_event` (fires when user closes without buying)

2. Breakdown by `paywall_name`. High dismissal on `subscribe_modal` with low dismissal
   on `enhancement_paywall` would confirm the inline wall outperforms the modal.

   > Note: `enhancement_paywall` has no close button so it never fires a dismissal event —
   > expect 0 % dismissal there (users must choose a plan or navigate away).

### Interpreting the results

- **Best overall surface** → highest `Entered → Converted` rate across all countries.
- **Best surface per country** → sort the breakdown by `$country_code` and compare rows
  with the same country across different `paywall_name` values.
- **Surface + plan signal** → add a third breakdown for `$product_id` to see which plan
  each surface sells most. If `pro_paywall` (monthly-only) converts well in the US but
  `subscribe_modal` converts better in the UK where the annual plan is popular, that
  signals a UK-specific paywall variant with a prominent annual option could lift revenue.

---

## Subscriber attributes reference

These are the attributes the app sets on every RevenueCat customer profile. All of them
become Mixpanel user properties automatically after the integration is enabled.

### Set on install (`trackAppInstall`)

| Attribute | Type | Notes |
|-----------|------|-------|
| `install_first_seen_at` | ISO timestamp | First cold-start only |
| `platform` | `"ios"` / `"android"` | |
| `locale` | e.g. `"en-GB"` | Device region setting |
| `device_model` | e.g. `"iPhone16,2"` | Hardware model identifier |
| `os_version` | e.g. `"18.4"` | iOS/Android version |

### Set on paywall view (`trackPaywallImpression`)

| Attribute | Type | Notes |
|-----------|------|-------|
| `paywall_name` | string | Which surface: `pro_paywall`, `enhancement_paywall`, `subscribe_modal` |
| `paywall_first_seen_at` | ISO timestamp | Set once, never overwritten |
| `paywall_last_seen_at` | ISO timestamp | Updated on every view |
| `paywall_view_count` | integer string | Cumulative across all surfaces |

### Set on paywall dismiss (`trackPaywallDismissal`) — modal surfaces only

| Attribute | Type | Notes |
|-----------|------|-------|
| `paywall_dismissed_name` | string | Surface that was dismissed |
| `paywall_dismissed_at` | ISO timestamp | Timestamp of last dismissal |
| `paywall_dismiss_count` | integer string | Cumulative dismissal counter |
| `paywall_dismissed_plan` | string | Plan highlighted when user closed (`monthly`, `annual`, `perpic`) |

### Set on purchase (`trackPaywallPurchase`)

| Attribute | Type | Notes |
|-----------|------|-------|
| `last_purchased_plan` | string | Plan highlighted at tap-time; may differ from purchased product |

### Set on churn (`trackSubscriptionChurn`)

| Attribute | Type | Notes |
|-----------|------|-------|
| `last_churned_reason` | `"cancel"` / `"billing_error"` | |
| `last_churned_at` | ISO timestamp | |
| `last_churned_plan` | string | Plan that was active at churn |

RevenueCat also automatically captures `$country_code` (App Store storefront country)
on every event — this is the most reliable country signal and does not require any
subscriber attribute.

---

## Relevant files

- `artifacts/owens-photofix/lib/revenuecat.tsx` — all tracking functions
- `artifacts/owens-photofix/components/ProPaywall.tsx` — `paywall_name: "pro_paywall"`
- `artifacts/owens-photofix/components/EnhancementPaywall.tsx` — `paywall_name: "enhancement_paywall"`
- `artifacts/owens-photofix/components/SubscribeModal.tsx` — `paywall_name: "subscribe_modal"`
