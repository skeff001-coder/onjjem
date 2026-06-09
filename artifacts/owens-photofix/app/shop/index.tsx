import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SHOP_PRODUCTS, formatPrice, minPrice } from "@/lib/shopProducts";

const GOLD = "#C9960C";
const BG = "#0F0D09";
const CARD_BG = "#1C1A14";
const CARD_BORDER = "rgba(201,150,12,0.15)";
const CREAM = "#FAF7F2";
const MUTED = "#7A6E57";
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const CATEGORY_ORDER = ["Wall Art", "Kitchen", "Gifts", "Magnets", "Special", "Pets"];

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("onjjem:shop_photo").then((b64) => {
      if (b64) {
        setHasPhoto(true);
        setPhotoUri(`data:image/jpeg;base64,${b64}`);
      }
    }).catch(() => {});
  }, []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    products: SHOP_PRODUCTS.filter((p) => p.category === cat),
  })).filter((g) => g.products.length > 0);

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      {/* Header */}
      <LinearGradient
        colors={["#1C1A14", "#0F0D09"]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ONJJEM Print Shop</Text>
          <Text style={styles.headerSub}>Turn your memories into keepsakes</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo preview banner */}
        {hasPhoto && photoUri ? (
          <View style={styles.photoBanner}>
            <Image source={{ uri: photoUri }} style={styles.photoBannerImg} />
            <View style={styles.photoBannerText}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.photoBannerLabel}>Restored photo ready to print</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noPhotoBanner}>
            <Ionicons name="images-outline" size={20} color={GOLD} />
            <Text style={styles.noPhotoText}>
              Restore a photo first to see your print preview
            </Text>
          </View>
        )}

        {/* Shipping badge */}
        <View style={styles.shippingRow}>
          <View style={styles.shippingBadge}>
            <Ionicons name="airplane-outline" size={14} color={GOLD} />
            <Text style={styles.shippingBadgeText}>Free UK delivery · Ships worldwide</Text>
          </View>
          <View style={styles.shippingBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={GOLD} />
            <Text style={styles.shippingBadgeText}>Secure Stripe checkout</Text>
          </View>
        </View>

        {/* Product categories */}
        {grouped.map(({ category, products }) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <View style={styles.grid}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.card}
                  activeOpacity={0.82}
                  onPress={() => router.push(`/shop/${product.id}`)}
                >
                  <LinearGradient
                    colors={["#241F14", "#1A1710"]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardEmojiWrap}>
                      <Text style={styles.cardEmoji}>{product.emoji}</Text>
                    </View>
                    <Text style={styles.cardName}>{product.name}</Text>
                    <Text style={styles.cardTagline} numberOfLines={1}>
                      {product.tagline}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardPrice}>
                        from {formatPrice(minPrice(product))}
                      </Text>
                      <Ionicons name="chevron-forward" size={12} color={GOLD} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Bonus banner */}
        <LinearGradient
          colors={["#241F0A", "#1C1A08"]}
          style={styles.bonusBanner}
        >
          <View style={styles.bonusRow}>
            <Text style={styles.bonusEmoji}>🃏</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bonusTitle}>Free Playing Cards on orders over £50</Text>
              <Text style={styles.bonusSub}>
                A full custom deck sent automatically — no code needed
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: CREAM,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  photoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1A14",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  photoBannerImg: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#2A2520",
  },
  photoBannerText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  photoBannerLabel: {
    fontSize: 13,
    color: CREAM,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  noPhotoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(201,150,12,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  noPhotoText: {
    fontSize: 13,
    color: MUTED,
    flex: 1,
    fontFamily: "Inter_400Regular",
  },

  shippingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  shippingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,150,12,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  shippingBadgeText: {
    fontSize: 11,
    color: GOLD,
    fontFamily: "Inter_500Medium",
  },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  cardGradient: {
    padding: 14,
    minHeight: 140,
  },
  cardEmojiWrap: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(201,150,12,0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 24 },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: CREAM,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  cardTagline: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto" as any,
  },
  cardPrice: {
    fontSize: 13,
    color: GOLD,
    fontFamily: "Inter_600SemiBold",
  },

  bonusBanner: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    marginTop: 4,
  },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bonusEmoji: { fontSize: 32 },
  bonusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GOLD,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  bonusSub: {
    fontSize: 12,
    color: MUTED,
    fontFamily: "Inter_400Regular",
  },
});
