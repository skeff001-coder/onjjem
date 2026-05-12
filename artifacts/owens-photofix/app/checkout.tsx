import React, { useState } from "react";
import {
  Alert,
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
import { useRouter, useLocalSearchParams } from "expo-router";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderNumber?: string;
    items?: string;
    total?: string;
  }>();

  const [confirming, setConfirming] = useState(false);

  const orderNumber = params.orderNumber ?? `OJ-${Math.floor(1000 + Math.random() * 9000)}`;
  const total = params.total ?? "0.00";
  const items: { title: string; price: number }[] = (() => {
    try { return params.items ? JSON.parse(params.items) : []; }
    catch { return []; }
  })();

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      router.replace({
        pathname: "/success",
        params: { orderNumber, items: JSON.stringify(items), total },
      });
    }, 800);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Gold top bar */}
      <LinearGradient
        colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.goldBar}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => router.replace("/")} activeOpacity={0.7} hitSlop={8}>
            <Text style={styles.headerEyebrow}>ONJJEM</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Secure order notice */}
        <View style={styles.secureBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#1A7A4A" />
          <View style={styles.secureBannerText}>
            <Text style={styles.secureBannerTitle}>Secure Order · SSL Encrypted</Text>
            <Text style={styles.secureBannerSub}>
              Your order will be confirmed and our team will contact you within 2 hours to arrange payment and delivery.
            </Text>
          </View>
        </View>

        {/* Order summary card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.summaryBar}
          />
          <View style={styles.summaryHeader}>
            <Ionicons name="bag-outline" size={18} color={GOLD} />
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.orderNumBadge}>
              <Text style={styles.orderNumText}>#{orderNumber}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {items.length > 0 ? items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
            </View>
          )) : (
            <View style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemTitle}>ONJJEM Masterpiece</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>£{total}</Text>
          </View>
        </View>

        {/* Delivery info */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryRow}>
            <Ionicons name="location-outline" size={20} color={GOLD} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>Delivery Address</Text>
              <Text style={styles.deliveryValue}>Confirmed with our team · UK delivery</Text>
            </View>
          </View>
          <View style={styles.deliveryDivider} />
          <View style={styles.deliveryRow}>
            <Ionicons name="time-outline" size={20} color={GOLD} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>Estimated Delivery</Text>
              <Text style={styles.deliveryValue}>5–7 working days · Free UK delivery</Text>
            </View>
          </View>
          <View style={styles.deliveryDivider} />
          <View style={styles.deliveryRow}>
            <Ionicons name="card-outline" size={20} color={GOLD} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>Payment</Text>
              <Text style={styles.deliveryValue}>Visa · Mastercard · PayPal · Bank Transfer</Text>
            </View>
          </View>
        </View>

        {/* Restoration note */}
        <View style={styles.restorationNote}>
          <Ionicons name="color-wand-outline" size={16} color={GOLD} />
          <Text style={styles.restorationText}>
            Every order includes a complimentary expert restoration review before printing. We'll send you a preview for approval.
          </Text>
        </View>

        {/* Place Order button */}
        <TouchableOpacity
          style={[styles.confirmBtn, confirming && styles.confirmBtnLoading]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={confirming}
        >
          <LinearGradient
            colors={confirming ? ["#A67C00", "#A67C00"] : [GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Ionicons
              name={confirming ? "hourglass-outline" : "checkmark-circle-outline"}
              size={22}
              color="#fff"
            />
            <View>
              <Text style={styles.confirmBtnText}>
                {confirming ? "Placing Order…" : "Place Order"}
              </Text>
              <Text style={styles.confirmBtnSub}>We'll be in touch within 2 hours</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={16} color={MUTED} />
          <Text style={styles.backLinkText}>Edit my order</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CREAM,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerEyebrow: { fontSize: 9, color: GOLD, letterSpacing: 4, fontFamily: "Inter_600SemiBold" },
  headerTitle: { fontSize: 17, fontFamily: "Cinzel_700Bold", color: DARK, letterSpacing: 0.5 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },

  secureBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F0FFF4",
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  secureBannerText: { flex: 1 },
  secureBannerTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold", color: "#1A7A4A", marginBottom: 4,
  },
  secureBannerSub: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: "#2D6A4F", lineHeight: 17,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    overflow: "hidden",
  },
  summaryBar: { height: 3 },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  summaryTitle: { flex: 1, fontSize: 15, fontFamily: "Cinzel_700Bold", color: DARK },
  orderNumBadge: {
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderNumText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: GOLD },
  divider: { height: 1, backgroundColor: GOLD_BORDER, marginHorizontal: 16 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  itemTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: DARK },
  itemPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: DARK },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: MUTED },
  totalAmount: { fontSize: 22, fontFamily: "Cinzel_700Bold", color: DARK },

  deliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  deliveryText: { flex: 1 },
  deliveryTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: MUTED },
  deliveryValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: DARK, marginTop: 2 },
  deliveryDivider: { height: 1, backgroundColor: "#F0EAD8" },

  restorationNote: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: GOLD_BG,
    borderRadius: 10,
    padding: 12,
    alignItems: "flex-start",
  },
  restorationText: {
    flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#7A5800", lineHeight: 17,
  },

  confirmBtn: { borderRadius: 16, overflow: "hidden" },
  confirmBtnLoading: { opacity: 0.7 },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  confirmBtnText: { fontSize: 17, fontFamily: "Cinzel_700Bold", color: "#fff" },
  confirmBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", textAlign: "center" },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  backLinkText: { fontSize: 13, fontFamily: "Inter_400Regular", color: MUTED },
});
