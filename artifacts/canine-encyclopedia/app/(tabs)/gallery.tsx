import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Linking,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, type GalleryEntry } from "@/context/AppContext";
import { BreedCard } from "@/components/BreedCard";
import { PUPGRADE_PRODUCT_IDS, purchasePupgrade } from "@/lib/revenuecat";
import { getGlowup, type GlowupResult } from "@/lib/gemini";

const { width } = Dimensions.get("window");

const BARK_TRANSLATIONS = [
  "Feed me immediately. This is not a drill. 🍗",
  "There is a SUSPICIOUS leaf outside. Investigate at once.",
  "I love you more than squirrels. That's a lot.",
  "Why are you looking at your phone? Look at ME.",
  "The postman has disrespected us again. I handled it.",
  "Walkies? WALKIES? I heard walkies?! LET'S GO.",
  "That other dog looked at my ball. My ball. MINE.",
  "I have sat on this spot for 0.3 seconds and need attention.",
];

const GLOWUP_STYLES = [
  { label: "Van Gogh", emoji: "🌻", desc: "Swirling impressionist brushstrokes" },
  { label: "Watercolour", emoji: "🎨", desc: "Soft pastel wash portrait" },
  { label: "Neon Pop", emoji: "⚡", desc: "Bold neon graphic art style" },
  { label: "Pencil Sketch", emoji: "✏️", desc: "Fine charcoal line drawing" },
  { label: "Studio Portrait", emoji: "📸", desc: "Professional headshot lighting" },
  { label: "Royal Portrait", emoji: "👑", desc: "17th century oil painting" },
];

const BARKOFF_SOUNDS = [
  { label: "Head Tilt", emoji: "🐕", desc: "High-pitched mystery squeak" },
  { label: "Freeze", emoji: "🧊", desc: "Ultrasonic attention tone" },
  { label: "Play Bow", emoji: "🎾", desc: "Puppy excitement chirp" },
  { label: "Zoomies", emoji: "💨", desc: "Chaotic energy activator" },
  { label: "Nap Time", emoji: "😴", desc: "Calm, low frequency hum" },
];

type PupgradeKey = "bark_translator" | "digital_pawsport" | "ai_glowup" | "golden_badge" | "barkoff_pack";

const GIMMICKS: Array<{
  id: PupgradeKey;
  title: string;
  icon: string;
  description: string;
  color: string;
}> = [
  {
    id: "bark_translator",
    title: "Bark Translator",
    icon: "🗣️",
    description: "AI decodes your dog's barks into hilarious WhatsApp-ready texts.",
    color: "#FF2D78",
  },
  {
    id: "digital_pawsport",
    title: "Digital Pawsport",
    icon: "🆔",
    description: "A premium ID card for your dog — breed, name, and all their stats.",
    color: "#00F5FF",
  },
  {
    id: "ai_glowup",
    title: "AI Glow-Up",
    icon: "🎨",
    description: "Transform your dog's photo into a stunning digital masterpiece.",
    color: "#B24BF3",
  },
  {
    id: "golden_badge",
    title: "Golden Bone Badge",
    icon: "🦴",
    description: "Show off your VIP dog owner status with a glowing golden badge.",
    color: "#c9a84c",
  },
  {
    id: "barkoff_pack",
    title: "The Bark-Off Pack",
    icon: "🔊",
    description: "Secret sounds that trigger adorable head-tilts and zoomies.",
    color: "#00FF9D",
  },
];

