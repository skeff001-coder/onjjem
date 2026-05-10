import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { TrustFooter } from "@/components/TrustFooter";
import { ContactExpertsModal } from "@/components/ContactExpertsModal";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";
const DARK_NAVY = "#0D1B2A";

const { width: SCREEN_W } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "resize-outline" as const,
    title: "Up to 4m × 3m",
    sub: "Covers an entire feature wall in one seamless print",
  },
  {
    icon: "color-palette-outline" as const,
    title: "Eco-Friendly Inks",
    sub: "Vivid, fade-resistant colour safe for the whole family",
  },
  {
    icon: "layers-outline" as const,
    title: "Premium Wallpaper",
    sub: "Peel-and-stick or paste — easy to hang, no specialist needed",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Expert Restoration First",
    sub: "Every photo is master-restored before it reaches the press",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Specialist Protective Shipping",
    sub: "Rolled in archival tissue, boxed in reinforced tube packaging",
  },
  {
    icon: "ribbon-outline" as const,
    title: "10-Year Colour Guarantee",
    sub: "Our inks are rated to look perfect for a decade",
  },
];

const ROOM_STYLES = [
  { emoji: "💒", label: "Wedding" },
  { emoji: "👶", label: "Nursery" },
  { emoji: "🏛️", label: "Heritage" },
  { emoji: "🎖️", label: "Memorial" },
  { emoji: "🌿", label: "Living Room" },
  { emoji: "🖼️", label: "Gallery Wall" },
];

