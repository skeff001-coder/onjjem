import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PRICING } from "@/lib/pricing";
import { trackPaywallDismissal, trackPaywallImpression, trackPaywallPurchase, useSubscription } from "@/lib/revenuecat";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Plan = "perpic" | "monthly";

export function SubscribeModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>("monthly");
  const [purchased, setPurchased] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState<Plan>("monthly");
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.85)).current;
  const {
    monthlyPackage,
    perPhotoPackage,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
    isSubscribed,
  } = useSubscription();

  // Track whether a purchase completed in this modal session so we can skip
  // the dismissal event when onClose is called after a successful purchase.
  const purchasedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      purchasedRef.current = false;
      setPurchased(false);
      successOpacity.setValue(0);
      successScale.setValue(0.85);
      void trackPaywallImpression("subscribe_modal");
    }
  }, [visible]);

  useEffect(() => {
    if (purchased) {
      Animated.parallel([
        Animated.timing(successOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      ]).start();
      const timer = setTimeout(() => { onClose(); }, 2200);
      return () => clearTimeout(timer);
    }
  }, [purchased]);

  const handleClose = () => {
    if (!purchasedRef.current) {
      void trackPaywallDismissal("subscribe_modal", plan);
    }
    onClose();
  };

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert(
        "Restore Complete",
        isSubscribed
          ? "Your ONJJEM Pro subscription is active."
          : "No previous purchases were found on this Apple ID.",
      );
    } catch (err: any) {
      Alert.alert("Restore Failed", err?.message ?? "Unable to restore purchases.");
    }
  };

  const PLANS = [
    {
      id: "perpic" as Plan,
      label: "One Photo",
      price: perPhotoPackage?.product.priceString ?? PRICING.perPhoto.amount,
      period: "per photo",
      desc: "Pay once, enhance one photo at full quality. No subscription.",
      color: "#E8A020",
      icon: "camera" as const,
      pkg: perPhotoPackage,
    },
    {
      id: "monthly" as Plan,
      label: "Monthly",
      price: monthlyPackage?.product.priceString ?? PRICING.monthly.amount,
      period: "per month",
      desc: "Unlimited full-quality restorations. Cancel anytime.",
      color: "#4A90D9",
      icon: "infinite" as const,
      pkg: monthlyPackage,
    },
  ];

  const selected = PLANS.find((p) => p.id === plan)!;

  const handleSubscribe = async () => {
    if (!selected.pkg) {
      Alert.alert(
        "Unavailable",
        "We couldn't reach the App Store right now. Please check your connection and try again in a moment.",
      );
      return;
    }
    try {
      await purchase(selected.pkg);
      purchasedRef.current = true;
      void trackPaywallPurchase("subscribe_modal", plan);
      setPurchasedPlan(plan);
      setPurchased(true);
    } catch (err: any) {
      if (err?.userCancelled) return;
      Alert.alert("Purchase Failed", err?.message ?? "Unable to complete the purchase.");
    }
  };

  const successPlan = PLANS.find((p) => p.id === purchasedPlan)!;
  const successPerks =
    purchasedPlan === "perpic"
      ? ["Full HD quality output", "All 6 modes", "No watermark"]
      : ["Unlimited HD photos", "All 6 modes combined", "Cancel anytime"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={s.root}>

        {purchased && (
          <Animated.View style={[s.successOverlay, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            <LinearGradient colors={["#0D160F", "#12200F", "#0D160F"]} style={s.successCard}>
              <LinearGradient
                colors={[successPlan.color, successPlan.color + "AA"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.successBar}
              />
              <View style={s.successInner}>
                <View style={[s.successIconWrap, { backgroundColor: successPlan.color + "22", borderColor: successPlan.color + "55" }]}>
                  <Ionicons name="checkmark-circle" size={56} color={successPlan.color} />
                </View>
                <Text style={s.successTitle}>You're now Pro!</Text>
                <Text style={[s.successPlanLabel, { color: successPlan.color }]}>
                  {successPlan.label} plan activated
                </Text>
                <Text style={s.successBody}>
                  Full HD quality, all 6 enhancement modes, and unlimited photos are now unlocked on your account.
                </Text>
                <View style={s.successDivider} />
                <View style={s.successPerks}>
                  {successPerks.map((perk) => (
                    <View key={perk} style={s.successPerkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={successPlan.color} />
                      <Text style={s.successPerkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Gold bar */}
        <LinearGradient
          colors={["#C9960C", "#F5D78E", "#C9960C"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.goldBar}
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(250,247,242,0.5)" />
            </TouchableOpacity>
            <Text style={s.title}>Unlock Full Quality</Text>
            <Text style={s.subtitle}>
              Your free sample ran at reduced quality.{"\n"}Choose how you'd like to continue.
            </Text>
          </View>

          {/* Price cards */}
          <View style={s.cards}>
            {PLANS.map((p) => {
              const active = plan === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[s.card, active && { borderColor: p.color, backgroundColor: p.color + "14" }]}
                  onPress={() => setPlan(p.id)}
                  activeOpacity={0.8}
                >
                  <View style={s.cardTop}>
                    <View style={[s.iconWrap, { backgroundColor: p.color + "20" }]}>
                      <Ionicons name={p.icon} size={20} color={p.color} />
                    </View>
                    <View style={s.cardMeta}>
                      <Text style={[s.cardLabel, active && { color: p.color }]}>{p.label}</Text>
                      <Text style={s.cardDesc}>{p.desc}</Text>
                    </View>
                    <View style={s.cardPriceWrap}>
                      <Text style={[s.cardPrice, active && { color: p.color }]}>{p.price}</Text>
                      <Text style={s.cardPeriod}>{p.period}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA */}
          <View style={s.ctaWrap}>
            <TouchableOpacity
              onPress={handleSubscribe}
              activeOpacity={0.87}
              style={s.ctaBtn}
              disabled={isPurchasing}
            >
              <LinearGradient
                colors={
                  plan === "perpic"
                    ? ["#8B6200", "#E8A020", "#F5C050", "#E8A020"]
                    : ["#2C6FAE", "#4A90D9", "#5BA3E8", "#4A90D9"]
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.cta}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={selected.icon} size={22} color="#fff" />
                    <Text style={s.ctaText}>
                      {plan === "perpic"
                        ? `${PRICING.perPhoto.shortLabel} — ${selected.price}`
                        : `${PRICING.monthly.shortLabel} — ${selected.price}${PRICING.monthly.period}`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.legal}>
              {plan !== "perpic"
                ? "Subscription renews automatically. Cancel anytime in iPhone Settings → Apple ID → Subscriptions.\n"
                : "One-time payment. No subscription.\n"}
              Payment charged to your Apple ID at confirmation.
            </Text>

            <View style={s.footerLinks}>
              <TouchableOpacity
                onPress={handleRestore}
                activeOpacity={0.7}
                disabled={isRestoring}
                style={s.footerLinkBtn}
              >
                <Text style={s.privacyLink}>
                  {isRestoring ? "Restoring…" : "Restore Purchases"}
                </Text>
              </TouchableOpacity>
              <Text style={s.footerLinkSep}>·</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://onjjem.co.uk/privacy")}
                activeOpacity={0.7}
                style={s.footerLinkBtn}
              >
                <Text style={s.privacyLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={s.footerLinkSep}>·</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}
                activeOpacity={0.7}
                style={s.footerLinkBtn}
              >
                <Text style={s.privacyLink}>Terms of Use</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

      </View>
    </Modal>
  );
}

const CREAM = "#FAF7F2";
const DARK  = "#0E0C08";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  goldBar: { height: 3 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 6,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.55)",
    lineHeight: 20,
  },

  cards: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 14,
  },
  card: {
    backgroundColor: "#1A1610",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 14,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42, height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: { flex: 1, gap: 3 },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(250,247,242,0.6)",
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.4)",
    lineHeight: 17,
  },
  cardPriceWrap: { alignItems: "flex-end" },
  cardPrice: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(250,247,242,0.5)",
  },
  cardPeriod: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.3)",
  },

  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 14,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 4,
  },
  footerLinkBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  footerLinkSep: {
    fontSize: 11,
    color: "rgba(250,247,242,0.3)",
  },
  ctaBtn: { borderRadius: 16, overflow: "hidden" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.28)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  privacyLink: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(201,150,12,0.55)",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E0C08",
    padding: 24,
  },
  successCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  successBar: { height: 4 },
  successInner: {
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -0.3,
  },
  successPlanLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  successBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.55)",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  successDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 4,
  },
  successPerks: { width: "100%", gap: 10 },
  successPerkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successPerkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.75)",
  },
});
