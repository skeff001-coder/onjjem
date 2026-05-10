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
import { Image, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppSplash() {
  return (
    <View style={splash.root}>
      <View style={splash.iconWrap}>
        <Image
          source={require("@/assets/images/icon_refined.png")}
          style={splash.icon}
          resizeMode="cover"
        />
        <View style={splash.iconGoldRing} />
      </View>
      <Text style={splash.brand}>ONJJEM</Text>
      <Text style={splash.subtitle}>PHOTO RESTORATION</Text>
      <Text style={splash.tagline}>Preserving Your Legacies Since 2026</Text>
    </View>
  );
}

const splash = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1C1A14",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  iconWrap: {
    position: "relative",
    width: 148,
    height: 148,
    borderRadius: 36,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#C9960C",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  iconGoldRing: {
    position: "absolute",
    inset: 0,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(201,150,12,0.6)",
  },
  brand: {
    fontSize: 36,
    fontWeight: "700",
    color: "#F5EDD8",
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#C9960C",
    letterSpacing: 4,
    marginTop: 4,
    marginBottom: 32,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(245,215,142,0.55)",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
});

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="gift-shop" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="gallery" options={{ headerShown: false }} />
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

  if (!fontsLoaded && !fontError) return <AppSplash />;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
