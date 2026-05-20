import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

export const INSTALL_FIRST_SEEN_KEY = "onjjem_install_first_seen_at";
export const FIRST_PAYWALL_SEEN_KEY = "onjjem_paywall_first_seen_at";
export const PAYWALL_VIEW_COUNT_KEY = "onjjem_paywall_view_count";
export const PAYWALL_DISMISS_COUNT_KEY = "onjjem_paywall_dismiss_count";

/**
 * Per-surface AsyncStorage key helpers — used by the dev stats screen to show
 * conversion rates broken down by paywall name.
 */
export function paywallViewCountKey(name: string): string {
  return `onjjem_paywall_view_count_${name}`;
}
export function paywallDismissCountKey(name: string): string {
  return `onjjem_paywall_dismiss_count_${name}`;
}
export function paywallPurchaseCountKey(name: string): string {
  return `onjjem_paywall_purchase_count_${name}`;
}
export function paywallPurchasePlanCountKey(name: string, planId: string): string {
  return `onjjem_paywall_purchase_count_${name}_${planId}`;
}
export function paywallFirstSeenKey(name: string): string {
  return `onjjem_paywall_first_seen_at_${name}`;
}
export function paywallPurchasedAtKey(name: string): string {
  return `onjjem_paywall_purchased_at_${name}`;
}

/**
 * Per-plan dismissal count key — records how many times the paywall was
 * dismissed while a specific plan (e.g. "annual", "monthly", "perpic") was
 * selected. Used by the dev stats screen for plan abandonment breakdown.
 */
export function paywallDismissPlanCountKey(plan: string): string {
  return `onjjem_paywall_dismiss_plan_count_${plan}`;
}

/**
 * Per-surface-per-plan dismissal count key — records how many times a
 * specific paywall surface was dismissed while a given plan was highlighted.
 * Enables the dev stats screen to show plan abandonment broken down *per
 * surface*, not just globally across all paywalls.
 */
export function paywallDismissSurfacePlanCountKey(surface: string, plan: string): string {
  return `onjjem_paywall_dismiss_count_${surface}_${plan}`;
}

/**
 * Call once as early as possible after RevenueCat is configured (e.g. in the
 * root layout). Sets subscriber attributes that mark the install event:
 *
 *   - install_first_seen_at  — ISO timestamp of first app open (set once)
 *   - platform               — "ios" | "android" | "web"
 *   - locale                 — device locale/region tag (e.g. "en-GB", "fr-FR")
 *   - device_model           — hardware model (e.g. "iPhone16,2")
 *   - os_version             — OS version string (e.g. "18.4")
 *
 * These feed into RevenueCat Charts and any connected integration
 * (Mixpanel, Amplitude, etc.) as the "install" step of the
 * install → paywall view → purchase conversion funnel.
 *
 * locale + device_model + os_version allow Mixpanel/Amplitude to break down
 * subscribers by country (via locale region tag) and device type after the
 * RevenueCat → Mixpanel integration is enabled in the RevenueCat dashboard.
 * See ANALYTICS_SETUP.md for the one-time dashboard setup steps.
 */
/**
 * HOW TO VIEW THE CONVERSION FUNNEL IN REVENUECAT CHARTS
 * -------------------------------------------------------
 * 1. Open https://app.revenuecat.com → your project (app ID 6770767370)
 * 2. Charts → "Initial Conversion" shows new subscribers per product
 *    (com.onjjem.photorestoration.monthly / .annual / .one_photo)
 * 3. Charts → "Active Subscriptions" and "Revenue" are broken down by product
 * 4. Individual customer profiles show the subscriber attributes set here:
 *    install_first_seen_at, paywall_first_seen_at, paywall_view_count, etc.
 * 5. To connect a downstream tool (Mixpanel, Amplitude, Segment, etc.):
 *    RevenueCat Dashboard → Integrations → Add Integration
 *    No code changes needed — all attributes set here flow through automatically.
 */

