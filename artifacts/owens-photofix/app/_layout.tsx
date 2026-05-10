import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
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
import { GraffitiTitle } from "@/components/GraffitiTitle";
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
      {/* Centre content */}
      <View style={splash.centre}>
        {/* Icon */}
        <View style={splash.iconWrap}>
          <Image
            source={require("@/assets/images/icon_refined.png")}
            style={splash.icon}
            resizeMode="cover"
          />
          <View style={splash.iconGoldRing} />
        </View>

        {/* Thin gold rule above brand */}
        <View style={splash.rule} />

        {/* Brand name */}
        <GraffitiTitle fontSize={60} letterSpacing={8} />
        <Text style={splash.subtitle}>PHOTO RESTORATION</Text>
        <Text style={splash.subtitleGifts}>PERSONALISED GIFTS</Text>

        {/* Thin divider */}
        <View style={splash.divider} />

        {/* Tagline */}
        <Text style={splash.tagline}>Turning Memories into Masterpieces</Text>
      </View>

      {/* London badge — pinned to bottom */}
      <View style={splash.londonBadge}>
        <View style={splash.londonLine} />
        <View style={splash.londonRow}>
          <Text style={splash.londonFlag}>🇬🇧</Text>
          <Text style={splash.londonText}>Expertly Restored in London</Text>
        </View>
      </View>
    </View>
  );
}

const splash = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F0D09",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Centre block */
  centre: {
    alignItems: "center",
    gap: 0,
  },

  /* Icon */
  iconWrap: {
    position: "relative",
    width: 152,
    height: 152,
    borderRadius: 38,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#C9960C",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  iconGoldRing: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(201,150,12,0.65)",
  },

  /* Gold rule above brand */
  rule: {
    width: 48,
    height: 1,
    backgroundColor: "#C9960C",
    opacity: 0.55,
    marginBottom: 14,
  },

  /* Brand */
  brand: {
    fontSize: 54,
    fontFamily: "BebasNeue_400Regular",
    color: "#F5EDD8",
    letterSpacing: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C9960C",
    letterSpacing: 5,
    marginBottom: 4,
  },
  subtitleGifts: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C9960C",
    letterSpacing: 5,
    marginBottom: 20,
  },

  /* Divider */
  divider: {
    width: 32,
    height: 1,
    backgroundColor: "rgba(201,150,12,0.3)",
    marginBottom: 16,
  },

  /* Tagline */
  tagline: {
    fontSize: 14,
    color: "rgba(245,237,216,0.6)",
    fontStyle: "italic",
    letterSpacing: 0.4,
  },

  /* London badge */
  londonBadge: {
    position: "absolute",
    bottom: 44,
    alignItems: "center",
    gap: 10,
  },
  londonLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(201,150,12,0.25)",
    marginBottom: 2,
  },
  londonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  londonFlag: {
    fontSize: 14,
  },
  londonText: {
    fontSize: 11,
    color: "rgba(201,150,12,0.7)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
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
      <Stack.Screen name="feature-walls" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
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
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
