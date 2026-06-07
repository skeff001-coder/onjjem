import React, { createContext, useContext, useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

// ─── Knowledge Entitlements ────────────────────────────────────────────────
export const ENTITLEMENT_LINEAGE = "lineage";
export const ENTITLEMENT_GROOMING = "grooming";
export const ENTITLEMENT_BLUEPRINT = "blueprint";

export const PACKAGE_LINEAGE = "lineage_package";
export const PACKAGE_GROOMING = "grooming_package";
export const PACKAGE_BLUEPRINT = "blueprint_package";

// ─── Scanner Entitlements ──────────────────────────────────────────────────
export const ENTITLEMENT_MIXED_BREED = "mixed_breed";
export const ENTITLEMENT_AGE_CALC = "age_calculator";
export const ENTITLEMENT_PERSONALITY = "personality_matcher";

export const PACKAGE_MIXED_BREED = "mixed_breed_package";
export const PACKAGE_AGE_CALC = "age_calculator_package";
export const PACKAGE_PERSONALITY = "personality_package";

// ─── Pup-Grade Products ──────────────────────────────────────────────────────
export const PUPGRADE_PRODUCT_IDS: Record<string, string> = {
  bark_translator:   "pupgrade_bark_translator",
  digital_pawsport:  "pupgrade_digital_pawsport",
  ai_glowup:         "pupgrade_ai_glowup",
  golden_badge:      "pupgrade_golden_badge",
  barkoff_pack:      "pupgrade_barkoff_pack",
};

export async function purchasePupgrade(rcProductId: string): Promise<string> {
  const result = await Purchases.purchaseProduct(
    rcProductId,
    null,
    Purchases.PURCHASE_TYPE.INAPP
  );
  return result.transaction?.transactionIdentifier ?? result.customerInfo.originalAppUserId;
}

// ─── Merchandise Products ───────────────────────────────────────────────────
// Note: All merchandise purchases are now handled through the onJJem web shop.
// Native IAP for physical goods is not used per Apple App Store guidelines.
// The web shop (onjjem-shop artifact) uses Stripe Checkout for payments.

/**
 * True when the RevenueCat test/sandbox key is the active key for this build.
 * The test key is set in development and preview builds but NOT in production
 * builds (which set the platform-specific iOS/Android live keys instead).
 * Use this to show sandbox indicators in the UI so testers know no real money
 * is charged.
 */
export const IS_SANDBOX_MODE =
  !!REVENUECAT_TEST_API_KEY &&
  !REVENUECAT_IOS_API_KEY &&
  !REVENUECAT_ANDROID_API_KEY;

/**
 * Selects the correct RevenueCat API key based on the current build profile.
 *
 * Key routing by EAS build profile:
 *
 *   development  — EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is set; __DEV__ is true
 *                  → always returns the sandbox/test key. No real charges.
 *
 *   preview      — EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is set;
 *                  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is NOT set;
 *                  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is NOT set.
 *                  __DEV__ is false and executionEnvironment is "standalone"
 *                  (TestFlight / internal Android build), so the early-return
 *                  branch is skipped. Both platform-specific key branches are
 *                  skipped because neither env var is present. Falls through to
 *                  the final `return REVENUECAT_TEST_API_KEY`.
 *                  → always returns the sandbox/test key. TestFlight testers
 *                  and Android internal testers are NEVER charged real money.
 *
 *   production   — EXPO_PUBLIC_REVENUECAT_IOS_API_KEY (iOS) and
 *                  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY (Android) are set;
 *                  EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is NOT set.
 *                  Guard passes (at least one key is present). __DEV__ is false
 *                  and executionEnvironment is "standalone". Falls into the
 *                  correct platform key branch.
 *                  → returns the live App Store / Google Play key. Real
 *                  purchases are charged.
 *
 * NOTE: If you add a new EAS build profile, make sure it sets
 * EXPO_PUBLIC_REVENUECAT_TEST_API_KEY (and does NOT set
 * EXPO_PUBLIC_REVENUECAT_IOS_API_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY)
 * to guarantee sandbox routing on both iOS and Android.
 */
function getRevenueCatApiKey() {
  if (!REVENUECAT_TEST_API_KEY && !REVENUECAT_IOS_API_KEY && !REVENUECAT_ANDROID_API_KEY) {
    throw new Error("RevenueCat API Keys not found — run the seed script first");
  }
  if (__DEV__ || Platform.OS === "web") {
    return REVENUECAT_TEST_API_KEY!;
  }
  if (Platform.OS === "ios" && REVENUECAT_IOS_API_KEY) return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android" && REVENUECAT_ANDROID_API_KEY) return REVENUECAT_ANDROID_API_KEY;
  return REVENUECAT_TEST_API_KEY!;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
}

/**
 * Async variant of `initializeRevenueCat` that also restores the user's
 * previously saved region preference from AsyncStorage.
 *
 * Call this on cold launch instead of `initializeRevenueCat` so that
 * offerings are fetched with the correct regional pricing already active,
 * without requiring the user to visit Settings again.
 */
export async function initializeRevenueCatAsync(): Promise<void> {
  initializeRevenueCat();
  const regionCode = await getStoredRegionCode();
  if (regionCode) {
    await Purchases.setAttributes({ preferred_region: regionCode });
    await Purchases.syncAttributesAndOfferingsIfNeeded();
  }
}

// ─── Region / Currency Preference ──────────────────────────────────────────

const REGION_STORAGE_KEY = "@revenuecat_region";

/** Returns the stored region code (e.g. "GB"), or null if never set. */
export async function getStoredRegionCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REGION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the user's chosen region, records it as a RevenueCat subscriber
 * attribute (so it can be used for dashboard-level offering targeting), and
 * forces a full attribute-sync + offerings re-fetch so prices are refreshed.
 *
 * Returns the freshly-fetched offerings, or null on error.
 */
export async function saveRegionAndSync(regionCode: string): Promise<void> {
  await AsyncStorage.setItem(REGION_STORAGE_KEY, regionCode);
  await Purchases.setAttributes({ preferred_region: regionCode });
  await Purchases.syncAttributesAndOfferingsIfNeeded();
}

/**
 * Removes the user's stored region preference and clears the `preferred_region`
 * subscriber attribute on RevenueCat, reverting to the device's default locale.
 * Syncs attributes and invalidates the offerings cache so the next fetch uses
 * the device's native storefront region.
 */
export async function clearRegionAndSync(): Promise<void> {
  await AsyncStorage.removeItem(REGION_STORAGE_KEY);
  await Purchases.setAttributes({ preferred_region: "" });
  await Purchases.syncAttributesAndOfferingsIfNeeded();
}

function useSubscriptionContext() {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: () => Purchases.getCustomerInfo(),
    staleTime: 60_000,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: () => Purchases.getOfferings(),
    staleTime: 300_000,
  });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;

      if (wasBackground && nextState === "active") {
        void (async () => {
          try {
            const regionCode = await getStoredRegionCode();
            if (regionCode) {
              await Purchases.syncAttributesAndOfferingsIfNeeded();
            }
          } finally {
            queryClient.invalidateQueries({ queryKey: ["revenuecat", "offerings"], refetchType: "active" });
          }
        })();
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
    onError: (err: any) => {
      // Log purchase errors for debugging
      if (err && err.code !== "PURCHASE_CANCELLED") {
        console.warn("[RevenueCat] Purchase error:", err.code, err.message);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const active = customerInfoQuery.data?.entitlements.active ?? {};

  // Knowledge
  const hasLineage = !!(active[ENTITLEMENT_LINEAGE] || active[ENTITLEMENT_BLUEPRINT]);
  const hasGrooming = !!(active[ENTITLEMENT_GROOMING] || active[ENTITLEMENT_BLUEPRINT]);
  const hasBlueprint = !!active[ENTITLEMENT_BLUEPRINT];

  // Scanners
  const hasMixedBreed = !!active[ENTITLEMENT_MIXED_BREED];
  const hasAgeCalc = !!active[ENTITLEMENT_AGE_CALC];
  const hasPersonality = !!active[ENTITLEMENT_PERSONALITY];

  const packageFor = (identifier: string): PurchasesPackage | undefined =>
    offeringsQuery.data?.current?.availablePackages.find((p) => p.identifier === identifier);

  /**
   * Searches all available offerings (not just the current one) for a package
   * whose underlying product ID matches `productIdentifier`. Used for Pup-Grade
   * products which are fetched via `purchaseProduct` rather than a named offering.
   */
  const packageForProduct = (productIdentifier: string): PurchasesPackage | undefined => {
    if (!offeringsQuery.data) return undefined;
    for (const offering of Object.values(offeringsQuery.data.all)) {
      const pkg = offering.availablePackages.find(
        (p) => p.product.identifier === productIdentifier
      );
      if (pkg) return pkg;
    }
    return undefined;
  };

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isOfferingsFetching: offeringsQuery.isFetching,
    hasLineage,
    hasGrooming,
    hasBlueprint,
    hasMixedBreed,
    hasAgeCalc,
    hasPersonality,
    packageFor,
    packageForProduct,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
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
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
