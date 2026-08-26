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

export function localDayString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function paywallViewDayKey(name: string, day: string): string {
  return `onjjem_paywall_view_count_${name}_day_${day}`;
}
export function paywallDismissDayKey(name: string, day: string): string {
  return `onjjem_paywall_dismiss_count_${name}_day_${day}`;
}
export function paywallPurchaseDayKey(name: string, day: string): string {
  return `onjjem_paywall_purchase_count_${name}_day_${day}`;
}
export function paywallPurchasePlanDayKey(name: string, planId: string, day: string): string {
  return `onjjem_paywall_purchase_count_${name}_${planId}_day_${day}`;
}
export function paywallPurchaseGlobalPlanDayKey(plan: string, day: string): string {
  return `onjjem_paywall_purchase_plan_count_${plan}_day_${day}`;
}
export function paywallDismissPlanDayKey(plan: string, day: string): string {
  return `onjjem_paywall_dismiss_plan_count_${plan}_day_${day}`;
}
export function paywallDismissSurfacePlanDayKey(surface: string, plan: string, day: string): string {
  return `onjjem_paywall_dismiss_count_${surface}_${plan}_day_${day}`;
}

export function paywallPurchaseGlobalPlanCountKey(plan: string): string {
  return `onjjem_paywall_purchase_plan_count_${plan}`;
}

export function paywallDismissPlanCountKey(plan: string): string {
  return `onjjem_paywall_dismiss_plan_count_${plan}`;
}

export function paywallDismissSurfacePlanCountKey(surface: string, plan: string): string {
  return `onjjem_paywall_dismiss_count_${surface}_${plan}`;
}

export async function trackAppInstall(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(INSTALL_FIRST_SEEN_KEY);
    if (existing) return;

    const now = new Date().toISOString();

    let locale = "unknown";
    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "unknown";
    } catch {
      // Intl not available
    }

    const deviceModel: string =
      (Platform.constants as Record<string, unknown>)?.["Model"] as string ?? "unknown";
    const osVersion = String(Platform.Version);

    await Purchases.setAttributes({
      install_first_seen_at: now,
      platform: Platform.OS,
      locale,
      device_model: deviceModel,
      os_version: osVersion,
    });

    await Purchases.syncAttributesAndOfferingsIfNeeded();

    await AsyncStorage.setItem(INSTALL_FIRST_SEEN_KEY, now);
  } catch {
    // Non-critical
  }
}

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

    await Purchases.setAttributes(attrs);
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    await AsyncStorage.setItem(PAYWALL_VIEW_COUNT_KEY, String(count));
    if (isFirstView) await AsyncStorage.setItem(FIRST_PAYWALL_SEEN_KEY, now);

    const surfaceKey = paywallViewCountKey(paywallName);
    const surfaceFirstKey = paywallFirstSeenKey(paywallName);
    const today = localDayString();
    const viewDayKey = paywallViewDayKey(paywallName, today);
    const [rawSurface, rawSurfaceFirst, rawDayCount] = await Promise.all([
      AsyncStorage.getItem(surfaceKey),
      AsyncStorage.getItem(surfaceFirstKey),
      AsyncStorage.getItem(viewDayKey),
    ]);
    const surfaceCount = rawSurface ? (parseInt(rawSurface, 10) || 0) + 1 : 1;
    const dayCount = rawDayCount ? (parseInt(rawDayCount, 10) || 0) + 1 : 1;
    const surfaceWrites: [string, string][] = [
      [surfaceKey, String(surfaceCount)],
      [viewDayKey, String(dayCount)],
    ];
    if (!rawSurfaceFirst) surfaceWrites.push([surfaceFirstKey, now]);
    await AsyncStorage.multiSet(surfaceWrites);
  } catch {
    // Non-critical
  }
}

