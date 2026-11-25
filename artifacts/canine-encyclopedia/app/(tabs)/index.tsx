import { CartoonCarousel, CARTOON_SAMPLES } from '@/components/CartoonCarousel';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Animated,
  Linking,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
  Share,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { waitForCapture } from "@/lib/captureBridge";
import { getOrRequestAppleUserId, getFreeScanStatus, consumeFreeScan } from "@/lib/freeScanAuth";
import { useApp } from "@/context/AppContext";
import { ScanButton } from "@/components/ScanButton";
import { ProductMockup } from "@/components/ProductMockup";
import {
  identifyBreedFromBase64,
  getBreedKnowledge,
  getMixedBreedDNA,
  getAgeEstimate,
  getPersonalityScan,
  getHealthGuide,
  getTrickTrainer,
  getDogCartoon,
  getMoviePoster,
  type MixedBreedResult,
  type AgeEstimateResult,
  type PersonalityResult,
  type HealthGuideResult,
  type TrickTrainerResult,
  type DogCartoonResult,
  type MoviePosterResult,
} from "@/lib/gemini";
import {
  useSubscription,
  PACKAGE_MIXED_BREED,
  PACKAGE_AGE_CALC,
  PACKAGE_PERSONALITY,
  PACKAGE_HEALTH_GUIDE,
  PACKAGE_TRICK_TRAINER,
  PACKAGE_ALL_SCANNERS,
  PACKAGE_CARTOON,
} from "@/lib/revenuecat";
import { COLLAGE_ONLY } from "@/constants/recordingMode";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const COLS = 5;
const TILE = Math.ceil(width / COLS);
const GRID_ROWS = Math.ceil(height / TILE) + 1;
const GRID_TOTAL = COLS * GRID_ROWS;

/* ─── Types ─── */
type ScanType =
  | "breed"
  | "mixed_dna"
  | "age_calc"
  | "personality"
  | "health_guide"
  | "trick_trainer"
  | "cartoon";

interface ScannerDef {
  id: ScanType;
  title: string;
  subtitle: string;
  description: string;
  perks?: string[];
  icon: string;
  color: string;
  glow: string;
  free: boolean;
  packageId?: string;
  entitlementCheck?: () => boolean;
  featured?: boolean;
}

/* ─── Scanner Definitions ─── */
function useScannerDefs(): ScannerDef[] {
  const {
    hasMixedBreed,
    hasAgeCalc,
    hasPersonality,
    hasHealthGuide,
    hasTrickTrainer,
    hasAllScanners,
    hasCartoon,
  } = useSubscription();

  const all = hasAllScanners;
  return useMemo(
    () => [
      {
        id: "breed",
        title: "Breed Identifier",
        subtitle: "Instant breed recognition",
        description: "Point your camera at any dog and our AI will identify the breed in seconds. Free for everyone.",
        icon: "scan-outline",
        color: "#c9a84c",
        glow: "rgba(201,168,76,0.35)",
        free: true,
      },
      {
        id: "mixed_dna",
        title: "🎁 Unlock Everything",
        subtitle: "One purchase. Here's what you get:",
        description: "",
        perks: [
          "Your dog's full personality profile",
          "A personalised health & care guide",
          "Fun trick-training ideas for your dog",
          "How old your dog really is, in human years",
          "3 cartoon artworks of your dog",
          "Free gifts: a postcard of your dog delivered to your door + 15% off real mugs, cards & canvases at ONJJEM.com",
        ],
        icon: "layers-outline",
        color: "#d4af37",
        glow: "rgba(212,175,55,0.3)",
        free: false,
        packageId: PACKAGE_MIXED_BREED,
        entitlementCheck: () => hasMixedBreed || all,
        featured: true,
      },
    ],
    [hasMixedBreed, hasAgeCalc, hasPersonality, hasHealthGuide, hasTrickTrainer, hasCartoon, all]
  );
}

// A zero-dependency stand-in for a real looping video: a small mug mockup
// that cross-fades between "plain" and "cartoon printed on it" on a loop,
// to hint at the actual heat-reveal mugs ONJJEM sells — without needing
// expo-video/expo-av (a genuinely new native dependency, untested in this
// build pipeline) or a bundled video file we don't have.
function MugRevealLoop() {
  const colors = useColors();
  const nativeDriver = Platform.OS !== "web";
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(reveal, { toValue: 1, duration: 900, useNativeDriver: nativeDriver }),
        Animated.delay(1400),
        Animated.timing(reveal, { toValue: 0, duration: 900, useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{
      width: "100%", borderRadius: 20, overflow: "hidden",
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
    }}>
      <View style={{ width: 58, height: 52, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4ddcf", alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", right: -8, top: 13, width: 14, height: 24, borderRadius: 9, borderWidth: 4, borderColor: "#e4ddcf" }} />
        {/* "Printed" patch, fading in and out to mimic the heat-reveal */}
        <Animated.View style={{ width: 36, height: 30, borderRadius: 6, backgroundColor: colors.gold, opacity: reveal, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="paw" size={14} color={colors.navy} />
        </Animated.View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12.5, fontFamily: "Inter_700Bold", color: colors.foreground }}>
          ✨ Turn Your Dog Into Art & Real Mugs
        </Text>
        <Text style={{ fontSize: 10.5, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
          Heat-reveal mugs from ONJJEM — the print appears like magic
        </Text>
      </View>
    </View>
  );
}

/* ─── Header ─── */
function ScannerHeader({
  onScanPress,
  onCreatePosterPress,
  onFestivePress,
}: {
  onScanPress: () => void;
  onCreatePosterPress: () => void;
  onFestivePress: () => void;
}) {
  const colors = useColors();
  const nativeDriver = Platform.OS !== "web";

  // Gentle up/down float on the poster mockup — the only animation this
  // card needs, kept cheap (one Animated.Value, native driver) rather than
  // reaching for a real sample image we don't have.
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1800, useNativeDriver: nativeDriver }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={{ gap: 14, paddingHorizontal: 16, paddingTop: 8 }}>

      {/* ── Hero Showcase Card ── */}
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 22,
        alignItems: "center",
        gap: 16,
      }}>
        {/* Animated poster mockup */}
        <Animated.View style={{ width: "58%", aspectRatio: 3 / 4, transform: [{ translateY: floatY }], marginTop: 6 }}>
          <View style={{
            flex: 1, borderRadius: 22, backgroundColor: colors.navy,
            borderWidth: 3, borderColor: colors.gold, overflow: "hidden",
            alignItems: "center", justifyContent: "center", padding: 12,
            shadowColor: colors.navy, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
          }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Ionicons name="person" size={46} color="#fff9ed" />
              <Ionicons name="paw" size={38} color={colors.gold} style={{ marginLeft: -10, marginBottom: 2 }} />
            </View>
            <Text style={{ marginTop: 10, fontSize: 10, fontFamily: "Inter_700Bold", color: colors.gold, letterSpacing: 2 }}>
              YOU + YOUR DOG
            </Text>
            <Text style={{ fontSize: 8, fontFamily: "Inter_500Medium", color: "rgba(255,249,237,0.55)", marginTop: 2, letterSpacing: 1 }}>
              A MOVIE POSTER
            </Text>
          </View>

          {/* Floating badge: AI speed claim */}
          <View style={{
            position: "absolute", top: -10, right: -14,
            backgroundColor: colors.gold, borderRadius: 999,
            paddingHorizontal: 9, paddingVertical: 5,
            transform: [{ rotate: "6deg" }],
            shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
          }}>
            <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: colors.navy }}>✨ AI Pixar Poster in 10s</Text>
          </View>

          {/* Floating pill: Christmas Edition — doubles as a shortcut into the festive flow */}
          <TouchableOpacity
            onPress={onFestivePress}
            activeOpacity={0.85}
            style={{
              position: "absolute", bottom: -10, left: -14,
              backgroundColor: colors.navy, borderRadius: 999,
              borderWidth: 1, borderColor: colors.gold,
              paddingHorizontal: 9, paddingVertical: 5,
              transform: [{ rotate: "-5deg" }],
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff9ed" }}>🎄 Christmas Edition</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={{
          fontSize: 23,
          fontFamily: "Inter_700Bold",
          color: colors.foreground,
          letterSpacing: -0.4,
          lineHeight: 28,
          textAlign: "center",
        }}>
          Turn You & Your Dog Into a Movie Poster.
        </Text>

        {/* Mug-reveal teaser loop — sits right above the primary button */}
        <MugRevealLoop />

        {/* Two high-impact action buttons */}
        <View style={{ width: "100%", gap: 10 }}>
          <TouchableOpacity
            onPress={onCreatePosterPress}
            activeOpacity={0.88}
            style={{
              backgroundColor: colors.gold, borderRadius: 16,
              paddingVertical: 16, alignItems: "center",
              shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.navy }}>
              🎬 Create You + Your Dog Poster
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onScanPress}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.gold,
              borderRadius: 16, paddingVertical: 15, alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground }}>
              📸 Scan Your Dog (Breed, Vibe & Art)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Discovery grid ── */}
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}>
        <Text style={{
          fontSize: 11,
          fontFamily: "Inter_700Bold",
          color: colors.mutedForeground,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}>
          What you can discover
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {[
            { emoji: "🐾", label: "Breeds" },
            { emoji: "🧠", label: "Vibe" },
            { emoji: "🎂", label: "Age" },
            { emoji: "🧬", label: "History" },
            { emoji: "🎨", label: "Art", isNew: true },
          ].map((item, i) => (
            <View key={i} style={{ alignItems: "center", flex: 1, gap: 6 }}>
              {item.isNew && (
                <View style={{
                  position: "absolute",
                  top: -8,
                  right: 0,
                  backgroundColor: colors.gold,
                  borderRadius: 4,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  zIndex: 1,
                }}>
                  <Text style={{ fontSize: 7, fontFamily: "Inter_700Bold", color: colors.navy }}>NEW</Text>
                </View>
              )}
              <View style={{
                backgroundColor: colors.secondary,
                borderRadius: 12,
                padding: 8,
              }}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              </View>
              <Text style={{
                fontSize: 9,
                fontFamily: "Inter_500Medium",
                color: colors.mutedForeground,
                textAlign: "center",
                lineHeight: 12,
              }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

    </View>
  );
}

const gStyles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#c9a84c",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.4,
    lineHeight: 32,
    marginTop: 6,
  },
  subhead: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
    lineHeight: 18,
  },
});