export default function FeatureWallsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [contactVisible, setContactVisible] = useState(false);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Gold top bar */}
      <LinearGradient
        colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerEyebrow}>ONJJEM</Text>
          <Text style={s.headerTitle}>Feature Walls</Text>
        </View>
        <View style={s.headerRight} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero block */}
        <LinearGradient
          colors={[DARK_NAVY, "#162236"]}
          style={s.hero}
        >
          {/* Gold shimmer bar */}
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.heroGoldBar}
          />

          <View style={s.heroInner}>
            <View style={s.heroBadge}>
              <Ionicons name="sparkles" size={12} color={GOLD} />
              <Text style={s.heroBadgeText}>LARGE FORMAT · MASTER CRAFTED</Text>
            </View>

            <Text style={s.heroHeadline}>Turn Your Wall into{"\n"}a Masterpiece.</Text>
            <Text style={s.heroProduct}>Custom Wedding &amp; Heritage Murals</Text>
            <Text style={s.heroSize}>Up to 4m × 3m</Text>

            <View style={s.heroDivider} />

            <Text style={s.heroDesc}>
              Our master restorers take your precious photograph and transform it
              into a life-sized feature wall. Printed on premium, easy-to-hang
              wallpaper with eco-friendly inks — including expert restoration and
              specialist protective shipping.
            </Text>

            {/* Price block */}
            <View style={s.priceBlock}>
              <View style={s.priceTopRow}>
                <View style={s.priceLeft}>
                  <Text style={s.priceLabel}>FROM</Text>
                  <Text style={s.priceAmount}>£409.99</Text>
                  <Text style={s.priceIncludes}>Includes Restoration &amp; Delivery</Text>
                </View>
              </View>
              <View style={s.priceDividerH} />
              <View style={s.priceRight}>
                <View style={s.priceFeature}>
                  <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                  <Text style={s.priceFeatureText}>Expert restoration</Text>
                </View>
                <View style={s.priceFeature}>
                  <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                  <Text style={s.priceFeatureText}>Premium wallpaper</Text>
                </View>
                <View style={s.priceFeature}>
                  <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                  <Text style={s.priceFeatureText}>UK delivery included</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* CTA button */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => setContactVisible(true)}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaBtnGradient}
          >
            <Ionicons name="home-outline" size={22} color="#fff" />
            <View style={s.ctaBtnTextWrap}>
              <Text style={s.ctaBtnPrimary}>Start My Mural Project</Text>
              <Text style={s.ctaBtnSub}>Tell us your measurements — we'll do the rest</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Room style selector — visual inspiration */}
        <View style={s.roomSection}>
          <Text style={s.sectionEyebrow}>PERFECT FOR</Text>
          <Text style={s.sectionTitle}>Every Room &amp; Occasion</Text>
          <View style={s.roomGrid}>
            {ROOM_STYLES.map((r) => (
              <View key={r.label} style={s.roomChip}>
                <Text style={s.roomEmoji}>{r.emoji}</Text>
                <Text style={s.roomLabel}>{r.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Feature list */}
        <View style={s.featuresSection}>
          <Text style={s.sectionEyebrow}>WHAT'S INCLUDED</Text>
          <Text style={s.sectionTitle}>Everything in One Price</Text>

          <View style={s.featureList}>
            {FEATURES.map((f) => (
              <View key={f.title} style={s.featureRow}>
                <View style={s.featureIconWrap}>
                  <Ionicons name={f.icon} size={20} color={GOLD} />
                </View>
                <View style={s.featureText}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Process steps */}
        <View style={s.processSection}>
          <Text style={s.sectionEyebrow}>HOW IT WORKS</Text>
          <Text style={s.sectionTitle}>Simple as Three Steps</Text>

          {[
            {
              n: "1",
              title: "Tell Us Your Vision",
              desc: "Send us your photo and wall measurements via the contact form. Our experts will assess the image quality and advise on the best finish.",
            },
            {
              n: "2",
              title: "We Restore &amp; Print",
              desc: "Our master restorers perfect your image, then it is printed large-format on premium wallpaper with fade-proof, eco-certified inks.",
            },
            {
              n: "3",
              title: "Hang &amp; Admire",
              desc: "Delivered in specialist protective packaging. Hang it yourself with our included guide, or use any local decorator.",
            },
          ].map((step) => (
            <View key={step.n} style={s.step}>
              <View style={s.stepNumber}>
                <Text style={s.stepN}>{step.n}</Text>
              </View>
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pull quote */}
        <LinearGradient
          colors={[DARK, "#2E2A1E"]}
          style={s.quoteCard}
        >
          <Text style={s.quoteMarks}>"</Text>
          <Text style={s.quoteText}>
            The mural of my grandparents' wedding photo now fills the entire dining room wall.
            Every guest asks about it. It is the most beautiful thing in our home.
          </Text>
          <Text style={s.quoteAuthor}>— Catherine B., Edinburgh</Text>
        </LinearGradient>

        {/* Second CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => setContactVisible(true)}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaBtnGradient}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
            <View style={s.ctaBtnTextWrap}>
              <Text style={s.ctaBtnPrimary}>Start My Mural Project</Text>
              <Text style={s.ctaBtnSub}>Our experts are ready to help</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <TrustFooter />
      </ScrollView>

      <ContactExpertsModal
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
      />
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

  /* Header */
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
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
    letterSpacing: 0.2,
  },
  headerRight: { width: 40 },

  scroll: { flex: 1 },
  scrollContent: {
    gap: 0,
  },

  /* Hero */
  hero: {
    marginHorizontal: 0,
    overflow: "hidden",
  },
  heroGoldBar: {
    height: 2,
  },
  heroInner: {
    padding: 24,
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2,
  },
  heroHeadline: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    lineHeight: 36,
    letterSpacing: 0.2,
  },
  heroProduct: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
    letterSpacing: 0.3,
  },
  heroSize: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(245,237,216,0.55)",
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(201,150,12,0.2)",
    marginVertical: 4,
  },
  heroDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,237,216,0.75)",
    lineHeight: 22,
  },

  /* Price block */
  priceBlock: {
    backgroundColor: "rgba(201,150,12,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    gap: 14,
  },
  priceTopRow: {},
  priceLeft: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  priceIncludes: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,237,216,0.55)",
    marginTop: 2,
  },
  priceDividerH: {
    height: 1,
    backgroundColor: "rgba(201,150,12,0.2)",
    marginVertical: 2,
  },
  /* keep old name so nothing else breaks */
  priceDivider: {
    width: 1,
    backgroundColor: "rgba(201,150,12,0.2)",
    alignSelf: "stretch",
  },
  priceRight: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  priceFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceFeatureText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(245,237,216,0.85)",
  },

  /* CTA button */
  ctaBtn: {
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  ctaBtnPrimary: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  ctaBtnTextWrap: {
    flex: 1,
  },
  ctaBtnSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },

  /* Room styles */
  roomSection: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 6,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
    marginBottom: 12,
  },
  roomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roomChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roomEmoji: { fontSize: 16 },
  roomLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: DARK,
  },

  /* Features */
  featuresSection: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 6,
  },
  featureList: {
    gap: 14,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    padding: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: DARK,
  },
  featureSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    lineHeight: 17,
  },

  /* Process */
  processSection: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 6,
  },
  step: {
    flexDirection: "row",
    gap: 14,
    marginTop: 14,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stepN: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  stepBody: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  stepDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    lineHeight: 20,
  },

  /* Pull quote */
  quoteCard: {
    marginHorizontal: 18,
    marginTop: 28,
    marginBottom: 4,
    borderRadius: 16,
    padding: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
  },
  quoteMarks: {
    fontSize: 48,
    color: GOLD,
    lineHeight: 40,
    fontFamily: "Inter_700Bold",
    opacity: 0.6,
  },
  quoteText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,237,216,0.85)",
    fontStyle: "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