export async function trackPaywallPurchase(paywallName: string, planId?: string): Promise<void> {
  try {
    const today = localDayString();
    const surfaceKey = paywallPurchaseCountKey(paywallName);
    const purchasedAtKey = paywallPurchasedAtKey(paywallName);
    const purchaseDayKey = paywallPurchaseDayKey(paywallName, today);
    const keysToRead: string[] = [surfaceKey, purchasedAtKey, purchaseDayKey];
    if (planId) {
      keysToRead.push(paywallPurchasePlanCountKey(paywallName, planId));
      keysToRead.push(paywallPurchaseGlobalPlanCountKey(planId));
      keysToRead.push(paywallPurchasePlanDayKey(paywallName, planId, today));
      keysToRead.push(paywallPurchaseGlobalPlanDayKey(planId, today));
    }

    const pairs = await AsyncStorage.multiGet(keysToRead);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    const count = map[surfaceKey] ? (parseInt(map[surfaceKey]!, 10) || 0) + 1 : 1;
    const dayCount = map[purchaseDayKey] ? (parseInt(map[purchaseDayKey]!, 10) || 0) + 1 : 1;
    const writes: [string, string][] = [
      [surfaceKey, String(count)],
      [purchaseDayKey, String(dayCount)],
    ];

    if (!map[purchasedAtKey]) {
      writes.push([purchasedAtKey, new Date().toISOString()]);
    }

    if (planId) {
      const surfacePlanKey = paywallPurchasePlanCountKey(paywallName, planId);
      const surfacePlanCount = map[surfacePlanKey] ? (parseInt(map[surfacePlanKey]!, 10) || 0) + 1 : 1;
      writes.push([surfacePlanKey, String(surfacePlanCount)]);

      const surfacePlanDayKey = paywallPurchasePlanDayKey(paywallName, planId, today);
      const surfacePlanDayCount = map[surfacePlanDayKey] ? (parseInt(map[surfacePlanDayKey]!, 10) || 0) + 1 : 1;
      writes.push([surfacePlanDayKey, String(surfacePlanDayCount)]);

      const globalPlanKey = paywallPurchaseGlobalPlanCountKey(planId);
      const globalPlanCount = map[globalPlanKey] ? (parseInt(map[globalPlanKey]!, 10) || 0) + 1 : 1;
      writes.push([globalPlanKey, String(globalPlanCount)]);

      const globalPlanDayKey = paywallPurchaseGlobalPlanDayKey(planId, today);
      const globalPlanDayCount = map[globalPlanDayKey] ? (parseInt(map[globalPlanDayKey]!, 10) || 0) + 1 : 1;
      writes.push([globalPlanDayKey, String(globalPlanDayCount)]);

      await Purchases.setAttributes({ last_purchased_plan: planId });
      await Purchases.syncAttributesAndOfferingsIfNeeded();
    }

    await AsyncStorage.multiSet(writes);
  } catch {
    // Non-critical
  }
}

export function churnPlanCountKey(plan: string): string {
  return `onjjem_churn_plan_count_${plan}`;
}
export function churnReasonCountKey(reason: "cancel" | "billing_error"): string {
  return `onjjem_churn_reason_count_${reason}`;
}
export const CHURN_TOTAL_COUNT_KEY = "onjjem_churn_total_count";

export async function trackSubscriptionChurn(
  reason: "cancel" | "billing_error",
  planId?: string,
): Promise<void> {
  try {
    const attrs: Record<string, string> = {
      last_churned_reason: reason,
      last_churned_at: new Date().toISOString(),
    };

    if (planId) {
      attrs.last_churned_plan = planId;
    }

    await Purchases.setAttributes(attrs);
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    const reasonKey = churnReasonCountKey(reason);
    const keysToRead: string[] = [CHURN_TOTAL_COUNT_KEY, reasonKey];
    if (planId) keysToRead.push(churnPlanCountKey(planId));

    const pairs = await AsyncStorage.multiGet(keysToRead);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    const total = map[CHURN_TOTAL_COUNT_KEY]
      ? (parseInt(map[CHURN_TOTAL_COUNT_KEY]!, 10) || 0) + 1
      : 1;
    const reasonCount = map[reasonKey]
      ? (parseInt(map[reasonKey]!, 10) || 0) + 1
      : 1;
    const writes: [string, string][] = [
      [CHURN_TOTAL_COUNT_KEY, String(total)],
      [reasonKey, String(reasonCount)],
    ];

    if (planId) {
      const planKey = churnPlanCountKey(planId);
      const planCount = map[planKey] ? (parseInt(map[planKey]!, 10) || 0) + 1 : 1;
      writes.push([planKey, String(planCount)]);
    }

    await AsyncStorage.multiSet(writes);
  } catch {
    // Non-critical
  }
}