export async function trackAppInstall(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(INSTALL_FIRST_SEEN_KEY);
    if (existing) return; // already recorded on a previous session

    const now = new Date().toISOString();

    // Capture device locale (e.g. "en-GB", "fr-FR") — the region tag gives
    // a reliable proxy for the subscriber's country when Mixpanel/Amplitude
    // segments by this property after the RevenueCat integration is enabled.
    let locale = "unknown";
    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "unknown";
    } catch {
      // Intl not available in this JS engine build — fall back to "unknown"
    }

    // Device model (e.g. "iPhone16,2") and OS version (e.g. "18.4") let
    // Mixpanel/Amplitude break subscriptions down by hardware and software.
    const deviceModel: string =
      (Platform.constants as Record<string, unknown>)?.["Model"] as string ?? "unknown";
    const osVersion = String(Platform.Version);

    // Set attributes and sync BEFORE writing the AsyncStorage marker.
    // If the network call fails (offline, transient error), the marker is never
    // written, so the next cold-start will automatically retry — preventing
    // permanent undercounting of installs.
    await Purchases.setAttributes({
      install_first_seen_at: now,
      platform: Platform.OS,
      locale,
      device_model: deviceModel,
      os_version: osVersion,
    });

    // Push attributes to RevenueCat immediately so they appear in Charts
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    // Only persist the marker after a successful sync
    await AsyncStorage.setItem(INSTALL_FIRST_SEEN_KEY, now);
  } catch {
    // Non-critical — analytics failures must never affect the user experience
  }
}

/**
 * Call this whenever a paywall surface becomes visible.
 *
 * Sets custom subscriber attributes on the RevenueCat customer profile:
 *   - paywall_first_seen_at  — ISO timestamp of the very first paywall view (set once)
 *   - paywall_last_seen_at   — ISO timestamp updated on every view
 *   - paywall_name           — which paywall surface was most recently seen
 *   - paywall_view_count     — cumulative count of all paywall views (event-like counter)
 *
 * These attributes flow into RevenueCat Charts and any connected integration
 * (Mixpanel, Amplitude, etc.), enabling the install → paywall view → purchase
 * conversion funnel to be measured per customer. Because `paywall_view_count` is
 * an incrementing integer, it can be used to count paywall-view events even
 * though RevenueCat attributes are profile traits rather than an event stream.
 *
 * RevenueCat Charts automatically surfaces installs (first configure() call) and
 * purchases per product ID. Pairing that with these attributes completes the
 * full funnel for each subscriber.
 */
export async function trackPaywallImpression(paywallName: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    const [firstSeen, rawCount] = await Promise.all([
      AsyncStorage.getItem(FIRST_PAYWALL_SEEN_KEY),
      AsyncStorage.getItem(PAYWALL_VIEW_COUNT_KEY),
    ]);

    const attrs: Record<string, string> = {
      paywall_last_seen_at: now,
      paywall_name: paywallName,
    };

    const isFirstView = !firstSeen;
    if (isFirstView) attrs.paywall_first_seen_at = now;

    const count = rawCount ? (parseInt(rawCount, 10) || 0) + 1 : 1;
    attrs.paywall_view_count = String(count);

    // Set attributes and sync BEFORE writing the AsyncStorage markers.
    // If the network call fails, the markers are never written, so the next
    // paywall open will retry — preventing permanent undercounting.
    await Purchases.setAttributes(attrs);
    // Push to RevenueCat immediately so Charts reflects the view without delay
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    // Persist markers only after a successful sync
    await AsyncStorage.setItem(PAYWALL_VIEW_COUNT_KEY, String(count));
    if (isFirstView) await AsyncStorage.setItem(FIRST_PAYWALL_SEEN_KEY, now);

    // Also persist a per-surface view count and first-seen timestamp for the dev stats screen
    const surfaceKey = paywallViewCountKey(paywallName);
    const surfaceFirstKey = paywallFirstSeenKey(paywallName);
    const [rawSurface, rawSurfaceFirst] = await Promise.all([
      AsyncStorage.getItem(surfaceKey),
      AsyncStorage.getItem(surfaceFirstKey),
    ]);
    const surfaceCount = rawSurface ? (parseInt(rawSurface, 10) || 0) + 1 : 1;
    await AsyncStorage.setItem(surfaceKey, String(surfaceCount));
    if (!rawSurfaceFirst) {
      await AsyncStorage.setItem(surfaceFirstKey, now);
    }
  } catch {
    // Non-critical — analytics failures must never affect the user experience
  }
}

