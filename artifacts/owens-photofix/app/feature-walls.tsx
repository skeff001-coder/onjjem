import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const CUSTOMER_STORIES = [
  {
    id: "anniversary",
    image: require("@/assets/gallery/mural_anniversary.png"),
    tag: "50TH ANNIVERSARY",
    title: "A Golden Anniversary to Remember",
    story:
      "For their parents' 50th golden wedding anniversary, the family secretly commissioned ONJJEM to restore and enlarge the original 1974 wedding photo to fill the entire end wall of the function room. When the couple walked in, the room fell silent. Their wedding day — in full, vivid colour — greeted them at life-size scale. There was not a dry eye in the house.",
    detail: "360×260 cm · 6 panels · function room, Cheshire",
  },
  {
    id: "living_room",
    image: require("@/assets/gallery/mural_living_room.png"),
    tag: "HERITAGE PORTRAIT",
    title: "A Victorian Ancestor, Restored to Life",
    story:
      "A faded daguerreotype of a great-great-grandmother — barely visible, heavily cracked — became the centrepiece of an elegant London living room. Our master restorers spent two days on the colour science alone. The result: a floor-to-ceiling feature wall that guests mistake for a commissioned oil painting.",
    detail: "240×240 cm · 4 panels · private residence, London",
  },
  {
    id: "hallway",
    image: require("@/assets/gallery/mural_hallway.png"),
    tag: "FAMILY LEGACY",
    title: "Three Generations in One Hallway",
    story:
      "A composite of three restored family photographs spanning the 1930s, 1960s, and 1990s. Each era brought back with full colour and remarkable clarity, printed as a single continuous mural along a 4.5-metre hallway. The family calls it 'the corridor of time'.",
    detail: "450×220 cm · 8 panels · family home, Manchester",
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

const PANEL_CM = 62.5;
const MARKUP = 2.0;
const MAX_HEIGHT_CM = 1000;

const PAPER_TYPES = [
  {
    id: "standard",
    name: "Standard",
    spec: "Paste-the-wall · matte textured finish",
    baseCost: 20,
    retailPerSqm: 40,
    badge: "MOST POPULAR" as const,
    badgeColor: "#34D399",
    desc: "Matte, textured finish. Apply paste directly to the wall, then hang — traditional method, permanent result. Long-lasting, non-fade print. Greenguard Gold-certified eco-friendly, solvent-free inks.",
  },
  {
    id: "premium",
    name: "Premium",
    spec: "Water-activated · lightly textured · 10-yr guarantee",
    baseCost: 35,
    retailPerSqm: 70,
    badge: "HERITAGE CHOICE" as const,
    badgeColor: GOLD,
    desc: "Water-activated adhesive — simply spray the wall, then slide into place. Matte, lightly textured finish. Scratch and abrasion resistant. 10-year non-fade guarantee. Greenguard Gold-certified eco-friendly inks.",
  },
  {
    id: "selfadhesive",
    name: "Self-Adhesive",
    spec: "Peel-and-stick · repositionable · 10-yr guarantee",
    baseCost: 45,
    retailPerSqm: 90,
    badge: "PREMIUM" as const,
    badgeColor: "#93C5FD",
    desc: "Peel-and-stick — no paste or water needed. Fully repositionable: can be removed and reapplied countless times. Perfect for renters and temporary displays. 10-year non-fade guarantee. Greenguard Gold-certified inks.",
  },
] as const;

type PaperTypeId = typeof PAPER_TYPES[number]["id"];

function calcPrice(w: number, h: number, baseCost: number) {
  return Math.round(((w * h) / 10000) * baseCost * MARKUP * 100) / 100;
}

export default function FeatureWallsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;
  const router = useRouter();
  const [contactVisible, setContactVisible] = useState(false);
  const [calcW, setCalcW] = useState("300");
  const [calcH, setCalcH] = useState("240");
  const [paperType, setPaperType] = useState<PaperTypeId>("standard");
  const [showInfoFor, setShowInfoFor] = useState<PaperTypeId | null>(null);

  const selectedPaper = PAPER_TYPES.find((p) => p.id === paperType) ?? PAPER_TYPES[0];
  const wNum = Math.max(1, parseFloat(calcW) || 0);
  const hNum = Math.max(1, parseFloat(calcH) || 0);
  const panelCount = wNum > 0 ? Math.ceil(wNum / PANEL_CM) : 0;
  const price = calcPrice(wNum, hNum, selectedPaper.baseCost);
  const heightWarning = hNum > MAX_HEIGHT_CM;

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
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <TouchableOpacity onPress={() => router.replace("/")} activeOpacity={0.7} hitSlop={8}>
            <Text style={s.headerEyebrow}>ONJJEM</Text>
          </TouchableOpacity>
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
            <Text style={s.heroProduct}>Custom Wedding & Heritage Murals</Text>

            <View style={s.heroDivider} />

            <Text style={s.heroDesc}>
              Any size, any wall — no limits. Our master restorers transform your
              photograph into a life-sized feature wall printed on premium
              easy-to-hang wallpaper with eco-friendly inks.
            </Text>

            {/* ── Live Price Calculator ── */}
            <View style={s.calcCard}>
              <Text style={s.calcTitle}>INSTANT PRICE CALCULATOR</Text>

              {/* ── Paper Type Selector ── */}
              <View style={s.paperSection}>
                <Text style={s.paperSectionLabel}>PAPER TYPE</Text>
                {PAPER_TYPES.map((p) => {
                  const selected = paperType === p.id;
                  const infoOpen = showInfoFor === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.paperOption, selected && s.paperOptionSelected]}
                      onPress={() => { setPaperType(p.id); setShowInfoFor(null); }}
                      activeOpacity={0.82}
                    >
                      <View style={s.paperOptionTop}>
                        {/* Radio */}
                        <View style={[s.paperRadio, selected && s.paperRadioSelected]}>
                          {selected && <View style={s.paperRadioDot} />}
                        </View>
                        {/* Name + spec */}
                        <View style={s.paperNameWrap}>
                          <Text style={[s.paperName, selected && s.paperNameSelected]}>
                            {p.name}
                          </Text>
                          <Text style={s.paperSpec}>{p.spec}</Text>
                        </View>
                        {/* Badge */}
                        <View style={[s.paperBadge, { borderColor: p.badgeColor + "55" }]}>
                          <Text style={[s.paperBadgeText, { color: p.badgeColor }]}>{p.badge}</Text>
                        </View>
                        {/* Info icon */}
                        <TouchableOpacity
                          hitSlop={10}
                          onPress={(e) => {
                            e.stopPropagation();
                            setShowInfoFor(infoOpen ? null : p.id);
                          }}
                        >
                          <Ionicons
                            name={infoOpen ? "information-circle" : "information-circle-outline"}
                            size={17}
                            color={selected ? GOLD : "rgba(245,237,216,0.35)"}
                          />
                        </TouchableOpacity>
                        {/* Price */}
                        <Text style={[s.paperPrice, selected && s.paperPriceSelected]}>
                          £{p.retailPerSqm}/m²
                        </Text>
                      </View>

                      {/* Expandable quality description */}
                      {infoOpen && (
                        <View style={s.paperDescBox}>
                          <Text style={s.paperDescText}>{p.desc}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Dimensions ── */}
              <View style={s.calcRow}>
                <View style={s.calcField}>
                  <Text style={s.calcLabel}>Width (cm)</Text>
                  <TextInput
                    style={s.calcInput}
                    value={calcW}
                    onChangeText={setCalcW}
                    keyboardType="numeric"
                    placeholder="e.g. 300"
                    placeholderTextColor="rgba(245,237,216,0.3)"
                    selectTextOnFocus
                  />
                </View>
                <Text style={s.calcX}>×</Text>
                <View style={s.calcField}>
                  <Text style={s.calcLabel}>Height (cm)</Text>
                  <TextInput
                    style={s.calcInput}
                    value={calcH}
                    onChangeText={setCalcH}
                    keyboardType="numeric"
                    placeholder="e.g. 240"
                    placeholderTextColor="rgba(245,237,216,0.3)"
                    selectTextOnFocus
                  />
                </View>
              </View>

              {heightWarning && (
                <View style={s.calcWarning}>
                  <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                  <Text style={s.calcWarningText}>
                    Heights over 10 m require a bespoke consultation — contact us for a quote.
                  </Text>
                </View>
              )}

              {/* ── Results row ── */}
              <View style={s.calcResults}>
                <View style={s.calcStat}>
                  <Text style={s.calcStatValue}>{panelCount}</Text>
                  <Text style={s.calcStatLabel}>Panels</Text>
                </View>
                <View style={s.calcStatDivider} />
                <View style={s.calcStat}>
                  <Text style={s.calcStatValue}>
                    {wNum > 0 ? (wNum / 100).toFixed(1) : "—"}m × {hNum > 0 ? (hNum / 100).toFixed(1) : "—"}m
                  </Text>
                  <Text style={s.calcStatLabel}>Your wall size</Text>
                </View>
                <View style={s.calcStatDivider} />
                <View style={s.calcStat}>
                  <Text style={[s.calcStatValue, s.calcPrice]}>£{price.toFixed(2)}</Text>
                  <Text style={s.calcStatLabel}>Your price</Text>
                </View>
              </View>

              {/* ── Quality description for selected paper ── */}
              <View style={s.qualityDescBox}>
                <Ionicons name="document-text-outline" size={13} color={GOLD} />
                <Text style={s.qualityDescText}>{selectedPaper.desc}</Text>
              </View>

              {/* ── Quality Guarantee badge ── */}
              <View style={s.qualityGuarantee}>
                <Ionicons name="ribbon" size={14} color={GOLD} />
                <Text style={s.qualityGuaranteeText}>
                  All prints are master-crafted in London using eco-friendly, UV-resistant inks.
                </Text>
              </View>

              <Text style={s.calcNote}>
                £{selectedPaper.retailPerSqm}/m² · {selectedPaper.name} · 8 cm bleed (4 cm each side) added automatically · panel width 62.5 cm
              </Text>
            </View>

            <View style={s.priceRight}>
              <View style={s.priceFeature}>
                <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                <Text style={s.priceFeatureText}>Expert restoration included</Text>
              </View>
              <View style={s.priceFeature}>
                <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                <Text style={s.priceFeatureText}>Premium wallpaper — 3 finish options</Text>
              </View>
              <View style={s.priceFeature}>
                <Ionicons name="checkmark-circle" size={15} color={GOLD} />
                <Text style={s.priceFeatureText}>UK delivery included</Text>
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

        {/* Seam Preview Tool */}
        <TouchableOpacity
          style={s.seamPreviewCard}
          onPress={() => router.push("/wall-preview")}
          activeOpacity={0.87}
        >
          <LinearGradient colors={["#0D1B2A", "#162236"]} style={s.seamPreviewGradient}>
            <View style={s.seamPreviewLeft}>
              <View style={s.seamPreviewBadge}>
                <Ionicons name="eye-outline" size={11} color={GOLD} />
                <Text style={s.seamPreviewBadgeText}>NEW TOOL</Text>
              </View>
              <Text style={s.seamPreviewTitle}>Preview Your Seam Lines</Text>
              <Text style={s.seamPreviewSub}>
                See exactly where each 62.5 cm panel joins before you order — so you can plan your crop around the seams.
              </Text>
            </View>
            <View style={s.seamPreviewLines}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[s.seamPreviewLine, i === 1 && s.seamPreviewLineGold]} />
              ))}
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Customer Stories */}
        <View style={s.storiesSection}>
          <Text style={s.sectionEyebrow}>CUSTOMER COMMISSIONS</Text>
          <Text style={s.sectionTitle}>Real Murals. Real Moments.</Text>
          {CUSTOMER_STORIES.map((story) => (
            <View key={story.id} style={s.storyCard}>
              <Image source={story.image} style={s.storyImage} resizeMode="cover" />
              <LinearGradient
                colors={["transparent", "rgba(28,26,20,0.92)"]}
                style={s.storyImageOverlay}
              />
              <View style={s.storyTagWrap}>
                <View style={s.storyTag}>
                  <Ionicons name="sparkles" size={9} color={GOLD} />
                  <Text style={s.storyTagText}>{story.tag}</Text>
                </View>
              </View>
              <View style={s.storyBody}>
                <Text style={s.storyTitle}>{story.title}</Text>
                <Text style={s.storyText}>{story.story}</Text>
                <View style={s.storyDetail}>
                  <Ionicons name="resize-outline" size={12} color={GOLD} />
                  <Text style={s.storyDetailText}>{story.detail}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Room style selector — visual inspiration */}
        <View style={s.roomSection}>
          <Text style={s.sectionEyebrow}>PERFECT FOR</Text>
          <Text style={s.sectionTitle}>Every Room & Occasion</Text>
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
              title: "We Restore & Print",
              desc: "Our master restorers perfect your image, then it is printed large-format on premium wallpaper with fade-proof, eco-certified inks.",
            },
            {
              n: "3",
              title: "Hang & Admire",
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

  /* ── Paper Selector ── */
  paperSection: {
    gap: 6,
  },
  paperSectionLabel: {
    fontSize: 8,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(245,237,216,0.45)",
    letterSpacing: 2,
  },
  paperOption: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(245,237,216,0.1)",
    borderRadius: 10,
    padding: 10,
    gap: 0,
  },
  paperOptionSelected: {
    backgroundColor: "rgba(201,150,12,0.1)",
    borderColor: "rgba(201,150,12,0.5)",
  },
  paperOptionTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  paperRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(245,237,216,0.25)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  paperRadioSelected: {
    borderColor: GOLD,
  },
  paperRadioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GOLD,
  },
  paperNameWrap: {
    flex: 1,
    gap: 1,
  },
  paperName: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(245,237,216,0.6)",
  },
  paperNameSelected: {
    color: "#F5EDD8",
  },
  paperSpec: {
    fontSize: 9,
    color: "rgba(245,237,216,0.35)",
    fontFamily: "Inter_400Regular",
  },
  paperBadge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  paperBadgeText: {
    fontSize: 7,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  paperPrice: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(245,237,216,0.4)",
    flexShrink: 0,
  },
  paperPriceSelected: {
    color: GOLD,
  },
  paperDescBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,150,12,0.2)",
  },
  paperDescText: {
    fontSize: 11,
    color: "rgba(245,237,216,0.6)",
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  qualityDescBox: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 7,
    backgroundColor: "rgba(201,150,12,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    borderRadius: 8,
    padding: 10,
  },
  qualityDescText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(245,237,216,0.65)",
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  qualityGuarantee: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 7,
    backgroundColor: "rgba(201,150,12,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
    borderRadius: 8,
    padding: 10,
  },
  qualityGuaranteeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#F5D78E",
    lineHeight: 17,
  },

  /* ── Inline Calculator ── */
  calcCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  calcTitle: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2.5,
  },
  calcRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  calcField: {
    flex: 1,
    gap: 4,
  },
  calcLabel: {
    fontSize: 10,
    color: "rgba(245,237,216,0.55)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  calcInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.4)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  calcX: {
    fontSize: 20,
    color: "rgba(245,237,216,0.4)",
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    paddingBottom: 8,
  },
  calcWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    borderRadius: 8,
    padding: 10,
  },
  calcWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#F59E0B",
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  calcResults: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },
  calcStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  calcStatDivider: {
    width: 1,
    backgroundColor: "rgba(201,150,12,0.2)",
    marginVertical: 8,
  },
  calcStatValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  calcPrice: {
    color: GOLD,
    fontSize: 17,
  },
  calcStatLabel: {
    fontSize: 10,
    color: "rgba(245,237,216,0.45)",
    fontFamily: "Inter_400Regular",
  },
  calcNote: {
    fontSize: 10,
    color: "rgba(245,237,216,0.4)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.2,
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

  /* Seam Preview Card */
  seamPreviewCard: {
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  seamPreviewGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  seamPreviewLeft: {
    flex: 1,
    gap: 5,
  },
  seamPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,150,12,0.18)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  seamPreviewBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.5,
  },
  seamPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  seamPreviewSub: {
    fontSize: 11,
    color: "rgba(245,237,216,0.6)",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  seamPreviewLines: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginRight: 4,
  },
  seamPreviewLine: {
    width: 2,
    height: 36,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  seamPreviewLineGold: {
    backgroundColor: GOLD,
    height: 44,
  },

  /* Customer Stories */
  storiesSection: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 6,
  },
  storyCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 14,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    shadowColor: "#B8960A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  storyImage: {
    width: "100%",
    height: 200,
  },
  storyImageOverlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    height: 100,
  },
  storyTagWrap: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  storyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28,26,20,0.75)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.5)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  storyTagText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.5,
  },
  storyBody: {
    backgroundColor: "#fff",
    padding: 16,
    gap: 7,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
    lineHeight: 21,
  },
  storyText: {
    fontSize: 13,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  storyDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  storyDetailText: {
    fontSize: 11,
    color: GOLD,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.3,
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
