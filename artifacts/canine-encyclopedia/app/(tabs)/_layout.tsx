import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { COLLAGE_ONLY } from "@/constants/recordingMode";

function SandboxBadge() {
  const insets = useSafeAreaInsets();
  return null;
}

const sandboxStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: 12,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(232,168,56,0.15)",
    borderWidth: 1,
    borderColor: "rgba(232,168,56,0.35)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#e8a838",
    letterSpacing: 0.8,
  },
});

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "camera.viewfinder", selected: "camera.viewfinder" }} />
        <Label>Scanner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gallery">
        <Icon sf={{ default: "pawprint", selected: "pawprint.fill" }} />
        <Label>My Pack</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Doggie Gifts</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: COLLAGE_ONLY ? { display: "none" } : {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="camera.viewfinder" tintColor={color} size={24} />
            ) : (
              <Ionicons name="scan-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "My Pack",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="pawprint.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="paw-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Doggie Gifts",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bag.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="bag-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="encyclopedia" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <SandboxBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  promoStrip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(201,168,76,0.25)",
  },
  promoText: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "rgba(201,168,76,0.75)",
    fontFamily: "Inter_500Medium",
  },
});