/**
 * Call this whenever a paywall surface is dismissed without a completed purchase.
 *
 * Sets custom subscriber attributes on the RevenueCat customer profile:
 *   - paywall_dismissed_at    — ISO timestamp of the most recent dismissal
 *   - paywall_dismissed_name  — which paywall surface was dismissed
 *   - paywall_dismiss_count   — cumulative count of all dismissals (no-purchase closes)
 *
 * Together with `paywall_view_count` these allow a per-surface conversion rate
 * (views ÷ purchases, or equivalently 1 − dismissals/views) to be computed for
 * each paywall in RevenueCat Charts or any connected downstream tool.
 *
 * Only call this when the user has definitively closed the paywall without buying —
 * do NOT call it after a successful purchase even if `onClose` is invoked.
 *
 * @param selectedPlan  Optional — the plan the user had highlighted at dismissal time
 *                      (e.g. "annual", "monthly", "perpic"). Stored as the subscriber
 *                      attribute `paywall_dismissed_plan` so RevenueCat Charts and any
 *                      connected integration can break down abandonment by price tier.
 */
/**
 * Call this immediately after a successful purchase on a paywall surface.
 *
 * Increments the per-surface purchase counter stored in AsyncStorage under
 * `onjjem_paywall_purchase_count_<name>`. This gives an accurate conversion
 * rate (real purchases ÷ views) rather than the estimated figure derived
 * from views minus dismissals, which undercounts when users background the
 * app without explicitly dismissing the paywall.
 */
export async function trackPaywallPurchase(paywallName: string, planId?: string): Promise<void> {
  try {
    const surfaceKey = paywallPurchaseCountKey(paywallName);
    const purchasedAtKey = paywallPurchasedAtKey(paywallName);
    const keysToRead: string[] = [surfaceKey, purchasedAtKey];
    if (planId) keysToRead.push(paywallPurchasePlanCountKey(paywallName, planId));

    const pairs = await AsyncStorage.multiGet(keysToRead);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    const count = map[surfaceKey] ? (parseInt(map[surfaceKey]!, 10) || 0) + 1 : 1;
    const writes: [string, string][] = [[surfaceKey, String(count)]];

    // Record the first purchase timestamp for time-to-convert display
    if (!map[purchasedAtKey]) {
      writes.push([purchasedAtKey, new Date().toISOString()]);
    }

    // Per-surface-per-plan purchase count (e.g. onjjem_paywall_purchase_count_subscribe_modal_annual)
    if (planId) {
      const planKey = paywallPurchasePlanCountKey(paywallName, planId);
      const planCount = map[planKey] ? (parseInt(map[planKey]!, 10) || 0) + 1 : 1;
      writes.push([planKey, String(planCount)]);
    }

    await AsyncStorage.multiSet(writes);
  } catch {
    // Non-critical — analytics failures must never affect the user experience
  }
}

export async function trackPaywallDismissal(paywallName: string, selectedPlan?: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    const rawCount = await AsyncStorage.getItem(PAYWALL_DISMISS_COUNT_KEY);
    const count = rawCount ? (parseInt(rawCount, 10) || 0) + 1 : 1;

    const attrs: Record<string, string> = {
      paywall_dismissed_at: now,
      paywall_dismissed_name: paywallName,
      paywall_dismiss_count: String(count),
    };

    if (selectedPlan) {
      attrs.paywall_dismissed_plan = selectedPlan;
    }

    // Set attributes and sync BEFORE writing the AsyncStorage marker so that a
    // network failure causes a retry on the next dismissal rather than silently
    // dropping the event.
    await Purchases.setAttributes(attrs);
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    await AsyncStorage.setItem(PAYWALL_DISMISS_COUNT_KEY, String(count));

    // Also persist a per-surface dismiss count for the dev stats screen
    const surfaceKey = paywallDismissCountKey(paywallName);
    const rawSurface = await AsyncStorage.getItem(surfaceKey);
    const surfaceCount = rawSurface ? (parseInt(rawSurface, 10) || 0) + 1 : 1;
    await AsyncStorage.setItem(surfaceKey, String(surfaceCount));

    // Persist a per-plan dismissal count so the dev stats screen can show
    // which plan users had selected when they abandoned the paywall.
    if (selectedPlan) {
      const planKey = paywallDismissPlanCountKey(selectedPlan);
      const surfacePlanKey = paywallDismissSurfacePlanCountKey(paywallName, selectedPlan);
      const pairs = await AsyncStorage.multiGet([planKey, surfacePlanKey]);
      const pairMap = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      const planCount = pairMap[planKey] ? (parseInt(pairMap[planKey]!, 10) || 0) + 1 : 1;
      const surfacePlanCount = pairMap[surfacePlanKey] ? (parseInt(pairMap[surfacePlanKey]!, 10) || 0) + 1 : 1;
      await AsyncStorage.multiSet([
        [planKey, String(planCount)],
        [surfacePlanKey, String(surfacePlanCount)],
      ]);
    }
  } catch {
    // Non-critical — analytics failures must never affect the user experience
  }
}

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";
export const PHOTO_CREDITS_STORAGE_KEY = "onjjem_photo_credits";

