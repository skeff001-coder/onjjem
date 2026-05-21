import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import { useColors } from "@/hooks/useColors";
import {
  FIRST_PAYWALL_SEEN_KEY,
  INSTALL_FIRST_SEEN_KEY,
  PAYWALL_DISMISS_COUNT_KEY,
  PAYWALL_VIEW_COUNT_KEY,
  paywallDismissCountKey,
  paywallDismissPlanCountKey,
  paywallDismissSurfacePlanCountKey,
  paywallFirstSeenKey,
  paywallPurchasedAtKey,
  paywallPurchaseCountKey,
  paywallPurchaseGlobalPlanCountKey,
  paywallPurchasePlanCountKey,
  paywallViewCountKey,
} from "@/lib/revenuecat";

const KNOWN_SURFACES = ["pro_paywall", "subscribe_modal", "enhancement_paywall"] as const;

const KNOWN_PLANS = [
  { id: "annual",  label: "Annual" },
  { id: "monthly", label: "Monthly" },
  { id: "perpic",  label: "One Photo" },
] as const;

const SURFACE_COLORS: Record<string, string> = {
  pro_paywall:          "#4A90D9",
  subscribe_modal:      "#A764DC",
  enhancement_paywall:  "#C9960C",
};

type SurfaceStat = {
  name: string;
  views: number;
  dismissals: number;
  purchases: number;
  conversionRate: number;
  firstSeenAt: string | null;
  purchasedAt: string | null;
  planPurchases: Record<string, number>;
  planDismissals: Record<string, number>;
};

type PlanStat = {
  id: string;
  label: string;
  dismissals: number;
  purchases: number;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
}

function formatTimeDiff(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    return totalHours === 0 ? "< 1 hour" : `${totalHours}h`;
  }
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
}

async function loadStats(): Promise<{
  surfaces: SurfaceStat[];
  plans: PlanStat[];
  installFirstSeenAt: string | null;
  globalPaywallFirstSeenAt: string | null;
}> {
  const surfaceKeys = KNOWN_SURFACES.flatMap((name) => [
    paywallViewCountKey(name),
    paywallDismissCountKey(name),
    paywallPurchaseCountKey(name),
    paywallFirstSeenKey(name),
    paywallPurchasedAtKey(name),
    ...KNOWN_PLANS.map((p) => paywallPurchasePlanCountKey(name, p.id)),
    ...KNOWN_PLANS.map((p) => paywallDismissSurfacePlanCountKey(name, p.id)),
  ]);
  const planDismissKeys = KNOWN_PLANS.map((p) => paywallDismissPlanCountKey(p.id));
  const planPurchaseKeys = KNOWN_PLANS.map((p) => paywallPurchaseGlobalPlanCountKey(p.id));

  const pairs = await AsyncStorage.multiGet([
    ...surfaceKeys,
    ...planDismissKeys,
    ...planPurchaseKeys,
    INSTALL_FIRST_SEEN_KEY,
    FIRST_PAYWALL_SEEN_KEY,
  ]);
  const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

  const surfaces = KNOWN_SURFACES.map((name) => {
    const views = parseInt(map[paywallViewCountKey(name)] ?? "0", 10) || 0;
    const dismissals = parseInt(map[paywallDismissCountKey(name)] ?? "0", 10) || 0;
    const purchases = parseInt(map[paywallPurchaseCountKey(name)] ?? "0", 10) || 0;
    const conversionRate = views > 0 ? (purchases / views) * 100 : 0;
    const firstSeenAt = map[paywallFirstSeenKey(name)] ?? null;
    const purchasedAt = map[paywallPurchasedAtKey(name)] ?? null;
    const planPurchases: Record<string, number> = {};
    const planDismissals: Record<string, number> = {};
    for (const p of KNOWN_PLANS) {
      planPurchases[p.id] = parseInt(map[paywallPurchasePlanCountKey(name, p.id)] ?? "0", 10) || 0;
      planDismissals[p.id] = parseInt(map[paywallDismissSurfacePlanCountKey(name, p.id)] ?? "0", 10) || 0;
    }
    return { name, views, dismissals, purchases, conversionRate, firstSeenAt, purchasedAt, planPurchases, planDismissals };
  });

  const plans: PlanStat[] = KNOWN_PLANS.map((p) => ({
    id: p.id,
    label: p.label,
    dismissals: parseInt(map[paywallDismissPlanCountKey(p.id)] ?? "0", 10) || 0,
    purchases: parseInt(map[paywallPurchaseGlobalPlanCountKey(p.id)] ?? "0", 10) || 0,
  }));

  return {
    surfaces,
    plans,
    installFirstSeenAt: map[INSTALL_FIRST_SEEN_KEY] ?? null,
    globalPaywallFirstSeenAt: map[FIRST_PAYWALL_SEEN_KEY] ?? null,
  };
}

