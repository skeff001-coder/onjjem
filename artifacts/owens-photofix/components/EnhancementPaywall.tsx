import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  selectedModeCount: number;
  onUpgradeSingle: () => void;
  onUpgradeUnlimited: () => void;
}

const SINGLE_FEATURES = [
  "Full HD quality output",
  "All 6 enhancement modes",
  "Up to 3 effects combined",
  "No watermark or sample badge",
  "Save to Photos library",
];

const UNLIMITED_FEATURES = [
  "Everything in Single HD",
  "Unlimited photos per month",
  "Priority processing queue",
  "Batch restore old albums",
  "Early access to new tools",
  "Cancel anytime",
];

const COMPARISON = [
  { label: "Output quality",        free: "Basic (preview)",  pro: "Full HD" },
  { label: "Enhancement depth",     free: "Reduced strength", pro: "100% strength" },
  { label: "Modes combinable",      free: "1 only",           pro: "Up to 3" },
  { label: "Watermark",             free: "Sample badge",     pro: "None" },
  { label: "Save to Photos",        free: "✕",                pro: "✓" },
];

export function EnhancementPaywall({ selectedModeCount, onUpgradeSingle, onUpgradeUnlimited }: Props) {
  const colors = useColors();
  const [activePlan, setActivePlan] = useState<"single" | "unlimited">("unlimited");

  return (
    <View style={s.root}>

      {/* ── "Just a taste" header ── */}
      <LinearGradient
        colors={["#0D0B07", "#1C1A14", "#0D0B07"]}
        style={s.headerCard}
      >
        <LinearGradient
          colors={["#C9960C", "#F5D78E", "#C9960C"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.goldBar}
        />
        <View style={s.headerInner}>
          <View style={s.badgeRow}>
            <Ionicons name="sparkles" size={13} color="#C9960C" />
            <Text style={s.badgeText}>ONJJEM PRO RESTORATION</Text>
          </View>
          <Text style={s.headerTitle}>This is just a taste</Text>
          <Text style={s.headerSub}>
            Your free sample used reduced quality and limited strength. Unlock the full power of ONJJEM and see what your photos truly look like restored to their best.
          </Text>
        </View>
      </LinearGradient>

      {/* ── Before / After comparison table ── */}
      <View style={[s.comparisonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.comparisonHeader}>
          <Text style={s.comparisonEmpty} />
          <View style={s.comparisonCol}>
            <Text style={s.comparisonFreeLabel}>FREE</Text>
          </View>
          <View style={[s.comparisonCol, s.comparisonProCol]}>
            <Text style={s.comparisonProLabel}>PRO ★</Text>
          </View>
        </View>
        {COMPARISON.map((row, i) => (
          <View
            key={row.label}
            style={[
              s.comparisonRow,
              i < COMPARISON.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <Text style={s.comparisonRowLabel}>{row.label}</Text>
            <View style={s.comparisonCol}>
              <Text style={s.comparisonFreeVal}>{row.free}</Text>
            </View>
            <View style={[s.comparisonCol, s.comparisonProCol]}>
              <Text style={s.comparisonProVal}>{row.pro}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Plan toggle ── */}
      <View style={s.planToggle}>
        <TouchableOpacity
          style={[s.planToggleBtn, activePlan === "single" && s.planToggleBtnActive]}
          onPress={() => setActivePlan("single")}
          activeOpacity={0.8}
        >
          <Text style={[s.planToggleBtnText, activePlan === "single" && s.planToggleBtnTextActive]}>
            Single Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.planToggleBtn, activePlan === "unlimited" && s.planToggleBtnActive]}
          onPress={() => setActivePlan("unlimited")}
          activeOpacity={0.8}
        >
          <View style={s.bestValueBadge}>
            <Text style={s.bestValueText}>BEST VALUE</Text>
          </View>
          <Text style={[s.planToggleBtnText, activePlan === "unlimited" && s.planToggleBtnTextActive]}>
            Unlimited
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Active plan card ── */}
      {activePlan === "single" ? (
        <LinearGradient
          colors={["#0D1B2A", "#0A1520"]}
          style={s.planCard}
        >
          <LinearGradient
            colors={["#4A90D9", "#2C6FAE"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.planCardBar}
          />
          <View style={s.planCardInner}>
            <View style={s.planCardPriceRow}>
              <Text style={s.planCardCurrency}>£</Text>
              <Text style={s.planCardAmount}>1.99</Text>
              <Text style={s.planCardPeriod}>per photo</Text>
            </View>
            <Text style={s.planCardTagline}>Pay once, keep forever — no commitment</Text>
            <View style={s.planCardFeatures}>
              {SINGLE_FEATURES.map((f) => (
                <View key={f} style={s.featurePill}>
                  <Ionicons name="checkmark-circle" size={16} color="#4A90D9" />
                  <Text style={s.featurePillText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.singleBtn} onPress={onUpgradeSingle} activeOpacity={0.85}>
            <Text style={s.singleBtnText}>Enhance This Photo — £1.99</Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={["#12100A", "#1C1A14"]}
          style={s.planCard}
        >
          <LinearGradient
            colors={["#C9960C", "#F5D78E", "#C9960C"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.planCardBar}
          />
          <View style={s.planCardInner}>
            <View style={s.planCardPriceRow}>
              <Text style={[s.planCardCurrency, { color: "#C9960C" }]}>£</Text>
              <Text style={[s.planCardAmount, { color: "#F5D78E" }]}>11.99</Text>
              <Text style={[s.planCardPeriod, { color: "#C9960C" }]}>/month</Text>
            </View>
            <Text style={[s.planCardTagline, { color: "rgba(250,247,242,0.6)" }]}>
              Unlimited photos · Cancel anytime
            </Text>
            <View style={s.planCardFeatures}>
              {UNLIMITED_FEATURES.map((f) => (
                <View key={f} style={s.featurePill}>
                  <Ionicons name="checkmark-circle" size={16} color="#C9960C" />
                  <Text style={[s.featurePillText, { color: "#FAF7F2" }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity onPress={onUpgradeUnlimited} activeOpacity={0.85}>
            <LinearGradient
              colors={["#A67C00", "#C9960C", "#E8B422", "#C9960C"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.unlimitedBtn}
            >
              <Ionicons name="infinite" size={20} color="#fff" />
              <Text style={s.unlimitedBtnText}>Start Unlimited — £11.99/mo</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.unlimitedLegal}>Cancel anytime in iPhone Settings → App Store → Subscriptions</Text>
        </LinearGradient>
      )}

      {/* ── Social proof ── */}
      <View style={[s.quoteCard, { backgroundColor: colors.card, borderColor: "rgba(201,150,12,0.2)" }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#C9960C" />
        <Text style={[s.quoteText, { color: colors.mutedForeground }]}>
          "I couldn't believe the difference — my grandmother's 1940s wedding photo looks like it was taken yesterday."
        </Text>
        <View style={s.quoteStars}>
          {[1,2,3,4,5].map(i => <Text key={i} style={s.quoteStar}>★</Text>)}
          <Text style={[s.quoteAuthor, { color: colors.foreground }]}>— Margaret T.</Text>
        </View>
      </View>

    </View>
  );
}

const CREAM = "#FAF7F2";
const GOLD  = "#C9960C";

const s = StyleSheet.create({
  root: { gap: 14 },

  // Header card
  headerCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
  },
  goldBar: { height: 3 },
  headerInner: { padding: 18, gap: 8 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.65)",
    lineHeight: 21,
  },

  // Comparison table
  comparisonCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  comparisonHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  comparisonEmpty: { flex: 1.4 },
  comparisonCol: { flex: 1, alignItems: "center" },
  comparisonProCol: {
    backgroundColor: "rgba(201,150,12,0.08)",
    borderRadius: 6,
  },
  comparisonFreeLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
  },
  comparisonProLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 6,
  },
  comparisonRowLabel: {
    flex: 1.4,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  comparisonFreeVal: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },
  comparisonProVal: {
    fontSize: 11.5,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    textAlign: "center",
  },

  // Plan toggle
  planToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  planToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    position: "relative",
  },
  planToggleBtnActive: {
    backgroundColor: GOLD,
  },
  planToggleBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
  },
  planToggleBtnTextActive: {
    color: "#fff",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#E74C3C",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bestValueText: {
    fontSize: 8,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.8,
  },

  // Plan cards
  planCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    gap: 0,
  },
  planCardBar: { height: 4 },
  planCardInner: { padding: 18, gap: 10 },
  planCardPriceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
  },
  planCardCurrency: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#4A90D9",
    marginTop: 7,
  },
  planCardAmount: {
    fontSize: 52,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -2,
    lineHeight: 56,
  },
  planCardPeriod: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.55)",
    alignSelf: "flex-end",
    marginBottom: 10,
    marginLeft: 4,
  },
  planCardTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.5)",
    marginTop: -4,
  },
  planCardFeatures: { gap: 8, marginTop: 4 },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featurePillText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.75)",
    flex: 1,
  },

  // Single CTA
  singleBtn: {
    margin: 14,
    marginTop: 4,
    backgroundColor: "#4A90D9",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  singleBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Unlimited CTA
  unlimitedBtn: {
    margin: 14,
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  unlimitedBtnText: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  unlimitedLegal: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.3)",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    lineHeight: 14,
  },

  // Quote
  quoteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    alignItems: "flex-start",
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 21,
  },
  quoteStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  quoteStar: {
    fontSize: 13,
    color: GOLD,
  },
  quoteAuthor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    marginLeft: 6,
  },
});
