import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  paywallDismissCountKey,
  paywallFirstSeenKey,
  paywallPurchasedAtKey,
  paywallPurchaseCountKey,
  paywallViewCountKey,
} from "@/lib/revenuecat";

const KNOWN_SURFACES = ["pro_paywall", "subscribe_modal", "enhancement_paywall"] as const;

type SurfaceStat = {
  name: string;
  views: number;
  dismissals: number;
  purchases: number;
  conversionRate: number;
  firstSeenAt: string | null;
  purchasedAt: string | null;
};

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

async function loadStats(): Promise<SurfaceStat[]> {
  const keys = KNOWN_SURFACES.flatMap((name) => [
    paywallViewCountKey(name),
    paywallDismissCountKey(name),
    paywallPurchaseCountKey(name),
    paywallFirstSeenKey(name),
    paywallPurchasedAtKey(name),
  ]);
  const pairs = await AsyncStorage.multiGet(keys);
  const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

  return KNOWN_SURFACES.map((name) => {
    const views = parseInt(map[paywallViewCountKey(name)] ?? "0", 10) || 0;
    const dismissals = parseInt(map[paywallDismissCountKey(name)] ?? "0", 10) || 0;
    const purchases = parseInt(map[paywallPurchaseCountKey(name)] ?? "0", 10) || 0;
    const conversionRate = views > 0 ? (purchases / views) * 100 : 0;
    const firstSeenAt = map[paywallFirstSeenKey(name)] ?? null;
    const purchasedAt = map[paywallPurchasedAtKey(name)] ?? null;
    return { name, views, dismissals, purchases, conversionRate, firstSeenAt, purchasedAt };
  });
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

export function PaywallStatsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<SurfaceStat[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await loadStats());
    } finally {
      setLoading(false);
    }
  }, []);

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
            const keys = KNOWN_SURFACES.flatMap((name) => [
              paywallViewCountKey(name),
              paywallDismissCountKey(name),
              paywallPurchaseCountKey(name),
            ]);
            await AsyncStorage.multiRemove(keys);
            await refresh();
          },
        },
      ],
    );
  }, [refresh]);

  useEffect(() => {
    if (visible) void refresh();
  }, [visible, refresh]);

  const maxViews = Math.max(1, ...stats.map((s) => s.views));

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
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.4)",
      textAlign: "center",
      paddingVertical: 32,
    },
  });

  const allZero = stats.every((s) => s.views === 0);

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
              <Text style={s.subtitle}>Dev-only · Local data · No external calls</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(245,215,142,0.5)" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#C9960C" style={{ paddingVertical: 40 }} />
          ) : (
            <ScrollView
              contentContainerStyle={s.scroll}
              showsVerticalScrollIndicator={false}
            >
              {allZero ? (
                <Text style={s.emptyText}>
                  No paywall events recorded yet.{"\n"}Open a paywall to start tracking.
                </Text>
              ) : (
                stats.map((stat) => {
                  const convColor = rateColour(stat.conversionRate);
                  return (
                    <View key={stat.name} style={s.card}>
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

                      <TimeToConvert firstSeenAt={stat.firstSeenAt} purchasedAt={stat.purchasedAt} />
                    </View>
                  );
                })
              )}

              <Text style={s.note}>
                Conversion = purchases ÷ views (real purchase events).{"\n"}
                Data is local to this device only.
              </Text>

              <TouchableOpacity style={s.refreshBtn} onPress={refresh} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={14} color="rgba(201,150,12,0.7)" />
                <Text style={s.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={14} color="rgba(255,59,48,0.7)" />
                <Text style={s.resetBtnText}>Reset stats</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
