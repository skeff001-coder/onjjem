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

const MONTHLY_FEATURES = [
  "Unlimited HD photos — no cap, ever",
  "Ultra-sharp, crystal-clear studio output",
  "Professional-grade colour & contrast",
  "All 6 enhancement modes combined",
  "Priority AI processing queue",
  "Cancel anytime",
];

const ANNUAL_FEATURES = [
  "Ultra-HD · 4K-Grade · Cinema-Sharp",
  "Gallery-Quality · Exhibition-Grade · Frame-Worthy",
  "Studio-Perfect · Archival-Resolution · Magazine-Ready",
  "Professional-Finish · Crystal-Clear · Broadcast-Quality",
  "All 6 modes · Unlimited photos · Priority queue",
  "The absolute best your memories have ever looked",
];

const UNLIMITED_FEATURES = MONTHLY_FEATURES;

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "£11.99",
    period: "/month",
    saving: null,
    accent: "#4A90D9",
    tagline: "Unlimited photos · Same studio-grade quality as annual · Cancel anytime",
    features: MONTHLY_FEATURES,
  },
  {
    id: "biannual",
    label: "6 Months",
    price: "£19.99",
    period: "/6 months",
    saving: "Save 17%",
    accent: "#C9960C",
    tagline: "Unlimited photos · Ultra-HD studio quality · Cancel anytime",
    features: MONTHLY_FEATURES,
  },
  {
    id: "annual",
    label: "Annual",
    price: "£24.99",
    period: "/year",
    saving: "Save 83%",
    accent: "#27AE60",
    tagline: "The deal of the decade — every quality word you can think of, for one incredible price",
    features: ANNUAL_FEATURES,
  },
] as const;

type PlanId = typeof PLANS[number]["id"];

const COMPARISON = [
  { label: "Output quality",        free: "Basic (preview)",  pro: "Full HD" },
  { label: "Enhancement depth",     free: "Reduced strength", pro: "100% strength" },
  { label: "Modes combinable",      free: "1 only",           pro: "Up to 3" },
  { label: "Watermark",             free: "Sample badge",     pro: "None" },
  { label: "Save to Photos",        free: "✕",                pro: "✓" },
];

export function EnhancementPaywall({ selectedModeCount, onUpgradeSingle, onUpgradeUnlimited }: Props) {
  const colors = useColors();
  const [activePlan, setActivePlan] = useState<PlanId>("monthly");

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

      {/* ── Single photo option ── */}
      <View style={[s.singleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.singleRowLeft}>
          <View style={s.singleRowIconWrap}>
            <Ionicons name="image-outline" size={20} color="#4A90D9" />
          </View>
          <View style={s.singleRowText}>
            <Text style={[s.singleRowTitle, { color: colors.foreground }]}>Single HD Enhancement</Text>
            <Text style={[s.singleRowSub, { color: colors.mutedForeground }]}>Full quality · No subscription</Text>
          </View>
        </View>
        <TouchableOpacity style={s.singleRowBtn} onPress={onUpgradeSingle} activeOpacity={0.85}>
          <Text style={s.singleRowBtnText}>£1.99</Text>
        </TouchableOpacity>
      </View>

      {/* ── Unlimited plans header ── */}
      <View style={s.unlimitedHeader}>
        <Text style={s.unlimitedHeaderTitle}>Unlimited Plans</Text>
        <Text style={[s.unlimitedHeaderSub, { color: colors.mutedForeground }]}>Choose your commitment — save more, pay less</Text>
      </View>

      {/* ── 3 plan selectors ── */}
      <View style={s.planSelectorRow}>
        {PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[s.planSelector, isActive && { borderColor: plan.accent }]}
              onPress={() => setActivePlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.id === "annual" && (
                <View style={[s.planSelectorBadge, { backgroundColor: "#27AE60" }]}>
                  <Text style={s.planSelectorBadgeText}>BEST</Text>
                </View>
              )}
              {plan.id === "biannual" && (
                <View style={[s.planSelectorBadge, { backgroundColor: "#C9960C" }]}>
                  <Text style={s.planSelectorBadgeText}>VALUE</Text>
                </View>
              )}
              <Text style={[s.planSelectorLabel, isActive && { color: plan.accent }]}>{plan.label}</Text>
              <Text style={[s.planSelectorPrice, isActive && { color: plan.accent }]}>{plan.price}</Text>
              <Text style={[s.planSelectorPeriod, { color: colors.mutedForeground }]}>{plan.period}</Text>
              {plan.saving && (
                <Text style={[s.planSelectorSaving, { color: plan.accent }]}>{plan.saving}</Text>
              )}
              {isActive && (
                <View style={[s.planSelectorCheck, { backgroundColor: plan.accent }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Active plan detail card ── */}
      {(() => {
        const plan = PLANS.find(p => p.id === activePlan)!;
        return (
          <LinearGradient
            colors={["#12100A", "#1C1A14"]}
            style={s.planCard}
          >
            <LinearGradient
              colors={[plan.accent, plan.accent + "88"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.planCardBar}
            />
            <View style={s.planCardInner}>
              <View style={s.planCardPriceRow}>
                <Text style={[s.planCardCurrency, { color: plan.accent }]}>£</Text>
                <Text style={[s.planCardAmount, { color: "#F5D78E" }]}>{plan.price.slice(1)}</Text>
                <Text style={[s.planCardPeriod, { color: plan.accent }]}>{plan.period}</Text>
              </View>
              {plan.saving && (
                <View style={[s.savingChip, { backgroundColor: plan.accent + "22", borderColor: plan.accent + "55" }]}>
                  <Ionicons name="pricetag-outline" size={12} color={plan.accent} />
                  <Text style={[s.savingChipText, { color: plan.accent }]}>{plan.saving} vs monthly</Text>
                </View>
              )}
              <Text style={[s.planCardTagline, { color: "rgba(250,247,242,0.6)" }]}>
                {plan.tagline}
              </Text>
              <View style={s.planCardFeatures}>
                {plan.features.map((f) => (
                  <View key={f} style={s.featurePill}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.accent} />
                    <Text style={[s.featurePillText, { color: "#FAF7F2" }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity onPress={onUpgradeUnlimited} activeOpacity={0.85}>
              <LinearGradient
                colors={[plan.accent, plan.accent + "CC"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.unlimitedBtn}
              >
                <Ionicons name="infinite" size={20} color="#fff" />
                <Text style={s.unlimitedBtnText}>
                  Start {plan.label} — {plan.price}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={s.unlimitedLegal}>Cancel anytime in iPhone Settings → App Store → Subscriptions</Text>
          </LinearGradient>
        );
      })()}

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

  // Single photo row
  singleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  singleRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  singleRowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74,144,217,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  singleRowText: { flex: 1 },
  singleRowTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  singleRowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  singleRowBtn: {
    backgroundColor: "#4A90D9",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  singleRowBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Unlimited plans header
  unlimitedHeader: { gap: 3 },
  unlimitedHeaderTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
  },
  unlimitedHeaderSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // 3-plan selectors
  planSelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  planSelector: {
    flex: 1,
    backgroundColor: "#1A1812",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    alignItems: "center",
    gap: 3,
    position: "relative",
    paddingTop: 16,
  },
  planSelectorBadge: {
    position: "absolute",
    top: -9,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  planSelectorBadgeText: {
    fontSize: 8,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  planSelectorLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.5,
  },
  planSelectorPrice: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    letterSpacing: -0.5,
  },
  planSelectorPeriod: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  planSelectorSaving: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  planSelectorCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // Saving chip inside plan card
  savingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: -4,
  },
  savingChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
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
