import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Animated,
  Linking,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { waitForCapture } from "@/lib/captureBridge";
import { useApp } from "@/context/AppContext";
import { ScanButton } from "@/components/ScanButton";
import {
  identifyBreedFromBase64,
  getBreedKnowledge,
  getMixedBreedDNA,
  getAgeEstimate,
  getPersonalityScan,
  getHealthGuide,
  getTrickTrainer,
  type MixedBreedResult,
  type AgeEstimateResult,
  type PersonalityResult,
  type HealthGuideResult,
  type TrickTrainerResult,
} from "@/lib/gemini";
import {
  useSubscription,
  PACKAGE_MIXED_BREED,
  PACKAGE_AGE_CALC,
  PACKAGE_PERSONALITY,
  PACKAGE_HEALTH_GUIDE,
  PACKAGE_TRICK_TRAINER,
  PACKAGE_ALL_SCANNERS,
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
  | "trick_trainer";

interface ScannerDef {
  id: ScanType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  glow: string;
  free: boolean;
  packageId?: string;
  entitlementCheck?: () => boolean;
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
        title: "Mixed Breed DNA",
        subtitle: "Genetic heritage breakdown",
        description: "Discover your dog's ancestral breeds, genetic markers, and full heritage tree.",
        icon: "git-merge-outline",
        color: "#c98b9c",
        glow: "rgba(201,139,156,0.28)",
        free: false,
        packageId: PACKAGE_MIXED_BREED,
        entitlementCheck: () => hasMixedBreed || all,
      },
      {
        id: "age_calc",
        title: "Age Calculator",
        subtitle: "Visual age estimation",
        description: "Our AI reads coat condition, eye clarity, and muscle tone to estimate your dog's age.",
        icon: "hourglass-outline",
        color: "#7fb0c2",
        glow: "rgba(127,176,194,0.28)",
        free: false,
        packageId: PACKAGE_AGE_CALC,
        entitlementCheck: () => hasAgeCalc || all,
      },
      {
        id: "personality",
        title: "Personality Matcher",
        subtitle: "Shareable results",
        description: "Analyse your dog's expression and posture to reveal their dominant traits, social style, and energy level.",
        icon: "happy-outline",
        color: "#a999c9",
        glow: "rgba(169,153,201,0.28)",
        free: false,
        packageId: PACKAGE_PERSONALITY,
        entitlementCheck: () => hasPersonality || all,
      },
    ],
    [hasMixedBreed, hasAgeCalc, hasPersonality, hasHealthGuide, hasTrickTrainer, all]
  );
}

