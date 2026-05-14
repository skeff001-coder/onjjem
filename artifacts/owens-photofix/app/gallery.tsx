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
      "Heavy scratches, water stains and torn edges erased. Every face brought back with remarkable clarity — as sharp and vivid as the day it was taken.",
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
      "A black-and-white 1960s ceremony brought to life with warm, natural colour — exactly as it looked on the day. Every shade chosen with meticulous care.",
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
      "Torn in two and held together with tape for decades — now seamlessly restored as if it never happened. Not a trace of damage remains.",
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
      "A cherished but out-of-focus portrait made razor sharp — preserving every gentle detail of her expression for the generations that follow.",
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
      "An 1890s family portrait rescued from near-total decay and colourised to show them as the world once saw them — proud, vivid, and timeless.",
    before: require("@/assets/gallery/victorian_before.png"),
    after: require("@/assets/gallery/victorian_after.png"),
    initialPos: 0.5,
  },
];

const PROCESS_STEPS = [
  {
    icon: "cloud-upload-outline" as const,
    title: "You send us your photo",
    body: "Any format, any condition. A cracked print, a faded scan, a blurry snapshot — we have seen it all.",
  },
  {
    icon: "sparkles" as const,
    title: "Our masters go to work",
    body: "Cinema-Grade AI restoration is guided by our expert team — colour, detail, and emotion restored with human judgement at every step.",
  },
  {
    icon: "gift-outline" as const,
    title: "You receive a masterpiece",
    body: "A full-resolution digital file and, if you wish, a museum-quality print delivered straight to your door.",
  },
];

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;
  const router = useRouter();

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      <LinearGradient
        colors={["#C9960C", "#F5D78E", "#C9960C", "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <TouchableOpacity onPress={() => router.replace("/")} activeOpacity={0.7} hitSlop={8}>
              <Text style={s.headerEyebrow}>ONJJEM</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Masterpiece Gallery</Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* ── Hero ── */}
        <View style={s.heroBlock}>
          <View style={s.crownWrap}>
            <Text style={s.crownEmoji}>👑</Text>
          </View>
          <Text style={s.heroTitle}>The Art of Restoration</Text>
          <View style={s.goldDivider} />
          <Text style={s.heroBody}>
            At ONJJEM, we believe that every photograph deserves to be seen at its very best — not locked away in a drawer, faded beyond recognition. We were founded on a single conviction: that the moments your family lived through are too precious to be lost to time.
          </Text>
          <Text style={s.heroBody}>
            Our Master Restorers combine Cinema-Grade AI with years of hand-finishing expertise to return your photographs to a standard that no darkroom could ever achieve — and then some. We do not simply "fix" photos. We resurrect them.
          </Text>
        </View>

        {/* ── How the Gallery Works ── */}
        <View style={s.galleryGuide}>
          <LinearGradient colors={["#1C1A14", "#2E2A1E"]} style={s.guideGradient}>
            <View style={s.guideHeaderRow}>
              <Ionicons name="information-circle-outline" size={18} color={GOLD} />
              <Text style={s.guideHeading}>How to Read This Gallery</Text>
            </View>
            <Text style={s.guideBody}>
              Every image below is a real restoration — no composites, no stock photography, no tricks. Drag the gold handle left and right across any photo to reveal exactly what we received versus what we returned. The transformation you see is precisely what you can expect for your own treasured memories.
            </Text>
            <Text style={s.guideBody}>
              Each card describes the specific challenge we faced and the technique we used to overcome it — from colour science to structural repair. Browse at your own pace, then come to us when you are ready.
            </Text>
          </LinearGradient>
        </View>

        {/* ── Example Cards ── */}
        {EXAMPLES.map((ex, index) => (
          <View key={ex.id} style={s.card}>
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

            <View style={s.sliderWrap}>
              <GallerySlider
                beforeSource={ex.before}
                afterSource={ex.after}
                initialPos={ex.initialPos}
              />
              <View style={s.dragHint}>
                <Ionicons name="swap-horizontal-outline" size={13} color={MUTED} />
                <Text style={s.dragHintText}>Drag the handle to compare</Text>
              </View>
            </View>

            <Text style={s.cardDesc}>{ex.description}</Text>
          </View>
        ))}

        {/* ── Our Process ── */}
        <View style={s.processBlock}>
          <Text style={s.sectionEyebrow}>OUR CRAFT</Text>
          <Text style={s.sectionTitle}>How Every Restoration Is Made</Text>
          <View style={s.goldDividerCentre} />
          {PROCESS_STEPS.map((step, i) => (
            <View key={i} style={s.processStep}>
              <View style={s.processIconWrap}>
                <Ionicons name={step.icon} size={22} color={GOLD} />
              </View>
              <View style={s.processText}>
                <Text style={s.processTitle}>{step.title}</Text>
                <Text style={s.processBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Why Choose ONJJEM ── */}
        <LinearGradient colors={["#1C1A14", "#2A2215"]} style={s.whyBlock}>
          <Text style={s.whyEyebrow}>FOR PERSONAL & BUSINESS CLIENTS</Text>
          <Text style={s.whyTitle}>Why Organisations Choose ONJJEM</Text>
          <View style={s.whyDivider} />
          <Text style={s.whyBody}>
            Our work does not stop at family memories. Funeral homes, heritage societies, museums, publishers, production companies, and luxury brands commission us for restoration projects ranging from single portraits to entire historical archives.
          </Text>
          <Text style={s.whyBody}>
            We offer dedicated account management, volume pricing, NDA agreements, and delivery guaranteed to your timeline. Every restoration carries our Certificate of Authenticity — a signed document attesting to the provenance, techniques used, and our quality guarantee.
          </Text>
          <View style={s.whyFeatures}>
            {[
              { icon: "shield-checkmark-outline" as const, text: "10-Year Quality Guarantee on every print" },
              { icon: "time-outline" as const, text: "Rush 24-hour turnaround available" },
              { icon: "business-outline" as const, text: "Business accounts with volume pricing" },
              { icon: "ribbon-outline" as const, text: "Certificate of Authenticity included" },
              { icon: "lock-closed-outline" as const, text: "NDA & confidentiality agreements available" },
              { icon: "call-outline" as const, text: "Dedicated account manager for commissions" },
            ].map((f, i) => (
              <View key={i} style={s.whyFeatureRow}>
                <Ionicons name={f.icon} size={15} color={GOLD} />
                <Text style={s.whyFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── CTA ── */}
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
                <Text style={s.ctaBtnPrimary}>Restore Your Memories Now</Text>
                <Text style={s.ctaBtnSecondary}>Free preview · Results in under 60 seconds →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.ctaNote}>
            No account required · Every restoration is private and confidential
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

  /* ── Hero ── */
  heroBlock: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 4,
    gap: 14,
  },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD_BG,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  crownEmoji: { fontSize: 30 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  goldDivider: {
    width: 56,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 2,
    marginBottom: 4,
  },
  heroBody: {
    fontSize: 14,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
  },

  /* ── Gallery Guide ── */
  galleryGuide: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  guideGradient: {
    padding: 20,
    gap: 10,
  },
  guideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  guideHeading: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.3,
  },
  guideBody: {
    fontSize: 13,
    color: "#D4C9A8",
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },

  /* ── Example card ── */
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

  /* ── Process ── */
  processBlock: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 0,
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  goldDividerCentre: {
    width: 48,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 10,
    marginBottom: 22,
  },
  processStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    width: "100%",
    marginBottom: 18,
  },
  processIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  processText: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  processTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    lineHeight: 19,
  },
  processBody: {
    fontSize: 13,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  /* ── Why ONJJEM ── */
  whyBlock: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  whyEyebrow: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2.5,
  },
  whyTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#FAF7F2",
    lineHeight: 25,
    letterSpacing: 0.2,
  },
  whyDivider: {
    width: 44,
    height: 2,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginVertical: 2,
  },
  whyBody: {
    fontSize: 13,
    color: "#C8BBAA",
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  whyFeatures: {
    marginTop: 6,
    gap: 10,
  },
  whyFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  whyFeatureText: {
    fontSize: 13,
    color: "#E8DBC0",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    flex: 1,
  },

  /* ── CTA ── */
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