export const PACKAGE_IDENTIFIERS = {
  monthly: "$rc_monthly",
  annual: "$rc_annual",
  perPhoto: "one_photo",
} as const;

function getRevenueCatApiKey(): string | null {
  // In dev / Expo Go / web, the test key is sufficient.
  if (
    __DEV__ ||
    Platform.OS === "web" ||
    Constants.executionEnvironment === "storeClient"
  ) {
    return REVENUECAT_TEST_API_KEY ?? null;
  }
  // In a built native app, only the current platform key is required.
  if (Platform.OS === "ios") return REVENUECAT_IOS_API_KEY ?? null;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY ?? null;
  return REVENUECAT_TEST_API_KEY ?? null;
}

let _configured = false;

export function initializeRevenueCat() {
  if (_configured) return;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    throw new Error("RevenueCat public API key not configured");
  }
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  _configured = true;
}

async function readPhotoCredits(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(PHOTO_CREDITS_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function writePhotoCredits(n: number): Promise<void> {
  try {
    await AsyncStorage.setItem(PHOTO_CREDITS_STORAGE_KEY, String(Math.max(0, n)));
  } catch {
    // non-fatal
  }
}

function useSubscriptionContext() {
  const qc = useQueryClient();
  const [photoCredits, setPhotoCredits] = useState(0);

  useEffect(() => {
    readPhotoCredits().then(setPhotoCredits);
  }, []);

  const customerInfoQuery = useQuery<CustomerInfo>({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => Purchases.getCustomerInfo(),
    staleTime: 60_000,
  });

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => Purchases.getOfferings(),
    staleTime: 300_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      // Locally credit consumables (one-photo) — RevenueCat does not auto-track these
      if (pkg.identifier === PACKAGE_IDENTIFIERS.perPhoto) {
        const next = (await readPhotoCredits()) + 1;
        await writePhotoCredits(next);
        setPhotoCredits(next);
      }
      return customerInfo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => Purchases.restorePurchases(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] }),
  });

  const consumePhotoCredit = async (): Promise<boolean> => {
    const current = await readPhotoCredits();
    if (current <= 0) return false;
    const next = current - 1;
    await writePhotoCredits(next);
    setPhotoCredits(next);
    return true;
  };

  const currentOffering: PurchasesOffering | null =
    offeringsQuery.data?.current ?? null;

  const monthlyPackage =
    currentOffering?.availablePackages.find(
      (p) => p.identifier === PACKAGE_IDENTIFIERS.monthly,
    ) ?? null;
  const annualPackage =
    currentOffering?.availablePackages.find(
      (p) => p.identifier === PACKAGE_IDENTIFIERS.annual,
    ) ?? null;
  const perPhotoPackage =
    currentOffering?.availablePackages.find(
      (p) => p.identifier === PACKAGE_IDENTIFIERS.perPhoto,
    ) ?? null;

  const isSubscribed =
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !==
    undefined;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    currentOffering,
    monthlyPackage,
    annualPackage,
    perPhotoPackage,
    isSubscribed,
    photoCredits,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    consumePhotoCredit,
    refresh: () => {
      void customerInfoQuery.refetch();
      void offeringsQuery.refetch();
    },
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
