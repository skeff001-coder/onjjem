import type { ReactNode } from "react";

// ─── RevenueCat temporarily fully disabled ──────────────────────────────────
// This file is a clean stub with ZERO dependency on react-native-purchases,
// for a genuine crash-isolation test on the JSC engine build. Every export
// below matches the real file's shape so the rest of the app compiles
// unchanged, but nothing here ever calls into native purchase code.

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
export const ENTITLEMENT_CARTOON = "dog_cartoon";
export const PACKAGE_CARTOON = "dog_cartoon_package";

// ─── Pup-Grade Products ──────────────────────────────────────────────────────
export const PUPGRADE_PRODUCT_IDS: Record<string, string> = {
  bark_translator: "pupgrade_bark_translator",
  digital_pawsport: "pupgrade_digital_pawsport",
  ai_glowup: "pupgrade_ai_glowup",
  golden_badge: "pupgrade_golden_badge",
  barkoff_pack: "pupgrade_barkoff_pack",
};

export async function purchasePupgrade(_rcProductId: string): Promise<string> {
  throw new Error("Purchases temporarily disabled");
}

// ─── Merchandise Products ───────────────────────────────────────────────────
export const MERCH_PRODUCT_IDS: Record<string, string> = {
  canvas_20: "angem_canvas_small",
  canvas_a3: "angem_canvas_a3",
  canvas_a2: "angem_canvas_a2",
  framed_print: "angem_framed_print",
  cushion: "angem_cushion",
  dog_lead: "angem_dog_lead",
  tote: "angem_tote_bag",
  mug: "angem_mug",
  blanket: "angem_blanket",
  jigsaw: "angem_jigsaw",
  dog_ball: "angem_dog_ball",
  bandana: "angem_bandana",
  phone_case: "angem_phone_case",
  notebook: "angem_notebook",
  photo_book: "angem_photo_book",
  keyring: "angem_keyring",
  bauble: "angem_bauble",
  coaster_set: "angem_coaster_set",
  water_bottle: "angem_water_bottle",
  desk_calendar: "angem_desk_calendar",
};

export async function purchaseMerchandise(_rcProductId: string): Promise<string> {
  throw new Error("Purchases temporarily disabled");
}

export function initializeRevenueCat() {
  console.log("RevenueCat disabled for JSC crash isolation test — skipping init");
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  return children as any;
}

export function useSubscription() {
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
