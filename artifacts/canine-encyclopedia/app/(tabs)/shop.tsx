import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, type GalleryEntry } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const ONJJEM_URL = "https://www.onjjem.com/shop/";

/* Product images served from the web store */
const PRODUCT_IMAGE_BASE = "https://www.onjjem.com/shop/assets/";
const PRODUCT_IMAGES: Record<string, string> = {
  canvas: "stretched-canvas-real.jpeg",
  mug: "photo-mug.png",
  coaster: "coasters.png",
  jigsaw_110: "jigsaw-110.png",
  dog_tag: "dog-tag.png",
};

/* Simplified shop — only 5 basic products. Everything else at onjjem.com */
const CATALOGUE = [
  {
    id: "canvas",
    name: "Stretched Canvas",
    sub: "38mm deep · 400gsm artist-grade",
    tagline: "Premium hand-stretched canvas",
    price: "£49.99",
    icon: "image-outline" as const,
    color: "#c9a84c",
    featured: true,
    emoji: "🖼️",
    desc: "European kiln-dried knotless pine stretcher bars. Hand-stretched, 200+ year display permanence.",
  },
  {
    id: "mug",
    name: "Photo Mug",
    sub: "11 oz ceramic",
    tagline: "Morning coffee with your best friend",
    price: "£17.99",
    icon: "cafe-outline" as const,
    color: "#4a9eca",
    featured: false,
    emoji: "☕",
    desc: "Vibrant wrap-around dog portrait. Dishwasher and microwave safe.",
  },
  {
    id: "coaster",
    name: "Wooden Coasters",
    sub: "4 cork-backed coasters",
    tagline: "Coffee tastes better with their face",
    price: "£24.99",
    icon: "disc-outline" as const,
    color: "#4a9eca",
    featured: false,
    emoji: "🥤",
    desc: "Gloss finish on 4mm thick fibreboard. High-gloss surface with protective cork underside.",
  },
  {
    id: "jigsaw_110",
    name: "Jigsaw Puzzle",
    sub: "110 pieces · gift tin",
    tagline: "A fun afternoon challenge",
    price: "£22.99",
    icon: "shapes-outline" as const,
    color: "#e07c5a",
    featured: false,
    emoji: "🧩",
    desc: "110-piece full-colour jigsaw of your dog's photo. High-gloss finish, presentation tin.",
  },
  {
    id: "dog_tag",
    name: "Dog ID Tag",
    sub: "Premium stainless steel",
    tagline: "Keep them safe in style",
    price: "£12.99",
    icon: "pricetag-outline" as const,
    color: "#c9a84c",
    featured: false,
    emoji: "🏷️",
    desc: "Personalised metal tag with your dog's photo and name. Laser-engraved, 3 sizes available.",
  },
];

