import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

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
export const ENTITLEMENT_HEALTH_GUIDE = "health_guide";
export const ENTITLEMENT_TRICK_TRAINER = "trick_trainer";
export const ENTITLEMENT_ALL_SCANNERS = "all_scanners";

export const PACKAGE_MIXED_BREED = "mixed_breed_package";
export const PACKAGE_AGE_CALC = "age_calculator_package";
export const PACKAGE_PERSONALITY = "personality_package";
export const PACKAGE_HEALTH_GUIDE = "health_guide_package";
export const PACKAGE_TRICK_TRAINER = "trick_trainer_package";
export const PACKAGE_ALL_SCANNERS = "all_scanners_package";

// ─── Cartoon-ify ───────────────────────────────────────────────────────────
// Deliberately kept separate from the scanner bundle above — this is a
// standalone paid product with no free trial, not part of "buy any
// scanner, get all three".
export const ENTITLEMENT_CARTOON = "dog_cartoon";
export const PACKAGE_CARTOON = "dog_cartoon_package";

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
export const MERCH_PRODUCT_IDS: Record<string, string> = {
  canvas_20:     "angem_canvas_small",
  canvas_a3:     "angem_canvas_a3",
  canvas_a2:     "angem_canvas_a2",
  framed_print:  "angem_framed_print",
  cushion:       "angem_cushion",
  dog_lead:      "angem_dog_lead",
  tote:          "angem_tote_bag",
  mug:           "angem_mug",
  blanket:       "angem_blanket",
  jigsaw:        "angem_jigsaw",
  dog_ball:      "angem_dog_ball",
  bandana:       "angem_bandana",
  phone_case:    "angem_phone_case",
  notebook:      "angem_notebook",
  photo_book:    "angem_photo_book",
  keyring:       "angem_keyring",
  bauble:        "angem_bauble",
  coaster_set:   "angem_coaster_set",
  water_bottle:  "angem_water_bottle",
  desk_calendar: "angem_desk_calendar",
};

export async function purchaseMerchandise(rcProductId: string): Promise<string> {
  const result = await Purchases.purchaseProduct(
    rcProductId,
    null,
    Purchases.PURCHASE_TYPE.INAPP
  );
  return result.transaction?.transactionIdentifier ?? result.customerInfo.originalAppUserId;
}

function getRevenueCatApiKey() {
  if (!REVENUECAT_TEST_API_KEY) {
    throw new Error("RevenueCat API Keys not found — run the seed script first");
  }
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY;
  }
  if (Platform.OS === "ios" && REVENUECAT_IOS_API_KEY) return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android" && REVENUECAT_ANDROID_API_KEY) return REVENUECAT_ANDROID_API_KEY;
  return REVENUECAT_TEST_API_KEY;
}

let revenueCatConfigured = false;
const configListeners: Array<() => void> = [];

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  revenueCatConfigured = true;
  configListeners.forEach((fn) => fn());
  console.log("Configured RevenueCat");
}

function useSubscriptionContext() {
  const [configured, setConfigured] = useState(revenueCatConfigured);

  useEffect(() => {
    if (configured) return;
    const listener = () => setConfigured(true);
    configListeners.push(listener);
    return () => {
      const i = configListeners.indexOf(listener);
      if (i > -1) configListeners.splice(i, 1);
    };
  }, [configured]);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: () => Purchases.getCustomerInfo(),
    staleTime: 60_000,
    enabled: configured,
    retry: 3,
    retryDelay: 500,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: () => Purchases.getOfferings(),
    staleTime: 300_000,
    enabled: configured,
    retry: 3,
    retryDelay: 500,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
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

  // Bundle — buying mixed_breed_package (£2.99) unlocks DNA, Age & Personality
  // together as one combined purchase. The three old individual 99p IAPs
  // (age_calculator_package, personality_package) are legacy and no longer
  // sold — they are ignored here deliberately.
  const hasBundlePurchase = !!active[ENTITLEMENT_MIXED_BREED];
  const hasAllScanners = hasBundlePurchase;
  const hasMixedBreed = hasBundlePurchase;
  const hasAgeCalc = hasBundlePurchase;
  const hasPersonality = hasBundlePurchase;
  const hasHealthGuide = hasBundlePurchase;
  const hasTrickTrainer = hasBundlePurchase;

  // Standalone, no free trial, not part of the scanner bundle.
  const hasCartoon = !!active[ENTITLEMENT_CARTOON];

  const packageFor = (identifier: string): PurchasesPackage | undefined =>
    offeringsQuery.data?.current?.availablePackages.find((p) => p.identifier === identifier);

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    hasLineage,
    hasGrooming,
    hasBlueprint,
    hasMixedBreed,
    hasAgeCalc,
    hasPersonality,
    hasHealthGuide,
    hasTrickTrainer,
    hasAllScanners,
    hasCartoon,
    packageFor,
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
  if (!ctx) {
    // RevenueCat temporarily disabled for crash isolation testing —
    // return safe no-op values instead of throwing, so screens that
    // call useSubscription() don't crash the whole app.
    return {
      customerInfo: undefined,
      offerings: undefined,
      isLoading: false,
      hasLineage: false,
      hasGrooming: false,
      hasBlueprint: false,
      hasMixedBreed: false,
      hasAgeCalc: false,
      hasPersonality: false,
      hasHealthGuide: false,
      hasTrickTrainer: false,
      hasAllScanners: false,
      hasCartoon: false,
      packageFor: () => undefined,
      purchase: async () => { throw new Error("Purchases temporarily disabled"); },
      restore: async () => { throw new Error("Purchases temporarily disabled"); },
      isPurchasing: false,
      isRestoring: false,
    };
  }
  return ctx;
}