/* ─── Blinking Footer (recording mode only) ─── */
function BlinkingFooter() {
  const native = Platform.OS !== "web";
  const blink = useRef(new Animated.Value(1)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(blink, { toValue: 1, duration: 0, useNativeDriver: native }), Animated.delay(200), Animated.timing(blink, { toValue: 0, duration: 0, useNativeDriver: native }), Animated.delay(400)])).start();
    Animated.loop(Animated.sequence([Animated.timing(scanY, { toValue: height, duration: 2200, useNativeDriver: native }), Animated.timing(scanY, { toValue: 0, duration: 2200, useNativeDriver: native })])).start();
  }, [blink, scanY]);
  return (
    <>
      <Animated.View style={{ position: "absolute", left: 0, right: 0, height: 3, backgroundColor: "#c9a84c", shadowColor: "#c9a84c", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 18, transform: [{ translateY: scanY }], pointerEvents: "none" } as any} />
      <Animated.View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", opacity: blink, pointerEvents: "none" } as any}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 38, letterSpacing: 1, color: "#ffffff", textShadowColor: "#ffffff", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24 }}>What's Up Dog!</Text>
      </Animated.View>
    </>
  );
}

/* ─── Scanner Card ─── */
function ScannerCard({
  def,
  index,
  onPress,
  owned,
}: {
  def: ScannerDef;
  index: number;
  onPress: () => void;
  owned: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 80,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [anim, index]);

  useEffect(() => {
    if (!def.featured || owned) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [def.featured, owned, pulse]);

  const nativeDriver = Platform.OS !== "web";
  const handleHoverIn = () => {
    setHovered(true);
    Animated.spring(scale, { toValue: 1.03, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handleHoverOut = () => {
    setHovered(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const isFeaturedGlow = def.featured && !owned;
  const glowShadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const glowBorderColor = isFeaturedGlow ? def.color : (hovered ? def.color : "#ead9b8");

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity, width: CARD_WIDTH }}>
      <Animated.View
        style={[
          cardStyles.card,
          {
            borderColor: glowBorderColor,
            borderWidth: isFeaturedGlow ? 1.5 : (hovered ? 1.5 : 1),
            shadowColor: def.color,
            shadowOpacity: isFeaturedGlow ? glowShadowOpacity : (hovered ? 0.25 : 0.08),
            shadowRadius: isFeaturedGlow ? 24 : (hovered ? 20 : 8),
          },
        ]}
      >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={{ gap: 10 }}
        {...(Platform.OS === "web" ? {
          onPointerEnter: handleHoverIn,
          onPointerLeave: handleHoverOut,
        } as any : {})}
      >
        {/* Premium badge */}
        {!def.free && !owned && !def.featured && (
          <View style={[cardStyles.premiumBadge, { backgroundColor: def.color }]}>
            <Text style={cardStyles.premiumBadgeText}>Bundle</Text>
          </View>
        )}
        {!def.free && !owned && def.featured && (
          <View style={[cardStyles.premiumBadge, { backgroundColor: def.color }]}>
            <Text style={cardStyles.premiumBadgeText}>{def.id === "mixed_dna" ? "£2.99 · Unlock" : "£4.99"}</Text>
          </View>
        )}
        {!def.free && owned && (
          <View style={[cardStyles.ownedBadge, { backgroundColor: def.color + "22", borderColor: def.color + "44" }]}>
            <Ionicons name="checkmark-circle" size={12} color={def.color} />
            <Text style={[cardStyles.ownedBadgeText, { color: def.color }]}>Unlocked</Text>
          </View>
        )}
        {def.free && (
          <View style={[cardStyles.freeBadge, { backgroundColor: "#4ade80" }]}>
            <Text style={cardStyles.freeBadgeText}>FREE</Text>
          </View>
        )}

        <View style={cardStyles.row}>
          <View style={[cardStyles.iconWrap, { backgroundColor: def.color + "18" }]}>
            <Ionicons name={def.icon as any} size={26} color={def.color} />
          </View>
          <View style={cardStyles.textWrap}>
            <Text style={cardStyles.title}>{def.title}</Text>
            <Text style={cardStyles.subtitle}>{def.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={def.color} style={{ opacity: 0.6 }} />
        </View>

        {def.perks ? (
          <View style={{ gap: 7, marginTop: 2 }}>
            {def.perks.map((perk, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={def.color}
                  style={{ marginTop: 1 }}
                />
                <Text style={[cardStyles.description, { marginTop: 0, flex: 1 }]}>{perk}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={cardStyles.description}>{def.description}</Text>
        )}
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff9ed",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  premiumBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  premiumBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#2e2013", letterSpacing: 0.3 },
  ownedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  ownedBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  freeBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#2e2013", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2, paddingRight: 56 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#3b2a1d", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#8a7259" },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8a7259", lineHeight: 18, marginTop: 2 },
});

/* ─── Scan Result Types ─── */
type ScanResultData =
  | { type: "breed"; data: Awaited<ReturnType<typeof identifyBreedFromBase64>> }
  | { type: "mixed_dna"; data: MixedBreedResult }
  | { type: "age_calc"; data: AgeEstimateResult }
  | { type: "personality"; data: PersonalityResult }
  | { type: "health_guide"; data: HealthGuideResult }
  | { type: "trick_trainer"; data: TrickTrainerResult }
  | { type: "cartoon"; data: DogCartoonResult };

/* ─── Result Modal ─── */
function ScanResultModal({
  visible,
  onClose,
  result,
  scanType,
  scannedUri,
  dogName,
  dogBreed,
}: {
  visible: boolean;
  onClose: () => void;
  result: ScanResultData | null;
  scanType: ScanType;
  scannedUri: string | null;
  dogName?: string | null;
  dogBreed?: string | null;
}) {
  const colors = useColors();
  if (!visible || !result) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[rStyles.container, { backgroundColor: colors.background }]}>
        <View style={rStyles.topBar}>
          <View style={rStyles.handle} />
          <TouchableOpacity onPress={onClose} style={rStyles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rStyles.scroll}>
          {scanType === "mixed_dna" && result.type === "mixed_dna" && (
            <MixedDNAResult data={result.data} />
          )}
          {scanType === "age_calc" && result.type === "age_calc" && (
            <AgeCalcResult data={result.data} />
          )}
          {scanType === "personality" && result.type === "personality" && (
            <PersonalityResultView data={result.data} />
          )}
          {scanType === "health_guide" && result.type === "health_guide" && (
            <HealthGuideResult data={result.data} />
          )}
          {scanType === "trick_trainer" && result.type === "trick_trainer" && (
            <TrickTrainerResultView data={result.data} />
          )}
          {scanType === "cartoon" && result.type === "cartoon" && (
            <CartoonResultView data={result.data} dogName={dogName} dogBreed={dogBreed} />
          )}
          {scannedUri && !["cartoon", "mixed_dna", "age_calc", "personality"].includes(scanType) && <ProductMockup photoUri={scannedUri} />}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MixedDNAResult({ data }: { data: MixedBreedResult }) {
  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#c98b9c" }]}>
        <Ionicons name="git-merge-outline" size={28} color="#c98b9c" />
      </View>
      <Text style={rStyles.resultTitle}>Mixed Breed DNA</Text>
      <Text style={rStyles.resultSubtitle}>Genetic Heritage Analysis</Text>

      <View style={rStyles.metricRow}>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#c98b9c" }]}>{data.primaryBreed}</Text>
          <Text style={rStyles.metricLabel}>Primary Breed</Text>
        </View>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#c98b9c" }]}>{data.secondaryBreed}</Text>
          <Text style={rStyles.metricLabel}>Secondary</Text>
        </View>
      </View>

      <View style={rStyles.metric}>
        <Text style={[rStyles.metricValue, { color: "#c98b9c" }]}>{data.confidence}%</Text>
        <Text style={rStyles.metricLabel}>Confidence</Text>
      </View>

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryText}>{data.dnaSummary}</Text>
      </View>

      <ResultSection title="Genetic Markers" icon="cellular-outline" color="#c98b9c" items={data.geneticMarkers} />

      {data.ancestralBreeds?.length > 0 && (
        <View style={{ marginTop: 8, width: "100%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Ionicons name="time-outline" size={14} color="#c98b9c" />
            <Text style={[rStyles.sectionTitle, { color: "#c98b9c" }]}>Ancestral Breakdown</Text>
          </View>
          {data.ancestralBreeds.map((a, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={[rStyles.bulletText, { fontWeight: "700" }]}>{a.breed}</Text>
                <Text style={[rStyles.bulletText, { color: "#c98b9c", fontWeight: "700" }]}>{a.estimatedPercentage}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${a.estimatedPercentage}%`, backgroundColor: "#c98b9c", borderRadius: 3 }} />
              </View>
              <Text style={[rStyles.bulletText, { marginTop: 4, opacity: 0.75 }]}>{a.traitContribution}</Text>
            </View>
          ))}
        </View>
      )}

      {data.inheritedTraits?.length > 0 && (
        <View style={{ marginTop: 8, width: "100%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Ionicons name="paw-outline" size={14} color="#c98b9c" />
            <Text style={[rStyles.sectionTitle, { color: "#c98b9c" }]}>Inherited Traits</Text>
          </View>
          {data.inheritedTraits.map((t, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <Text style={{ color: "#c98b9c", fontSize: 14, marginTop: 1 }}>•</Text>
              <Text style={[rStyles.bulletText, { flex: 1 }]}>
                <Text style={{ fontWeight: "700" }}>{t.trait}</Text>
                {"  —  likely from "}
                {t.likelySource}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ResultSection title="Health Considerations" icon="medkit-outline" color="#c98b9c" items={data.healthConsiderations} />

            {!!data.geneticFunFact && (
        <View style={[rStyles.summaryBox, { marginTop: 8 }]}>
          <Text style={[rStyles.summaryLabel, { color: "#c98b9c" }]}>DID YOU KNOW?</Text>
          <Text style={rStyles.summaryText}>{data.geneticFunFact}</Text>
        </View>
      )}
      <PrintCTA color="#c98b9c" />
    </View>
  );
}

function AgeCalcResult({ data }: { data: AgeEstimateResult }) {

  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#7fb0c2" }]}>
        <Ionicons name="hourglass-outline" size={28} color="#7fb0c2" />
      </View>
      <Text style={rStyles.resultTitle}>Age Calculator</Text>
      <Text style={rStyles.resultSubtitle}>Visual Age Estimation</Text>

      <View style={rStyles.bigNumberWrap}>
        <Text style={[rStyles.bigNumber, { color: "#7fb0c2" }]}>{data.estimatedAge}</Text>
        <Text style={rStyles.bigNumberLabel}>Estimated Age</Text>
      </View>

      <View style={rStyles.metricRow}>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#7fb0c2" }]}>{data.ageRange}</Text>
          <Text style={rStyles.metricLabel}>Range</Text>
        </View>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#7fb0c2" }]}>{data.confidence}%</Text>
          <Text style={rStyles.metricLabel}>Confidence</Text>
        </View>
      </View>

      <View style={rStyles.metricRow}>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#7fb0c2" }]}>{data.lifeStage}</Text>
          <Text style={rStyles.metricLabel}>Life Stage</Text>
        </View>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#7fb0c2" }]}>{data.humanYearsEquivalent}</Text>
          <Text style={rStyles.metricLabel}>Human Years</Text>
        </View>
      </View>

      {!!data.lifeStageDescription && (
        <View style={rStyles.summaryBox}>
          <Text style={rStyles.summaryLabel}>What This Means Right Now</Text>
          <Text style={rStyles.summaryText}>{data.lifeStageDescription}</Text>
        </View>
      )}

      <ResultSection title="Visual Signs" icon="eye-outline" color="#7fb0c2" items={data.signs} />

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryLabel}>Birthday Estimate</Text>
        <Text style={rStyles.summaryText}>{data.birthdayEstimate}</Text>
      </View>

      {!!data.whatsNextMilestone && (
        <View style={rStyles.summaryBox}>
          <Text style={rStyles.summaryLabel}>What's Next</Text>
          <Text style={rStyles.summaryText}>{data.whatsNextMilestone}</Text>
        </View>
      )}

            <ResultSection title="Age-Specific Care" icon="heart-outline" color="#7fb0c2" items={data.careRecommendations} />
      <PrintCTA color="#7fb0c2" />
    </View>
  );
}

function CartoonResultView({
  data,
  dogName,
  dogBreed,
}: {
  data: DogCartoonResult;
  dogName?: string | null;
  dogBreed?: string | null;
}) {

  const [saving, setSaving] = useState(false);
  const dataUri = `data:${data.mimeType};base64,${data.imageBase64}`;

  // Simple caption, no new image-compositing library needed —
  // just a readable text line to go alongside the cartoon image share.
  const shareCaption = `${dogName?.trim() ? dogName.trim() : "My dog"}${
    dogBreed ? `, the ${dogBreed}` : ""
  } — cartoon-ified with What's Up Dog! 🐾`;

  const handleSaveShare = async () => {
    setSaving(true);
    try {
      const fileUri = `${FileSystem.cacheDirectory}dog-cartoon-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, data.imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Share.share({ url: fileUri, message: shareCaption });
    } catch (e) {
      Alert.alert("Couldn't save", "Something went wrong saving the image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#e0a95c" }]}>
        <Ionicons name="color-wand-outline" size={28} color="#e0a95c" />
      </View>
      <Text style={rStyles.resultTitle}>Cartoon-ify</Text>
      <Text style={rStyles.resultSubtitle}>Your dog, animated-movie style</Text>

      <Image
        source={{ uri: dataUri }}
        style={{ width: "100%", aspectRatio: 1, borderRadius: 16, marginTop: 16, backgroundColor: "#1a1a1a" }}
        resizeMode="cover"
      />

            <TouchableOpacity
        onPress={handleSaveShare}
        disabled={saving}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: "#e0a95c",
          borderRadius: 12,
          paddingVertical: 14,
          marginTop: 16,
        }}
      >
        {saving ? (
          <ActivityIndicator color="#1a1206" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={18} color="#1a1206" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a1206" }}>Save / Share</Text>
          </>
        )}
      </TouchableOpacity>

      <MugCardMockup imageBase64={data.imageBase64} mimeType={data.mimeType} />
    </View>
  );
}


function PersonalityResultView({ data }: { data: PersonalityResult }) {
  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#a999c9" }]}>
        <Ionicons name="happy-outline" size={28} color="#a999c9" />
      </View>
      <Text style={rStyles.resultTitle}>Personality Matcher</Text>
      <Text style={rStyles.resultSubtitle}>Behavioural Analysis</Text>

      <View style={rStyles.metric}>
        <Text style={[rStyles.metricValue, { color: "#a999c9" }]}>{data.dominantTrait}</Text>
        <Text style={rStyles.metricLabel}>Dominant Trait</Text>
      </View>

      <View style={rStyles.metricRow}>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#a999c9", fontSize: 14 }]}>{data.socialStyle}</Text>
          <Text style={rStyles.metricLabel}>Social Style</Text>
        </View>
        <View style={rStyles.metric}>
          <Text style={[rStyles.metricValue, { color: "#a999c9", fontSize: 14 }]}>{data.energyLevel}</Text>
          <Text style={rStyles.metricLabel}>Energy</Text>
        </View>
      </View>

      <Text style={[rStyles.sectionTitle, { color: "#a999c9" }]}>Personality Traits</Text>
      <View style={rStyles.tagRow}>
        {data.traits.map((t, i) => (
          <View key={i} style={[rStyles.tag, { backgroundColor: "#a999c922", borderColor: "#a999c944" }]}>
            <Text style={[rStyles.tagText, { color: "#a999c9" }]}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryText}>{data.description}</Text>
      </View>

      {!!data.idealOwnerMatch && (
        <View style={rStyles.summaryBox}>
          <Text style={[rStyles.summaryLabel, { color: "#a999c9" }]}>Their Ideal Owner</Text>
          <Text style={rStyles.summaryText}>{data.idealOwnerMatch}</Text>
        </View>
      )}

      {!!data.trainingStyle && (
        <View style={rStyles.summaryBox}>
          <Text style={[rStyles.summaryLabel, { color: "#a999c9" }]}>Best Training Approach</Text>
          <Text style={rStyles.summaryText}>{data.trainingStyle}</Text>
        </View>
      )}

      {!!data.behaviouralQuirk && (
        <View style={rStyles.summaryBox}>
          <Text style={[rStyles.summaryLabel, { color: "#a999c9" }]}>Their Little Quirk</Text>
          <Text style={rStyles.summaryText}>{data.behaviouralQuirk}</Text>
        </View>
      )}

            {!!data.compatibilityNotes && (
        <View style={rStyles.summaryBox}>
          <Text style={[rStyles.summaryLabel, { color: "#a999c9" }]}>Kids & Other Pets</Text>
          <Text style={rStyles.summaryText}>{data.compatibilityNotes}</Text>
        </View>
      )}
      <PrintCTA color="#a999c9" />
    </View>
  );
}

function HealthGuideResult({ data }: { data: HealthGuideResult }) {

  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#4ade80" }]}>
        <Ionicons name="medical-outline" size={28} color="#4ade80" />
      </View>
      <Text style={rStyles.resultTitle}>Health & Care Guide</Text>
      <Text style={rStyles.resultSubtitle}>Personalised Wellness Plan</Text>

      <ResultSection title="Health Tips" icon="heart-outline" color="#4ade80" items={data.healthTips} />

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryLabel}>Exercise Plan</Text>
        <Text style={rStyles.summaryText}>{data.exercisePlan}</Text>
      </View>

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryLabel}>Diet & Nutrition</Text>
        <Text style={rStyles.summaryText}>{data.dietNotes}</Text>
      </View>

      <TouchableOpacity
        onPress={() => Linking.openURL("https://apps.apple.com/app/id6769327588")}
        style={rStyles.crossPromoCard}
      >
        <View style={rStyles.crossPromoIconWrap}>
          <Image
            source={{ uri: "https://raw.githubusercontent.com/skeff001-coder/BYTE-2-EAT/main/artifacts/culinary-scan-assist/public/app-icon.png" }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rStyles.crossPromoTitle}>Feeding yourself too?</Text>
          <Text style={rStyles.crossPromoBody}>
            Also on the Apple App Store: try Byte 2 Eat — turn a photo of your fridge into
            personalised meal ideas.
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#4ade80" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL("https://apps.apple.com/app/id6770767370")}
        style={rStyles.crossPromoCard}
      >
        <View style={rStyles.crossPromoIconWrap}>
          <Image
            source={{ uri: "https://raw.githubusercontent.com/skeff001-coder/onjjem/main/artifacts/owens-photofix/assets/images/icon.png" }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rStyles.crossPromoTitle}>Turn their photo into a gift</Text>
          <Text style={rStyles.crossPromoBody}>
            Also on the Apple App Store: try ONJJEM for personalised photo gifts — mugs,
            canvas prints & more.
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#4ade80" />
      </TouchableOpacity>

      <ResultSection title="Vet Checklist" icon="checkmark-circle-outline" color="#4ade80" items={data.vetChecklist} />

      <Text style={[rStyles.sectionTitle, { color: "#c9a84c", marginTop: 8 }]}>Recommended Products</Text>
      {data.productRecommendations.map((p, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL(p.url)} style={rStyles.productCard}>
          <View style={{ flex: 1 }}>
            <Text style={rStyles.productName}>{p.name}</Text>
            <Text style={rStyles.productDesc}>{p.description}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#c9a84c" />
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => Linking.openURL("https://onjjem.com")} style={[rStyles.onjjemLink, { marginTop: 4 }]}>
        <Text style={rStyles.onjjemLinkText}>Browse all products at ONJJEM.com →</Text>
      </TouchableOpacity>
    </View>
  );
}

function TrickTrainerResultView({ data }: { data: TrickTrainerResult }) {
  return (
    <View style={rStyles.resultWrap}>
      <View style={[rStyles.iconRing, { borderColor: "#c9a84c" }]}>
        <Ionicons name="flash-outline" size={28} color="#c9a84c" />
      </View>
      <Text style={rStyles.resultTitle}>Trick Trainer</Text>
      <Text style={rStyles.resultSubtitle}>{data.difficulty} Training Plan</Text>

      <View style={rStyles.metric}>
        <Text style={[rStyles.metricValue, { color: "#c9a84c" }]}>{data.estimatedTime}</Text>
        <Text style={rStyles.metricLabel}>Total Time to Master</Text>
      </View>

      <Text style={[rStyles.sectionTitle, { color: "#c9a84c" }]}>Tricks to Learn</Text>
      {data.tricks.map((t, i) => (
        <View key={i} style={rStyles.trickCard}>
          <View style={[rStyles.trickNumber, { backgroundColor: "#c9a84c22", borderColor: "#c9a84c44" }]}>
            <Text style={[rStyles.trickNumberText, { color: "#c9a84c" }]}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rStyles.trickName}>{t.name}</Text>
            <Text style={rStyles.trickMeta}>{t.steps} steps · {t.time}</Text>
          </View>
        </View>
      ))}

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryLabel}>Training Schedule</Text>
        <Text style={rStyles.summaryText}>{data.trainingSchedule}</Text>
      </View>

      <ResultSection title="Pro Tips" icon="bulb-outline" color="#c9a84c" items={data.tips} />
    </View>
  );
}

function PrintCTA({ color }: { color: string }) {
  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity
        onPress={() => Linking.openURL("https://onjjem.com/shop")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: color,
          borderRadius: 12,
          paddingVertical: 14,
        }}
      >
        <Ionicons name="print-outline" size={18} color={color} />
        <Text style={{ fontSize: 14, fontWeight: "700", color }}>Get Your Dog Printed at ONJJEM</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: "#8a7259", textAlign: "center", marginTop: 8 }}>
        Mugs, canvas, magnets & more — using your own dog photos
      </Text>
    </View>
  );
}

// Plain-RN "mug on a table" mockup — no gradients/shader library, just
// layered Views (rounded rect body, a thin darker strip for shading, a
// ring-shaped handle clipped to a sliver by sitting mostly outside the
// body's bounds) with the artwork dropped into a flat inset "label" area
// rather than a true cylindrical-wrap projection, which would need a
// skia/canvas dependency this build deliberately avoids.
function MugCardMockup({ imageBase64, mimeType }: { imageBase64: string; mimeType: string }) {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;
  const [saving, setSaving] = useState(false);

  const handleOrder = async () => {
    setSaving(true);
    try {
      const fileUri = `${FileSystem.cacheDirectory}onjjem-gift-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Share.share(
        Platform.OS === "ios"
          ? { url: fileUri }
          : { url: fileUri, message: "My gift artwork — upload this at onjjem.com/mug" },
      );
    } catch {
      // Saving/sharing failing shouldn't block getting to the shop.
    } finally {
      setSaving(false);
      // Confirmed-working product page (Owen tested it live), not the
      // generic /shop homepage — "Order This Mug" should land on a mug,
      // not wherever browsing from the homepage happens to lead.
      Linking.openURL("https://onjjem.com/mug");
    }
  };

  return (
    <View style={{
      width: "100%", backgroundColor: "#fff9ed", borderRadius: 20,
      borderWidth: 1, borderColor: "#ead9b8", padding: 18, gap: 14,
      alignItems: "center", marginTop: 8,
    }}>
      <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#3b2a1d" }}>
        Make It a Real Gift (ONJJEM)
      </Text>

      <View style={{ flexDirection: "row", gap: 24, alignItems: "flex-end", justifyContent: "center" }}>
        {/* Mug mockup */}
        <View style={{ width: 120, alignItems: "center" }}>
          <View style={{
            width: 100, height: 90, borderRadius: 14, backgroundColor: "#ffffff",
            borderWidth: 1, borderColor: "#e4ddcf",
            shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
            alignItems: "center", justifyContent: "center",
          }}>
            {/* handle */}
            <View style={{
              position: "absolute", right: -14, top: 18,
              width: 26, height: 46, borderRadius: 16,
              borderWidth: 7, borderColor: "#e4ddcf",
            }} />
            {/* subtle cylindrical shading */}
            <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, backgroundColor: "rgba(0,0,0,0.06)", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />
            <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 10, backgroundColor: "rgba(0,0,0,0.04)", borderTopRightRadius: 14, borderBottomRightRadius: 14 }} />
            {/* artwork label */}
            <View style={{ width: 70, height: 62, borderRadius: 6, overflow: "hidden" }}>
              <Image source={{ uri: dataUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </View>
          </View>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8a7259", marginTop: 8 }}>Ceramic Mug</Text>
        </View>

        {/* Greeting card mockup */}
        <View style={{ width: 90, alignItems: "center" }}>
          <View style={{
            width: 80, height: 108, borderRadius: 8, backgroundColor: "#ffffff",
            borderWidth: 1, borderColor: "#e4ddcf", overflow: "hidden",
            shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
          }}>
            <Image source={{ uri: dataUri }} style={{ width: "100%", height: "72%" }} resizeMode="cover" />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#3b2a1d" }}>Season's</Text>
              <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#3b2a1d" }}>Greetings</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8a7259", marginTop: 8 }}>Greeting Card</Text>
        </View>
      </View>

      <View style={{ backgroundColor: "#e3a93c", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
        <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: "#2e2013" }}>15% OFF APP EXCLUSIVE APPLIED</Text>
      </View>

      <TouchableOpacity
        onPress={handleOrder}
        disabled={saving}
        style={{
          width: "100%", backgroundColor: "#e3a93c", borderRadius: 12,
          paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
        }}
      >
        {saving ? (
          <ActivityIndicator color="#2e2013" size="small" />
        ) : (
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#2e2013" }}>Order This Mug on ONJJEM.com →</Text>
        )}
      </TouchableOpacity>
      <Text style={{ fontSize: 11, color: "#8a7259", textAlign: "center" }}>
        Your artwork saves automatically — just upload it at checkout.
      </Text>
    </View>
  );
}

// Static gift-shop teaser for the home screen — unlike MugCardMockup above,
// there's no real generated artwork yet at this point (nothing's been
// scanned), so this uses a generic mug glyph instead of a photo.
function OnjjemGiftTeaser() {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL("https://onjjem.com/mug")}
      activeOpacity={0.88}
      style={{
        marginTop: 24, marginHorizontal: 16,
        backgroundColor: "#fff9ed", borderRadius: 20,
        borderWidth: 1, borderColor: "#ead9b8",
        padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
      }}
    >
      <View style={{
        width: 56, height: 52, borderRadius: 12, backgroundColor: "#ffffff",
        borderWidth: 1, borderColor: "#e4ddcf", alignItems: "center", justifyContent: "center",
      }}>
        {/* mini mug handle */}
        <View style={{ position: "absolute", right: -8, top: 12, width: 14, height: 24, borderRadius: 9, borderWidth: 4, borderColor: "#e4ddcf" }} />
        <Ionicons name="gift-outline" size={22} color="#e3a93c" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "rgba(201,168,76,0.8)", letterSpacing: 1, marginBottom: 2 }}>
          FROM ONJJEM, OUR SISTER COMPANY
        </Text>
        <Text style={{ fontSize: 13.5, fontFamily: "Inter_700Bold", color: "#3b2a1d" }}>
          Put your poster on a real mug or Christmas card
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ backgroundColor: "#e3a93c", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: "#2e2013" }}>15% OFF</Text>
          </View>
          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#8a7259" }}>onjjem.com</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8a7259" />
    </TouchableOpacity>
  );
}

function ResultSection({ title, icon, color, items }: { title: string; icon: string; color: string; items: string[] }) {
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[rStyles.sectionTitle, { color }]}>{title}</Text>
      </View>
      {(items ?? []).map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <Text style={{ color, fontSize: 14, marginTop: 1 }}>•</Text>
          <Text style={[rStyles.bulletText, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const rStyles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { alignItems: "center", paddingTop: 14, paddingHorizontal: 16, marginBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ead9b8", marginBottom: 4 },
  closeBtn: { position: "absolute", right: 16, top: 14, padding: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  resultWrap: { alignItems: "center", gap: 10, paddingBottom: 20 },
  iconRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  resultTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#3b2a1d", letterSpacing: -0.2, textAlign: "center" },
  resultSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8a7259", textAlign: "center", marginTop: -4 },
  bigNumberWrap: { alignItems: "center", marginVertical: 8 },
  bigNumber: { fontSize: 48, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  bigNumberLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8a7259", marginTop: -4 },
  metricRow: { flexDirection: "row", gap: 12, width: "100%" },
  metric: { flex: 1, backgroundColor: "#fff9ed", borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#ead9b8" },
  metricValue: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  metricLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#8a7259", textAlign: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 6, color: "#3b2a1d" },
  bulletText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#5c4027", lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%", justifyContent: "center" },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  summaryBox: { backgroundColor: "#fff9ed", borderRadius: 14, padding: 16, width: "100%", borderWidth: 1, borderColor: "#ead9b8", gap: 6 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#8a7259", letterSpacing: 0.5 },
  summaryText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3b2a1d", lineHeight: 20 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(227,169,60,0.1)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(227,169,60,0.25)",
    marginBottom: 8,
  },
  productName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#3b2a1d" },
  productDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8a7259", marginTop: 2 },
  onjjemLink: { alignItems: "center", paddingVertical: 8 },
  onjjemLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#c9a84c" },
  crossPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(74,164,128,0.1)",
    borderWidth: 1,
    borderColor: "rgba(74,164,128,0.3)",
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  crossPromoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74,164,128,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  crossPromoTitle: { fontSize: 13.5, fontFamily: "Inter_700Bold", color: "#3b2a1d" },
  crossPromoBody: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8a7259", marginTop: 2, lineHeight: 16 },
  trickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff9ed",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ead9b8",
    marginBottom: 8,
  },
  trickNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  trickNumberText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  trickName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#3b2a1d" },
  trickMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8a7259", marginTop: 2 },
});

/* ─── Web Purchase Prompt ─── */
function WebPrompt({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  if (!visible) return null;
  return (
    <View style={[wpStyles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
      <View style={[wpStyles.card, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}>
        <Ionicons name="phone-portrait-outline" size={36} color={colors.gold} />
        <Text style={[wpStyles.title, { color: colors.foreground }]}>Get the App</Text>
        <Text style={[wpStyles.body, { color: colors.mutedForeground }]}>
          Premium scanners unlock inside the What's Up Dog! iOS app.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://apps.apple.com/app/id6771118261")}
          style={[wpStyles.btn, { backgroundColor: colors.gold }]}
        >
          <Text style={[wpStyles.btnText, { color: colors.navy }]}>Download from App Store</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={wpStyles.close}>
          <Text style={[wpStyles.closeText, { color: colors.mutedForeground }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const wpStyles = StyleSheet.create({
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, zIndex: 100 },
  card: { width: "100%", maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 28, gap: 14, alignItems: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  btn: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  close: { paddingVertical: 6 },
  closeText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

/* ─── Main Screen ─── */
type ScanPhase = "idle" | "scanning" | "named";

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gallery, addToGallery, setCurrentScan, setCurrentPhotoUri, setCurrentKnowledge, setCurrentDogName, cacheKnowledge } = useApp();
  const {
    hasMixedBreed,
    hasAgeCalc,
    hasPersonality,
    hasHealthGuide,
    hasTrickTrainer,
    hasAllScanners,
    hasCartoon,
    packageFor,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
  } = useSubscription();

  const scanners = useScannerDefs();

  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scannedUri, setScannedUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [pendingScan, setPendingScan] = useState<Awaited<ReturnType<typeof identifyBreedFromBase64>> | null>(null);
  const [dogName, setDogName] = useState("");
  const [pendingGalleryId, setPendingGalleryId] = useState<string | null>(null);
  const [revealOfferVisible, setRevealOfferVisible] = useState(false);
  const [revealOfferDogName, setRevealOfferDogName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const [activeScanType, setActiveScanType] = useState<ScanType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [webPromptVisible, setWebPromptVisible] = useState(false);
  // Remembers the most recently scanned photo so the paid scanners
  // (mixed_dna / age_calc / personality) can reuse it instead of asking
  // the user to take or pick a photo all over again.
  const [lastPhoto, setLastPhoto] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<ScannerDef | null>(null);
  const [stylePickerVisible, setStylePickerVisible] = useState(false);
  const [storyPickerVisible, setStoryPickerVisible] = useState(false);
  const [selectedCartoonStyle, setSelectedCartoonStyle] = useState<"default" | "oil-painting" | "anime" | "pop-art">("default");
  const [isBuying, setIsBuying] = useState(false);

  // ── "You + Your Dog" Movie Poster ──
  // Deliberately kept as its own self-contained flow (not wired into the
  // ScanType/processImage pipeline above) since it needs two photos, not
  // one, and that pipeline isn't built to take two inputs at once.
  const [moviePosterVisible, setMoviePosterVisible] = useState(false);
  const [moviePosterStep, setMoviePosterStep] = useState<"input" | "generating" | "result">("input");
  const [ownerPhoto, setOwnerPhoto] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [posterDogPhoto, setPosterDogPhoto] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [ownerNameInput, setOwnerNameInput] = useState("");
  const [posterDogNameInput, setPosterDogNameInput] = useState("");
  const [moviePosterResult, setMoviePosterResult] = useState<MoviePosterResult | null>(null);
  const [moviePosterTitle, setMoviePosterTitle] = useState("");
  const [moviePosterTitleEditing, setMoviePosterTitleEditing] = useState(false);
  const [moviePosterError, setMoviePosterError] = useState<string | null>(null);
  const [festiveMode, setFestiveMode] = useState(false);
  // Cartoon uses — 3 per purchase, tracked locally.
  // No free cartoon scan. No bundle dependency.
  const [cartoonUsesRemaining, setCartoonUsesRemaining] = useState<number>(0);
  const [cartoonUsesLoaded, setCartoonUsesLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("wud_cartoon_paid_uses");
      setCartoonUsesRemaining(raw ? parseInt(raw, 10) : 0);
      setCartoonUsesLoaded(true);
    })();
  }, []);

  // Movie Poster uses — same "3 per purchase (or free re-unlock top-up)"
  // pattern as Cartoonify above, but tracked separately. Kept separate
  // rather than sharing Cartoonify's pool since the bundle's own sales
  // copy already promises "3 cartoon artworks" specifically — pooling
  // them would quietly shrink that promise for existing buyers. A poster
  // call is also pricier (two reference images in, one out) than a
  // single-image cartoon call, so its own 3-use cap keeps cost predictable.
  const [posterUsesRemaining, setPosterUsesRemaining] = useState<number>(0);
  const [posterUsesLoaded, setPosterUsesLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("wud_poster_paid_uses");
      setPosterUsesRemaining(raw ? parseInt(raw, 10) : 0);
      setPosterUsesLoaded(true);
    })();
  }, []);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const galleryUris = useMemo(() => gallery.map((g) => g.uri), [gallery]);

  const [dogPhotos, setDogPhotos] = useState<string[]>([]);
  useEffect(() => {
    fetch("https://dog.ceo/api/breeds/image/random/50")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.message)) {
          const massive = [...data.message, ...data.message, ...data.message, ...data.message];
          setDogPhotos(massive);
        }
      })
      .catch(() => {});
  }, []);

  const isOwned = useCallback(
    (def: ScannerDef) => {
      if (def.free) return true;
      if (hasAllScanners) return true;
      return def.entitlementCheck ? def.entitlementCheck() : false;
    },
    [hasAllScanners]
  );

  const handleScannerTap = async (def: ScannerDef) => {
    if (isWeb && !def.free && !isOwned(def)) {
      setWebPromptVisible(true);
      return;
    }
    // Cartoon has its own bespoke free-then-paid gating just below —
    // it must never be intercepted by the generic "not owned" check here,
    // since that only reflects the old standalone £4.99 purchase, not the
    // free scan earned from the £2.99 bundle.
    if (!def.free && !isOwned(def) && def.id !== "cartoon") {
      setPurchaseTarget(def);
      setPurchaseModalVisible(true);
      return;
    }
    if (def.id === "cartoon") {
      if (!cartoonUsesLoaded) return;
      if (cartoonUsesRemaining > 0) {
        setStylePickerVisible(true);
        return;
      }
      // No uses remaining — show purchase prompt
      setPurchaseTarget(def);
      setPurchaseModalVisible(true);
      return;
    }
    if (def.id === "mixed_dna") {
      // Already owned — let them pick which of the three reports to view,
      // rather than guessing which one they meant.
      setStoryPickerVisible(true);
      return;
    }
    if (def.free && Platform.OS === "ios") {
      const appleUserId = await getOrRequestAppleUserId();
      if (appleUserId) {
        const status = await getFreeScanStatus(appleUserId);
        if (status && status.remaining <= 0) {
          Alert.alert(
            "Free scans used up",
            "You've used your free breed scans. Unlock the premium scanners to keep exploring your dog's story.",
          );
          return;
        }
      }
      // If sign-in was declined or the status check failed (e.g. offline),
      // we don't hard-block the free scanner — better to let a genuine
      // user through than lock them out over a network hiccup. The
      // consume step in processImage still enforces the real limit
      // whenever a connection is available.
    }
    // Owned or free — start scan.
    // For the three "reads the same photo differently" scanners, reuse the
    // most recently scanned photo if we have one, rather than making the
    // user take or pick a photo all over again.
    const REUSABLE_SCANS: ScanType[] = ["mixed_dna", "age_calc", "personality", "cartoon"];
    if (REUSABLE_SCANS.includes(def.id) && lastPhoto) {
      await processImage(lastPhoto.uri, lastPhoto.base64, lastPhoto.mimeType, def.id);
      return;
    }
    startScan(def.id);
  };

  const pickImage = async (
    source: "camera" | "library",
  ): Promise<{ uri: string; base64: string; mimeType: string } | null> => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera access needed", "Please allow camera access to scan your dog.");
        return null;
      }
      router.push("/camera-capture");
      const captured = await waitForCapture();
      if (!captured) return null;
      return captured;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Photo library access needed", "Please allow photo library access to choose a photo.");
        return null;
      }
      // Deliberately don't request base64 straight from the picker here.
      // iPhone photo library assets are often stored in iCloud rather than
      // fully downloaded to the device, and the picker's own base64
      // conversion can silently return empty/truncated data in that case
      // instead of a clear error. Reading the file ourselves via
      // expo-file-system after the picker resolves a local uri is more
      // reliable, since iOS has to fully materialise the file locally
      // before handing back that uri at all.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      // iPhone photo library images are very commonly stored as HEIC, not
      // JPEG — sending the wrong mimeType label to Gemini's image decoder
      // can cause it to fail on otherwise-valid images. Use whatever real
      // type the picker actually reports, falling back to a sensible guess
      // from the file extension only if that's ever missing.
      const mimeType =
        asset.mimeType ??
        (asset.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!base64 || base64.length < 100) {
          throw new Error("Photo appears to be empty or not fully downloaded");
        }
        return { uri: asset.uri, base64, mimeType };
      } catch (err) {
        Alert.alert(
          "Couldn't read that photo",
          "This can happen if the photo is still downloading from iCloud. Please try again, or pick a different photo.",
        );
        return null;
      }
    }
  };

  // Reuses lastPhoto if the app hasn't been restarted since the last scan.
  // If it has (lastPhoto is only in-memory, not persisted), falls back to
  // re-reading the most recently scanned dog's photo from the saved
  // gallery, so a customer never gets asked for a fresh photo when we
  // already have one from them.
  const getReusablePhoto = async (): Promise<{ uri: string; base64: string; mimeType: string } | null> => {
    if (lastPhoto) return lastPhoto;
    const mostRecent = [...gallery].sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!mostRecent?.uri) return null;
    try {
      const base64 = await FileSystem.readAsStringAsync(mostRecent.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = mostRecent.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      return { uri: mostRecent.uri, base64, mimeType };
    } catch {
      return null;
    }
  };

  // ── "You + Your Dog" Movie Poster helpers ──

  const openMoviePoster = async (startFestive: boolean = false) => {
    if (!posterUsesLoaded) return;
    // Require the Full Story Bundle unlock (and a remaining use) before
    // even opening the input screen — no free/teaser generations, since
    // each one is a real paid Gemini call with no guaranteed revenue.
    // Tapping Unlock when already owned but out of uses is a free
    // StoreKit "re-purchase" of an owned non-consumable (same trick
    // Cartoonify already relies on) — it tops the 3 uses back up at no
    // extra charge to the customer.
    const owned = hasCartoon || hasAllScanners;
    if (!owned || posterUsesRemaining <= 0) {
      const unlocked = await handleMoviePosterUnlock();
      if (!unlocked) return;
    }
    const reusable = await getReusablePhoto();
    setPosterDogPhoto(reusable);
    setPosterDogNameInput(dogName || gallery[0]?.dogName || "");
    setOwnerPhoto(null);
    setOwnerNameInput("");
    setMoviePosterResult(null);
    setMoviePosterTitle("");
    setMoviePosterError(null);
    setFestiveMode(startFestive);
    setMoviePosterStep("input");
    setMoviePosterVisible(true);
  };

  const pickMoviePosterPhoto = (target: "owner" | "dog") => {
    Alert.alert(
      target === "owner" ? "Add your selfie" : "Add your dog's photo",
      "Take a new photo or choose one from your library.",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            // The camera lives on its own full-screen route (pushed via
            // expo-router), which sits UNDERNEATH this screen's own native
            // modal sheet. Pushing to it while the sheet is still presented
            // leaves the camera screen mounted but invisible/untappable
            // behind the sheet — the classic "frozen" Movie Poster screen.
            // Close the sheet first and let it finish dismissing, then
            // bring it back once we're back with the photo. All the form
            // state (names, the other photo) lives in this component, not
            // the Modal, so it survives the round trip untouched.
            setMoviePosterVisible(false);
            await new Promise((resolve) => setTimeout(resolve, 400));
            const picked = await pickImage("camera");
            setMoviePosterVisible(true);
            if (picked) {
              if (target === "owner") setOwnerPhoto(picked);
              else setPosterDogPhoto(picked);
            }
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const picked = await pickImage("library");
            if (picked) {
              if (target === "owner") setOwnerPhoto(picked);
              else setPosterDogPhoto(picked);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const generateMoviePoster = async () => {
    if (!ownerPhoto || !posterDogPhoto) {
      Alert.alert("Two photos needed", "Add your selfie and your dog's photo to continue.");
      return;
    }
    setMoviePosterStep("generating");
    setMoviePosterError(null);
    try {
      const result = await getMoviePoster(
        ownerPhoto.base64,
        ownerPhoto.mimeType,
        posterDogPhoto.base64,
        posterDogPhoto.mimeType,
        ownerNameInput.trim() || undefined,
        posterDogNameInput.trim() || undefined,
        festiveMode,
      );
      setMoviePosterResult(result);
      setMoviePosterTitle(result.defaultTitle);
      setMoviePosterStep("result");
      if (posterUsesRemaining > 0) {
        const next = posterUsesRemaining - 1;
        await AsyncStorage.setItem("wud_poster_paid_uses", String(next));
        setPosterUsesRemaining(next);
      }
    } catch (e: any) {
      setMoviePosterError(e?.message ?? "Something went wrong generating your poster.");
      setMoviePosterStep("input");
    }
  };

  // Deliberately a standalone purchase call (not routed through the shared
  // handlePurchase/purchaseTarget flow above), since that flow has its own
  // post-purchase side effects (re-opening the style picker, kicking off a
  // DNA/age/personality scan) tied to a ScanType that doesn't fit this
  // two-photo feature. Grants the same Full Story Bundle entitlement
  // (hasCartoon), since packaging a brand new £-priced product would need
  // manual App Store Connect setup this session can't do.
  const [moviePosterBuying, setMoviePosterBuying] = useState(false);
  const handleMoviePosterUnlock = async (): Promise<boolean> => {
    if (isWeb) {
      setWebPromptVisible(true);
      return false;
    }
    const pkg = packageFor(PACKAGE_MIXED_BREED);
    if (!pkg) {
      Alert.alert("Not available", "This product is not available right now. Please try again.");
      return false;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMoviePosterBuying(true);
    try {
      await purchase(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Re-purchasing an already-owned non-consumable doesn't charge the
      // customer again (StoreKit just redelivers it) — so this also
      // doubles as the "ran out of included generations, tap Unlock to
      // top back up" path, same trick Cartoonify's reset already uses.
      await AsyncStorage.setItem("wud_poster_paid_uses", "3");
      setPosterUsesRemaining(3);
      return true;
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert("Purchase failed", e?.message ?? "Please try again.");
      return false;
    } finally {
      setMoviePosterBuying(false);
    }
  };

  const handleMoviePosterShare = async () => {
    if (!moviePosterResult) return;
    try {
      const fileUri = `${FileSystem.cacheDirectory}movie-poster-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, moviePosterResult.imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Share.share({
        url: fileUri,
        message: "Check out our movie poster made with What's Up Dog!",
      });
    } catch {
      Alert.alert("Couldn't save", "Something went wrong saving the poster. Please try again.");
    }
  };

  const startScan = async (scanType: ScanType, cartoonStyleOverride?: "default" | "oil-painting" | "anime" | "pop-art") => {
    setActiveScanType(scanType);
    Alert.alert(
      "Add a photo",
      "Take a new photo or choose one from your library.",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const picked = await pickImage("camera");
            if (picked) await processImage(picked.uri, picked.base64, picked.mimeType, scanType, cartoonStyleOverride);
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const picked = await pickImage("library");
            if (picked) await processImage(picked.uri, picked.base64, picked.mimeType, scanType, cartoonStyleOverride);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const processImage = async (uri: string, base64: string, mimeType: string, scanType: ScanType, cartoonStyleOverride?: "default" | "oil-painting" | "anime" | "pop-art") => {
    setScannedUri(uri);
    setLastPhoto({ uri, base64, mimeType });
    if (scanType === "breed") {
      setPhase("scanning");
      setStatusText("Identifying breed…");
    } else {
      setPhase("scanning");
      setStatusText(`Running ${scanners.find((s) => s.id === scanType)?.title ?? "scan"}…`);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      switch (scanType) {
        case "breed": {
          if (Platform.OS === "ios") {
            const appleUserId = await getOrRequestAppleUserId();
            if (appleUserId) {
              const consumeResult = await consumeFreeScan(appleUserId);
              if (consumeResult && !consumeResult.allowed) {
                setPhase("idle");
                setScannedUri(null);
                Alert.alert(
                  "Free scans used up",
                  "You've used your free breed scans. Unlock the premium scanners to keep exploring your dog's story.",
                );
                return;
              }
            }
          }
          const scanResult = await identifyBreedFromBase64(base64, mimeType);
          setPendingScan(scanResult);
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          setPendingGalleryId(id);
          setPhase("named");
          setDogName("");
          setTimeout(() => nameInputRef.current?.focus(), 300);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
        case "mixed_dna": {
          const data = await getMixedBreedDNA(base64, mimeType);
          setScanResult({ type: "mixed_dna", data });
          setResultVisible(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
        case "age_calc": {
          const data = await getAgeEstimate(base64, mimeType);
          setScanResult({ type: "age_calc", data });
          setResultVisible(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
        case "personality": {
          const data = await getPersonalityScan(base64, mimeType);
          setScanResult({ type: "personality", data });
          setResultVisible(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
        case "cartoon": {
          const data = await getDogCartoon(base64, mimeType, cartoonStyleOverride ?? "default");
          setScanResult({ type: "cartoon", data });
          setResultVisible(true);
          if (cartoonUsesRemaining > 0) {
            const next = cartoonUsesRemaining - 1;
            await AsyncStorage.setItem("wud_cartoon_paid_uses", String(next));
            setCartoonUsesRemaining(next);
          }
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
        case "health_guide":
        case "trick_trainer": {
          // These need a breed, not a photo. Show prompt or use last scanned breed.
          const lastBreed = pendingScan?.breed ?? gallery[0]?.breed;
          if (!lastBreed) {
            Alert.alert("Scan a breed first", "Please scan a dog with the Breed Identifier before using this feature.");
            setPhase("idle");
            setScannedUri(null);
            return;
          }
          if (scanType === "health_guide") {
            const data = await getHealthGuide(lastBreed, dogName || undefined);
            setScanResult({ type: "health_guide", data });
          } else {
            const data = await getTrickTrainer(lastBreed, dogName || undefined);
            setScanResult({ type: "trick_trainer", data });
          }
          setResultVisible(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
      }
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Scan failed", e?.message ?? "Could not complete the scan. Please try again.");
      setPhase("idle");
      setScannedUri(null);
    } finally {
      setStatusText("");
    }
  };

  const handleContinue = async () => {
    if (!pendingScan || !pendingGalleryId || !scannedUri) return;
    const name = dogName.trim();
    setCurrentDogName(name);
    setCurrentScan(pendingScan);
    setCurrentPhotoUri(scannedUri);
    await addToGallery({
      id: pendingGalleryId,
      uri: scannedUri,
      breed: pendingScan.breed,
      dogName: name || undefined,
      isMix: pendingScan.isMix,
      mixBreeds: pendingScan.mixBreeds,
      timestamp: Date.now(),
      hasDeepKnowledge: false,
    });
    getBreedKnowledge(pendingScan.breed)
      .then((k) => {
        setCurrentKnowledge(k);
        cacheKnowledge(pendingScan.breed, k);
      })
      .catch(() => {});
    setRevealOfferDogName(name || "your dog");
    setPhase("idle");
    setScannedUri(null);
    setPendingScan(null);
    setPendingGalleryId(null);
    setDogName("");
    setRevealOfferVisible(true);
  };

  const dismissRevealOffer = () => {
    setRevealOfferVisible(false);
    router.push("/breed");
  };

  const acceptRevealOffer = () => {
    setRevealOfferVisible(false);
    const mixedDnaDef = scanners.find((s) => s.id === "mixed_dna");
    if (mixedDnaDef) {
      setPurchaseTarget(mixedDnaDef);
      setPurchaseModalVisible(true);
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setScannedUri(null);
    setPendingScan(null);
    setPendingGalleryId(null);
    setDogName("");
  };

  const handlePurchase = async () => {
    if (!purchaseTarget?.packageId) return;
    if (isWeb) {
      setWebPromptVisible(true);
      setPurchaseModalVisible(false);
      return;
    }
    const pkg = packageFor(purchaseTarget.packageId);
    if (!pkg) {
      Alert.alert("Not available", "This product is not available right now. Please try again.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBuying(true);
    try {
      await purchase(pkg);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPurchaseModalVisible(false);
      if (purchaseTarget.id === "cartoon") {
        await AsyncStorage.setItem("wud_cartoon_paid_uses", "3");
        setCartoonUsesRemaining(3);
        setStylePickerVisible(true);
      } else {
        const photo = await getReusablePhoto();
        if (photo) {
          await processImage(photo.uri, photo.base64, photo.mimeType, purchaseTarget.id);
        } else {
          startScan(purchaseTarget.id);
        }
      }
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert("Purchase failed", e?.message ?? "Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleUnlockAll = async () => {
    if (isWeb) {
      setWebPromptVisible(true);
      return;
    }
    const pkg = packageFor(PACKAGE_ALL_SCANNERS);
    if (!pkg) {
      Alert.alert("Not available", "The bundle is not available right now. Please try again.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBuying(true);
    try {
      await purchase(pkg);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert("Purchase failed", e?.message ?? "Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleRestore = async () => {
    if (isWeb) {
      setWebPromptVisible(true);
      return;
    }
    try {
      await restore();
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      {/* Background dog-photo collage, dimmed for legibility */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" } as any]}>
        {dogPhotos.length > 0 &&
          Array.from({ length: GRID_TOTAL }).map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const photo = dogPhotos[i % dogPhotos.length];
            return (
              <Image
                key={i}
                source={{ uri: photo }}
                style={{ position: "absolute", left: col * TILE, top: row * TILE, width: TILE, height: TILE, opacity: 0.4 }}
                resizeMode="cover"
              />
            );
          })}
        {/* warm cream scrim so the collage reads as texture, not noise */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(251,243,227,0.9)" }]} />
      </View>

      {COLLAGE_ONLY && <BlinkingFooter />}

      {!COLLAGE_ONLY && (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: isWeb ? 100 : insets.bottom + 140 }}

          >
            {/* Header — now the full visual-first hero: poster mockup,
                headline, and the two primary action buttons. The old
                separate Christmas banner and the small Movie Poster list
                row are both folded into this hero (the floating "Christmas
                Edition" pill and the primary button respectively), so
                they've been removed rather than left as redundant clutter. */}
            <ScannerHeader
              onScanPress={() => {
                const breedDef = scanners.find(s => s.id === "breed");
                if (breedDef) handleScannerTap(breedDef);
              }}
              onCreatePosterPress={() => openMoviePoster()}
              onFestivePress={() => openMoviePoster(true)}
            />

            {/* Scanner Cards */}
            <View style={{ alignItems: "center", gap: 12, marginTop: 20, paddingHorizontal: 16 }}>
              {scanners.map((def, i) => (
                <ScannerCard
                  key={def.id}
                  def={def}
                  index={i}
                  onPress={() => handleScannerTap(def)}
                  owned={isOwned(def)}
                />
              ))}
            </View>

            {/* Restore Purchases */}
            <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={{ alignItems: "center", marginTop: 16 }}>
              {isRestoring ? (
                <ActivityIndicator size="small" color="#8a7259" />
              ) : (
                <Text style={styles.restoreText}>Restore purchases</Text>
              )}
            </TouchableOpacity>

            {/* ONJJEM Gift Card */}
            <OnjjemGiftTeaser />
          </ScrollView>

          {/* Scanning overlay */}
          {phase === "scanning" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(251,243,227,0.92)", alignItems: "center", justifyContent: "center", zIndex: 50 }]}>
              <ActivityIndicator color={colors.gold} size="large" />
              <Text style={{ marginTop: 16, fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{statusText}</Text>
            </View>
          )}
        </>
      )}

      {/* Dog Name Modal (breed scan only) */}
      <Modal visible={phase === "named"} animationType="slide" transparent onRequestClose={handleReset}>
        <KeyboardAvoidingView style={styles.nameModalWrap} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleReset} />
          <View style={[styles.nameSheet, { backgroundColor: "#141927", borderColor: "rgba(255,255,255,0.1)" }]}>
            <View style={styles.nameHandle} />
            {pendingScan && (
              <View style={[styles.breedFoundRow, { backgroundColor: "#0a0e1a" }]}>
                {scannedUri && <Image source={{ uri: scannedUri }} style={styles.nameThumbnail} resizeMode="cover" />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.breedFoundLabel}>Identified</Text>
                  <Text style={styles.breedFoundName}>{pendingScan.breed}</Text>
                  {pendingScan.isMix && pendingScan.mixBreeds && (
                    <Text style={styles.breedFoundMix}>Mix: {pendingScan.mixBreeds.join(" · ")}</Text>
                  )}
                </View>
                <View style={styles.pawBadge}>
                  <Ionicons name="paw" size={20} color="#c9a84c" />
                </View>
              </View>
            )}
            <Text style={styles.nameQuestion}>What's their name?</Text>
            <Text style={styles.nameHint}>Optional — we'll personalise everything for them</Text>
            <TextInput
              ref={nameInputRef}
              value={dogName}
              onChangeText={setDogName}
              placeholder="e.g. Biscuit, Poppy, Max…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              onSubmitEditing={handleContinue}
              returnKeyType="go"
              style={[styles.nameInput, { borderColor: dogName ? "#c9a84c88" : "rgba(255,255,255,0.12)" }]}
            />
            <TouchableOpacity onPress={handleContinue} style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>
                {dogName.trim() ? `Meet ${dogName.trim()} →` : `View ${pendingScan?.breed ?? "breed"} →`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancel scan</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reveal Story Offer — shown right after a breed scan is named */}
      <Modal visible={revealOfferVisible} animationType="slide" transparent onRequestClose={dismissRevealOffer}>
        <View style={styles.nameModalWrap}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismissRevealOffer} />
          <View style={[styles.nameSheet, { backgroundColor: "#141927", borderColor: "rgba(255,255,255,0.1)" }]}>
            <View style={styles.nameHandle} />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" }}>
              🐾 {revealOfferDogName}'s story awaits
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Unlock {revealOfferDogName}'s full Mixed Breed DNA, Age & Personality report — plus a free postcard
              of {revealOfferDogName} posted straight to your door, and access to the Loyalty Card.
            </Text>
            <TouchableOpacity onPress={acceptRevealOffer} style={[styles.continueBtn, { marginTop: 18 }]}>
              <Text style={styles.continueBtnText}>Reveal {revealOfferDogName}'s Story — £2.99</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={dismissRevealOffer} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Scan Result */}
      <ScanResultModal
        visible={resultVisible}
        onClose={() => {
          setResultVisible(false);
          setScanResult(null);
          setActiveScanType(null);
          setPhase("idle");
          setScannedUri(null);
        }}
        result={scanResult}
        scanType={scanResult?.type ?? "breed"}
        scannedUri={scannedUri}
        dogName={dogName || revealOfferDogName || null}
        dogBreed={pendingScan?.breed ?? gallery[0]?.breed ?? null}
      />

      {/* Cartoon Style Picker */}
      <Modal visible={stylePickerVisible} animationType="slide" transparent onRequestClose={() => setStylePickerVisible(false)}>
        <View style={styles.stylePickerOverlay}>
          <View style={styles.stylePickerSheet}>
            <View style={styles.nameHandle} />
            <Text style={styles.stylePickerTitle}>Choose a Style</Text>
            <Text style={styles.stylePickerSubtitle}>Pick how you'd like your dog reimagined</Text>
            {[
              { id: "default" as const, label: "Animated Movie", icon: "film-outline" },
              { id: "oil-painting" as const, label: "Oil Painting", icon: "color-palette-outline" },
              { id: "pop-art" as const, label: "Pop Art", icon: "color-filter-outline" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.styleOptionRow}
                onPress={() => {
                  setStylePickerVisible(false);
                  startScan("cartoon", opt.id);
                }}
              >
                <Ionicons name={opt.icon as any} size={22} color="#e0a95c" />
                <Text style={styles.styleOptionText}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.styleOptionRow, { borderWidth: 1, borderColor: "#e3a93c88" }]}
              onPress={() => {
                setStylePickerVisible(false);
                // Give this sheet a beat to finish dismissing before
                // presenting the Movie Poster one on top of it — presenting
                // a new modal sheet in the same tick as dismissing another
                // is the same class of native-modal race fixed above.
                setTimeout(() => openMoviePoster(), 350);
              }}
            >
              <Ionicons name="people-outline" size={22} color="#e0a95c" />
              <View style={{ flex: 1 }}>
                <Text style={styles.styleOptionText}>You + Your Dog Movie Poster</Text>
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#8a7259", marginTop: 1 }}>
                  Needs a selfie too
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStylePickerVisible(false)} style={{ marginTop: 8, alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Story Picker — choose which report to view from the Full Story Bundle */}
      <Modal visible={storyPickerVisible} animationType="slide" transparent onRequestClose={() => setStoryPickerVisible(false)}>
        <View style={styles.stylePickerOverlay}>
          <View style={styles.stylePickerSheet}>
            <View style={styles.nameHandle} />
            <Text style={styles.stylePickerTitle}>Your Dog's Full Story</Text>
            <Text style={styles.stylePickerSubtitle}>Choose which report to view</Text>
            {[
              { id: "mixed_dna" as const, label: "Mixed Breed DNA", icon: "git-merge-outline" },
              { id: "age_calc" as const, label: "Age Calculator", icon: "hourglass-outline" },
              { id: "personality" as const, label: "Personality Matcher", icon: "happy-outline" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.styleOptionRow}
                onPress={async () => {
                  setStoryPickerVisible(false);
                  const photo = await getReusablePhoto();
                  if (photo) {
                    processImage(photo.uri, photo.base64, photo.mimeType, opt.id);
                  } else {
                    startScan(opt.id);
                  }
                }}
              >
                <Ionicons name={opt.icon as any} size={22} color="#d4af37" />
                <Text style={styles.styleOptionText}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setStoryPickerVisible(false)} style={{ marginTop: 8, alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* "You + Your Dog" Movie Poster */}
      <Modal
        visible={moviePosterVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMoviePosterVisible(false)}
      >
        <View style={[rStyles.container, { backgroundColor: colors.background }]}>
          <View style={rStyles.topBar}>
            <View style={rStyles.handle} />
            <TouchableOpacity onPress={() => setMoviePosterVisible(false)} style={rStyles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rStyles.scroll}>

            {moviePosterStep === "input" && (
              <View style={{ alignItems: "center", gap: 16, paddingBottom: 20 }}>
                <View style={[rStyles.iconRing, { borderColor: colors.gold }]}>
                  <Ionicons name="film-outline" size={28} color={colors.gold} />
                </View>
                <Text style={rStyles.resultTitle}>You + Your Dog</Text>
                <Text style={rStyles.resultSubtitle}>A movie poster starring the both of you</Text>

                {moviePosterError && (
                  <View style={{ backgroundColor: "rgba(217,83,79,0.1)", borderWidth: 1, borderColor: "rgba(217,83,79,0.3)", borderRadius: 12, padding: 12, width: "100%" }}>
                    <Text style={{ color: "#d9534f", fontSize: 13 }}>{moviePosterError}</Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                  <TouchableOpacity
                    onPress={() => pickMoviePosterPhoto("owner")}
                    style={{
                      flex: 1, aspectRatio: 1, borderRadius: 16,
                      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
                      borderStyle: ownerPhoto ? "solid" : "dashed",
                      alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}
                  >
                    {ownerPhoto ? (
                      <Image source={{ uri: ownerPhoto.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={26} color={colors.mutedForeground} />
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_600SemiBold" }}>Your Selfie</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => pickMoviePosterPhoto("dog")}
                    style={{
                      flex: 1, aspectRatio: 1, borderRadius: 16,
                      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
                      borderStyle: posterDogPhoto ? "solid" : "dashed",
                      alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}
                  >
                    {posterDogPhoto ? (
                      <Image source={{ uri: posterDogPhoto.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <>
                        <Ionicons name="paw-outline" size={26} color={colors.mutedForeground} />
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_600SemiBold" }}>Your Dog's Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                {posterDogPhoto && (
                  <TouchableOpacity onPress={() => pickMoviePosterPhoto("dog")} style={{ marginTop: -8 }}>
                    <Text style={{ fontSize: 12, color: colors.gold, fontFamily: "Inter_600SemiBold" }}>Use a different dog photo</Text>
                  </TouchableOpacity>
                )}

                <View style={{ width: "100%", gap: 10 }}>
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 4 }}>Your Name (optional)</Text>
                    <TextInput
                      value={ownerNameInput}
                      onChangeText={setOwnerNameInput}
                      placeholder="Me"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
                        fontFamily: "Inter_500Medium", color: colors.foreground, backgroundColor: colors.card,
                      }}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 4 }}>Dog's Name</Text>
                    <TextInput
                      value={posterDogNameInput}
                      onChangeText={setPosterDogNameInput}
                      placeholder="Your dog's name"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
                        fontFamily: "Inter_500Medium", color: colors.foreground, backgroundColor: colors.card,
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setFestiveMode((v) => !v)}
                  activeOpacity={0.85}
                  style={{
                    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: colors.card, borderWidth: 1.5,
                    borderColor: festiveMode ? colors.gold : colors.border,
                    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
                  }}
                >
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 18 }}>🎄</Text>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 }}>
                      Festive Christmas Scene
                    </Text>
                  </View>
                  <Switch
                    value={festiveMode}
                    onValueChange={setFestiveMode}
                    trackColor={{ false: colors.border, true: colors.gold }}
                    thumbColor="#ffffff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={generateMoviePoster}
                  disabled={!ownerPhoto || !posterDogPhoto}
                  style={{
                    width: "100%", backgroundColor: colors.gold, borderRadius: 12,
                    paddingVertical: 15, alignItems: "center", marginTop: 4,
                    opacity: (!ownerPhoto || !posterDogPhoto) ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.navy }}>Create Our Poster</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center" }}>
                  {posterUsesRemaining} poster {posterUsesRemaining === 1 ? "generation" : "generations"} left in your bundle
                </Text>
              </View>
            )}

            {moviePosterStep === "generating" && (
              <View style={{ alignItems: "center", gap: 16, paddingTop: 60 }}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                  Creating your movie poster...
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                  This can take up to 30 seconds — our AI is painting you and {posterDogNameInput || "your dog"} into one scene.
                </Text>
              </View>
            )}

            {moviePosterStep === "result" && moviePosterResult && (() => {
              const posterUnlocked = hasCartoon || hasAllScanners;
              return (
                <View style={{ alignItems: "center", gap: 14, paddingBottom: 20 }}>
                  <View style={{
                    width: "100%", aspectRatio: 3 / 4, borderRadius: 18, overflow: "hidden",
                    backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Image
                      source={{ uri: `data:${moviePosterResult.mimeType};base64,${moviePosterResult.imageBase64}` }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    {/* Title overlay (tap to edit) */}
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, padding: 16, alignItems: "center" }}>
                      {moviePosterTitleEditing ? (
                        <TextInput
                          value={moviePosterTitle}
                          onChangeText={setMoviePosterTitle}
                          onBlur={() => setMoviePosterTitleEditing(false)}
                          autoFocus
                          multiline
                          textAlign="center"
                          style={{
                            fontSize: 24, fontFamily: "Inter_700Bold", color: "#ffffff",
                            textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
                            textAlign: "center", width: "100%",
                          }}
                        />
                      ) : (
                        <TouchableOpacity onPress={() => setMoviePosterTitleEditing(true)}>
                          <Text style={{
                            fontSize: 24, fontFamily: "Inter_700Bold", color: "#ffffff", textAlign: "center",
                            textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
                            letterSpacing: 0.5,
                          }}>
                            {moviePosterTitle} <Ionicons name="pencil" size={14} color="#ffffff" />
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* Billing block overlay */}
                    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: "rgba(0,0,0,0.35)" }}>
                      <Text style={{
                        fontSize: 11, fontFamily: "Inter_700Bold", color: "#ffffff", textAlign: "center", letterSpacing: 0.5,
                      }}>
                        {moviePosterResult.billing}
                      </Text>
                    </View>
                    {/* Preview watermark, shown until unlocked */}
                    {!posterUnlocked && (
                      <View style={{
                        position: "absolute", top: "45%", left: 0, right: 0,
                        alignItems: "center", transform: [{ rotate: "-18deg" }],
                      }}>
                        <Text style={{
                          fontSize: 34, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.35)", letterSpacing: 4,
                        }}>
                          PREVIEW
                        </Text>
                      </View>
                    )}
                  </View>

                  {posterUnlocked ? (
                    <>
                      <TouchableOpacity
                        onPress={handleMoviePosterShare}
                        style={{
                          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                          backgroundColor: colors.gold, borderRadius: 12, paddingVertical: 14, width: "100%",
                        }}
                      >
                        <Ionicons name="share-outline" size={18} color={colors.navy} />
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy }}>Share Poster</Text>
                      </TouchableOpacity>
                      <MugCardMockup
                        imageBase64={moviePosterResult.imageBase64}
                        mimeType={moviePosterResult.mimeType}
                      />
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={handleMoviePosterUnlock}
                      disabled={moviePosterBuying || isPurchasing}
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                        backgroundColor: colors.gold, borderRadius: 12, paddingVertical: 14, width: "100%",
                        opacity: (moviePosterBuying || isPurchasing) ? 0.6 : 1,
                      }}
                    >
                      {moviePosterBuying ? (
                        <ActivityIndicator color={colors.navy} size="small" />
                      ) : (
                        <>
                          <Ionicons name="lock-open-outline" size={18} color={colors.navy} />
                          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy }}>Unlock HD Poster — £2.99</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center" }}>
                    {posterUnlocked
                      ? "Part of your Full Story Bundle unlock."
                      : "One unlock gets you this poster plus Breed DNA, Age, Personality & Cartoonify."}
                  </Text>
                </View>
              );
            })()}

          </ScrollView>
        </View>
      </Modal>

      {/* Web Prompt */}
      <WebPrompt visible={webPromptVisible} onClose={() => setWebPromptVisible(false)} />

      {/* Purchase Modal */}
      <Modal visible={purchaseModalVisible} animationType="fade" transparent onRequestClose={() => setPurchaseModalVisible(false)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }]}>
          <View style={[styles.purchaseCard, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}>
            {purchaseTarget && (
              <>
                <View style={[styles.purchaseIcon, { backgroundColor: purchaseTarget.color + "22" }]}>
                  <Ionicons name={purchaseTarget.icon as any} size={32} color={purchaseTarget.color} />
                </View>
                <Text style={[styles.purchaseTitle, { color: colors.foreground }]}>{purchaseTarget.title}</Text>
                <Text style={[styles.purchaseDesc, { color: colors.mutedForeground }]}>{purchaseTarget.description}</Text>
                <Text style={[styles.purchasePrice, { color: purchaseTarget.color }]}>
                  {purchaseTarget.id === "cartoon" ? "£4.99" : "£2.99"}
                </Text>
                <Text style={[styles.purchaseSub, { color: colors.mutedForeground }]}>
                  {purchaseTarget.id === "cartoon"
                    ? "Get 3 cartoon scans — choose from Animated Movie, Oil Painting or Pop Art styles. One-time purchase."
                    : "Unlock your dog's full DNA, Age & Personality story — plus a free personalised postcard shipped to your door. One-time purchase."}
                </Text>
                <CartoonCarousel samples={CARTOON_SAMPLES} />
                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={isBuying}
                  style={[styles.purchaseBtn, { backgroundColor: purchaseTarget.color }]}
                >
                  {isBuying ? (
                    <ActivityIndicator color="#0a0e1a" size="small" />
                  ) : (
                    <Text style={[styles.purchaseBtnText, { color: "#0a0e1a" }]}>
                      {purchaseTarget.id === "cartoon" ? "Get 3 Cartoon Scans — £4.99" : "Unlock Full Story + Free Postcard — £2.99"}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPurchaseModalVisible(false)} style={{ paddingVertical: 8 }}>
                  <Text style={[styles.purchaseCancel, { color: colors.mutedForeground }]}>Not now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  unlockAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#c9a84c",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    shadowColor: "#c9a84c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  unlockAllText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0a0e1a", letterSpacing: -0.2 },
  unlockAllPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0a0e1a", opacity: 0.7 },
  unlockAllSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", marginTop: 8 },
  restoreText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8a7259" },

  onjjemStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,14,26,0.92)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  onjjemLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "rgba(201,168,76,0.6)", letterSpacing: 1.2, marginBottom: 2 },
  onjjemTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ffffff", letterSpacing: -0.1 },
  onjjemSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", marginTop: 2 },

  nameModalWrap: { flex: 1, justifyContent: "flex-end" },
  nameSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, padding: 24, paddingBottom: 44, gap: 14 },
  nameHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 6 },
  stylePickerOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  stylePickerSheet: { backgroundColor: "#141927", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  stylePickerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", marginTop: 8 },
  stylePickerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 4, marginBottom: 18 },
  styleOptionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: "rgba(224,169,92,0.08)", borderRadius: 14, marginBottom: 10 },
  styleOptionText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  breedFoundRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  nameThumbnail: { width: 52, height: 52, borderRadius: 12 },
  breedFoundLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase" },
  breedFoundName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#c9a84c", marginTop: 2 },
  breedFoundMix: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: 2 },
  pawBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  nameQuestion: { fontSize: 23, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2 },
  nameHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: -6, lineHeight: 18 },
  nameInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontFamily: "Inter_500Medium", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.05)" },
  continueBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", backgroundColor: "#c9a84c" },
  continueBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0a0e1a" },
  cancelLink: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)" },

  purchaseCard: { width: "100%", maxWidth: 340, borderRadius: 24, borderWidth: 1, padding: 28, gap: 14, alignItems: "center" },
  purchaseIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  purchaseTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  purchaseDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  purchasePrice: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  purchaseSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  purchaseBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  purchaseBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  purchaseCancel: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
