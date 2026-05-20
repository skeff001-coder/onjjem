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

## Subscriber attributes reference

These are the attributes the app sets on every RevenueCat customer profile. All of them
become Mixpanel user properties automatically after the integration is enabled.

| Attribute | Type | Set in | Notes |
|-----------|------|--------|-------|
| `install_first_seen_at` | ISO timestamp | `trackAppInstall` | First cold-start only |
| `platform` | `"ios"` / `"android"` | `trackAppInstall` | |
| `locale` | e.g. `"en-GB"` | `trackAppInstall` | Device region setting |
| `device_model` | e.g. `"iPhone16,2"` | `trackAppInstall` | Hardware model identifier |
| `os_version` | e.g. `"18.4"` | `trackAppInstall` | iOS/Android version |
| `paywall_first_seen_at` | ISO timestamp | `trackPaywallImpression` | Set once |
| `paywall_last_seen_at` | ISO timestamp | `trackPaywallImpression` | Updated every view |
| `paywall_name` | string | `trackPaywallImpression` | Which paywall surface |
| `paywall_view_count` | integer string | `trackPaywallImpression` | Cumulative counter |

RevenueCat also automatically captures `$country_code` (App Store storefront country)
on every event — this is the most reliable country signal and does not require any
subscriber attribute.

---

## Relevant files

- `artifacts/owens-photofix/lib/revenuecat.tsx` — `trackAppInstall` and
  `trackPaywallImpression` set all subscriber attributes listed above
