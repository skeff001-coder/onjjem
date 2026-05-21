import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_HINT_KEYS = [
  "hasSeenWelcome",
  "hasSeenPinchHint",
  "hasSeenResultTip",
  "hasSeenPickerTip",
  "hasSeenGalleryHint",
  "hasSeenSliderDrag",
] as const;

export type OnboardingHintKey = (typeof ONBOARDING_HINT_KEYS)[number];

export const ONBOARDING_HINT_LABELS: Record<OnboardingHintKey, string> = {
  hasSeenWelcome: "Welcome",
  hasSeenPinchHint: "Pinch-to-zoom",
  hasSeenResultTip: "Result tip",
  hasSeenPickerTip: "Picker tip",
  hasSeenGalleryHint: "Gallery hint",
  hasSeenSliderDrag: "Slider drag hint",
};

/**
 * Clears "seen" flags used by onboarding hints and first-run flows.
 * Pass an array of specific keys to clear only those hints; omit the
 * argument (or pass undefined) to clear every hint at once.
 * After calling this the app will show the selected hints again.
 * Useful for QA / developer testing without reinstalling.
 */
export async function resetOnboardingHints(keys?: OnboardingHintKey[]): Promise<void> {
  const toReset = keys ?? [...ONBOARDING_HINT_KEYS];
  await AsyncStorage.multiRemove(toReset);
}