function ProductMockup({
  imageUri,
  productImageUri,
  productId,
  color,
  size,
}: {
  imageUri?: string;
  productImageUri?: string;
  productId: string;
  color: string;
  size: number;
}) {
  const isCircle = ["cushion", "dog_ball"].includes(productId);
  const isRounded = ["phone_case", "dog_tag"].includes(productId);
  const borderRadius = isCircle ? size / 2 : isRounded ? size / 2 : 8;
  const borderColor = productId.startsWith("canvas") || productId === "framed_print" ? "#c8b89a" : productId === "dog_tag" ? "#888888" : color + "66";
  const borderWidth = productId.startsWith("canvas") || productId === "framed_print" ? 7 : 3;

  const displayUri = imageUri || productImageUri;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        borderWidth,
        borderColor,
        overflow: "hidden",
        backgroundColor: color + "18",
      }}
    >
      {displayUri ? (
        <Image source={{ uri: displayUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.38 }}>🐕</Text>
        </View>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gallery } = useApp();

  const [previewEntry, setPreviewEntry] = useState<GalleryEntry | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const activeEntry = previewEntry ?? gallery[0] ?? null;
  const previewUri = activeEntry?.uri;
  const dogName = activeEntry?.dogName ?? "";

  const featured = CATALOGUE[0];
  const rest = CATALOGUE.slice(1);
  const CARD_W = (width - 52) / 2;

  const openExternalShop = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await Linking.canOpenURL(ONJJEM_URL);
    if (ok) Linking.openURL(ONJJEM_URL);
    else Alert.alert("Visit onjjem.com in your browser.");
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
            <Text style={[styles.title, { color: colors.foreground }]}>What's Up Dog!</Text>
            <Text style={[styles.subtitle, { color: colors.gold }]}>Premium personalised dog gifts</Text>
          </View>
          <View style={[styles.starBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
            <Ionicons name="paw" size={14} color={colors.gold} />
          </View>
        </View>

        {/* onJJem shop banner */}
        <View style={[styles.partnerBanner, { backgroundColor: colors.navyMid, borderColor: colors.gold + "44" }]}>
          <View style={styles.partnerRow}>
            <View style={[styles.officialChip, { backgroundColor: colors.gold }]}>
              <Ionicons name="star" size={12} color={colors.navy} />
              <Text style={[styles.officialChipText, { color: colors.navy }]}>PREMIUM GIFTS</Text>
            </View>
          </View>
          <Text style={[styles.partnerHeading, { color: colors.foreground }]}>What's Up Dog!</Text>
          <Text style={[styles.partnerBody, { color: colors.mutedForeground }]}>
            Premium personalised dog gifts printed and fulfilled by onJJEM. Every order is a keepsake — museum-grade inks, delivered gift-wrapped in 3–5 business days.
          </Text>
          <TouchableOpacity onPress={openExternalShop} activeOpacity={0.85} style={[styles.visitBtn, { backgroundColor: colors.gold }]}>
            <Ionicons name="globe-outline" size={17} color={colors.navy} />
            <Text style={[styles.visitBtnText, { color: colors.navy }]}>VISIT ONJJEM.COM</Text>
            <Ionicons name="open-outline" size={15} color={colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Preview photo picker */}
        {gallery.length > 0 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>PREVIEW WITH YOUR DOG</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {gallery.map((entry) => {
                const active = (activeEntry?.id) === entry.id;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => { setPreviewEntry(entry); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[styles.pickerThumb, { borderColor: active ? colors.gold : colors.border, borderWidth: active ? 2.5 : 1 }]}
                  >
                    <Image source={{ uri: entry.uri }} style={styles.pickerThumbImg} resizeMode="cover" />
                    {entry.dogName ? (
                      <View style={[styles.pickerNameWrap, { backgroundColor: colors.background + "ee" }]}>
                        <Text style={[styles.pickerName, { color: colors.gold }]} numberOfLines={1}>{entry.dogName}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Featured product — now opens web shop */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Featured</Text>
          <TouchableOpacity onPress={openExternalShop} activeOpacity={0.88}
            style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
            <View style={[styles.featuredMockup, { backgroundColor: colors.navyMid }]}>
              <Image source={{ uri: `${PRODUCT_IMAGE_BASE}${PRODUCT_IMAGES[featured.id]}` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={[StyleSheet.absoluteFill, { borderWidth: 16, borderColor: "#c8b89a", borderRadius: 4 }]} pointerEvents="none" />
              <View style={[styles.bestSellerBadge, { backgroundColor: colors.gold }]}>
                <Text style={[styles.bestSellerText, { color: colors.navy }]}>BEST SELLER</Text>
              </View>
            </View>
            <View style={styles.featuredMeta}>
              <View style={styles.featuredRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featuredName, { color: colors.foreground }]}>{featured.name}</Text>
                  <Text style={[styles.featuredSub, { color: colors.gold }]}>{featured.sub}</Text>
                  <Text style={[styles.featuredTagline, { color: colors.mutedForeground }]}>{featured.tagline}</Text>
                </View>
                <Text style={[styles.featuredPrice, { color: colors.gold }]}>{featured.price}</Text>
              </View>
              <Text style={[styles.featuredDesc, { color: colors.mutedForeground }]}>{featured.desc}</Text>
              <View style={[styles.orderRowBtn, { backgroundColor: colors.gold }]}>
                <Ionicons name="globe-outline" size={17} color={colors.navy} />
                <Text style={[styles.orderRowBtnText, { color: colors.navy }]}>
                  Order on onjjem.com
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Full range grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Gifts for Your Dog</Text>
          <View style={styles.grid}>
            {rest.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={openExternalShop}
                activeOpacity={0.75}
                style={[styles.gridCard, { width: CARD_W, backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.gridMockupWrap, { backgroundColor: colors.navyMid }]}>
                  <ProductMockup
                    productImageUri={`${PRODUCT_IMAGE_BASE}${PRODUCT_IMAGES[product.id]}`}
                    productId={product.id}
                    color={product.color}
                    size={CARD_W * 0.58}
                  />
                </View>
                <View style={styles.gridMeta}>
                  <Text style={[styles.gridName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.gridSub, { color: product.color }]} numberOfLines={1}>{product.sub}</Text>
                  <Text style={[styles.gridTagline, { color: colors.mutedForeground }]} numberOfLines={2}>{product.tagline}</Text>
                </View>
                <View style={[styles.gridFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.gridPrice, { color: colors.foreground }]}>{product.price}</Text>
                  <View style={[styles.addBtn, { backgroundColor: product.color }]}>
                    <Ionicons name="open-outline" size={13} color="#0a0e1a" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* More at onjjem.com */}
        <View style={[styles.section, { marginBottom: 8 }]}>
          <TouchableOpacity
            onPress={openExternalShop}
            activeOpacity={0.85}
            style={[styles.partnerBanner, { backgroundColor: colors.navyMid, borderColor: colors.gold + "44" }]}
          >
            <Text style={[styles.partnerBody, { color: colors.mutedForeground }]}>
              More gifts available at
            </Text>
            <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colors.gold, textAlign: "center" }}>
              onjjem.com
            </Text>
            <Text style={[styles.partnerBody, { color: colors.mutedForeground, marginTop: 6 }]}>
              Crafted by <Text style={{ color: colors.gold }}>onJJem</Text> · Tote bags, cushions, leads & more
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trust strip */}
        <View style={[styles.trustStrip, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
          {[
            { icon: "shield-checkmark-outline" as const, label: "Ethically\nmade" },
            { icon: "car-outline" as const, label: "3–5 day\ndelivery" },
            { icon: "refresh-outline" as const, label: "Hassle-free\nreturns" },
            { icon: "leaf-outline" as const, label: "Print on\ndemand" },
          ].map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <Ionicons name={t.icon} size={20} color={colors.gold} />
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 3 },
  starBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginTop: 4, alignItems: "center", justifyContent: "center" },
  partnerBanner: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, marginBottom: 16 },
  partnerRow: { flexDirection: "row" },
  officialChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  officialChipText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  partnerHeading: { fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  partnerBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  visitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14 },
  visitBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  pickerSection: { marginBottom: 14, gap: 6 },
  pickerLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, paddingLeft: 20 },
  pickerRow: { paddingHorizontal: 20, gap: 10 },
  pickerThumb: { borderRadius: 14, overflow: "hidden", width: 72, height: 72 },
  pickerThumbImg: { width: "100%", height: "100%" },
  pickerNameWrap: { position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 3, paddingHorizontal: 4 },
  pickerName: { fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeading: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.2 },
  featuredCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  featuredMockup: { width: "100%", height: width - 32, position: "relative" },
  bestSellerBadge: { position: "absolute", top: 14, right: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  bestSellerText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  featuredMeta: { padding: 18, gap: 10 },
  featuredRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featuredName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  featuredSub: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  featuredTagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  featuredPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  featuredDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  orderRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  orderRowBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  gridMockupWrap: { height: 120, alignItems: "center", justifyContent: "center" },
  gridMeta: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, gap: 3 },
  gridName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gridSub: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  gridTagline: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  gridFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  gridPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  addBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  trustStrip: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 8 },
  trustItem: { alignItems: "center", gap: 5 },
  trustLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 13 },
});
