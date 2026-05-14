import React, { useState } from "react";
import {
  Dimensions,
  Platform,
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
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

const { width: SCREEN_W } = Dimensions.get("window");

const PRODUCTS = [
  {
    id: "canvas_classic",
    title: "Classic Gallery Wrap Canvas",
    size: "30×20 cm",
    price: "£29.99",
    emoji: "🎨",
    desc: "Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame for a stunning gallery wrap finish. A beautiful addition to any wall.",
    bestSeller: false,
    premium: false,
  },
  {
    id: "canvas_large",
    title: "Large Gallery Wrap Canvas",
    size: "60×40 cm",
    price: "£49.99",
    emoji: "🖼️",
    desc: "Cinema-Grade AI Restoration included. Our most popular canvas size — hand-stretched over a 2.5cm deep FSC-certified wooden frame. Lifetime Fade-Resistant Guarantee. A true statement piece.",
    bestSeller: true,
    premium: false,
  },
  {
    id: "canvas_bespoke",
    title: "Bespoke Canvas — Any Size",
    size: "Made to Measure · Any Dimensions",
    price: "from £49.99",
    emoji: "📐",
    desc: "Want an exact size for your wall? Our master printers will produce your canvas at any custom dimensions. Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame.\n\nSmall bespoke sizes from £49.99. Larger bespoke sizes (e.g. 90×60 cm) from £225. Tap 'Request a Quote' with your exact width and height for a precise price.",
    bestSeller: false,
    premium: false,
    getQuote: true,
  },
  {
    id: "heritage_mini_canvas_trio",
    title: "Heritage Mini Canvas Trio",
    size: "Set of 3 · Vertical Display",
    price: "£34.99",
    emoji: "🎨",
    desc: "Three of your precious memories, expertly restored and displayed on a beautiful vertical canvas set. Perfect for a desk or a bedside table.",
    bestSeller: false,
    premium: false,
  },
  {
    id: "aluminium_print",
    title: "Aluminium Heritage Print",
    size: "2mm aluminium · smooth satin finish · 4mm rounded corners · built-in shadow mount",
    price: "£44.99",
    emoji: "🪙",
    desc: "Sublimation-printed directly onto 2mm premium aluminium with a smooth satin finish and 4mm rounded corners. The built-in shadow mount holds the print slightly off the wall for a contemporary floating effect. Scratch and UV-resistant. Wipe-clean. Made in the UK in 1–2 days.",
    bestSeller: false,
    premium: false,
  },
  {
    id: "acrylic_memory_block",
    title: "Acrylic Memory Block",
    size: "20mm thick · diamond-polished edges · freestanding · A7 / Square / A6 / A5",
    price: "from £25.90",
    emoji: "🔷",
    desc: "Freestanding 3D photo glass effect — your restored photo printed into 20mm-thick diamond-polished acrylic. Choose opaque (matte white backing, bold vivid colours) or translucent (frosted, luminous look).\n\nA7 10.5×7.8cm — £25.90\nSquare 10.5×10.5cm — £31.00\nA6 15×10.5cm — £33.00\n\n3-year guarantee. Ready same day.",
    bestSeller: false,
    premium: false,
  },
  {
    id: "gallery_diptych",
    title: "The Diptych — Heritage Gallery Panel",
    size: "2 Panels · Seamless Masterpiece",
    price: "£125.00",
    emoji: "🖼️",
    desc: "Turn your favourite restored memory into a professional art installation. Two panels that create one seamless masterpiece — hand-stretched over deep wooden frames in London.",
    bestSeller: false,
    premium: true,
  },
  {
    id: "gallery_triptych",
    title: "The Triptych — Heritage Gallery Panel",
    size: "3 Panels · Large-Scale Gallery Feel",
    price: "£145.00",
    emoji: "🖼️",
    desc: "Turn your favourite restored memory into a professional art installation. Three stunning panels for a large-scale gallery feel — hand-stretched over deep wooden frames in London.",
    bestSeller: true,
    premium: true,
  },
];

const FEATURES = [
  { icon: "color-palette-outline" as const, title: "Hand-Stretched", sub: "Every canvas is stretched by hand over a 2.5cm deep FSC-certified wooden frame" },
  { icon: "sparkles-outline" as const, title: "AI Restoration Included", sub: "Cinema-Grade AI enhancement on every order before it reaches the press" },
  { icon: "ribbon-outline" as const, title: "Lifetime Guarantee", sub: "Fade-resistant inks guaranteed for the lifetime of the canvas" },
  { icon: "shield-checkmark-outline" as const, title: "UK Master Printers", sub: "Produced in our ONJJEM Master Print Lab by specialist artisans" },
];

export default function CanvasPrintsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;
  const router = useRouter();
  const [contactVisible, setContactVisible] = useState(false);

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Gold top bar */}
      <LinearGradient
        colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={GOLD} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerBrand}>ONJJEM</Text>
          <Text style={s.headerTitle}>Canvas Prints</Text>
          <Text style={s.headerSub}>Hand-stretched gallery canvases · UK Master Printers</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <LinearGradient
          colors={["#091D35", "#0F3060", "#091D35"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroBanner}
        >
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.heroBannerBar}
          />
          <Text style={s.heroEmoji}>🎨</Text>
          <Text style={s.heroTitle}>ONJJEM Signature{"\n"}Canvas Collection</Text>
          <Text style={s.heroSub}>
            Your treasured memories, expertly restored and printed on premium gallery-grade canvas — ready to hang.
          </Text>
          <View style={s.heroChips}>
            {["A4 · A3 · A2 · A1", "Ready to Hang", "Lifetime Guarantee", "Free UK Delivery"].map((c) => (
              <View key={c} style={s.heroChip}>
                <Text style={s.heroChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Feature badges */}
        <View style={s.featuresGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={s.featureCard}>
              <Ionicons name={f.icon} size={22} color={GOLD} />
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

        {/* Products */}
        <Text style={s.sectionLabel}>Our Canvas Range</Text>
        {PRODUCTS.map((p) => (
          <View key={p.id} style={s.productCard}>
            {p.bestSeller && (
              <View style={s.bestSellerBadge}>
                <Text style={s.bestSellerText}>★ Best Seller</Text>
              </View>
            )}
            {p.premium && (
              <View style={s.premiumBadge}>
                <Text style={s.premiumBadgeText}>✦ Premium</Text>
              </View>
            )}
            <View style={s.productTop}>
              <Text style={s.productEmoji}>{p.emoji}</Text>
              <View style={s.productMeta}>
                <Text style={s.productTitle}>{p.title}</Text>
                <Text style={s.productSize}>{p.size}</Text>
              </View>
              <Text style={s.productPrice}>{p.price}</Text>
            </View>
            <Text style={s.productDesc}>{p.desc}</Text>
            <TouchableOpacity
              style={s.orderBtn}
              onPress={() => setContactVisible(true)}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={[GOLD, "#E8C44A", GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.orderBtnGrad}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={DARK} />
                <Text style={s.orderBtnText}>
                  {p.getQuote ? "Request a Quote" : "Order Now"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}

        <TrustFooter />
      </ScrollView>

      {/* Sticky contact bar */}
      <View style={[s.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={s.stickyBtn}
          onPress={() => setContactVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={DARK} />
          <Text style={s.stickyBtnText}>Contact Our Experts</Text>
        </TouchableOpacity>
      </View>

      <ContactExpertsModal visible={contactVisible} onClose={() => setContactVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3, width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CREAM,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE7D4",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerBrand: { fontSize: 10, fontFamily: "Cinzel_400Regular", color: GOLD, letterSpacing: 3 },
  headerTitle: { fontSize: 18, fontFamily: "Cinzel_700Bold", color: DARK, letterSpacing: 1 },
  headerSub: { fontSize: 10, color: MUTED, textAlign: "center", marginTop: 2 },
  scroll: { paddingBottom: 100, gap: 16, paddingHorizontal: 16, paddingTop: 16 },

  heroBanner: {
    borderRadius: 14,
    overflow: "hidden",
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  heroBannerBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  heroEmoji: { fontSize: 36, marginBottom: 4 },
  heroTitle: { fontSize: 20, fontFamily: "Cinzel_700Bold", color: "#F5D78E", textAlign: "center", letterSpacing: 1, lineHeight: 28 },
  heroSub: { fontSize: 13, color: "rgba(245,215,142,0.75)", textAlign: "center", lineHeight: 19 },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 },
  heroChip: { backgroundColor: "rgba(201,150,12,0.18)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(201,150,12,0.35)" },
  heroChipText: { fontSize: 10, color: "#F5D78E", fontFamily: "Inter_600SemiBold" },

  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  featureCard: {
    width: (SCREEN_W - 42) / 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#EDE7D4",
  },
  featureTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: DARK },
  featureSub: { fontSize: 11, color: MUTED, lineHeight: 16 },

  sectionLabel: { fontSize: 13, fontFamily: "Cinzel_400Regular", color: GOLD, letterSpacing: 2, marginBottom: -4 },

  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE7D4",
    gap: 10,
  },
  bestSellerBadge: { alignSelf: "flex-start", backgroundColor: GOLD_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "#D4B84A" },
  bestSellerText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#8B6A00" },
  premiumBadge: { alignSelf: "flex-start", backgroundColor: "#1C1A14", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  premiumBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: GOLD },
  productTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  productEmoji: { fontSize: 28 },
  productMeta: { flex: 1 },
  productTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: DARK },
  productSize: { fontSize: 11, color: GOLD, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  productPrice: { fontSize: 16, fontFamily: "Inter_700Bold", color: GOLD },
  productDesc: { fontSize: 12, color: MUTED, lineHeight: 18 },

  orderBtn: { borderRadius: 10, overflow: "hidden", marginTop: 2 },
  orderBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  orderBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: DARK },

  stickyBar: {
    backgroundColor: CREAM,
    borderTopWidth: 1,
    borderTopColor: "#EDE7D4",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  stickyBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  stickyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: DARK },
});
