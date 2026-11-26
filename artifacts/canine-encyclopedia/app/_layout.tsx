import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { SubscriptionProvider, initializeRevenueCat } from "@/lib/revenuecat";

// TEMPORARY DIAGNOSTIC — remove once the launch crash is identified.
// Build 92 crashes with SIGABRT from an uncaught JS error during startup,
// but the device crash log has no symbols and no error message/stack, only
// raw memory offsets. React Native's own uncaught-error handler is what's
// escalating that error into a native abort; intercepting it here instead
// shows the real error message and stack on screen as an alert, so the
// next test run tells us exactly what's throwing instead of just crashing.
if ((global as any).ErrorUtils) {
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    // Only show the raw error pop-up in development; real users just get a
    // console log so they never see a stack trace.
    console.warn(isFatal ? "Fatal JS error (captured):" : "JS error (captured):", error?.message ?? String(error));
    if (__DEV__) {
      try {
        Alert.alert(
          isFatal ? "Fatal JS Error (captured)" : "JS Error (captured)",
          `${error?.message ?? String(error)}\n\n${(error?.stack ?? "").toString().slice(0, 1200)}`,
        );
      } catch {}
    }
    // Deliberately not calling the default handler, so a stray JS error
    // doesn't escalate into a native abort and crash the app.
  });
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

try {
  initializeRevenueCat();
} catch (err: any) {
  Alert.alert("RevenueCat Unavailable", err?.message ?? "Unknown error");
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="breed"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="breed-search"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="camera-capture"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
              <SubscriptionProvider>
                <RootLayoutNav />
              </SubscriptionProvider>
            </AppProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
