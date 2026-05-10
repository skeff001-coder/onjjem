import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const BLUE = "#0066FF";
const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Product = {
  id: string;
  title: string;
  size?: string;
  desc: string;
  price: string;
  emoji: string;
  iconBg: string;
  wide?: boolean;
  bestSeller?: boolean;
};

type Section = {
  id: string;
  title: string;
  subtitle: string;
  fulfillment: string;
  headerGradient: readonly [string, string];
  products: Product[];
};

const SECTIONS: Section[] = [
  {
    id: "prints",
    title: "Prints & Wall Art",
    subtitle: "Professional lab quality, delivered to your door",
    fulfillment: "Master Print Lab",
    headerGradient: ["#4F8EF7", "#2255CC"],
    products: [
      {
        id: "photo_print",
        title: "Standard Photo Print",
        size: "7×5 inch",
        desc: "Professional gloss finish",
        price: "£4.99",
        emoji: "🖼️",
        iconBg: "#EEF4FF",
      },
      {
        id: "poster",
        title: "A4 Photo Poster",
        size: "A4",
        desc: "High quality gallery paper",
        price: "£12.99",
        emoji: "📜",
        iconBg: "#E8F4FF",
      },
      {
        id: "canvas_classic",
        title: "Classic Canvas",
        size: "30×20 cm",
        desc: "Hand stretched on wood",
        price: "£29.99",
        emoji: "🎨",
        iconBg: "#F0EBFF",
      },
      {
        id: "canvas_large",
        title: "Large Canvas",
        size: "60×40 cm",
        desc: "Statement wall art",
        price: "£49.99",
        emoji: "🖼️",
        iconBg: "#EAF0FF",
      },
    ],
  },
  {
    id: "keepsakes",
    title: "Keepsakes",
    subtitle: "Carry your memories wherever life takes you",
    fulfillment: "Master Print Lab",
    headerGradient: ["#FF9F0A", "#E07000"],
    products: [
      {
        id: "magnet",
        title: "Fridge Magnet",
        desc: "Acrylic memory for your kitchen",
        price: "£9.99",
        emoji: "🧲",
        iconBg: "#FFF4E0",
      },
      {
        id: "keyring",
        title: "Photo Keyring",
        desc: "Take your memories everywhere",
        price: "£12.99",
        emoji: "🔑",
        iconBg: "#FFF9E6",
      },
    ],
  },
  {
    id: "cushions",
    title: "Cushions & Pillowcases",
    subtitle: "Personalized comfort for every home",
    fulfillment: "Master Textiles",
    headerGradient: ["#F06292", "#C2185B"],
    products: [
      {
        id: "pillowcase",
        title: "Premium Photo Pillowcase",
        desc: "Soft touch fabric, perfect for memories",
        price: "£24.99",
        emoji: "😴",
        iconBg: "#FDE8F1",
        wide: true,
      },
      {
        id: "cushion_square",
        title: "Square Photo Cushion",
        size: "40 cm",
        desc: "Plump and vibrant",
        price: "£29.99",
        emoji: "🟪",
        iconBg: "#F8E8FF",
        wide: true,
      },
      {
        id: "cushion_large",
        title: "Large Luxury Cushion",
        size: "60 cm",
        desc: "Our most comfortable gift",
        price: "£39.99",
        emoji: "🛋️",
        iconBg: "#FFE8F5",
        wide: true,
        bestSeller: true,
      },
    ],
  },
  {
    id: "bedding",
    title: "Luxury Bedding",
    subtitle: "Wrap yourself in your most precious moments",
    fulfillment: "Master Textiles",
    headerGradient: ["#7B2FBE", "#4A1080"],
    products: [
      {
        id: "quilt_single",
        title: "Single Photo Quilt",
        size: "Single",
        desc: "Hand stitched and cosy",
        price: "£135",
        emoji: "🛏️",
        iconBg: "#F3E8FF",
        wide: true,
      },
      {
        id: "quilt_double",
        title: "Double Photo Quilt",
        size: "Double",
        desc: "Premium quality comfort",
        price: "£165",
        emoji: "🛏️",
        iconBg: "#EDE0FF",
        wide: true,
      },
      {
        id: "quilt_king",
        title: "King-Size Quilt",
        size: "King",
        desc: "Our largest, most detailed gift",
        price: "£195",
        emoji: "🛏️",
        iconBg: "#E8DAFF",
        wide: true,
        bestSeller: true,
      },
    ],
  },
];

