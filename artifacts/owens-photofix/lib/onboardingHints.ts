import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_HINT_KEYS = [
  "hasSeenWelcome",
  "hasSeenPinchHint",
  "hasSeenResultTip",
  "hasSeenPickerTip",
  "hasSeenGalleryHint",
] as const;

export type OnboardingHintKey = (typeof ONBOARDING_HINT_KEYS)[number];

/**
 * Clears every "seen" flag used by onboarding hints and first-run flows.
 * After calling this the app will show all hints again as if freshly installed.
 * Useful for QA / developer testing without reinstalling.
 */
export async function resetOnboardingHints(): Promise<void> {
  await AsyncStorage.multiRemove([...ONBOARDING_HINT_KEYS]);
}