export function planIdFromProductIdentifier(productId: string): string | undefined {
  const lower = productId.toLowerCase();
  if (lower.includes("monthly")) return "monthly";
  if (lower.includes("one_cartoon") || lower.includes("onephoto")) return "one_scan";
  if (lower.includes("three_cartoon") || lower.includes("threephoto")) return "three_scans";
  if (lower.includes("five_cartoon") || lower.includes("fivephoto")) return "five_scans";
  return undefined;
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

    await Purchases.setAttributes(attrs);
    await Purchases.syncAttributesAndOfferingsIfNeeded();

    await AsyncStorage.setItem(PAYWALL_DISMISS_COUNT_KEY, String(count));

    const today = localDayString();
    const surfaceKey = paywallDismissCountKey(paywallName);
    const dismissDayKey = paywallDismissDayKey(paywallName, today);
    const [rawSurface, rawDismissDay] = await Promise.all([
      AsyncStorage.getItem(surfaceKey),
      AsyncStorage.getItem(dismissDayKey),
    ]);
    const surfaceCount = rawSurface ? (parseInt(rawSurface, 10) || 0) + 1 : 1;
    const dismissDayCount = rawDismissDay ? (parseInt(rawDismissDay, 10) || 0) + 1 : 1;
    const surfaceWrites: [string, string][] = [
      [surfaceKey, String(surfaceCount)],
      [dismissDayKey, String(dismissDayCount)],
    ];

    if (selectedPlan) {
      const planKey = paywallDismissPlanCountKey(selectedPlan);
      const surfacePlanKey = paywallDismissSurfacePlanCountKey(paywallName, selectedPlan);
      const planDayKey = paywallDismissPlanDayKey(selectedPlan, today);
      const surfacePlanDayKey = paywallDismissSurfacePlanDayKey(paywallName, selectedPlan, today);
      const pairs = await AsyncStorage.multiGet([planKey, surfacePlanKey, planDayKey, surfacePlanDayKey]);
      const pairMap = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      const planCount = pairMap[planKey] ? (parseInt(pairMap[planKey]!, 10) || 0) + 1 : 1;
      const surfacePlanCount = pairMap[surfacePlanKey] ? (parseInt(pairMap[surfacePlanKey]!, 10) || 0) + 1 : 1;
      const planDayCount = pairMap[planDayKey] ? (parseInt(pairMap[planDayKey]!, 10) || 0) + 1 : 1;
      const surfacePlanDayCount = pairMap[surfacePlanDayKey] ? (parseInt(pairMap[surfacePlanDayKey]!, 10) || 0) + 1 : 1;
      surfaceWrites.push(
        [planKey, String(planCount)],
        [surfacePlanKey, String(surfacePlanCount)],
        [planDayKey, String(planDayCount)],
        [surfacePlanDayKey, String(surfacePlanDayCount)],
      );
    }

    await AsyncStorage.multiSet(surfaceWrites);
  } catch {
    // Non-critical
  }
}

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const PHOTO_CREDITS_STORAGE_KEY = "onjjem_photo_credits";

// Three consumable bundles: 1, 3, and 5 cartoon scans
export const PACKAGE_IDENTIFIERS = {
  oneCartoon: "one_cartoon_scan",
  threeCartoons: "three_cartoon_scans",
  fiveCartoons: "five_cartoon_scans",
} as const;

// How many credits each bundle purchase grants
const CREDIT_VALUES: Record<string, number> = {
  [PACKAGE_IDENTIFIERS.oneCartoon]: 1,
  [PACKAGE_IDENTIFIERS.threeCartoons]: 3,
  [PACKAGE_IDENTIFIERS.fiveCartoons]: 5,
};

function getRevenueCatApiKey(): string | null {
  if (
    __DEV__ ||
    Platform.OS === "web" ||
    Constants.executionEnvironment === "storeClient"
  ) {
    return REVENUECAT_TEST_API_KEY ?? null;
  }
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
      const creditsGranted = CREDIT_VALUES[pkg.identifier];
      if (creditsGranted) {
        const next = (await readPhotoCredits()) + creditsGranted;
        await writePhotoCredits(next);
        setPhotoCredits(next);
      }
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      qc.setQueryData<CustomerInfo>(["revenuecat", "customer-info"], customerInfo);
      qc.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => Purchases.restorePurchases(),
    onSuccess: (customerInfo) => {
      qc.setQueryData<CustomerInfo>(["revenuecat", "customer-info"], customerInfo);
      qc.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] });
    },
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

  const allOfferings = offeringsQuery.data?.all ?? {};
  if (Object.keys(allOfferings).length === 0) {
    console.warn("[RevenueCat] No offerings configured at all");
  }

  function findPackageInOwnOffering(packageIdentifier: string): PurchasesPackage | null {
    const offering = allOfferings["cartoon_photos"];
    if (!offering) {
      console.warn(`[RevenueCat] No offering found with identifier "cartoon_photos"`);
      return null;
    }
    if (!offering.availablePackages.length) {
      console.warn(`[RevenueCat] Offering "cartoon_photos" has no packages attached`);
      return null;
    }
    const pkg = offering.availablePackages.find(p => p.identifier === packageIdentifier);
    if (!pkg) {
      console.warn(`[RevenueCat] No package found with identifier "${packageIdentifier}" in offering "cartoon_photos"`);
      return null;
    }
    return pkg;
  }

  const oneCartoonPackage = findPackageInOwnOffering(PACKAGE_IDENTIFIERS.oneCartoon);
  const threeCartoonPackage = findPackageInOwnOffering(PACKAGE_IDENTIFIERS.threeCartoons);
  const fiveCartoonPackage = findPackageInOwnOffering(PACKAGE_IDENTIFIERS.fiveCartoons);

  const isSubscribed = false; // No subscriptions in ONJJEM

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    currentOffering,
    oneCartoonPackage,
    threeCartoonPackage,
    fiveCartoonPackage,
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
