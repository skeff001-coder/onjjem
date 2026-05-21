import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { PRICING } from "@/lib/pricing";
import { trackPaywallDismissal, trackPaywallImpression, trackPaywallPurchase, useSubscription } from "@/lib/revenuecat";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  {
    emoji: "✦",
    color: "#0A84FF",
    title: "Ultra Sharp AI",
    sub: "Advanced AI sharpening restores blurry and low-res photos to crisp, stunning clarity",
  },
  {
    emoji: "🎨",
    color: "#FF9F0A",
    title: "Full Colour Restoration",
    sub: "Breathe vibrant life back into faded or black-and-white vintage photos",
  },
  {
    emoji: "💬",
    color: "#25D366",
    title: "Unlimited WhatsApp Sharing",
    sub: "Share every enhanced photo directly to WhatsApp with a single tap — no limits",
  },
  {
    emoji: "📸",
    color: "#FF375F",
    title: "Save to Camera Roll",
    sub: "Every enhanced photo is saved instantly to your iPhone Photos library",
  },
  {
    emoji: "∞",
    color: "#BF5AF2",
    title: "Unlimited Photos",
    sub: "Process as many photos as you like, any time, with no daily cap",
  },
];

export function ProPaywall({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [purchased, setPurchased] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.85)).current;
  const { monthlyPackage, purchase, restore, isPurchasing, isRestoring, isSubscribed } =
    useSubscription();

  // Track whether a purchase completed in this modal session so we can skip
  // the dismissal event when onClose is called after a successful purchase.
  const purchasedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      purchasedRef.current = false;
      setPurchased(false);
      successOpacity.setValue(0);
      successScale.setValue(0.85);
      void trackPaywallImpression("pro_paywall");
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
      void trackPaywallDismissal("pro_paywall", "monthly");
    }
    onClose();
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 56) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  // Use live store price when available; otherwise fall back to display price.
  const priceLabel =
    monthlyPackage?.product.priceString ?? PRICING.monthly.amount;
  const periodLabel = PRICING.monthly.period;

  const handleSubscribe = async () => {
    if (!monthlyPackage) {
      Alert.alert(
        "Subscriptions Unavailable",
        "We couldn't reach the App Store right now. Please check your connection and try again in a moment.",
      );
      return;
    }
    try {
      await purchase(monthlyPackage);
      purchasedRef.current = true;
      void trackPaywallPurchase("pro_paywall", "monthly");
      setPurchased(true);
    } catch (err: any) {
      if (err?.userCancelled) return;
      Alert.alert("Purchase Failed", err?.message ?? "Unable to complete the purchase.");
    }
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

  const loading = isPurchasing || isRestoring;

  const SUCCESS_COLOR = "#F5C842";
  const SUCCESS_PERKS = ["Unlimited HD photos", "All 6 modes combined", "No watermark"];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {purchased && (
          <Animated.View style={[s.successOverlay, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            <LinearGradient colors={["#0D160F", "#12200F", "#0D160F"]} style={s.successCard}>
              <LinearGradient
                colors={[SUCCESS_COLOR, SUCCESS_COLOR + "AA"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.successBar}
              />
              <View style={s.successInner}>
                <View style={[s.successIconWrap, { backgroundColor: SUCCESS_COLOR + "22", borderColor: SUCCESS_COLOR + "55" }]}>
                  <Ionicons name="checkmark-circle" size={56} color={SUCCESS_COLOR} />
                </View>
                <Text style={s.successTitle}>You're now Pro!</Text>
                <Text style={[s.successPlanLabel, { color: SUCCESS_COLOR }]}>
                  Monthly plan activated
                </Text>
                <Text style={s.successBody}>
                  Full HD quality, all 6 enhancement modes, and unlimited photos are now unlocked on your account.
                </Text>
                <View style={s.successDivider} />
                <View style={s.successPerks}>
                  {SUCCESS_PERKS.map((perk) => (
                    <View key={perk} style={s.successPerkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={SUCCESS_COLOR} />
                      <Text style={s.successPerkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={[s.topBar, { paddingTop: topPad + 6 }]}>
          <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.card }]} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 140 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.heroBlock}>
            <Image source={require("@/assets/images/icon.png")} style={s.heroIcon} />

            <View style={s.proBadgeRow}>
              <Text style={s.proBadgeStar}>★</Text>
              <Text style={s.proBadgeLabel}>ONJJEM PRO</Text>
            </View>

            <Text style={[s.heroTitle, { color: colors.foreground }]}>
              Transform Your Photos
            </Text>
            <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
              AI-powered tools that make every photo look its absolute best
            </Text>
          </View>

          <View style={[s.priceCard, { borderColor: "#F5C842", backgroundColor: "rgba(245,200,66,0.07)" }]}>
            <View style={s.priceRow}>
              <Text style={[s.priceAmount, { color: colors.foreground }]}>{priceLabel}</Text>
              <Text style={[s.pricePeriod, { color: colors.mutedForeground }]}>{periodLabel}</Text>
            </View>
            <Text style={[s.priceTagline, { color: colors.mutedForeground }]}>
              Cancel anytime · No commitment · No hidden fees
            </Text>
          </View>

          <View style={[s.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.featuresHeading, { color: colors.mutedForeground }]}>EVERYTHING INCLUDED</Text>

            {PRO_FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[
                  s.featureRow,
                  i < PRO_FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[s.featureIconWrap, { backgroundColor: f.color + "1A" }]}>
                  <Text style={[s.featureEmoji, { color: f.color }]}>{f.emoji}</Text>
                </View>
                <View style={s.featureText}>
                  <Text style={[s.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                  <Text style={[s.featureSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#34C759" />
              </View>
            ))}
          </View>

          <View style={[s.socialProof, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.socialProofText, { color: colors.mutedForeground }]}>
              "My old family photos look incredible — like they were taken yesterday"
            </Text>
            <Text style={[s.socialProofName, { color: colors.foreground }]}>— Happy ONJJEM user</Text>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: bottomPad, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[s.subscribeBtn, loading && { opacity: 0.75 }]}
            onPress={handleSubscribe}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={s.subscribeBtnText}>Start Pro — {priceLabel} {periodLabel}</Text>
                <Text style={s.subscribeBtnStar}>★</Text>
              </>
            )}
          </TouchableOpacity>

          <Pressable onPress={handleRestore} style={s.restoreBtn}>
            <Text style={[s.restoreText, { color: colors.mutedForeground }]}>Restore Purchases</Text>
          </Pressable>

          <Text style={[s.legal, { color: colors.mutedForeground }]}>
            Subscription renews automatically at {priceLabel}{periodLabel}. Cancel anytime in your iPhone Settings → Apple ID → Subscriptions.
          </Text>

          <View style={s.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL("https://onjjem.co.uk/privacy")} activeOpacity={0.7}>
              <Text style={[s.legalLink, { color: colors.mutedForeground }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[s.legalLinkSep, { color: colors.mutedForeground }]}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")} activeOpacity={0.7}>
              <Text style={[s.legalLink, { color: colors.mutedForeground }]}>Terms of Use</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  heroBlock: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  proBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,200,66,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.45)",
  },
  proBadgeStar: {
    fontSize: 12,
    color: "#F5C842",
  },
  proBadgeLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
    color: "#F5C842",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  priceCard: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 56,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 60,
  },
  pricePeriod: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    alignSelf: "flex-end",
    marginBottom: 8,
    marginLeft: 4,
  },
  priceTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuresHeading: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 13,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  featureText: { flex: 1, gap: 3 },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  featureSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  socialProof: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  socialProofText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic" as const,
    lineHeight: 20,
  },
  socialProofName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  subscribeBtn: {
    backgroundColor: "#F5C842",
    borderRadius: 14,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  subscribeBtnText: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: "#000",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  subscribeBtnStar: {
    fontSize: 16,
    color: "#000",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  legal: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
    opacity: 0.55,
    paddingHorizontal: 4,
  },
  legalLinks: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 2,
  },
  legalLink: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    opacity: 0.45,
    textDecorationLine: "underline" as const,
  },
  legalLinkSep: {
    fontSize: 10,
    opacity: 0.3,
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
    color: "#FAF7F2",
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
