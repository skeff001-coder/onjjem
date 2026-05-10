import React from "react";
import {
  Alert,
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
import { useColors } from "@/hooks/useColors";

const BLUE = "#0066FF";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Product = {
  id: string;
  title: string;
  size?: string;
  desc: string;
  price: string;
  icon: IconName;
  iconBg: string;
  wide?: boolean;
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
        icon: "image-outline",
        iconBg: "#E8F0FE",
      },
      {
        id: "poster",
        title: "A4 Photo Poster",
        size: "A4",
        desc: "High quality gallery paper",
        price: "£12.99",
        icon: "newspaper-outline",
        iconBg: "#E3F2FD",
      },
      {
        id: "canvas_classic",
        title: "Classic Canvas",
        size: "30×20 cm",
        desc: "Hand stretched on wood",
        price: "£29.99",
        icon: "albums-outline",
        iconBg: "#EDE7F6",
      },
      {
        id: "canvas_large",
        title: "Large Canvas",
        size: "60×40 cm",
        desc: "Statement wall art",
        price: "£49.99",
        icon: "easel-outline",
        iconBg: "#E8EAF6",
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
        icon: "magnet-outline",
        iconBg: "#FFF3E0",
      },
      {
        id: "keyring",
        title: "Photo Keyring",
        desc: "Take your memories everywhere",
        price: "£12.99",
        icon: "key-outline",
        iconBg: "#FFF8E1",
      },
    ],
  },
  {
    id: "bedding",
    title: "Luxury Bedding",
    subtitle: "Wrap yourself in your most precious moments",
    fulfillment: "Master Textiles",
    headerGradient: ["#BF5AF2", "#7B2FBE"],
    products: [
      {
        id: "quilt_single",
        title: "Single Photo Quilt",
        size: "Single",
        desc: "Hand stitched and cosy",
        price: "£135",
        icon: "bed-outline",
        iconBg: "#F3E5F5",
        wide: true,
      },
      {
        id: "quilt_double",
        title: "Double Photo Quilt",
        size: "Double",
        desc: "Premium quality comfort",
        price: "£165",
        icon: "bed-outline",
        iconBg: "#EDE7F6",
        wide: true,
      },
      {
        id: "quilt_king",
        title: "King-Size Quilt",
        size: "King",
        desc: "Our largest, most detailed gift",
        price: "£195",
        icon: "bed-outline",
        iconBg: "#E8EAF6",
        wide: true,
      },
    ],
  },
];

export default function GiftShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const s = makeStyles(colors, insets);

  const handleDesign = (title: string) => {
    Alert.alert("Coming Soon", `${title} ordering is launching very soon!`);
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
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Gift Shop</Text>
          <Text style={s.headerSub}>Print · Gift · Remember</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="gift" size={26} color="#FF6B6B" />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={["#FFF9EC", "#EEF4FF"]} style={s.heroBanner}>
          <Text style={s.heroEmoji}>🎁</Text>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Turn Photos Into{"\n"}Treasured Gifts</Text>
            <Text style={s.heroSub}>Prices include UK shipping & professional packaging</Text>
          </View>
        </LinearGradient>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.id} style={s.section}>
            {/* Section header */}
            <LinearGradient
              colors={[...section.headerGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.sectionHeader}
            >
              <View>
                <Text style={s.sectionTitle}>{section.title}</Text>
                <Text style={s.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={s.fulfillmentBadge}>
                <Ionicons name="business-outline" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={s.fulfillmentText}>{section.fulfillment}</Text>
              </View>
            </LinearGradient>

            {/* Product grid */}
            <View style={s.productGrid}>
              {section.products.map((product) => (
                <View
                  key={product.id}
                  style={[
                    s.productCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    product.wide && s.productCardWide,
                  ]}
                >
                  {/* Icon area */}
                  <View style={[s.productIconWrap, { backgroundColor: product.iconBg }]}>
                    <Ionicons name={product.icon} size={28} color={BLUE} />
                    {product.size && (
                      <View style={s.sizePill}>
                        <Text style={s.sizePillText}>{product.size}</Text>
                      </View>
                    )}
                  </View>

                  {/* Text */}
                  <View style={s.productBody}>
                    <Text style={[s.productTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={[s.productDesc, { color: colors.mutedForeground }]}>
                      {product.desc}
                    </Text>

                    <View style={s.productFooter}>
                      <Text style={[s.productPrice, { color: BLUE }]}>{product.price}</Text>
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

        {/* Trust strip */}
        <View style={[s.trustRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "shield-checkmark-outline" as IconName, label: "Quality\nGuaranteed" },
            { icon: "airplane-outline" as IconName,          label: "UK Shipping\nIncluded" },
            { icon: "gift-outline" as IconName,              label: "Professional\nPackaging" },
          ].map((t) => (
            <View key={t.label} style={s.trustItem}>
              <Ionicons name={t.icon} size={22} color={BLUE} />
              <Text style={[s.trustLabel, { color: colors.foreground }]}>{t.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    rainbowBar: {
      height: 4,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    headerSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      letterSpacing: 1.5,
      marginTop: 1,
    },
    headerRight: { width: 40, alignItems: "center" },

    scroll: { padding: 16, gap: 20 },

    heroBanner: {
      borderRadius: 18,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: "#E0EAFF",
    },
    heroEmoji: { fontSize: 48 },
    heroText: { flex: 1, gap: 4 },
    heroTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      lineHeight: 26,
    },
    heroSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },

    /* Section */
    section: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
      elevation: 3,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "flex-end",
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
      backgroundColor: "rgba(0,0,0,0.2)",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
    },
    fulfillmentText: {
      fontSize: 10,
      color: "rgba(255,255,255,0.9)",
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.3,
    },

    /* Product grid — 2 col by default, wide cards take full row */
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 10,
      gap: 8,
      backgroundColor: colors.background,
    },
    productCard: {
      width: "48%",
      flexGrow: 1,
      borderRadius: 14,
      borderWidth: 1,
      overflow: "hidden",
    },
    productCardWide: {
      width: "100%",
      flexDirection: "row",
    },
    productIconWrap: {
      height: 80,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    sizePill: {
      position: "absolute",
      bottom: 6,
      right: 8,
      backgroundColor: "rgba(0,102,255,0.12)",
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    sizePillText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: BLUE,
      fontFamily: "Inter_700Bold",
    },
    productBody: {
      padding: 12,
      gap: 4,
      flex: 1,
    },
    productTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      lineHeight: 17,
    },
    productDesc: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 15,
    },
    productFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
      flexWrap: "wrap",
      gap: 4,
    },
    productPrice: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
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

    /* Trust strip */
    trustRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderRadius: 16,
      paddingVertical: 16,
      borderWidth: 1,
    },
    trustItem: { alignItems: "center", gap: 6 },
    trustLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
      lineHeight: 16,
    },
  });
}