/* ─── Header ─── */
function ScannerHeader() {
  return (
    <View style={gStyles.wrap}>
      <Text style={gStyles.eyebrow}>HERITAGE SCANNER</Text>
      <Text style={gStyles.headline}>Discover the story in their eyes.</Text>
      <Text style={gStyles.subhead}>Scan any dog to reveal their breed, age, and personality.</Text>
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
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 38, letterSpacing: 1, color: "#ffffff", textShadowColor: "#ffffff", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24 }}>That's My Dog!</Text>
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

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 80,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [anim, index]);

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

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity, width: CARD_WIDTH }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          cardStyles.card,
          {
            borderColor: hovered ? def.color : "rgba(255,255,255,0.08)",
            borderWidth: hovered ? 1.5 : 1,
            shadowColor: def.color,
            shadowOpacity: hovered ? 0.25 : 0.08,
            shadowRadius: hovered ? 20 : 8,
          },
        ]}
        {...(Platform.OS === "web" ? {
          onPointerEnter: handleHoverIn,
          onPointerLeave: handleHoverOut,
        } as any : {})}
      >
        {/* Premium badge */}
        {!def.free && !owned && (
          <View style={[cardStyles.premiumBadge, { backgroundColor: def.color }]}>
            <Text style={cardStyles.premiumBadgeText}>99p</Text>
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

        <Text style={cardStyles.description}>{def.description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#0e1322",
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  premiumBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#0a0e1a", letterSpacing: 0.5 },
  ownedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  ownedBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  freeBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#0a0e1a", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)" },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", lineHeight: 18, marginTop: 2 },
});

/* ─── Scan Result Types ─── */
type ScanResultData =
  | { type: "breed"; data: Awaited<ReturnType<typeof identifyBreedFromBase64>> }
  | { type: "mixed_dna"; data: MixedBreedResult }
  | { type: "age_calc"; data: AgeEstimateResult }
  | { type: "personality"; data: PersonalityResult }
  | { type: "health_guide"; data: HealthGuideResult }
  | { type: "trick_trainer"; data: TrickTrainerResult };

/* ─── Result Modal ─── */
function ScanResultModal({
  visible,
  onClose,
  result,
  scanType,
}: {
  visible: boolean;
  onClose: () => void;
  result: ScanResultData | null;
  scanType: ScanType;
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

      <ResultSection title="Genetic Markers" icon="cellular-outline" color="#c98b9c" items={data.geneticMarkers} />
      <ResultSection title="Ancestral Breeds" icon="time-outline" color="#c98b9c" items={data.ancestralBreeds} />

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryText}>{data.dnaSummary}</Text>
      </View>
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

      <View style={rStyles.metric}>
        <Text style={[rStyles.metricValue, { color: "#7fb0c2" }]}>{data.lifeStage}</Text>
        <Text style={rStyles.metricLabel}>Life Stage</Text>
      </View>

      <ResultSection title="Visual Signs" icon="eye-outline" color="#7fb0c2" items={data.signs} />

      <View style={rStyles.summaryBox}>
        <Text style={rStyles.summaryLabel}>Birthday Estimate</Text>
        <Text style={rStyles.summaryText}>{data.birthdayEstimate}</Text>
      </View>
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

function ResultSection({ title, icon, color, items }: { title: string; icon: string; color: string; items: string[] }) {
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[rStyles.sectionTitle, { color }]}>{title}</Text>
      </View>
      {items.map((item, i) => (
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
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#3a4558", marginBottom: 4 },
  closeBtn: { position: "absolute", right: 16, top: 14, padding: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  resultWrap: { alignItems: "center", gap: 10, paddingBottom: 20 },
  iconRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  resultTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2, textAlign: "center" },
  resultSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)", textAlign: "center", marginTop: -4 },
  bigNumberWrap: { alignItems: "center", marginVertical: 8 },
  bigNumber: { fontSize: 48, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  bigNumberLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)", marginTop: -4 },
  metricRow: { flexDirection: "row", gap: 12, width: "100%" },
  metric: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  metricValue: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  metricLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)", textAlign: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 6 },
  bulletText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%", justifyContent: "center" },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  summaryBox: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, width: "100%", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 6 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 },
  summaryText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", lineHeight: 20 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
    marginBottom: 8,
  },
  productName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
  productDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  onjjemLink: { alignItems: "center", paddingVertical: 8 },
  onjjemLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#c9a84c" },
  crossPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(74,222,128,0.08)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)",
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  crossPromoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74,222,128,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crossPromoTitle: { fontSize: 13.5, fontFamily: "Inter_700Bold", color: "#fff" },
  crossPromoBody: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2, lineHeight: 16 },
  trickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  trickNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  trickNumberText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  trickName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
  trickMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: 2 },
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
          Premium scanners unlock inside the That's My Dog! iOS app.
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
  const { gallery, addToGallery, setCurrentScan, setCurrentKnowledge, setCurrentDogName, cacheKnowledge } = useApp();
  const {
    hasMixedBreed,
    hasAgeCalc,
    hasPersonality,
    hasHealthGuide,
    hasTrickTrainer,
    hasAllScanners,
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
  const nameInputRef = useRef<TextInput>(null);

  const [activeScanType, setActiveScanType] = useState<ScanType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [webPromptVisible, setWebPromptVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<ScannerDef | null>(null);
  const [isBuying, setIsBuying] = useState(false);

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

  const handleScannerTap = (def: ScannerDef) => {
    if (isWeb && !def.free && !isOwned(def)) {
      setWebPromptVisible(true);
      return;
    }
    if (!def.free && !isOwned(def)) {
      setPurchaseTarget(def);
      setPurchaseModalVisible(true);
      return;
    }
    // Owned or free — start scan
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

  const startScan = async (scanType: ScanType) => {
    setActiveScanType(scanType);
    Alert.alert(
      "Add a photo",
      "Take a new photo or choose one from your library.",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const picked = await pickImage("camera");
            if (picked) await processImage(picked.uri, picked.base64, picked.mimeType, scanType);
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const picked = await pickImage("library");
            if (picked) await processImage(picked.uri, picked.base64, picked.mimeType, scanType);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const processImage = async (uri: string, base64: string, mimeType: string, scanType: ScanType) => {
    setScannedUri(uri);
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
    router.push("/breed");
    getBreedKnowledge(pendingScan.breed)
      .then((k) => {
        setCurrentKnowledge(k);
        cacheKnowledge(pendingScan.breed, k);
      })
      .catch(() => {});
    setPhase("idle");
    setScannedUri(null);
    setPendingScan(null);
    setPendingGalleryId(null);
    setDogName("");
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
      // After purchase, start the scan
      startScan(purchaseTarget.id);
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
    <View style={[styles.container, { backgroundColor: "#0a0e1a" }]}>
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
        {/* dark scrim so the collage reads as texture, not noise */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,14,26,0.82)" }]} />
      </View>

      {COLLAGE_ONLY && <BlinkingFooter />}

      {!COLLAGE_ONLY && (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: isWeb ? 100 : insets.bottom + 80 }}
          >
            {/* Header */}
            <ScannerHeader />

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
                <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
              ) : (
                <Text style={styles.restoreText}>Restore purchases</Text>
              )}
            </TouchableOpacity>

            {/* ONJJEM Promo Strip */}
            <TouchableOpacity
              onPress={() => Linking.openURL("https://onjjem.com")}
              activeOpacity={0.82}
              style={[styles.onjjemStrip, { marginTop: 24, marginHorizontal: 16 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.onjjemLabel}>FROM ONJJEM, OUR SISTER COMPANY</Text>
                <Text style={styles.onjjemTitle}>Turn this photo into a keepsake</Text>
                <Text style={styles.onjjemSub}>Canvas, mugs, keyrings & more — onjjem.com</Text>
              </View>
              <Ionicons name="bag-outline" size={24} color="#c9a84c" />
            </TouchableOpacity>
          </ScrollView>

          {/* Scanning overlay */}
          {phase === "scanning" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,14,26,0.85)", alignItems: "center", justifyContent: "center", zIndex: 50 }]}>
              <ActivityIndicator color="#c9a84c" size="large" />
              <Text style={{ marginTop: 16, fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#c9a84c" }}>{statusText}</Text>
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
        scanType={activeScanType ?? "breed"}
      />

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
                <Text style={[styles.purchasePrice, { color: purchaseTarget.color }]}>99p</Text>
                <Text style={[styles.purchaseSub, { color: colors.mutedForeground }]}>
                  One-time purchase, unlocks every premium scanner. No subscription.
                </Text>
                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={isBuying}
                  style={[styles.purchaseBtn, { backgroundColor: purchaseTarget.color }]}
                >
                  {isBuying ? (
                    <ActivityIndicator color="#0a0e1a" size="small" />
                  ) : (
                    <Text style={[styles.purchaseBtnText, { color: "#0a0e1a" }]}>Unlock All for 99p</Text>
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
  restoreText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)" },

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
