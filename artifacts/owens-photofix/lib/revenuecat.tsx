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
