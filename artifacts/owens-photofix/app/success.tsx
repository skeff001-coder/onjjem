import React, { useEffect, useRef } from "react";
import {
  Animated,
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
import { useRouter, useLocalSearchParams } from "expo-router";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderNumber?: string;
    items?: string;
    total?: string;
  }>();

  const orderNumber = params.orderNumber ?? `OJ-${Math.floor(1000 + Math.random() * 9000)}`;
  const total = params.total ?? "0.00";
  const items: { title: string; price: number }[] = (() => {
    try { return params.items ? JSON.parse(params.items) : []; }
    catch { return []; }
  })();

  const sealScale = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(sealScale, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gold gradient header band */}
        <LinearGradient
          colors={["#1C1A14", "#2E2818", "#1C1A14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBand}
        >
          <Text style={styles.brandLetterSpacing}>ONJJEM</Text>
          <View style={styles.headerRule} />
          <Text style={styles.headerSub}>RESTORE · PRINT · CHERISH</Text>
        </LinearGradient>

        {/* Animated gold seal */}
        <Animated.View style={[styles.sealWrap, { transform: [{ scale: sealScale }] }]}>
          <LinearGradient
            colors={["#F5D78E", "#C9960C", "#A67C00", "#C9960C", "#F5D78E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sealOuter}
          >
            <View style={styles.sealInner}>
              <Ionicons name="ribbon" size={36} color={GOLD} />
            </View>
          </LinearGradient>
          {/* Sparkle burst */}
          <View style={styles.sparkleRing} />
        </Animated.View>

        {/* Headline */}
        <View style={styles.headlineBlock}>
          <Text style={styles.sparkleEmoji}>✨</Text>
          <Text style={styles.headline}>Your Masterpiece{"\n"}is in Safe Hands!</Text>
          <View style={styles.goldRule} />
          <Text style={styles.reassurance}>
            Thank you for choosing ONJJEM. Don't worry, your precious memory is being
            custom-designed by our master restorers as we speak to ensure the highest
            cinema-grade quality. We will notify you the moment your order is ready to ship.
          </Text>
        </View>

        {/* Animated order summary card */}
        <Animated.View
          style={[
            styles.summaryCard,
            { transform: [{ translateY: cardSlide }], opacity: cardOpacity },
          ]}
        >
          {/* Gold top bar */}
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.summaryBar}
          />

          <View style={styles.summaryContent}>
            {/* Order number row */}
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryHeaderLeft}>
                <Ionicons name="cube-outline" size={16} color={GOLD} />
                <Text style={styles.summaryOrderLabel}>ORDER CONFIRMED</Text>
              </View>
              <View style={styles.orderNumBadge}>
                <Text style={styles.orderNumText}>#{orderNumber}</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            {/* Items list */}
            {items.length > 0 ? (
              <View style={styles.itemsList}>
                <Text style={styles.itemsHeader}>Your Order</Text>
                {items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.itemDot} />
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.itemsList}>
                <Text style={styles.itemsHeader}>Your Order</Text>
                <View style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemTitle}>ONJJEM Masterpiece</Text>
                </View>
              </View>
            )}

            <View style={styles.summaryDivider} />

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>£{total}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Restoration journey steps */}
        <Animated.View style={[styles.stepsCard, { opacity: cardOpacity }]}>
          <Text style={styles.stepsTitle}>What happens next?</Text>

          {[
            {
              icon: "color-wand" as const,
              color: GOLD,
              bg: GOLD_BG,
              label: "Master Restoration",
              sub: "Our expert artisans are personally enhancing your photo right now.",
            },
            {
              icon: "print-outline" as const,
              color: "#1D4ED8",
              bg: "#EFF6FF",
              label: "Cinema-Grade Printing",
              sub: "Your masterpiece is sent to our London print lab for production.",
            },
            {
              icon: "airplane-outline" as const,
              color: "#15803D",
              bg: "#F0FDF4",
              label: "Shipped to Your Door",
              sub: "Delivered in premium protective packaging, straight to your address.",
            },
          ].map((step, i) => (
            <View key={step.label} style={styles.step}>
              <View style={[styles.stepIconWrap, { backgroundColor: step.bg }]}>
                <Ionicons name={step.icon} size={20} color={step.color} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
              {i < 2 && <View style={styles.stepConnector} />}
            </View>
          ))}
        </Animated.View>

        {/* Return to Shop button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => router.replace("/gift-shop")}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.returnBtnGradient}
          >
            <Ionicons name="bag-handle-outline" size={20} color="#fff" />
            <Text style={styles.returnBtnText}>Return to Shop</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ONJJEM footer seal */}
        <View style={styles.footerSeal}>
          <View style={styles.footerRule} />
          <Text style={styles.footerBrand}>ONJJEM MASTER LAB</Text>
          <Text style={styles.footerTagline}>Turning Memories into Masterpieces · London</Text>
          <View style={styles.footerBadgeRow}>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeFlag}>🇬🇧</Text>
              <Text style={styles.footerBadgeText}>Handcrafted in London</Text>
            </View>
            <View style={styles.footerBadge}>
              <Ionicons name="ribbon" size={11} color={GOLD} />
              <Text style={styles.footerBadgeText}>Certified Quality Seal</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    alignItems: "stretch",
  },

  /* Header band */
  headerBand: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  brandLetterSpacing: {
    fontSize: 32,
    fontFamily: "BebasNeue_400Regular",
    color: GOLD,
    letterSpacing: 10,
  },
  headerRule: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(201,150,12,0.4)",
    marginVertical: 2,
  },
  headerSub: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(201,150,12,0.7)",
    letterSpacing: 4,
  },

  /* Gold seal */
  sealWrap: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
  },
  sealOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  sealInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FAF7F2",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    borderStyle: "dashed",
  },

  /* Headline */
  headlineBlock: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  sparkleEmoji: {
    fontSize: 28,
  },
  headline: {
    fontSize: 30,
    fontFamily: "BebasNeue_400Regular",
    color: DARK,
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 36,
  },
  goldRule: {
    width: 56,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
    marginVertical: 4,
  },
  reassurance: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    paddingHorizontal: 8,
  },

  /* Order summary card */
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryBar: {
    height: 5,
  },
  summaryContent: {
    padding: 18,
    gap: 14,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryOrderLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.5,
  },
  orderNumBadge: {
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderNumText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#8A6200",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F0EAD8",
  },
  itemsList: {
    gap: 10,
  },
  itemsHeader: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginTop: 6,
    flexShrink: 0,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: DARK,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: MUTED,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: DARK,
    letterSpacing: 0.3,
  },

  /* Steps card */
  stepsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDE7D6",
    padding: 18,
    gap: 0,
  },
  stepsTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    position: "relative",
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    paddingBottom: 20,
    gap: 2,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  stepSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    lineHeight: 18,
  },
  stepConnector: {
    position: "absolute",
    left: 19,
    top: 42,
    width: 2,
    height: 20,
    borderRadius: 1,
    backgroundColor: GOLD_BORDER,
  },

  /* Return button */
  returnBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  returnBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  returnBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },

  /* Footer */
  footerSeal: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 6,
  },
  footerRule: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(201,150,12,0.3)",
    marginBottom: 8,
  },
  footerBrand: {
    fontSize: 13,
    fontFamily: "BebasNeue_400Regular",
    color: GOLD,
    letterSpacing: 4,
  },
  footerTagline: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  footerBadgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  footerBadgeFlag: { fontSize: 11 },
  footerBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#7A6000",
  },
});
