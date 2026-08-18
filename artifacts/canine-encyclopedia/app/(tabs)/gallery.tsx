import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useApp, type GalleryEntry } from "@/context/AppContext";
import { BreedCard } from "@/components/BreedCard";
import { useSubscription } from "@/lib/revenuecat";

const { width } = Dimensions.get("window");

const FACTS = [
  "A dog's nose print is as unique as a human fingerprint.",
  "Dogs can smell about 100,000 times better than humans.",
  "The Basenji is the only breed that doesn't bark — it yodels.",
  "Greyhounds can reach speeds of up to 45 mph.",
  "A dog's heart beats between 60 and 140 times per minute.",
  "Puppies are born blind, deaf, and toothless.",
  "The oldest known dog lived to 29 years and 5 months.",
  "Dogs dream, just like humans — you can see their eyes move during REM sleep.",
  "A dog's sense of smell is so powerful it can detect certain cancers.",
  "Dalmatians are born completely white — their spots appear as they age.",
];

const HOW_IT_WORKS = [
  {
    icon: "camera-outline" as const,
    title: "Take a photo",
    body: "Point your camera at any dog — your own, a friend's, or one you meet on a walk.",
  },
  {
    icon: "sparkles" as const,
    title: "AI identifies the breed",
    body: "Our AI analyses the photo and identifies the breed within seconds, with a confidence score.",
  },
  {
    icon: "paw-outline" as const,
    title: "Explore breed facts",
    body: "Get a full profile — temperament, history, health traits, exercise needs, and more.",
  },
  {
    icon: "albums-outline" as const,
    title: "Build your pack",
    body: "Save every dog you scan. Name them, revisit their profiles, and grow your collection.",
  },
];

const TIPS = [
  {
    icon: "sunny-outline" as const,
    tip: "Scan in good lighting for the most accurate results.",
  },
  {
    icon: "eye-outline" as const,
    tip: "A clear view of the face gives the best breed match.",
  },
  {
    icon: "phone-portrait-outline" as const,
    tip: "Hold the phone steady — blurry photos reduce accuracy.",
  },
  {
    icon: "refresh-outline" as const,
    tip: "Try multiple angles if you're not happy with the first result.",
  },
];