function surfaceLabel(name: string): string {
  switch (name) {
    case "pro_paywall":      return "Pro Paywall";
    case "subscribe_modal":  return "Subscribe Modal";
    case "enhancement_paywall": return "Enhancement Paywall";
    default: return name;
  }
}

function rateColour(rate: number): string {
  if (rate >= 50) return "#34C759";
  if (rate >= 20) return "#FF9F0A";
  return "#FF3B30";
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { flex: pct, backgroundColor: color }]} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, flexDirection: "row", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  fill:  { borderRadius: 3 },
});

function InstallToPaywall({
  installFirstSeenAt,
  globalPaywallFirstSeenAt,
}: {
  installFirstSeenAt: string | null;
  globalPaywallFirstSeenAt: string | null;
}) {
  if (!installFirstSeenAt && !globalPaywallFirstSeenAt) return null;

  let valueText: string;
  let valueColor: string;

  if (installFirstSeenAt && globalPaywallFirstSeenAt) {
    const diffMs =
      new Date(globalPaywallFirstSeenAt).getTime() -
      new Date(installFirstSeenAt).getTime();
    valueText = diffMs >= 0 ? formatTimeDiff(diffMs) : "< 1 hour";
    valueColor = "#4A90D9";
  } else {
    valueText = "Paywall not seen yet";
    valueColor = "rgba(245,215,142,0.35)";
  }

  return (
    <View style={itpStyles.card}>
      <View style={itpStyles.titleRow}>
        <Ionicons name="rocket-outline" size={14} color="#4A90D9" />
        <Text style={itpStyles.title}>Install → First paywall view</Text>
      </View>
      <View style={itpStyles.valueRow}>
        <Text style={[itpStyles.value, { color: valueColor }]}>{valueText}</Text>
        {(!installFirstSeenAt || !globalPaywallFirstSeenAt) && (
          <Text style={itpStyles.missing}>
            {!installFirstSeenAt ? "Install time not recorded" : "Paywall not yet seen"}
          </Text>
        )}
      </View>
      {(installFirstSeenAt || globalPaywallFirstSeenAt) && (
        <View style={itpStyles.dateRow}>
          {installFirstSeenAt ? (
            <Text style={itpStyles.dateLabel}>
              <Text style={itpStyles.dateDim}>Installed </Text>
              {formatDateLabel(installFirstSeenAt)}
            </Text>
          ) : (
            <Text style={itpStyles.dateMissing}>Install date unknown</Text>
          )}
          <Text style={itpStyles.dateSep}>·</Text>
          {globalPaywallFirstSeenAt ? (
            <Text style={itpStyles.dateLabel}>
              <Text style={itpStyles.dateDim}>Paywall </Text>
              {formatDateLabel(globalPaywallFirstSeenAt)}
            </Text>
          ) : (
            <Text style={itpStyles.dateMissing}>Paywall not seen</Text>
          )}
        </View>
      )}
      <Text style={itpStyles.hint}>
        Time between first app open and first time the paywall appeared
      </Text>
    </View>
  );
}

const itpStyles = StyleSheet.create({
  card: {
    backgroundColor: "#181410",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(74,144,217,0.25)",
    padding: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "rgba(74,144,217,0.9)",
    letterSpacing: 0.2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  missing: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,215,142,0.35)",
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,215,142,0.35)",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(74,144,217,0.85)",
  },
  dateDim: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(74,144,217,0.5)",
  },
  dateSep: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(74,144,217,0.3)",
  },
  dateMissing: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,215,142,0.3)",
  },
});

function TimeToConvert({
  firstSeenAt,
  purchasedAt,
}: {
  firstSeenAt: string | null;
  purchasedAt: string | null;
}) {
  if (!firstSeenAt) return null;

  let label: string;
  let valueColor: string;

  if (purchasedAt) {
    const diffMs = new Date(purchasedAt).getTime() - new Date(firstSeenAt).getTime();
    label = diffMs >= 0 ? formatTimeDiff(diffMs) : "< 1 hour";
    valueColor = "#34C759";
  } else {
    label = "Not yet converted";
    valueColor = "rgba(245,215,142,0.35)";
  }

  return (
    <View style={ttcStyles.row}>
      <Ionicons name="time-outline" size={12} color="rgba(245,215,142,0.4)" />
      <Text style={ttcStyles.label}>Time to convert</Text>
      <Text style={[ttcStyles.value, { color: valueColor }]}>{label}</Text>
    </View>
  );
}

const ttcStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(201,150,12,0.12)",
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,215,142,0.4)",
  },
  value: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});

function PlanBreakdown({
  planPurchases,
  planDismissals,
  totalPurchases,
  totalDismissals,
}: {
  planPurchases: Record<string, number>;
  planDismissals: Record<string, number>;
  totalPurchases: number;
  totalDismissals: number;
}) {
  const totalP = totalPurchases > 0 ? totalPurchases : KNOWN_PLANS.reduce((s, p) => s + (planPurchases[p.id] ?? 0), 0);
  const totalD = totalDismissals > 0 ? totalDismissals : KNOWN_PLANS.reduce((s, p) => s + (planDismissals[p.id] ?? 0), 0);

  if (totalP === 0 && totalD === 0) return null;

  return (
    <View style={pbStyles.wrap}>
      <View style={pbStyles.headerRow}>
        <View style={pbStyles.labelSpacer} />
        {totalP > 0 && <View style={pbStyles.shareHeader} />}
        <View style={pbStyles.colHeader}>
          <Ionicons name="card-outline" size={10} color="rgba(52,199,89,0.7)" />
          <Text style={[pbStyles.colHeaderText, { color: "rgba(52,199,89,0.7)" }]}>Bought</Text>
        </View>
        <View style={pbStyles.colHeader}>
          <Ionicons name="exit-outline" size={10} color="rgba(255,159,10,0.7)" />
          <Text style={[pbStyles.colHeaderText, { color: "rgba(255,159,10,0.7)" }]}>Left</Text>
        </View>
      </View>
      {KNOWN_PLANS.map((p) => {
        const bought = planPurchases[p.id] ?? 0;
        const left = planDismissals[p.id] ?? 0;
        if (bought === 0 && left === 0) return null;
        const sharePct = totalP > 0 ? Math.round((bought / totalP) * 100) : null;
        return (
          <View key={p.id} style={pbStyles.row}>
            <Text style={pbStyles.label}>{p.label}</Text>
            {totalP > 0 && (
              <View style={pbStyles.shareCell}>
                {sharePct !== null && sharePct > 0 ? (
                  <Text style={pbStyles.sharePct}>{sharePct}%</Text>
                ) : (
                  <Text style={pbStyles.sharePctDim}>—</Text>
                )}
              </View>
            )}
            <View style={pbStyles.cell}>
              <Bar value={bought} max={Math.max(1, totalP)} color="#34C759" />
              <Text style={[pbStyles.count, { color: bought > 0 ? "#34C759" : "rgba(245,215,142,0.25)" }]}>
                {bought}
              </Text>
            </View>
            <View style={pbStyles.divider} />
            <View style={pbStyles.cell}>
              <Bar value={left} max={Math.max(1, totalD)} color="#FF9F0A" />
              <Text style={[pbStyles.count, { color: left > 0 ? "#FF9F0A" : "rgba(245,215,142,0.25)" }]}>
                {left}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const pbStyles = StyleSheet.create({
  wrap: {
    gap: 7,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(201,150,12,0.12)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  labelSpacer: {
    width: 62,
  },
  colHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingRight: 2,
  },
  colHeaderText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    width: 62,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#F5EDD8",
  },
  cell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    minWidth: 18,
    textAlign: "right",
  },
  shareHeader: {
    width: 38,
  },
  shareCell: {
    width: 38,
    alignItems: "flex-end",
  },
  sharePct: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "rgba(52,199,89,0.85)",
    textAlign: "right",
  },
  sharePctDim: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,215,142,0.2)",
    textAlign: "right",
  },
});

export function PaywallStatsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [surfaces, setSurfaces] = useState<SurfaceStat[]>([]);
  const [plans, setPlans] = useState<PlanStat[]>([]);
  const [installFirstSeenAt, setInstallFirstSeenAt] = useState<string | null>(null);
  const [globalPaywallFirstSeenAt, setGlobalPaywallFirstSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cardOffsets, setCardOffsets] = useState<Record<string, number>>({});
  const [highlightedSurface, setHighlightedSurface] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadStats();
      setSurfaces(result.surfaces);
      setPlans(result.plans);
      setInstallFirstSeenAt(result.installFirstSeenAt);
      setGlobalPaywallFirstSeenAt(result.globalPaywallFirstSeenAt);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    const now = new Date().toISOString();
    const lines: string[] = [];

    lines.push("=== Paywall Stats ===");
    lines.push(`Exported: ${now}`);
    lines.push("");

    if (installFirstSeenAt && globalPaywallFirstSeenAt) {
      const diffMs =
        new Date(globalPaywallFirstSeenAt).getTime() -
        new Date(installFirstSeenAt).getTime();
      lines.push(`Install → First paywall view: ${diffMs >= 0 ? formatTimeDiff(diffMs) : "< 1 hour"}`);
      lines.push("");
    }

    const totalViews = surfaces.reduce((sum, s) => sum + s.views, 0);
    const totalDismissals = surfaces.reduce((sum, s) => sum + s.dismissals, 0);
    const totalPurchases = surfaces.reduce((sum, s) => sum + s.purchases, 0);
    const overallConv = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    lines.push("--- All Surfaces (Totals) ---");
    lines.push(`Views:      ${totalViews}`);
    lines.push(`Dismissed:  ${totalDismissals}`);
    lines.push(`Purchased:  ${totalPurchases}`);
    lines.push(`Conv. rate: ${overallConv.toFixed(1)}%`);
    lines.push("");

    for (const stat of surfaces) {
      lines.push(`--- ${surfaceLabel(stat.name)} ---`);
      lines.push(`Views:      ${stat.views}`);
      lines.push(`Dismissed:  ${stat.dismissals}`);
      lines.push(`Purchased:  ${stat.purchases}`);
      lines.push(`Conv. rate: ${stat.conversionRate.toFixed(1)}%`);
      if (stat.firstSeenAt) lines.push(`First seen: ${stat.firstSeenAt}`);
      if (stat.purchasedAt) lines.push(`Purchased at: ${stat.purchasedAt}`);
      const planPurchaseEntries = KNOWN_PLANS.filter((p) => (stat.planPurchases[p.id] ?? 0) > 0);
      if (planPurchaseEntries.length > 0) {
        lines.push("Purchases by plan:");
        for (const p of planPurchaseEntries) {
          lines.push(`  ${p.label}: ${stat.planPurchases[p.id]}`);
        }
      }
      const planDismissEntries = KNOWN_PLANS.filter((p) => (stat.planDismissals[p.id] ?? 0) > 0);
      if (planDismissEntries.length > 0) {
        lines.push("Dismissed on plan:");
        for (const p of planDismissEntries) {
          lines.push(`  ${p.label}: ${stat.planDismissals[p.id]}`);
        }
      }
      lines.push("");
    }

    lines.push("--- Plan Signal (global) ---");
    for (const plan of plans) {
      const total = plan.purchases + plan.dismissals;
      const signal = total > 0 ? ((plan.purchases / total) * 100).toFixed(0) + "%" : "—";
      lines.push(`${plan.label}: ${plan.purchases} bought, ${plan.dismissals} left, signal ${signal}`);
    }

    await Share.share({ message: lines.join("\n") });
  }, [surfaces, plans, installFirstSeenAt, globalPaywallFirstSeenAt]);

  const handleExport = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const csvEscape = (v: string | number) => {
        const str = String(v);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const header = [
        "surface",
        "views",
        "dismissals",
        "purchases",
        "conversion_rate_pct",
        "plan_purchases_annual",
        "plan_purchases_monthly",
        "plan_purchases_perpic",
        "plan_dismissals_annual",
        "plan_dismissals_monthly",
        "plan_dismissals_perpic",
        "first_seen_at",
        "purchased_at",
      ];

      const rows: string[][] = surfaces.map((s) => [
        csvEscape(s.name),
        csvEscape(s.views),
        csvEscape(s.dismissals),
        csvEscape(s.purchases),
        csvEscape(s.conversionRate.toFixed(2)),
        csvEscape(s.planPurchases["annual"] ?? 0),
        csvEscape(s.planPurchases["monthly"] ?? 0),
        csvEscape(s.planPurchases["perpic"] ?? 0),
        csvEscape(s.planDismissals["annual"] ?? 0),
        csvEscape(s.planDismissals["monthly"] ?? 0),
        csvEscape(s.planDismissals["perpic"] ?? 0),
        csvEscape(s.firstSeenAt ?? ""),
        csvEscape(s.purchasedAt ?? ""),
      ]);

      const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const dateTag = now.slice(0, 10).replace(/-/g, "");
      const filename = `paywall_stats_${dateTag}.csv`;
      const path = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(path, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing not available", "This device does not support file sharing.");
        return;
      }

      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Export paywall stats",
        UTI: "public.comma-separated-values-text",
      });
    } catch {
      Alert.alert("Export failed", "Could not generate the export file. Please try again.");
    }
  }, [surfaces]);

  const paywallStatKeys = [
    PAYWALL_VIEW_COUNT_KEY,
    PAYWALL_DISMISS_COUNT_KEY,
    FIRST_PAYWALL_SEEN_KEY,
    ...KNOWN_SURFACES.flatMap((name) => [
      paywallViewCountKey(name),
      paywallDismissCountKey(name),
      paywallPurchaseCountKey(name),
      paywallFirstSeenKey(name),
      paywallPurchasedAtKey(name),
      ...KNOWN_PLANS.map((p) => paywallPurchasePlanCountKey(name, p.id)),
      ...KNOWN_PLANS.map((p) => paywallDismissSurfacePlanCountKey(name, p.id)),
    ]),
    ...KNOWN_PLANS.map((p) => paywallDismissPlanCountKey(p.id)),
    ...KNOWN_PLANS.map((p) => paywallPurchaseGlobalPlanCountKey(p.id)),
  ];

  const handleReset = useCallback(() => {
    Alert.alert(
      "Reset stats?",
      "This will zero out all paywall view and dismiss counts on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(paywallStatKeys);
            try {
              await Purchases.setAttributes({
                paywall_view_count: "0",
                paywall_dismiss_count: "0",
                paywall_first_seen_at: "",
                paywall_last_seen_at: "",
              });
            } catch {
              // Non-critical — proceed even if the RC call fails
            }
            await refresh();
          },
        },
      ],
    );
  }, [refresh, paywallStatKeys]);

  const handleFullReset = useCallback(() => {
    Alert.alert(
      "Full reset?",
      'This will also clear the install timestamp, making the "Install \u2192 First paywall view" card go blank. It cannot be undone.',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Full Reset",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([...paywallStatKeys, INSTALL_FIRST_SEEN_KEY]);
            try {
              await Purchases.setAttributes({
                paywall_view_count: "0",
                paywall_dismiss_count: "0",
                paywall_first_seen_at: "",
                paywall_last_seen_at: "",
                install_first_seen_at: "",
              });
            } catch {
              // Non-critical — proceed even if the RC call fails
            }
            await refresh();
          },
        },
      ],
    );
  }, [refresh, paywallStatKeys]);

  const handleSegmentTap = useCallback((surfaceName: string) => {
    const y = cardOffsets[surfaceName];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
    setHighlightedSurface(surfaceName);
    setTimeout(() => setHighlightedSurface(null), 1400);
  }, [cardOffsets]);

  useEffect(() => {
    if (visible) void refresh();
  }, [visible, refresh]);

  const maxViews = Math.max(1, ...surfaces.map((s) => s.views));

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.72)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: "#0F0D09",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
      paddingBottom: insets.bottom + 20,
      maxHeight: "85%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(201,150,12,0.15)",
      gap: 10,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(201,150,12,0.12)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: { flex: 1 },
    title: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      color: "#F5D78E",
    },
    subtitle: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.5)",
      marginTop: 1,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 14,
    },
    card: {
      backgroundColor: "#181410",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.18)",
      padding: 16,
      gap: 12,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    surfaceName: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      color: "#F5EDD8",
    },
    convBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    convBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    metricsRow: {
      flexDirection: "row",
      gap: 8,
    },
    metric: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderRadius: 10,
      padding: 10,
      gap: 4,
    },
    metricLabel: {
      fontSize: 9,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      color: "rgba(245,215,142,0.45)",
      letterSpacing: 1.5,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      color: "#F5EDD8",
    },
    metricSub: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.4)",
    },
    barLabel: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.4)",
      marginBottom: 4,
    },
    note: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.35)",
      textAlign: "center",
      paddingHorizontal: 8,
      marginTop: 4,
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: 4,
    },
    refreshBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(201,150,12,0.7)",
    },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: 2,
    },
    shareBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(74,144,217,0.85)",
    },
    exportBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: 2,
    },
    exportBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(52,199,89,0.85)",
    },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: 2,
    },
    resetBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,59,48,0.7)",
    },
    fullResetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      marginTop: 0,
    },
    fullResetBtnText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,59,48,0.45)",
    },
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.4)",
      textAlign: "center",
      paddingVertical: 32,
    },
    planRow: {
      gap: 6,
    },
    planLabelRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    planLabel: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "#F5EDD8",
    },
    planCount: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.5)",
      marginRight: 8,
    },
    planPct: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: "#FF9F0A",
      minWidth: 34,
      textAlign: "right",
    },
  });

  const allZero = surfaces.every((s) => s.views === 0);
  const totalPlanDismissals = plans.reduce((sum, p) => sum + p.dismissals, 0);
  const totalPlanPurchases = plans.reduce((sum, p) => sum + p.purchases, 0);

  const totalViews = surfaces.reduce((sum, s) => sum + s.views, 0);
  const totalDismissals = surfaces.reduce((sum, s) => sum + s.dismissals, 0);
  const totalPurchases = surfaces.reduce((sum, s) => sum + s.purchases, 0);
  const overallConvRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;
  const overallConvColor = rateColour(overallConvRate);
  const maxPlanPurchases = Math.max(1, ...plans.map((p) => p.purchases));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.iconWrap}>
              <Ionicons name="bar-chart-outline" size={18} color="#C9960C" />
            </View>
            <View style={s.headerTextWrap}>
              <Text style={s.title}>Paywall Conversion Stats</Text>
              <Text style={s.subtitle}>Dev-only · Local data · Plan data also flows to RevenueCat</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(245,215,142,0.5)" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#C9960C" style={{ paddingVertical: 40 }} />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={s.scroll}
              showsVerticalScrollIndicator={false}
            >
              <InstallToPaywall
                installFirstSeenAt={installFirstSeenAt}
                globalPaywallFirstSeenAt={globalPaywallFirstSeenAt}
              />

              {allZero ? (
                <Text style={s.emptyText}>
                  No paywall events recorded yet.{"\n"}Open a paywall to start tracking.
                </Text>
              ) : (
                <>
                  {/* Global Totals card */}
                  <View style={[s.card, { borderColor: "rgba(74,144,217,0.28)" }]}>
                    <View style={s.cardTop}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                        <Ionicons name="globe-outline" size={15} color="#4A90D9" />
                        <Text style={[s.surfaceName, { color: "#A8C8F0" }]}>All Surfaces — Totals</Text>
                      </View>
                      <View style={[s.convBadge, { borderWidth: 1, borderColor: overallConvColor + "55" }]}>
                        <Text style={[s.convBadgeText, { color: overallConvColor }]}>
                          {overallConvRate.toFixed(1)}% conv.
                        </Text>
                      </View>
                    </View>

                    <View style={s.metricsRow}>
                      <View style={s.metric}>
                        <Text style={s.metricLabel}>VIEWS</Text>
                        <Text style={s.metricValue}>{totalViews}</Text>
                        <Text style={s.metricSub}>all surfaces</Text>
                      </View>
                      <View style={s.metric}>
                        <Text style={s.metricLabel}>DISMISSED</Text>
                        <Text style={[s.metricValue, { color: totalDismissals > 0 ? "#FF9F0A" : "#F5EDD8" }]}>
                          {totalDismissals}
                        </Text>
                        <Text style={s.metricSub}>no purchase</Text>
                      </View>
                      <View style={s.metric}>
                        <Text style={s.metricLabel}>CONVERTED</Text>
                        <Text style={[s.metricValue, { color: totalPurchases > 0 ? "#34C759" : "#F5EDD8" }]}>
                          {totalPurchases}
                        </Text>
                        <Text style={s.metricSub}>purchases</Text>
                      </View>
                    </View>

                    {totalPlanPurchases > 0 && (
                      <View style={{ gap: 6, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(74,144,217,0.15)" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 }}>
                          <Ionicons name="card-outline" size={11} color="rgba(74,144,217,0.6)" />
                          <Text style={{ fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", color: "rgba(74,144,217,0.6)", letterSpacing: 1.2, textTransform: "uppercase" }}>
                            Purchases by plan
                          </Text>
                        </View>
                        {KNOWN_PLANS.map((p) => {
                          const plan = plans.find((pl) => pl.id === p.id);
                          const count = plan?.purchases ?? 0;
                          const pct = totalPlanPurchases > 0 ? (count / totalPlanPurchases) * 100 : 0;
                          if (count === 0) return null;
                          return (
                            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Text style={{ width: 60, fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F5EDD8" }}>{p.label}</Text>
                              <View style={{ flex: 1 }}>
                                <Bar value={count} max={maxPlanPurchases} color="#4A90D9" />
                              </View>
                              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(245,215,142,0.5)", minWidth: 18, textAlign: "right" }}>{count}</Text>
                              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#4A90D9", minWidth: 30, textAlign: "right" }}>{pct.toFixed(0)}%</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {totalPurchases > 0 && (
                      <View style={{ gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(74,144,217,0.15)" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <Ionicons name="pie-chart-outline" size={11} color="rgba(74,144,217,0.6)" />
                          <Text style={{ fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", color: "rgba(74,144,217,0.6)", letterSpacing: 1.2, textTransform: "uppercase" }}>
                            Purchases by surface
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 3, height: 22 }}>
                          {surfaces.filter((s) => s.purchases > 0).map((s, idx, arr) => (
                            <TouchableOpacity
                              key={s.name}
                              style={{
                                flex: s.purchases,
                                backgroundColor: SURFACE_COLORS[s.name] ?? "#666",
                                borderRadius: 5,
                                borderTopLeftRadius: idx === 0 ? 7 : 5,
                                borderBottomLeftRadius: idx === 0 ? 7 : 5,
                                borderTopRightRadius: idx === arr.length - 1 ? 7 : 5,
                                borderBottomRightRadius: idx === arr.length - 1 ? 7 : 5,
                              }}
                              onPress={() => handleSegmentTap(s.name)}
                              activeOpacity={0.7}
                            />
                          ))}
                        </View>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                          {surfaces.filter((s) => s.purchases > 0).map((s) => {
                            const pct = Math.round((s.purchases / totalPurchases) * 100);
                            return (
                              <TouchableOpacity
                                key={s.name}
                                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                                onPress={() => handleSegmentTap(s.name)}
                                activeOpacity={0.7}
                              >
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SURFACE_COLORS[s.name] ?? "#666" }} />
                                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(245,215,142,0.7)" }}>
                                  {surfaceLabel(s.name)}
                                </Text>
                                <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: SURFACE_COLORS[s.name] ?? "#666" }}>
                                  {pct}%
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>

                  {surfaces.map((stat) => {
                    const convColor = rateColour(stat.conversionRate);
                    const isHighlighted = highlightedSurface === stat.name;
                    const surfColor = SURFACE_COLORS[stat.name] ?? "#C9960C";
                    return (
                      <View
                        key={stat.name}
                        style={[s.card, isHighlighted && { borderColor: surfColor + "99", borderWidth: 1.5 }]}
                        onLayout={(e) => setCardOffsets((prev) => ({ ...prev, [stat.name]: e.nativeEvent.layout.y }))}
                      >
                        <View style={s.cardTop}>
                          <Text style={s.surfaceName}>{surfaceLabel(stat.name)}</Text>
                          <View style={[s.convBadge, { borderWidth: 1, borderColor: convColor + "55" }]}>
                            <Text style={[s.convBadgeText, { color: convColor }]}>
                              {stat.conversionRate.toFixed(1)}% conv.
                            </Text>
                          </View>
                        </View>

                        <View style={s.metricsRow}>
                          <View style={s.metric}>
                            <Text style={s.metricLabel}>VIEWS</Text>
                            <Text style={s.metricValue}>{stat.views}</Text>
                            <Text style={s.metricSub}>impressions</Text>
                          </View>
                          <View style={s.metric}>
                            <Text style={s.metricLabel}>DISMISSED</Text>
                            <Text style={[s.metricValue, { color: stat.dismissals > 0 ? "#FF9F0A" : "#F5EDD8" }]}>
                              {stat.dismissals}
                            </Text>
                            <Text style={s.metricSub}>no purchase</Text>
                          </View>
                          <View style={s.metric}>
                            <Text style={s.metricLabel}>CONVERTED</Text>
                            <Text style={[s.metricValue, { color: stat.purchases > 0 ? "#34C759" : "#F5EDD8" }]}>
                              {stat.purchases}
                            </Text>
                            <Text style={s.metricSub}>purchases</Text>
                          </View>
                        </View>

                        <View>
                          <Text style={s.barLabel}>Views vs overall traffic</Text>
                          <Bar value={stat.views} max={maxViews} color="#4A90D9" />
                        </View>

                        <PlanBreakdown
                          planPurchases={stat.planPurchases}
                          planDismissals={stat.planDismissals}
                          totalPurchases={stat.purchases}
                          totalDismissals={stat.dismissals}
                        />

                        <TimeToConvert firstSeenAt={stat.firstSeenAt} purchasedAt={stat.purchasedAt} />
                      </View>
                    );
                  })}

                  {/* Combined plan signal card */}
                  {(totalPlanPurchases > 0 || totalPlanDismissals > 0) && (
                    <View style={[s.card, { borderColor: "rgba(167,100,220,0.28)" }]}>
                      <View style={s.cardTop}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                          <Ionicons name="flash-outline" size={15} color="#A764DC" />
                          <Text style={[s.surfaceName, { color: "#CDA0F0" }]}>Plan Signal</Text>
                        </View>
                        <View style={[s.convBadge, { borderWidth: 1, borderColor: "rgba(167,100,220,0.35)" }]}>
                          <Text style={[s.convBadgeText, { color: "#A764DC" }]}>
                            bought ÷ (bought + left)
                          </Text>
                        </View>
                      </View>

                      {/* Column headers */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <View style={{ width: 62 }} />
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="card-outline" size={9} color="rgba(52,199,89,0.7)" />
                            <Text style={{ fontSize: 9, fontWeight: "700", fontFamily: "Inter_700Bold", color: "rgba(52,199,89,0.7)", letterSpacing: 1.1, textTransform: "uppercase" }}>Bought</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="exit-outline" size={9} color="rgba(255,159,10,0.7)" />
                            <Text style={{ fontSize: 9, fontWeight: "700", fontFamily: "Inter_700Bold", color: "rgba(255,159,10,0.7)", letterSpacing: 1.1, textTransform: "uppercase" }}>Left</Text>
                          </View>
                        </View>
                        <View style={{ width: 52, alignItems: "flex-end" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="flash-outline" size={9} color="rgba(167,100,220,0.7)" />
                            <Text style={{ fontSize: 9, fontWeight: "700", fontFamily: "Inter_700Bold", color: "rgba(167,100,220,0.7)", letterSpacing: 1.1, textTransform: "uppercase" }}>Signal</Text>
                          </View>
                        </View>
                      </View>

                      {plans.map((plan) => {
                        const signal = plan.purchases + plan.dismissals > 0
                          ? (plan.purchases / (plan.purchases + plan.dismissals)) * 100
                          : null;
                        const signalColor = signal !== null ? rateColour(signal) : "rgba(245,215,142,0.3)";
                        return (
                          <View key={plan.id} style={{ gap: 5 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Text style={{ width: 62, fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F5EDD8" }}>{plan.label}</Text>
                              <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: plan.purchases > 0 ? "#34C759" : "rgba(245,215,142,0.25)" }}>
                                  {plan.purchases}
                                </Text>
                              </View>
                              <View style={{ flex: 1, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: plan.dismissals > 0 ? "#FF9F0A" : "rgba(245,215,142,0.25)" }}>
                                  {plan.dismissals}
                                </Text>
                              </View>
                              <View style={{ width: 52, alignItems: "flex-end" }}>
                                {signal !== null ? (
                                  <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: signalColor }}>
                                    {signal.toFixed(0)}%
                                  </Text>
                                ) : (
                                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(245,215,142,0.25)" }}>—</Text>
                                )}
                              </View>
                            </View>
                            {signal !== null && (
                              <Bar value={signal} max={100} color={signalColor} />
                            )}
                          </View>
                        );
                      })}

                      <Text style={[s.metricSub, { marginTop: 2 }]}>
                        Signal = purchases ÷ (purchases + dismissals) per plan
                      </Text>
                    </View>
                  )}
                </>
              )}

              <Text style={s.note}>
                Conversion = purchases ÷ views (real purchase events).{"\n"}
                Data is local to this device only.
              </Text>

              <TouchableOpacity style={s.refreshBtn} onPress={refresh} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={14} color="rgba(201,150,12,0.7)" />
                <Text style={s.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={14} color="rgba(74,144,217,0.85)" />
                <Text style={s.shareBtnText}>Share stats</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.exportBtn} onPress={handleExport} activeOpacity={0.7}>
                <Ionicons name="download-outline" size={14} color="rgba(52,199,89,0.85)" />
                <Text style={s.exportBtnText}>Export stats (CSV)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={14} color="rgba(255,59,48,0.7)" />
                <Text style={s.resetBtnText}>Reset stats</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.fullResetBtn} onPress={handleFullReset} activeOpacity={0.7}>
                <Ionicons name="nuclear-outline" size={14} color="rgba(255,59,48,0.45)" />
                <Text style={s.fullResetBtnText}>Full reset (incl. install time)</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
