import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TrustFooter } from "@/components/TrustFooter";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { GallerySlider } from "@/components/GallerySlider";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

const EXAMPLES = [
  {
    id: "portrait",
    label: "1920s Family Portrait",
    tag: "DAMAGE RESTORED",
    tagIcon: "sparkles" as const,
    description:
      "Heavy scratches, water stains and torn edges erased. Every face brought back with remarkable clarity.",
    before: require("@/assets/gallery/portrait_before.png"),
    after: require("@/assets/gallery/portrait_after.png"),
    initialPos: 0.45,
  },
  {
    id: "wedding",
    label: "Faded Wedding Photo",
    tag: "COLOURISED",
    tagIcon: "color-palette-outline" as const,
    description:
      "A black-and-white 1960s ceremony brought to life with warm, natural colour — exactly as it looked on the day.",
    before: require("@/assets/gallery/wedding_before.png"),
    after: require("@/assets/gallery/wedding_after.png"),
    initialPos: 0.5,
  },
  {
    id: "childhood",
    label: "Torn Childhood Memory",
    tag: "TEARS REPAIRED",
    tagIcon: "construct-outline" as const,
    description:
      "Torn in two and held together with tape for decades — now seamlessly restored as if it never happened.",
    before: require("@/assets/gallery/childhood_before.png"),
    after: require("@/assets/gallery/childhood_after.png"),
    initialPos: 0.42,
  },
  {
    id: "grandma",
    label: "Blurry Grandmother Portrait",
    tag: "AI SHARPENED",
    tagIcon: "eye-outline" as const,
    description:
      "A cherished but out-of-focus portrait made razor sharp — preserving every gentle detail of her expression.",
    before: require("@/assets/gallery/grandma_before.png"),
    after: require("@/assets/gallery/grandma_after.png"),
    initialPos: 0.48,
  },
  {
    id: "victorian",
    label: "Victorian Era Daguerreotype",
    tag: "COLOURISED & RESTORED",
    tagIcon: "time-outline" as const,
    description:
      "An 1890s family portrait rescued from near-total decay and colourised to show them as the world once saw them.",
    before: require("@/assets/gallery/victorian_before.png"),
    after: require("@/assets/gallery/victorian_after.png"),
    initialPos: 0.5,
  },
];

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 60) : insets.top;
  const router = useRouter();

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Gold rainbow top bar */}
      <LinearGradient
        colors={["#C9960C", "#F5D78E", "#C9960C", "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerEyebrow}>ONJJEM</Text>
          <Text style={s.headerTitle}>Masterpiece Gallery</Text>
        </View>
        <View style={s.headerRight} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero intro */}
        <View style={s.heroBlock}>
          <View style={s.crownWrap}>
            <Text style={s.crownEmoji}>👑</Text>
          </View>
          <Text style={s.heroTitle}>The Art of Restoration</Text>
          <Text style={s.heroSub}>
            Drag the handle on each photo to reveal the transformation. These are real AI restorations — no tricks, no composites.
          </Text>
          <View style={s.goldDivider} />
        </View>

        {/* Example cards */}
        {EXAMPLES.map((ex, index) => (
          <View key={ex.id} style={s.card}>
            {/* Card header */}
            <View style={s.cardHeader}>
              <View style={s.cardNumberWrap}>
                <Text style={s.cardNumber}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <View style={s.cardTitleBlock}>
                <Text style={s.cardLabel}>{ex.label}</Text>
                <View style={s.tagRow}>
                  <Ionicons name={ex.tagIcon} size={11} color={GOLD} />
                  <Text style={s.tag}>{ex.tag}</Text>
                </View>
              </View>
            </View>

            {/* Interactive slider */}
            <View style={s.sliderWrap}>
              <GallerySlider
                beforeSource={ex.before}
                afterSource={ex.after}
                initialPos={ex.initialPos}
              />
              <View style={s.dragHint}>
                <Ionicons name="swap-horizontal-outline" size={13} color={MUTED} />
                <Text style={s.dragHintText}>Drag to compare</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={s.cardDesc}>{ex.description}</Text>

            {/* Gold bottom rule */}
            {index < EXAMPLES.length - 1 && <View style={s.cardRule} />}
          </View>
        ))}

        {/* Testimonial pull-quote */}
        <View style={s.quoteCard}>
          <LinearGradient
            colors={["#1C1A14", "#2E2A1E"]}
            style={s.quoteGradient}
          >
            <Text style={s.quoteMarks}>"</Text>
            <Text style={s.quoteText}>
              I had given up hope of ever seeing my grandmother's face clearly. ONJJEM restored it in minutes. I cried.
            </Text>
            <Text style={s.quoteAuthor}>— Margaret H., London</Text>
          </LinearGradient>
        </View>

        {/* CTA button */}
        <View style={s.ctaBlock}>
          <Text style={s.ctaEyebrow}>YOUR TURN</Text>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.replace("/")}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#C9960C", "#A67C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaBtnGradient}
            >
              <Ionicons name="sparkles" size={22} color="#fff" />
              <View style={s.ctaBtnText}>
                <Text style={s.ctaBtnPrimary}>Ready to Restore Your Memories?</Text>
                <Text style={s.ctaBtnSecondary}>Get Started Now →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.ctaNote}>
            Free preview · No account required · Results in under 60 seconds
          </Text>
        </View>

        <TrustFooter />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  goldBar: {
    height: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    letterSpacing: 0.2,
  },
  headerRight: { width: 40 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 0,
  },

  /* Hero */
  heroBlock: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 8,
    gap: 10,
  },
  crownWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GOLD_BG,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  crownEmoji: { fontSize: 28 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  heroSub: {
    fontSize: 14,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  goldDivider: {
    width: 56,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 6,
    marginBottom: 18,
  },

  /* Example card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#B8960A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  cardNumberWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.5,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 5,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tag: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.2,
  },
  sliderWrap: {
    gap: 8,
    marginBottom: 14,
  },
  dragHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dragHintText: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: 13,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  cardRule: {
    display: "none",
  },

  /* Testimonial */
  quoteCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  quoteGradient: {
    padding: 22,
    gap: 10,
  },
  quoteMarks: {
    fontSize: 42,
    color: GOLD,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    marginBottom: -4,
  },
  quoteText: {
    fontSize: 15,
    color: "#F5EDD8",
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
    fontStyle: "italic",
  },
  quoteAuthor: {
    fontSize: 12,
    color: GOLD,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },

  /* CTA */
  ctaBlock: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  ctaEyebrow: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  ctaBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 14,
  },
  ctaBtnText: {
    gap: 3,
  },
  ctaBtnPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  ctaBtnSecondary: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  ctaNote: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