export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gallery, removeFromGallery, setCurrentKnowledge, setCurrentScan, setCurrentDogName, knowledgeCache } = useApp();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [unlocked, setUnlocked] = useState<Record<PupgradeKey, boolean>>({
    bark_translator: false,
    digital_pawsport: false,
    ai_glowup: false,
    golden_badge: false,
    barkoff_pack: false,
  });
  const [purchasing, setPurchasing] = useState<PupgradeKey | null>(null);
  const [activeFeature, setActiveFeature] = useState<PupgradeKey | null>(null);
  const [barkResult, setBarkResult] = useState("");
  const [glowupResult, setGlowupResult] = useState<GlowupResult | null>(null);
  const [glowupLoading, setGlowupLoading] = useState(false);
  const [glowupStyle, setGlowupStyle] = useState<string | null>(null);
  const [barkoffActive, setBarkoffActive] = useState<string | null>(null);
  const [barkoffDone, setBarkoffDone] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const handleUnlock = async (id: PupgradeKey, title: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      Alert.alert(
        "Download the App",
        "Pup-Grade features are unlocked in the That's My Dog! iOS app. Download it free from the App Store.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "App Store", onPress: () => Linking.openURL("https://apps.apple.com/app/id6771118261") },
        ]
      );
      return;
    }
    Alert.alert(
      `Unlock ${title}`,
      "Get instant access for only £0.99!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay £0.99",
          onPress: async () => {
            setPurchasing(id);
            try {
              await purchasePupgrade(PUPGRADE_PRODUCT_IDS[id]);
              setUnlocked((prev) => ({ ...prev, [id]: true }));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Unlocked! 🎉", `${title} is now active in your Pack.`);
            } catch (e: any) {
              if (!e?.userCancelled) Alert.alert("Payment failed", e?.message ?? "Please try again.");
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    if (barkoffActive && !barkoffDone) loop.start();
    else { loop.stop(); pulseAnim.setValue(1); }
    return () => loop.stop();
  }, [barkoffActive, barkoffDone]);

  const fireBarkoff = (sound: typeof BARKOFF_SOUNDS[0]) => {
    if (barkoffActive) return;
    setBarkoffActive(sound.label);
    setBarkoffDone(false);
    if (Platform.OS !== "web") {
      const patterns: Haptics.ImpactFeedbackStyle[] = [
        Haptics.ImpactFeedbackStyle.Heavy,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
      ];
      let i = 0;
      const interval = setInterval(() => {
        Haptics.impactAsync(patterns[i % patterns.length]);
        i++;
        if (i >= 5) clearInterval(interval);
      }, 400);
    }
    setTimeout(() => {
      setBarkoffDone(true);
      setBarkoffActive(null);
    }, 3000);
  };

  const triggerGlowup = async (style: string) => {
    if (glowupLoading) return;
    setGlowupStyle(style);
    setGlowupResult(null);
    setGlowupLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const breed = firstDog?.breed ?? "Dog";
      const dogName = firstDog ? (gallery[0]?.dogName ?? undefined) : undefined;
      const result = await getGlowup(breed, style, dogName);
      setGlowupResult(result);
    } catch {
      Alert.alert("Glow-Up failed", "Please check your connection and try again.");
      setGlowupStyle(null);
    } finally {
      setGlowupLoading(false);
    }
  };

  const openFeature = (id: PupgradeKey) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === "bark_translator") {
      setBarkResult(BARK_TRANSLATIONS[Math.floor(Math.random() * BARK_TRANSLATIONS.length)]);
    }
    if (id === "ai_glowup") {
      setGlowupResult(null);
      setGlowupStyle(null);
    }
    if (id === "barkoff_pack") {
      setBarkoffActive(null);
      setBarkoffDone(false);
    }
    setActiveFeature(id);
  };

  const firstDog = gallery[0];
  const namedCount = gallery.filter((g) => g.dogName).length;

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
          {unlocked.golden_badge && (
            <View style={[styles.goldBadge, { backgroundColor: "#c9a84c22", borderColor: "#c9a84c55" }]}>
              <Text style={{ fontSize: 20 }}>🦴</Text>
              <Text style={[styles.goldBadgeText, { color: colors.gold }]}>VIP</Text>
            </View>
          )}
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

        {/* Pup-Grade Shop */}
        <View style={[styles.shopSection, { borderTopColor: colors.border }]}>
          <View style={styles.shopHeader}>
            <Text style={{ fontSize: 20 }}>💎</Text>
            <View>
              <Text style={[styles.shopTitle, { color: colors.foreground }]}>Pup-Grade Shop</Text>
              <Text style={[styles.shopSub, { color: colors.mutedForeground }]}>Fun extras · £0.99 each · unlock forever</Text>
            </View>
          </View>

          {GIMMICKS.map((g) => {
            const isUnlocked = unlocked[g.id];
            const isBuying = purchasing === g.id;
            return (
              <View key={g.id} style={[styles.gimmickCard, { backgroundColor: colors.card, borderColor: isUnlocked ? g.color + "55" : colors.border }]}>
                <View style={styles.gimmickTop}>
                  <View style={[styles.gimmickIconWrap, { backgroundColor: g.color + "18" }]}>
                    <Text style={styles.gimmickEmoji}>{g.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gimmickTitle, { color: colors.foreground }]}>
                      {g.title}{" "}
                      <Text style={{ fontSize: 14 }}>{isUnlocked ? "✅" : "💎"}</Text>
                    </Text>
                    <Text style={[styles.gimmickDesc, { color: colors.mutedForeground }]}>{g.description}</Text>
                  </View>
                  {isUnlocked ? (
                    <TouchableOpacity
                      onPress={() => openFeature(g.id)}
                      style={[styles.openBtn, { backgroundColor: g.color }]}
                    >
                      <Text style={styles.openBtnText}>Open</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleUnlock(g.id, g.title)}
                      disabled={isBuying}
                      style={[styles.priceBtn, { borderColor: g.color, backgroundColor: g.color + "18" }]}
                    >
                      <Text style={[styles.priceBtnText, { color: g.color }]}>
                        {isBuying ? "…" : "£0.99"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => Linking.openURL("https://onjjem.com")}
            style={[styles.onjjemBtn, { backgroundColor: colors.gold }]}
          >
            <Ionicons name="globe-outline" size={18} color={colors.navy} />
            <Text style={[styles.onjjemBtnText, { color: colors.navy }]}>SHOP AT ONJJEM.COM 🛍️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Feature Modals */}
      <Modal visible={activeFeature !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveFeature(null)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={() => setActiveFeature(null)} style={[styles.modalClose, { backgroundColor: colors.navyMid }]}>
            <Ionicons name="close" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {activeFeature === "bark_translator" && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalEmoji}>🗣️</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Bark Translator</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>What is your dog actually saying?</Text>
              <View style={[styles.translationBox, { backgroundColor: colors.navyMid, borderColor: "#FF2D7855" }]}>
                <Text style={[styles.translationText, { color: "#FF2D78" }]}>{barkResult}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBarkResult(BARK_TRANSLATIONS[Math.floor(Math.random() * BARK_TRANSLATIONS.length)])}
                style={[styles.featureBtn, { backgroundColor: "#FF2D78" }]}
              >
                <Text style={styles.featureBtnText}>Translate Again 🔄</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {activeFeature === "digital_pawsport" && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalEmoji}>🆔</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Digital Pawsport</Text>
              {firstDog ? (
                <View style={[styles.pawsportCard, { backgroundColor: colors.navyMid, borderColor: "#00F5FF44" }]}>
                  <View style={styles.pawsportTop}>
                    {firstDog.uri ? (
                      <Image source={{ uri: firstDog.uri }} style={styles.pawsportPhoto} resizeMode="cover" />
                    ) : (
                      <View style={[styles.pawsportPhoto, { backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }]}>
                        <Text style={{ fontSize: 32 }}>🐕</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.pawsportName, { color: "#00F5FF" }]}>{firstDog.dogName || "Unknown"}</Text>
                      <Text style={[styles.pawsportBreed, { color: colors.foreground }]}>{firstDog.breed}</Text>
                      {firstDog.isMix && <Text style={[styles.pawsportMix, { color: colors.mutedForeground }]}>Mixed breed</Text>}
                    </View>
                  </View>
                  <View style={[styles.pawsportDivider, { backgroundColor: "#00F5FF22" }]} />
                  <View style={styles.pawsportRow}>
                    <Text style={[styles.pawsportLabel, { color: colors.mutedForeground }]}>STATUS</Text>
                    <Text style={[styles.pawsportValue, { color: "#00FF9D" }]}>Very Good Boy ✅</Text>
                  </View>
                  <View style={styles.pawsportRow}>
                    <Text style={[styles.pawsportLabel, { color: colors.mutedForeground }]}>SCANNED BY</Text>
                    <Text style={[styles.pawsportValue, { color: colors.foreground }]}>What's Up Dog! AI</Text>
                  </View>
                  <View style={styles.pawsportRow}>
                    <Text style={[styles.pawsportLabel, { color: colors.mutedForeground }]}>PACK</Text>
                    <Text style={[styles.pawsportValue, { color: colors.gold }]}>{gallery.length} member{gallery.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={[styles.pawsportStamp, { borderColor: "#00F5FF44" }]}>
                    <Text style={[styles.pawsportStampText, { color: "#00F5FF44" }]}>CERTIFIED 🐾</Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.modalSub, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Scan a dog first to generate their Pawsport!
                </Text>
              )}
            </ScrollView>
          )}

          {activeFeature === "ai_glowup" && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalEmoji}>🎨</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>AI Glow-Up</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                {glowupResult ? glowupResult.title : "Choose a style — AI will paint your dog's portrait"}
              </Text>

              {glowupResult ? (
                <View style={{ width: "100%", gap: 12 }}>
                  <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
                    {glowupResult.palette.map((hex, i) => (
                      <View key={i} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: hex, borderWidth: 2, borderColor: "#ffffff22" }} />
                    ))}
                  </View>
                  <View style={[styles.translationBox, { backgroundColor: colors.navyMid, borderColor: "#B24BF355" }]}>
                    <Text style={[styles.translationText, { color: "#B24BF3", fontSize: 15, lineHeight: 22 }]}>{glowupResult.vision}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setGlowupResult(null); setGlowupStyle(null); }}
                    style={[styles.featureBtn, { backgroundColor: "#B24BF3" }]}
                  >
                    <Text style={styles.featureBtnText}>Try Another Style 🎨</Text>
                  </TouchableOpacity>
                </View>
              ) : glowupLoading ? (
                <View style={{ alignItems: "center", gap: 14, paddingVertical: 30 }}>
                  <ActivityIndicator size="large" color="#B24BF3" />
                  <Text style={[styles.modalSub, { color: "#B24BF3" }]}>Painting {glowupStyle} portrait…</Text>
                </View>
              ) : (
                <View style={styles.glowupGrid}>
                  {GLOWUP_STYLES.map((s) => (
                    <TouchableOpacity
                      key={s.label}
                      onPress={() => triggerGlowup(s.label)}
                      style={[styles.glowupCard, { backgroundColor: colors.navyMid, borderColor: "#B24BF355" }]}
                    >
                      <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
                      <Text style={[styles.glowupLabel, { color: colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.glowupDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {activeFeature === "golden_badge" && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalEmoji}>🦴</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Golden Bone Badge</Text>
              <View style={[styles.badgeShowcase, { backgroundColor: colors.navyMid, borderColor: "#c9a84c55" }]}>
                <Text style={{ fontSize: 72 }}>🦴</Text>
                <Text style={[styles.badgeTitle, { color: colors.gold }]}>VIP Dog Owner</Text>
                <Text style={[styles.badgeSub, { color: colors.mutedForeground }]}>
                  Your golden badge is active and displayed on your Pack header.
                  You're officially a top-tier dog parent. 🐾
                </Text>
              </View>
            </ScrollView>
          )}

          {activeFeature === "barkoff_pack" && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalEmoji}>🔊</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>The Bark-Off Pack</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                Point your phone at your dog · Tap to transmit
              </Text>

              {barkoffDone && (
                <View style={[styles.translationBox, { backgroundColor: colors.navyMid, borderColor: "#00FF9D55" }]}>
                  <Text style={{ fontSize: 32, textAlign: "center" }}>🐕</Text>
                  <Text style={[styles.translationText, { color: "#00FF9D", textAlign: "center" }]}>
                    Transmitted! Watch your dog's reaction…
                  </Text>
                </View>
              )}

              {barkoffActive && !barkoffDone && (
                <View style={{ alignItems: "center", gap: 10, paddingVertical: 10 }}>
                  <Animated.Text style={{ fontSize: 48, transform: [{ scale: pulseAnim }] }}>📡</Animated.Text>
                  <Text style={[styles.modalSub, { color: "#00FF9D" }]}>Transmitting {barkoffActive}…</Text>
                </View>
              )}

              <View style={{ gap: 10, width: "100%" }}>
                {BARKOFF_SOUNDS.map((s) => {
                  const isActive = barkoffActive === s.label;
                  return (
                    <TouchableOpacity
                      key={s.label}
                      onPress={() => fireBarkoff(s)}
                      disabled={!!barkoffActive}
                      style={[
                        styles.soundBtn,
                        {
                          backgroundColor: isActive ? "#00FF9D18" : colors.navyMid,
                          borderColor: isActive ? "#00FF9D" : "#00FF9D44",
                          opacity: barkoffActive && !isActive ? 0.45 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.soundLabel, { color: isActive ? "#00FF9D" : colors.foreground }]}>{s.label}</Text>
                        <Text style={[styles.soundDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                      </View>
                      {isActive
                        ? <ActivityIndicator size="small" color="#00FF9D" />
                        : <Ionicons name="play-circle" size={28} color="#00FF9D" />
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
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
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  goldBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },

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
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  shopHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  shopTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  shopSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  gimmickCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  gimmickTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  gimmickIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  gimmickEmoji: { fontSize: 26 },
  gimmickTitle: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: -0.1 },
  gimmickDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 3 },
  priceBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    minWidth: 48,
  },
  priceBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  openBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  openBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#0a0e1a" },

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

  modal: { flex: 1, paddingTop: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalClose: {
    position: "absolute", top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", zIndex: 10,
  },
  modalContent: {
    alignItems: "center",
    padding: 24,
    paddingTop: 40,
    gap: 16,
    width: "100%",
  },
  modalEmoji: { fontSize: 56 },
  modalTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.3, textAlign: "center" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },

  translationBox: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  translationText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
    textAlign: "center",
  },
  featureBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  featureBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  pawsportCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  pawsportTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  pawsportPhoto: { width: 72, height: 72, borderRadius: 14 },
  pawsportName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  pawsportBreed: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pawsportMix: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pawsportDivider: { height: 1, width: "100%" },
  pawsportRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pawsportLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  pawsportValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pawsportStamp: {
    position: "absolute", bottom: 16, right: 16,
    borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    transform: [{ rotate: "-12deg" }],
  },
  pawsportStampText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },

  glowupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    justifyContent: "space-between",
  },
  glowupCard: {
    width: (width - 60) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  glowupLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  glowupDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },

  badgeShowcase: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  badgeTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  badgeSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },

  soundBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
  },
  soundLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  soundDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