export default function GiftShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [giftWrap, setGiftWrap] = useState(false);
  const s = makeStyles(insets);

  const handleDesign = (title: string) => {
    const extra = giftWrap ? " + Deluxe Gift Wrapping (£4.99)" : "";
    Alert.alert("Coming Soon", `${title}${extra} ordering is launching very soon!`);
  };

  return (
    <View style={s.root}>
      {/* Rainbow bar */}
      <LinearGradient
        colors={["#FF6B6B", "#FF9F0A", "#FFD60A", "#34C759", "#4F8EF7", "#BF5AF2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.rainbowBar}
      />

      {/* Header */}
      <View style={[s.header, { backgroundColor: CREAM, borderBottomColor: "#E8E0D4" }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: "#fff", borderColor: "#E8E0D4" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Gift Shop</Text>
          <Text style={s.headerSub}>Print · Gift · Remember</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="gift" size={26} color="#FF6B6B" />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} style={{ backgroundColor: CREAM }}>
        {/* Hero */}
        <LinearGradient colors={["#FFF9EC", "#F0EAFF"]} style={s.heroBanner}>
          <Text style={s.heroEmoji}>🎁</Text>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Turn Photos Into{"\n"}Treasured Gifts</Text>
            <Text style={s.heroSub}>Prices include UK shipping & professional packaging</Text>
          </View>
        </LinearGradient>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.id} style={s.section}>
            <LinearGradient
              colors={[...section.headerGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.sectionHeader}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>{section.title}</Text>
                <Text style={s.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={s.fulfillmentBadge}>
                <Ionicons name="business-outline" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={s.fulfillmentText}>{section.fulfillment}</Text>
              </View>
            </LinearGradient>

            <View style={s.productGrid}>
              {section.products.map((product) => (
                <View
                  key={product.id}
                  style={[
                    s.productCard,
                    product.wide && s.productCardWide,
                  ]}
                >
                  {/* Best seller badge */}
                  {product.bestSeller && (
                    <View style={s.bestSellerBadge}>
                      <Text style={s.bestSellerStar}>★</Text>
                      <Text style={s.bestSellerText}>Best Seller</Text>
                    </View>
                  )}

                  {/* Icon area */}
                  <View style={[
                    s.productIconWrap,
                    { backgroundColor: product.iconBg },
                    product.wide && s.productIconWrapWide,
                  ]}>
                    <Text style={[s.productEmoji, product.wide && s.productEmojiWide]}>
                      {product.emoji}
                    </Text>
                    {product.size && (
                      <View style={s.sizePill}>
                        <Text style={s.sizePillText}>{product.size}</Text>
                      </View>
                    )}
                  </View>

                  {/* Text */}
                  <View style={s.productBody}>
                    <Text style={s.productTitle} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={s.productDesc}>{product.desc}</Text>

                    <View style={s.productFooter}>
                      <Text style={s.productPrice}>{product.price}</Text>
                      <TouchableOpacity
                        style={s.designBtn}
                        activeOpacity={0.82}
                        onPress={() => handleDesign(product.title)}
                      >
                        <Text style={s.designBtnText}>Design Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Gift Wrapping Toggle ── */}
        <View style={s.giftWrapCard}>
          <LinearGradient
            colors={["#7B2FBE", "#C2185B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.giftWrapHeader}
          >
            <Text style={s.giftWrapHeaderText}>✨  Luxury Touch</Text>
          </LinearGradient>

          <View style={s.giftWrapBody}>
            <View style={s.giftWrapRow}>
              <View style={s.giftWrapIconWrap}>
                <Text style={s.giftWrapEmoji}>🎀</Text>
              </View>
              <View style={s.giftWrapInfo}>
                <Text style={s.giftWrapTitle}>Deluxe Gift Wrapping</Text>
                <Text style={s.giftWrapPrice}>+ £4.99</Text>
              </View>
              <Switch
                value={giftWrap}
                onValueChange={setGiftWrap}
                trackColor={{ false: "#D1C9BE", true: BLUE }}
                thumbColor="#fff"
                ios_backgroundColor="#D1C9BE"
              />
            </View>

            {giftWrap && (
              <View style={s.giftWrapDesc}>
                <Ionicons name="sparkles-outline" size={15} color={GOLD} />
                <Text style={s.giftWrapDescText}>
                  Your item will be beautifully hand wrapped in premium paper with a personalized ribbon and a handwritten gift note.
                </Text>
              </View>
            )}

            {!giftWrap && (
              <Text style={s.giftWrapHint}>
                Toggle on to add a beautiful hand-wrapped finish to your order.
              </Text>
            )}
          </View>
        </View>

        {/* Trust strip */}
        <View style={s.trustRow}>
          {[
            { icon: "shield-checkmark-outline" as IconName, label: "Quality\nGuaranteed" },
            { icon: "airplane-outline" as IconName,          label: "UK Shipping\nIncluded" },
            { icon: "gift-outline" as IconName,              label: "Pro\nPackaging" },
          ].map((t) => (
            <View key={t.label} style={s.trustItem}>
              <Ionicons name={t.icon} size={22} color={BLUE} />
              <Text style={s.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: CREAM,
      paddingTop: insets.top,
    },
    rainbowBar: { height: 4, width: "100%" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#1C1C1E",
      fontFamily: "Inter_700Bold",
    },
    headerSub: {
      fontSize: 11,
      color: "#8E8E93",
      fontFamily: "Inter_400Regular",
      letterSpacing: 1.5,
      marginTop: 1,
    },
    headerRight: { width: 40, alignItems: "center" },

    scroll: { padding: 16, gap: 18 },

    heroBanner: {
      borderRadius: 18,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: "#E8DAFF",
    },
    heroEmoji: { fontSize: 48 },
    heroText: { flex: 1, gap: 4 },
    heroTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#1C1C1E",
      fontFamily: "Inter_700Bold",
      lineHeight: 26,
    },
    heroSub: {
      fontSize: 12,
      color: "#6C6C70",
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },

    section: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#E2D9CF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    sectionSubtitle: {
      fontSize: 12,
      color: "rgba(255,255,255,0.82)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    fulfillmentBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.22)",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      flexShrink: 0,
    },
    fulfillmentText: {
      fontSize: 10,
      color: "rgba(255,255,255,0.9)",
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.3,
    },

    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 10,
      gap: 8,
      backgroundColor: "#F5F0EA",
    },

    productCard: {
      width: "48%",
      flexGrow: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E2D9CF",
      overflow: "hidden",
      backgroundColor: "#fff",
      position: "relative",
    },
    productCardWide: {
      width: "100%",
      flexDirection: "row",
    },

    /* Best seller gold badge */
    bestSellerBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: GOLD_BG,
      borderWidth: 1,
      borderColor: GOLD,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    bestSellerStar: {
      fontSize: 10,
      color: GOLD,
    },
    bestSellerText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: GOLD,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.2,
    },

    productIconWrap: {
      height: 82,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    productIconWrapWide: {
      width: 90,
      height: "auto" as unknown as number,
      flexShrink: 0,
    },
    productEmoji: {
      fontSize: 36,
    },
    productEmojiWide: {
      fontSize: 32,
    },
    sizePill: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: "rgba(0,102,255,0.1)",
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    sizePillText: {
      fontSize: 9,
      fontWeight: "700" as const,
      color: BLUE,
      fontFamily: "Inter_700Bold",
    },
    productBody: {
      padding: 12,
      gap: 3,
      flex: 1,
    },
    productTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      lineHeight: 17,
      color: "#1C1C1E",
    },
    productDesc: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 15,
      color: "#6C6C70",
    },
    productFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      flexWrap: "wrap",
      gap: 4,
    },
    productPrice: {
      fontSize: 17,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: BLUE,
    },
    designBtn: {
      backgroundColor: BLUE,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    designBtnText: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },

    /* Gift wrapping */
    giftWrapCard: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#E2D9CF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
      backgroundColor: "#fff",
    },
    giftWrapHeader: {
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    giftWrapHeaderText: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    giftWrapBody: {
      padding: 16,
      gap: 12,
    },
    giftWrapRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    giftWrapIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: "#FDE8F1",
      alignItems: "center",
      justifyContent: "center",
    },
    giftWrapEmoji: {
      fontSize: 26,
    },
    giftWrapInfo: {
      flex: 1,
    },
    giftWrapTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: "#1C1C1E",
      fontFamily: "Inter_700Bold",
    },
    giftWrapPrice: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: BLUE,
      fontFamily: "Inter_600SemiBold",
      marginTop: 1,
    },
    giftWrapDesc: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
      backgroundColor: GOLD_BG,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#F0D98A",
    },
    giftWrapDescText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "#5C4A00",
      lineHeight: 19,
      flex: 1,
      fontStyle: "italic",
    },
    giftWrapHint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "#8E8E93",
      lineHeight: 17,
      textAlign: "center",
    },

    /* Trust strip */
    trustRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderRadius: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: "#E2D9CF",
      backgroundColor: "#fff",
    },
    trustItem: { alignItems: "center", gap: 6 },
    trustLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
      lineHeight: 16,
      color: "#1C1C1E",
    },
  });
}