export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gallery, removeFromGallery, setCurrentKnowledge, setCurrentScan, setCurrentDogName, knowledgeCache } = useApp();
  const { hasMixedBreed } = useSubscription();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const LOYALTY_KEY = "wud_loyalty_photos";
  const LOYALTY_SLOTS = 10;

  const [loyaltyPhotos, setLoyaltyPhotos] = useState<string[]>([]);
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [loyaltyComplete, setLoyaltyComplete] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(LOYALTY_KEY);
      const photos = raw ? JSON.parse(raw) as string[] : [];
      setLoyaltyPhotos(photos);
      setLoyaltyComplete(photos.length >= LOYALTY_SLOTS);
      setLoyaltyLoaded(true);
    })();
  }, []);

  const pickLoyaltyPhoto = async (slotIndex: number) => {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos to add a dog to your Loyalty Card.");
      return;
    }
    setPickingSlot(slotIndex);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 60,
      });
      // Show photo picker
      Alert.alert(
        "Add Dog Photo",
        "Choose from your most recent photos — pick any dog breed photo to fill this slot.",
        [
          { text: "Cancel", style: "cancel", onPress: () => setPickingSlot(null) },
          {
            text: "Choose Photo",
            onPress: async () => {
              if (result.assets.length > 0) {
                const asset = result.assets[0];
                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                const uri = info.localUri ?? info.uri ?? asset.uri;
                const updated = [...loyaltyPhotos];
                updated[slotIndex] = uri;
                setLoyaltyPhotos(updated);
                await AsyncStorage.setItem(LOYALTY_KEY, JSON.stringify(updated));
                if (updated.filter(Boolean).length >= LOYALTY_SLOTS) {
                  setLoyaltyComplete(true);
                  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert("🎉 Loyalty Card Complete!", "You've collected all 10 breeds! Your rewards are now unlocked in the That's My Dog! shop.");
                }
              }
              setPickingSlot(null);
            }
          }
        ]
      );
    } catch {
      setPickingSlot(null);
    }
  };

  const namedCount = gallery.filter((g) => g.dogName).length;

  const handlePress = (entry: GalleryEntry) => {
    const cachedKnowledge = knowledgeCache[entry.breed];
    if (cachedKnowledge) setCurrentKnowledge(cachedKnowledge);
    setCurrentDogName(entry.dogName ?? "");
    setCurrentScan({ breed: entry.breed, confidence: "high", isMix: entry.isMix, mixBreeds: entry.mixBreeds });
    router.push("/breed");
  };

  const handleLongPress = (entry: GalleryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const label = entry.dogName ? `${entry.dogName} (${entry.breed})` : entry.breed;
    Alert.alert(label, "Remove from My Pack?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromGallery(entry.id) },
    ]);
  };

  const randomFact = FACTS[Math.floor(Math.random() * FACTS.length)];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 }}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>My Pack</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {gallery.length === 0
                ? "No dogs scanned yet"
                : `${gallery.length} ${gallery.length === 1 ? "dog" : "dogs"}${namedCount > 0 ? ` · ${namedCount} named` : ""}`}
            </Text>
          </View>
          <View style={[styles.pawBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
            <Ionicons name="paw" size={20} color={colors.gold} />
          </View>
        </View>

        {/* ── Loyalty Card ── */}
        {hasMixedBreed && loyaltyLoaded && (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: loyaltyComplete ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
            borderWidth: 1,
            borderColor: loyaltyComplete ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 18,
            gap: 14,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 22 }}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: loyaltyComplete ? "#d4af37" : colors.foreground }}>
                  {loyaltyComplete ? "Loyalty Card Complete! 🎉" : "Dog Breed Loyalty Card"}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                  {loyaltyPhotos.filter(Boolean).length}/{LOYALTY_SLOTS} breeds collected
                </Text>
              </View>
              {loyaltyComplete && (
                <View style={{ backgroundColor: "#d4af37", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: "#000" }}>COMPLETE</Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
              <View style={{
                width: `${(loyaltyPhotos.filter(Boolean).length / LOYALTY_SLOTS) * 100}%`,
                height: "100%",
                backgroundColor: "#d4af37",
                borderRadius: 999,
              }} />
            </View>

            {/* Photo slots grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {Array.from({ length: LOYALTY_SLOTS }).map((_, i) => {
                const photo = loyaltyPhotos[i];
                const isLoading = pickingSlot === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => !loyaltyComplete && pickLoyaltyPhoto(i)}
                    disabled={loyaltyComplete || isLoading}
                    style={{
                      width: (Dimensions.get("window").width - 32 - 36 - 18) / 5,
                      aspectRatio: 1,
                      borderRadius: 10,
                      overflow: "hidden",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: photo ? "#d4af37" : "rgba(255,255,255,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#d4af37" size="small" />
                    ) : photo ? (
                      <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="add" size={20} color="rgba(255,255,255,0.2)" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Instructions / reward */}
            {loyaltyComplete ? (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/shop")}
                style={{ backgroundColor: "#d4af37", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#000" }}>Claim Your Rewards →</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 17 }}>
                Upload photos of 10 different dog breeds to complete your card and unlock exclusive rewards — including a 15% discount on everything at ONJJEM.com. Tap any slot to add a photo.
              </Text>
            )}
          </View>
        )}

        {/* Bundle prompt if not purchased */}
        {!hasMixedBreed && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/index")}
            style={{
              marginHorizontal: 16,
              marginBottom: 20,
              backgroundColor: "rgba(212,175,55,0.06)",
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.2)",
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 20 }}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#d4af37" }}>
                Loyalty Card — unlock with bundle
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                Buy The Full Story Bundle (£2.99) to unlock your Loyalty Card
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* ── Dog Gallery Grid ── */}
        {gallery.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <View style={[styles.emptyIconWrap, { borderColor: colors.border }]}>
              <Ionicons name="paw-outline" size={40} color={colors.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your pack is empty</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Head to the Scanner tab and point your camera at any dog to get started.
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

        {gallery.length > 0 && (
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Tap a dog to view their breed profile · Hold to remove
          </Text>
        )}

        {/* ── Did You Know ── */}
        <View style={[styles.factCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.factHeader}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <Text style={[styles.factLabel, { color: colors.gold }]}>DID YOU KNOW?</Text>
          </View>
          <Text style={[styles.factText, { color: colors.foreground }]}>{randomFact}</Text>
        </View>

        {/* ── How It Works ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
            What's Up Dog! uses advanced AI to identify dog breeds from a single photo — no account needed, no data stored.
          </Text>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={[styles.stepRow, { borderColor: colors.border }]}>
              <View style={[styles.stepIconWrap, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "33" }]}>
                <Ionicons name={step.icon} size={22} color={colors.gold} />
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Scanning Tips ── */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Tips for Better Scans</Text>
          {TIPS.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name={t.icon} size={16} color={colors.gold} />
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{t.tip}</Text>
            </View>
          ))}
        </View>

        {/* ── About the App ── */}
        <View style={[styles.aboutCard, { backgroundColor: colors.navyMid, borderColor: colors.gold + "33" }]}>
          <Text style={[styles.aboutLabel, { color: colors.gold }]}>ABOUT WHAT'S UP DOG!</Text>
          <Text style={[styles.aboutTitle, { color: colors.foreground }]}>Built for dog lovers</Text>
          <Text style={[styles.aboutBody, { color: colors.mutedForeground }]}>
            Whether you've spotted an interesting dog on a walk or want to learn more about your own breed, What's Up Dog! gives you instant, accurate breed information at your fingertips.
          </Text>
          <Text style={[styles.aboutBody, { color: colors.mutedForeground }]}>
            Our AI has been trained on thousands of breeds and mixes, covering everything from the most common family pets to rare working breeds from around the world.
          </Text>
          <View style={[styles.aboutDivider, { backgroundColor: colors.gold + "33" }]} />
          <View style={styles.aboutStats}>
            {[
              { value: "350+", label: "Breeds recognised" },
              { value: "AI", label: "Powered scanner" },
              { value: "Free", label: "No account needed" },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.gold }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Visit ONJJEM ── */}
        <TouchableOpacity
          onPress={() => Linking.openURL("https://onjjem.com")}
          style={[styles.onjjemBtn, { backgroundColor: colors.gold }]}
          activeOpacity={0.85}
        >
          <Ionicons name="globe-outline" size={18} color={colors.navy} />
          <Text style={[styles.onjjemBtnText, { color: colors.navy }]}>SHOP AT ONJJEM.COM 🛍️</Text>
        </TouchableOpacity>

        {/* ── Legal Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/privacy" as any)} activeOpacity={0.7}>
            <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: colors.mutedForeground }]}>·</Text>
          <TouchableOpacity onPress={() => router.push("/terms" as any)} activeOpacity={0.7}>
            <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.footerCopy, { color: colors.mutedForeground }]}>
          © 2025 ONJJEM Ltd · What's Up Dog! · All rights reserved
        </Text>
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
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  pawBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 0,
  },

  emptyState: {
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 20,
    borderStyle: "dashed",
    paddingVertical: 36,
    paddingHorizontal: 28,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  scanNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 4,
  },
  scanNowText: { fontSize: 15, fontFamily: "Inter_700Bold" },

  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  factCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  factHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  factLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  factText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },

  section: {
    marginTop: 28,
    paddingHorizontal: 20,
    gap: 0,
  },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.2, marginBottom: 6 },
  sectionBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 18 },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: { flex: 1, paddingTop: 2, gap: 3 },
  stepTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  stepBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  tipsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  tipsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },

  aboutCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  aboutLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  aboutTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  aboutBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aboutDivider: { height: 1, marginVertical: 4 },
  aboutStats: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  onjjemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 50,
  },
  onjjemBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
  },
  footerLink: { fontSize: 12, fontFamily: "Inter_400Regular" },
  footerDot: { fontSize: 12 },
  footerCopy: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 8,
  },
});
