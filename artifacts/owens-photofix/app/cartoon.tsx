import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";

// MINIMAL TEST VERSION — bisect step 1
// Everything native has been removed: no expo-image-picker, no Ionicons,
// no safe-area hook, no custom fonts, no fetch.
// If this screen opens WITHOUT crashing, the problem is one of the things
// removed, and we add them back one at a time.
// If this STILL crashes, the problem is in navigation/routing itself,
// not this screen's contents.

export default function CartoonScreen() {
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Cartoon-ify</Text>
        <Text style={s.subtitle}>
          Minimal test build. If you can read this without the app crashing,
          this screen is fine and we narrow down from here.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0D09" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  backBtn: { marginBottom: 20, paddingVertical: 10 },
  backText: { color: "#C9960C", fontSize: 16 },
  title: {
    fontSize: 32,
    color: "#F5EDD8",
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(245,237,216,0.65)",
    lineHeight: 20,
  },
});
