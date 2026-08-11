import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// BISECT STEP 2 — Ionicons added back only
// If this crashes: Ionicons is the culprit.
// If this opens fine: Ionicons is safe, move to step 3 (add image picker).

export default function CartoonScreen() {
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#C9960C" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <Ionicons name="color-wand-outline" size={48} color="#C9960C" />
          <Text style={s.title}>Cartoon-ify</Text>
          <Text style={s.subtitle}>
            Bisect step 2 — Ionicons added back. If you can read this without
            crashing, Ionicons is fine and we add the image picker next.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0D09" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    gap: 4,
  },
  backText: { color: "#C9960C", fontSize: 16 },
  hero: { alignItems: "center", gap: 16, marginTop: 40 },
  title: {
    fontSize: 32,
    color: "#F5EDD8",
    letterSpacing: 1,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(245,237,216,0.65)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
