import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "wud_apple_user_id";

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  return `https://${domain}`;
}

export async function getOrRequestAppleUserId(): Promise<string | null> {
  if (Platform.OS !== "ios") {
    return null;
  }

  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) return null;

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [],
    });
    if (credential.user) {
      await AsyncStorage.setItem(STORAGE_KEY, credential.user);
      return credential.user;
    }
    return null;
  } catch (err: any) {
    if (err?.code !== "ERR_REQUEST_CANCELED") {
      console.log("Sign in with Apple failed:", err);
    }
    return null;
  }
}

export type FreeScanStatus = { scansUsed: number; remaining: number; limit: number };

export async function getFreeScanStatus(appleUserId: string): Promise<FreeScanStatus | null> {
  try {
    const response = await fetch(
      `${getApiBase()}/api/free-scan/status?appleUserId=${encodeURIComponent(appleUserId)}`,
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function consumeFreeScan(
  appleUserId: string,
): Promise<{ allowed: boolean; remaining: number; limit: number } | null> {
  try {
    const response = await fetch(`${getApiBase()}/api/free-scan/consume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appleUserId }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
