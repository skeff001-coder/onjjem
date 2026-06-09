import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SHOP_PRODUCTS, formatPrice, type ShopVariant } from "@/lib/shopProducts";

const GOLD = "#C9960C";
const BG = "#0F0D09";
const CARD_BG = "#1C1A14";
const CREAM = "#FAF7F2";
const MUTED = "#7A6E57";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = SHOP_PRODUCTS.find((p) => p.id === productId);

  const [selectedVariant, setSelectedVariant] = useState<ShopVariant | null>(
    product?.variants[0] ?? null,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onjjem:shop_photo")
      .then((b64) => {
        if (b64) {
          setPhotoBase64(b64);
          setPhotoUri(`data:image/jpeg;base64,${b64}`);
        }
      })
      .catch(() => {});
  }, []);

  if (!product) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center", backgroundColor: BG }]}>
        <Text style={{ color: CREAM }}>Product not found</Text>
      </View>
    );
  }

  const handleOrder = async () => {
    if (!selectedVariant) return;

    if (!photoBase64) {
      Alert.alert(
        "No Photo Yet",
        "Please restore a photo first — then come back to the shop to order your print.",
        [
          { text: "Go Restore a Photo", onPress: () => router.push("/") },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "photo-fix-ai.replit.app";
      const resp = await fetch(`https://${domain}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedVariant.sku,
          amountPence: selectedVariant.pricePence,
          name: `${product.name} ${selectedVariant.label}`,
          photoBase64,
          successUrl: "https://onjjem.co.uk/?order=success",
          cancelUrl: "https://onjjem.co.uk/shop",
        }),
      });

      const data = (await resp.json()) as { url?: string; error?: string };

      if (!resp.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }

      setLoading(false);
      await WebBrowser.openBrowserAsync(data.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: "#1C1A14",
        controlsColor: GOLD,
      });

      Alert.alert(
        "Order Placed 🎉",
        "Your print is on its way! Check your email for a confirmation and tracking details.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Checkout Error", msg);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImg} resizeMode="cover" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewEmoji}>{product.emoji}</Text>
              <Text style={styles.previewPlaceholderText}>
                Restore a photo to see your print preview
              </Text>
            </View>
          )}
          {photoUri && (
            <LinearGradient
              colors={["transparent", "rgba(15,13,9,0.7)"]}
              style={styles.previewOverlay}
            >
              <View style={styles.previewBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.previewBadgeText}>Your Restored Photo</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.productHeader}>
            <Text style={styles.productEmoji}>{product.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>
          </View>
          <Text style={styles.productDesc}>{product.description}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.variantBlock}>
          <Text style={styles.variantLabel}>Choose Size</Text>
          <View style={styles.variantGrid}>
            {product.variants.map((v) => {
              const selected = selectedVariant?.sku === v.sku;
              return (
                <TouchableOpacity
                  key={v.sku}
                  style={[styles.variantPill, selected && styles.variantPillSelected]}
                  onPress={() => setSelectedVariant(v)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.variantPillLabel, selected && styles.variantPillLabelSelected]}>
                    {v.label}
                  </Text>
                  <Text style={[styles.variantPillPrice, selected && styles.variantPillPriceSelected]}>
                    {formatPrice(v.pricePence)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.trustRow}>
          {[
            { icon: "airplane-outline", text: "UK & worldwide shipping" },
            { icon: "time-outline", text: "3–5 working days" },
            { icon: "shield-checkmark-outline", text: "Secure Stripe checkout" },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.trustBadge}>
              <Ionicons name={icon as any} size={13} color={GOLD} />
              <Text style={styles.trustBadgeText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.checkoutPriceWrap}>
          <Text style={styles.checkoutPriceLabel}>{selectedVariant?.label ?? ""}</Text>
          <Text style={styles.checkoutPrice}>
            {selectedVariant ? formatPrice(selectedVariant.pricePence) : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && styles.checkoutBtnLoading]}
          onPress={handleOrder}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#3A3020", "#2A2418"] : ["#A67A00", "#C9960C", "#E4B832"]}
            style={styles.checkoutBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={GOLD} />
                <Text style={styles.checkoutBtnText}>Loading…</Text>
              </>
            ) : (
              <>
                <Ionicons name="bag-check-outline" size={20} color="#0F0D09" />
                <Text style={styles.checkoutBtnText}>Order Print</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,150,12,0.15)",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: CREAM,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  previewCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.15)",
    marginBottom: 20,
    height: 220,
  },
  previewImg: { width: "100%", height: "100%" },
  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  previewEmoji: { fontSize: 52 },
  previewPlaceholderText: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: "flex-end",
    padding: 10,
  },
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewBadgeText: { fontSize: 12, color: CREAM, fontFamily: "Inter_500Medium" },

  infoBlock: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.12)",
    marginBottom: 16,
  },
  productHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  productEmoji: { fontSize: 32 },
  productName: { fontSize: 20, fontWeight: "700", color: CREAM, fontFamily: "Inter_700Bold", marginBottom: 2 },
  productCategory: { fontSize: 11, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Inter_500Medium" },
  productDesc: { fontSize: 14, color: "rgba(250,247,242,0.7)", lineHeight: 21, fontFamily: "Inter_400Regular" },

  divider: { height: 1, backgroundColor: "rgba(201,150,12,0.1)", marginVertical: 4, marginBottom: 20 },

  variantBlock: { marginBottom: 20 },
  variantLabel: { fontSize: 13, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  variantGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  variantPill: {
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#1C1A14",
    alignItems: "center",
    minWidth: 80,
  },
  variantPillSelected: { borderColor: GOLD, backgroundColor: "rgba(201,150,12,0.12)" },
  variantPillLabel: { fontSize: 13, color: MUTED, fontFamily: "Inter_500Medium", marginBottom: 2 },
  variantPillLabelSelected: { color: CREAM },
  variantPillPrice: { fontSize: 12, color: "rgba(122,110,87,0.7)", fontFamily: "Inter_400Regular" },
  variantPillPriceSelected: { color: GOLD, fontFamily: "Inter_600SemiBold" },

  trustRow: { gap: 6, marginBottom: 8 },
  trustBadge: { flexDirection: "row", alignItems: "center", gap: 7 },
  trustBadgeText: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },

  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C1A14",
    borderTopWidth: 1,
    borderTopColor: "rgba(201,150,12,0.15)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  checkoutPriceWrap: { flex: 1 },
  checkoutPriceLabel: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  checkoutPrice: { fontSize: 22, fontWeight: "700", color: GOLD, fontFamily: "Inter_700Bold" },
  checkoutBtn: { borderRadius: 14, overflow: "hidden", flex: 1.4 },
  checkoutBtnLoading: { opacity: 0.7 },
  checkoutBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  checkoutBtnText: { fontSize: 16, fontWeight: "700", color: "#0F0D09", fontFamily: "Inter_700Bold" },
});
