import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, type GalleryEntry } from "@/context/AppContext";
import { BreedCard } from "@/components/BreedCard";
import { getBreedKnowledge } from "@/lib/gemini";

/* ─── Main Screen ─── */
export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gallery, removeFromGallery, setCurrentKnowledge, setCurrentScan, setCurrentDogName, knowledgeCache, cacheKnowledge, setGalleryEntryKnowledge, setSelectedGalleryEntry } = useApp();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const namedCount = gallery.filter((g) => g.dogName).length;

  const handlePress = (entry: GalleryEntry) => {
    setSelectedGalleryEntry(entry);
    setCurrentDogName(entry.dogName ?? "");
    // Prefer the full persisted scan result; fall back to a minimal one for
    // older entries saved before the richer fields were persisted.
    setCurrentScan(
      entry.scanResult ?? {
        breed: entry.breed,
        confidence: "high",
        isMix: entry.isMix,
        mixBreeds: entry.mixBreeds,
      },
    );
    const knowledge = entry.knowledge ?? knowledgeCache[entry.breed] ?? null;
    setCurrentKnowledge(knowledge);
    router.push("/breed");
    // Older entries predate persisted knowledge — fetch once and persist it
    // so the deep report is available instantly on future visits.
    if (!knowledge) {
      getBreedKnowledge(entry.breed)
        .then((k) => {
          setCurrentKnowledge(k);
          cacheKnowledge(entry.breed, k);
          setGalleryEntryKnowledge(entry.id, k);
        })
        .catch(() => {});
    }
  };

  const handleLongPress = (entry: GalleryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const label = entry.dogName ? `${entry.dogName} (${entry.breed})` : entry.breed;
    Alert.alert(label, "Remove from My Pack?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromGallery(entry.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>My Pack</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {gallery.length} {gallery.length === 1 ? "dog" : "dogs"}
              {namedCount > 0 ? ` · ${namedCount} named` : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/settings" as any);
            }}
            style={[styles.settingsBtn, { backgroundColor: colors.navyMid, borderColor: colors.border }]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Dog gallery grid */}
        {gallery.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { borderColor: colors.border }]}>
              <Ionicons name="paw-outline" size={40} color={colors.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your pack is empty</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Scan your dog on the Scanner tab to add them here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {gallery.map((item) => (
              <BreedCard
                key={item.id}
                entry={item}
                onPress={() => handlePress(item)}
                onLongPress={() => handleLongPress(item)}
              />
            ))}
          </View>
        )}

        {/* Shop at onJJem.com */}
        <View style={[styles.shopSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://www.onjjem.com/shop/pets")}
            style={[styles.onjjemBtn, { backgroundColor: colors.gold }]}
          >
            <Ionicons name="globe-outline" size={18} color={colors.navy} />
            <Text style={[styles.onjjemBtnText, { color: colors.navy }]}>SHOP AT ONJJEM.COM 🛍️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 0,
  },
  empty: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },

  shopSection: {
    marginTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  onjjemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 8,
    marginBottom: 8,
  },
  onjjemBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
