import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Plan = "monthly" | "annual";

const MONTHLY_PERKS = [
  "Unlimited HD restorations — no cap, ever",
  "100% enhancement strength — not the preview version",
  "All 6 modes combined: Sharpen · Brighten · Denoise · Restore · Vivid · Colourize",
  "Ultra-sharp, crystal-clear studio output",
  "Professional-grade colour & contrast correction",
  "Priority AI processing queue — jump the line",
  "Save full-res results to your Photos library",
  "Early access to every new tool we release",
];

const ANNUAL_PERKS = [
  ...MONTHLY_PERKS,
  "Print as many photos as you want all year — unlimited downloads",
  "Exclusive annual member badge & bonus features",
  "First in line for seasonal gift shop discounts",
  "Free concierge consultation on your best restoration",
];

const BONUSES = [
  { icon: "gift-outline" as const,       text: "Bonus: Members-only discount codes every month" },
  { icon: "star-outline" as const,       text: "Bonus: Early access to new AI restoration tools" },
  { icon: "ribbon-outline" as const,     text: "Bonus: Priority support — real people, fast replies" },
  { icon: "images-outline" as const,     text: "Bonus: Batch-restore entire albums in one go" },
];

export function SubscribeModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>("annual");

  const isAnnual = plan === "annual";
  const accent = isAnnual ? "#27AE60" : "#4A90D9";
  const perks = isAnnual ? ANNUAL_PERKS : MONTHLY_PERKS;

  const handleSubscribe = () => {
    Alert.alert(
      isAnnual ? "Annual Plan — £24.99/year" : "Monthly Plan — £11.99/month",
      "Payments are coming very soon — you'll be the first to know when we go live. We'll save your choice.",
      [{ text: "Can't Wait!", onPress: onClose }],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { paddingBottom: insets.bottom + 12 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Close button */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="rgba(250,247,242,0.5)" />
          </TouchableOpacity>

          {/* Header */}
          <LinearGradient colors={["#1A1610", "#0E0C08"]} style={s.header}>
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.goldBar}
            />
            <View style={s.headerInner}>
              <View style={s.tasteRow}>
                <Text style={s.tasteEmoji}>👁️</Text>
                <View style={s.tasteBadge}>
                  <Text style={s.tasteBadgeText}>FREE TASTE USED</Text>
                </View>
              </View>
              <Text style={s.headerTitle}>That Was Just a Glimpse.</Text>
              <Text style={s.headerSub}>
                What you just saw was ONJJEM running at a fraction of its power — reduced strength, half resolution, compressed output.
                {"\n\n"}
                The real machine? Completely different. Ultra-HD. Studio-grade. The kind of result you'd frame on a wall.
                {"\n\n"}
                Subscribe now and see what your photos truly look like at full power.
              </Text>
            </View>
          </LinearGradient>

          {/* Plan toggle */}
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, plan === "monthly" && { borderColor: "#4A90D9", backgroundColor: "#4A90D918" }]}
              onPress={() => setPlan("monthly")}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleLabel, plan === "monthly" && { color: "#4A90D9" }]}>Monthly</Text>
              <Text style={[s.togglePrice, plan === "monthly" && { color: "#FAF7F2" }]}>£11.99</Text>
              <Text style={s.togglePeriod}>/month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.toggleBtn, plan === "annual" && { borderColor: "#27AE60", backgroundColor: "#27AE6018" }]}
              onPress={() => setPlan("annual")}
              activeOpacity={0.8}
            >
              <View style={s.bestDealBadge}>
                <Text style={s.bestDealText}>BEST DEAL</Text>
              </View>
              <Text style={[s.toggleLabel, plan === "annual" && { color: "#27AE60" }]}>Annual</Text>
              <Text style={[s.togglePrice, plan === "annual" && { color: "#FAF7F2" }]}>£24.99</Text>
              <Text style={s.togglePeriod}>/year</Text>
              <Text style={[s.toggleSaving, { color: "#27AE60" }]}>Save 83%</Text>
            </TouchableOpacity>
          </View>

          {/* Perks */}
          <View style={s.perksCard}>
            <LinearGradient
              colors={[accent + "22", accent + "08"]}
              style={s.perksCardGradient}
            >
              <Text style={[s.perksTitle, { color: accent }]}>
                {isAnnual ? "Everything, Unlimited, All Year" : "Everything, Unlimited, Every Month"}
              </Text>
              {perks.map((p) => (
                <View key={p} style={s.perkRow}>
                  <Ionicons name="checkmark-circle" size={17} color={accent} />
                  <Text style={s.perkText}>{p}</Text>
                </View>
              ))}
            </LinearGradient>
          </View>

          {/* Bonus incentives */}
          <View style={s.bonusSection}>
            <Text style={s.bonusTitle}>Member Bonuses Included</Text>
            {BONUSES.map((b) => (
              <View key={b.text} style={s.bonusRow}>
                <View style={s.bonusIconWrap}>
                  <Ionicons name={b.icon} size={18} color="#C9960C" />
                </View>
                <Text style={s.bonusText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Emphasis bar */}
          <View style={s.emphasisBar}>
            <Text style={s.emphasisText}>
              🎯 Remember — your free sample ran at <Text style={s.emphasisBold}>50% resolution with reduced strength</Text>. The real thing is in a completely different league.
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.87} style={s.ctaWrap}>
            <LinearGradient
              colors={isAnnual ? ["#1A8C40", "#27AE60", "#2ECC71", "#27AE60"] : ["#2C6FAE", "#4A90D9", "#5BA3E8", "#4A90D9"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Ionicons name="infinite" size={22} color="#fff" />
              <Text style={s.ctaText}>
                {isAnnual ? "Start Annual Plan — £24.99/year" : "Start Monthly Plan — £11.99/month"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.legal}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime: iPhone Settings → Apple ID → Subscriptions.{"\n\n"}
            Same studio quality on both plans — annual just saves you 83%.
          </Text>

        </ScrollView>
      </View>
    </Modal>
  );
}

const CREAM = "#FAF7F2";
const DARK  = "#0E0C08";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 20, gap: 16 },

  closeBtn: {
    alignSelf: "flex-end",
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  header: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(201,150,12,0.2)" },
  goldBar: { height: 4 },
  headerInner: { padding: 20, gap: 12 },

  tasteRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tasteEmoji: { fontSize: 22 },
  tasteBadge: {
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.4)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tasteBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#C9960C",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.65)",
    lineHeight: 22,
  },

  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    backgroundColor: "#1A1610",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    alignItems: "center",
    gap: 3,
    position: "relative",
    paddingTop: 20,
  },
  bestDealBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#27AE60",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestDealText: {
    fontSize: 8,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  togglePrice: {
    fontSize: 30,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -1,
  },
  togglePeriod: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.4)",
  },
  toggleSaving: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },

  perksCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  perksCardGradient: { padding: 18, gap: 10 },
  perksTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  perkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: CREAM,
    flex: 1,
    lineHeight: 19,
  },

  bonusSection: { gap: 10 },
  bonusTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#C9960C",
    letterSpacing: 0.5,
  },
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(201,150,12,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.15)",
    padding: 12,
  },
  bonusIconWrap: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(201,150,12,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bonusText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.8)",
    flex: 1,
    lineHeight: 18,
  },

  emphasisBar: {
    backgroundColor: "rgba(201,150,12,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    padding: 14,
  },
  emphasisText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.7)",
    lineHeight: 20,
  },
  emphasisBold: {
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#C9960C",
  },

  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.3)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
