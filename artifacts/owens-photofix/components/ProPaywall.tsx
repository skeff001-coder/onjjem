import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  {
    icon: "sparkles" as const,
    title: "AI Sharpening",
    sub: "Restore blurry & low-res photos to crystal clarity",
  },
  {
    icon: "color-palette-outline" as const,
    title: "Colour Restoration",
    sub: "Bring old black-and-white photos to life",
  },
  {
    icon: "phone-portrait-outline" as const,
    title: "Save to Camera Roll",
    sub: "Keep every enhanced photo in your library",
  },
  {
    icon: "logo-whatsapp" as const,
    title: "Share Anywhere",
    sub: "Send results straight to WhatsApp and beyond",
  },
  {
    icon: "infinite-outline" as const,
    title: "Unlimited Photos",
    sub: "No daily limits — fix as many as you like",
  },
];

export function ProPaywall({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 56) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const handleSubscribe = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    Alert.alert(
      "Coming Soon",
      "Payments will be live very soon. Thank you for your interest in ONJJEM Pro!",
      [{ text: "Got it", onPress: onClose }],
    );
  };

  const handleRestore = () => {
    Alert.alert("Restore Purchases", "No previous purchases found.");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.heroBlock}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={s.heroIcon}
            />
            <View style={s.proBadgeRow}>
              <Ionicons name="star" size={14} color="#F5C842" />
              <Text style={[s.proBadgeLabel, { color: "#F5C842" }]}>PRO</Text>
            </View>
            <Text style={[s.heroTitle, { color: colors.foreground }]}>
              ONJJEM SNAP LAB Pro
            </Text>
            <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
              Everything you need to bring your photos back to life
            </Text>
          </View>

          <View style={[s.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {PRO_FEATURES.map((f, i) => (
              <View key={f.title} style={[s.featureRow, i < PRO_FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={s.featureIconWrap}>
                  <Ionicons name={f.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={s.featureText}>
                  <Text style={[s.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                  <Text style={[s.featureSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
            ))}
          </View>

          <View style={[s.priceCard, { borderColor: "#F5C842" }]}>
            <View style={s.priceTop}>
              <Text style={[s.priceAmount, { color: colors.foreground }]}>$4.99</Text>
              <Text style={[s.pricePer, { color: colors.mutedForeground }]}> / month</Text>
            </View>
            <Text style={[s.priceNote, { color: colors.mutedForeground }]}>
              Cancel anytime · No commitment
            </Text>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: bottomPad, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[s.subscribeBtn, loading && s.subscribeBtnLoading]}
            onPress={handleSubscribe}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="star" size={22} color="#000" />
                <Text style={s.subscribeBtnText}>Start Pro — $4.99/mo</Text>
              </>
            )}
          </TouchableOpacity>

          <Pressable onPress={handleRestore} style={s.restoreBtn}>
            <Text style={[s.restoreText, { color: colors.mutedForeground }]}>
              Restore Purchases
            </Text>
          </Pressable>

          <Text style={[s.legal, { color: colors.mutedForeground }]}>
            Subscription auto-renews monthly. Cancel anytime in your App Store settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  heroBlock: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  proBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245,200,66,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.4)",
  },
  proBadgeLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(10,132,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  featureSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  priceCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,200,66,0.06)",
  },
  priceTop: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: 42,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  pricePer: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
  priceNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
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
    gap: 10,
  },
  subscribeBtnLoading: {
    opacity: 0.7,
  },
  subscribeBtnText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000",
    fontFamily: "Inter_700Bold",
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
    opacity: 0.6,
  },
});
