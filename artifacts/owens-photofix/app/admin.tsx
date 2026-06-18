import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import {
  type Order,
  loadOrders,
  markOrderAsOrdered,
  timeAgo,
} from "@/lib/orders";
import {
  type Inquiry,
  loadInquiries,
  markInquiryRead,
} from "@/lib/inquiries";
import {
  CHURN_TOTAL_COUNT_KEY,
  churnPlanCountKey,
  churnReasonCountKey,
} from "@/lib/revenuecat";

const ADMIN_PIN = "1234";

type AnalyticsData = {
  metrics: {
    active_subscriptions: number;
    mrr: number;
    revenue: number;
    new_customers: number;
    active_users: number;
  };
  countries: { label: string; count: number }[];
  platforms: { label: string; count: number }[];
  totalSubscribers: number;
  totalCustomers: number;
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [churn, setChurn] = useState<{
    total: number;
    plans: { label: string; key: string; count: number }[];
    reasons: { label: string; key: "cancel" | "billing_error"; count: number }[];
  } | null>(null);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
      fetchAll();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const domain = process.env.EXPO_PUBLIC_DOMAIN || "onjjem-production-5ef8.up.railway.app";
    const planKeys = ["monthly", "perpic"] as const;
    const reasonKeys = ["cancel", "billing_error"] as const;
    const churnKeys = [
      CHURN_TOTAL_COUNT_KEY,
      ...planKeys.map((p) => churnPlanCountKey(p)),
      ...reasonKeys.map((r) => churnReasonCountKey(r)),
    ];

    const [ordersData, inquiriesData, analyticsResp, churnPairs] = await Promise.all([
      loadOrders(),
      loadInquiries(),
      fetch(`https://${domain}/api/analytics`, {
        headers: { "X-Admin-Token": process.env.EXPO_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? "" },
      }).catch(() => null),
      AsyncStorage.multiGet(churnKeys),
    ]);
    setOrders(ordersData);
    setInquiries(inquiriesData);
    if (analyticsResp?.ok) {
      const data = await analyticsResp.json() as AnalyticsData;
      setAnalytics(data);
    }

    const churnMap = Object.fromEntries(churnPairs.map(([k, v]) => [k, v]));
    const parse = (k: string) => parseInt(churnMap[k] ?? "0", 10) || 0;
    const planLabels: Record<string, string> = { monthly: "Monthly", perpic: "Per-photo" };
    const reasonLabels: Record<"cancel" | "billing_error", string> = {
      cancel: "Cancelled",
      billing_error: "Billing error",
    };
    setChurn({
      total: parse(CHURN_TOTAL_COUNT_KEY),
      plans: planKeys.map((p) => ({ label: planLabels[p], key: p, count: parse(churnPlanCountKey(p)) })),
      reasons: reasonKeys.map((r) => ({ label: reasonLabels[r], key: r, count: parse(churnReasonCountKey(r)) })),
    });

    setLoading(false);
  }, []);

  const handleMarkOrdered = async (id: string) => {
    await markOrderAsOrdered(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, markedAsOrdered: true } : o)));
  };

  const handleMarkRead = async (id: string) => {
    await markInquiryRead(id);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  };

  const pending = orders.filter((o) => !o.markedAsOrdered);
  const done = orders.filter((o) => o.markedAsOrdered);
  const unreadInquiries = inquiries.filter((i) => !i.read);
  const readInquiries = inquiries.filter((i) => i.read);

  if (!unlocked) {
    return (
      <View style={[styles.lockRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.lockCenter}>
          <View style={[styles.lockIcon, { backgroundColor: "#0055FF18" }]}>
            <Ionicons name="shield-checkmark" size={40} color="#0055FF" />
          </View>
          <Text style={[styles.lockTitle, { color: colors.foreground }]}>Admin Dashboard</Text>
          <Text style={[styles.lockSub, { color: colors.mutedForeground }]}>Enter your 4-digit PIN to continue</Text>

          <View style={[styles.pinBox, { borderColor: pinError ? "#FF3B30" : colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.pinInput, { color: colors.foreground }]}
              value={pin}
              onChangeText={(t) => { setPin(t); setPinError(false); }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.mutedForeground}
              onSubmitEditing={tryUnlock}
              autoFocus
            />
          </View>
          {pinError && <Text style={styles.pinError}>Incorrect PIN. Please try again.</Text>}

          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: "#0055FF", opacity: pin.length === 4 ? 1 : 0.5 }]}
            onPress={tryUnlock}
            disabled={pin.length !== 4}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-open-outline" size={18} color="#fff" />
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>

          <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>Contact your ONJJEM administrator for access</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {pending.length} pending · {done.length} fulfilled · {unreadInquiries.length} new enquir{unreadInquiries.length !== 1 ? "ies" : "y"}
          </Text>
        </View>
        <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── SUBSCRIBER ANALYTICS SECTION ── */}
          {analytics && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="bar-chart-outline" size={16} color="#7C3AED" />
                  <Text style={[styles.sectionTitle, { color: "#7C3AED" }]}>Subscriber Analytics</Text>
                </View>
                <Text style={[styles.analyticsSubtitle, { color: colors.mutedForeground }]}>live · RevenueCat</Text>
              </View>

              {/* Overview metrics row */}
              <View style={[styles.analyticsMetricsRow, { borderColor: colors.border }]}>
                {[
                  { label: "Active Subs", value: String(analytics.metrics.active_subscriptions) },
                  { label: "MRR", value: `$${analytics.metrics.mrr.toFixed(2)}` },
                  { label: "Revenue", value: `$${analytics.metrics.revenue.toFixed(2)}` },
                  { label: "Customers", value: String(analytics.totalCustomers) },
                  { label: "Subscribers", value: String(analytics.totalSubscribers) },
                ].map((m, i, arr) => (
                  <React.Fragment key={m.label}>
                    <View style={styles.analyticsStat}>
                      <Text style={[styles.analyticsStatValue, { color: colors.foreground }]}>{m.value}</Text>
                      <Text style={[styles.analyticsStatLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.analyticsStatDivider, { backgroundColor: colors.border }]} />}
                  </React.Fragment>
                ))}
              </View>

              {/* Country breakdown — active subscribers only */}
              {analytics.countries.length > 0 && (
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsCardHeader}>
                    <Ionicons name="globe-outline" size={13} color="#7C3AED" />
                    <Text style={[styles.analyticsCardTitle, { color: colors.foreground }]}>Subscribers by Country</Text>
                  </View>
                  {analytics.countries.map((c) => {
                    const base = analytics.totalSubscribers > 0 ? analytics.totalSubscribers : 1;
                    const pct = c.count / base;
                    return (
                      <View key={c.label} style={styles.analyticsBarRow}>
                        <Text style={[styles.analyticsBarLabel, { color: colors.foreground }]}>{c.label}</Text>
                        <View style={[styles.analyticsBarTrack, { backgroundColor: colors.muted }]}>
                          <View style={[styles.analyticsBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: "#7C3AED" }]} />
                        </View>
                        <Text style={[styles.analyticsBarCount, { color: colors.mutedForeground }]}>{c.count}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Platform breakdown — active subscribers only */}
              {analytics.platforms.length > 0 && (
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsCardHeader}>
                    <Ionicons name="phone-portrait-outline" size={13} color="#0891B2" />
                    <Text style={[styles.analyticsCardTitle, { color: colors.foreground }]}>Subscribers by Platform</Text>
                  </View>
                  {analytics.platforms.map((p) => {
                    const base = analytics.totalSubscribers > 0 ? analytics.totalSubscribers : 1;
                    const pct = p.count / base;
                    return (
                      <View key={p.label} style={styles.analyticsBarRow}>
                        <Text style={[styles.analyticsBarLabel, { color: colors.foreground }]}>{p.label}</Text>
                        <View style={[styles.analyticsBarTrack, { backgroundColor: colors.muted }]}>
                          <View style={[styles.analyticsBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: "#0891B2" }]} />
                        </View>
                        <Text style={[styles.analyticsBarCount, { color: colors.mutedForeground }]}>{p.count}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── CHURN BREAKDOWN SECTION ── */}
          {churn && churn.total > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="trending-down-outline" size={16} color="#DC2626" />
                  <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>Churned Subscribers</Text>
                </View>
                <Text style={[styles.analyticsSubtitle, { color: colors.mutedForeground }]}>
                  {churn.total} total
                </Text>
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsCardHeader}>
                  <Ionicons name="pricetag-outline" size={13} color="#DC2626" />
                  <Text style={[styles.analyticsCardTitle, { color: colors.foreground }]}>By Plan</Text>
                </View>
                {churn.plans.map((p) => {
                  const pct = p.count / churn.total;
                  return (
                    <View key={p.key} style={styles.analyticsBarRow}>
                      <Text style={[styles.analyticsBarLabel, { color: colors.foreground }]}>{p.label}</Text>
                      <View style={[styles.analyticsBarTrack, { backgroundColor: colors.muted }]}>
                        <View style={[styles.analyticsBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: "#DC2626" }]} />
                      </View>
                      <Text style={[styles.analyticsBarCount, { color: colors.mutedForeground }]}>
                        {p.count} ({Math.round(pct * 100)}%)
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsCardHeader}>
                  <Ionicons name="information-circle-outline" size={13} color="#F59E0B" />
                  <Text style={[styles.analyticsCardTitle, { color: colors.foreground }]}>By Reason</Text>
                </View>
                {churn.reasons.map((r) => {
                  const pct = r.count / churn.total;
                  return (
                    <View key={r.key} style={styles.analyticsBarRow}>
                      <Text style={[styles.analyticsBarLabel, { color: colors.foreground }]}>{r.label}</Text>
                      <View style={[styles.analyticsBarTrack, { backgroundColor: colors.muted }]}>
                        <View style={[styles.analyticsBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: "#F59E0B" }]} />
                      </View>
                      <Text style={[styles.analyticsBarCount, { color: colors.mutedForeground }]}>
                        {r.count} ({Math.round(pct * 100)}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── EXPERT INQUIRIES SECTION ── */}
          {inquiries.length > 0 && (
            <View style={styles.section}>
              {/* Section header with notification badge */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#0D9488" />
                  <Text style={[styles.sectionTitle, { color: "#0D9488" }]}>Expert Inquiries</Text>
                </View>
                {unreadInquiries.length > 0 && (
                  <View style={styles.newBadge}>
                    <View style={styles.newBadgeDot} />
                    <Text style={styles.newBadgeText}>
                      {unreadInquiries.length} New Expert {unreadInquiries.length === 1 ? "Inquiry" : "Inquiries"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Unread inquiries first */}
              {unreadInquiries.map((inq) => (
                <InquiryCard
                  key={inq.id}
                  inquiry={inq}
                  colors={colors}
                  onMarkRead={() => handleMarkRead(inq.id)}
                />
              ))}

              {/* Read inquiries */}
              {readInquiries.map((inq) => (
                <InquiryCard
                  key={inq.id}
                  inquiry={inq}
                  colors={colors}
                  onMarkRead={() => handleMarkRead(inq.id)}
                />
              ))}
            </View>
          )}

          {/* ── ORDERS SECTION ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="cube-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Print Orders</Text>
              </View>
            </View>

            {/* Pending / fulfilled label */}
            {pending.length > 0 ? (
              <View style={[styles.sectionLabel, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="time-outline" size={14} color="#FF6B00" />
                <Text style={[styles.sectionLabelText, { color: "#FF6B00" }]}>
                  {pending.length} order{pending.length !== 1 ? "s" : ""} awaiting fulfilment
                </Text>
              </View>
            ) : (
              <View style={[styles.sectionLabel, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                <Text style={[styles.sectionLabelText, { color: "#34C759" }]}>All orders fulfilled!</Text>
              </View>
            )}

            {orders.map((order, i) => (
              <View key={order.id}>
                <OrderCard
                  order={order}
                  colors={colors}
                  onMarkOrdered={() => handleMarkOrdered(order.id)}
                />
                {i < orders.length - 1 && <View style={{ height: 12 }} />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Inquiry card
// ─────────────────────────────────────────────
function InquiryCard({
  inquiry,
  colors,
  onMarkRead,
}: {
  inquiry: Inquiry;
  colors: ReturnType<typeof useColors>;
  onMarkRead: () => void;
}) {
  const isUnread = !inquiry.read;

  return (
    <View style={[
      styles.inquiryCard,
      {
        backgroundColor: isUnread ? "#F0FDFA" : colors.card,
        borderColor: isUnread ? "#99F6E4" : colors.border,
        borderLeftColor: isUnread ? "#0D9488" : "#9CA3AF",
      },
    ]}>
      {/* Teal left strip */}
      <View style={[styles.cardStrip, { backgroundColor: isUnread ? "#0D9488" : "#D1D5DB" }]} />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.inquiryTopRow}>
          <View style={styles.inquiryIconWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#0D9488" />
          </View>
          <View style={styles.inquiryMeta}>
            <View style={styles.orderIdRow}>
              <Text style={[styles.orderId, { color: colors.mutedForeground }]}>
                #{inquiry.id.replace("inq_", "")}
              </Text>
              <View style={styles.inquiryTimeRow}>
                {isUnread && <View style={styles.unreadDot} />}
                <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>
                  {timeAgo(inquiry.submittedAt)}
                </Text>
              </View>
            </View>
            <Text style={[styles.customerName, { color: colors.foreground }]}>{inquiry.email}</Text>
          </View>
        </View>

        {/* Question */}
        <View style={[styles.questionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.questionLabel, { color: colors.mutedForeground }]}>Question</Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{inquiry.question}</Text>
        </View>

        {/* Photo thumbnail if present */}
        {inquiry.photoUri && (
          <View style={styles.inquiryPhotoWrap}>
            <Image source={{ uri: inquiry.photoUri }} style={styles.inquiryPhoto} resizeMode="cover" />
            <View style={styles.inquiryPhotoLabel}>
              <Ionicons name="image-outline" size={11} color="#fff" />
              <Text style={styles.inquiryPhotoLabelText}>Photo attached</Text>
            </View>
          </View>
        )}

        {/* Action */}
        {isUnread ? (
          <TouchableOpacity style={styles.markReadBtn} onPress={onMarkRead} activeOpacity={0.82}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.markReadBtnText}>Mark as Read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#9CA3AF" />
            <Text style={styles.readBadgeText}>Read</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Order card
// ─────────────────────────────────────────────
function OrderCard({
  order,
  colors,
  onMarkOrdered,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  onMarkOrdered: () => void;
}) {
  const isOrdered = order.markedAsOrdered;
  const profit =
    order.retailPrice != null && order.tradeCost != null
      ? order.retailPrice - order.tradeCost
      : null;

  const handleDownloadPhoto = async () => {
    if (!order.photoUri) return;
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(order.photoUri);
    } else {
      Alert.alert("Sharing unavailable", "Photo sharing is not supported on this device.");
    }
  };

  const handleProcessOrder = () => {
    Linking.openURL("https://www.bagsoflove.co.uk");
    if (!isOrdered) onMarkOrdered();
  };

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: isOrdered ? "#D1FAE5" : colors.border,
        borderLeftColor: isOrdered ? "#34C759" : "#FF9F0A",
      },
    ]}>
      <View style={[styles.cardStrip, { backgroundColor: isOrdered ? "#34C759" : "#FF9F0A" }]} />
      <View style={styles.cardBody}>

        {/* Customer + photo thumbnail */}
        <View style={styles.cardTopRow}>
          {order.photoUri ? (
            <Image source={{ uri: order.photoUri }} style={styles.photoThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.photoThumb, styles.photoPlaceholder]}>
              <Ionicons name="image-outline" size={24} color={colors.mutedForeground} />
            </View>
          )}
          <View style={styles.customerInfo}>
            <View style={styles.orderIdRow}>
              <Text style={[styles.orderId, { color: colors.mutedForeground }]}>
                #{order.id.replace("ord_", "")}
              </Text>
              <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>
                {timeAgo(order.orderedAt)}
              </Text>
            </View>
            <Text style={[styles.customerName, { color: colors.foreground }]}>
              {order.customerName}
            </Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.customerAddress, { color: colors.mutedForeground }]} numberOfLines={2}>
                {order.customerAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Item */}
        <View style={[styles.productRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={[styles.productName, { color: colors.foreground }]}>{order.product}</Text>
        </View>

        {/* Personalisation block */}
        {order.personalisation ? (
          <View style={[styles.personalisationBox, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
            <View style={styles.personalisationHeader}>
              <Ionicons name="text-outline" size={13} color="#B45309" />
              <Text style={styles.personalisationTitle}>Personalisation</Text>
            </View>
            <Text style={styles.personalisationText}>"{order.personalisation.text}"</Text>
            <View style={styles.personalisationFontRow}>
              <Ionicons name="brush-outline" size={11} color="#92400E" />
              <Text style={styles.personalisationFont}>Font: {order.personalisation.fontStyle}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.personalisationBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.personalisationNone, { color: colors.mutedForeground }]}>
              No personalisation on this order
            </Text>
          </View>
        )}

        {/* Profit tracker */}
        <View style={[styles.profitRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.profitItem}>
            <Text style={[styles.profitLabel, { color: colors.mutedForeground }]}>Total Paid</Text>
            <Text style={[styles.profitValue, { color: colors.foreground }]}>
              £{order.retailPrice?.toFixed(2) ?? "—"}
            </Text>
          </View>
          <View style={styles.profitDivider} />
          <View style={styles.profitItem}>
            <Text style={[styles.profitLabel, { color: colors.mutedForeground }]}>Bags of Love</Text>
            <Text style={[styles.profitValue, { color: "#FF6B00" }]}>
              £{order.tradeCost?.toFixed(2) ?? "—"}
            </Text>
          </View>
          <View style={styles.profitDivider} />
          <View style={styles.profitItem}>
            <Text style={[styles.profitLabel, { color: colors.mutedForeground }]}>Your Profit</Text>
            <Text style={styles.profitAmount}>
              {profit != null ? `£${profit.toFixed(2)}` : "—"}
            </Text>
          </View>
        </View>

        {/* Download restored photo */}
        <TouchableOpacity
          style={[styles.downloadBtn, !order.photoUri && styles.downloadBtnDisabled]}
          onPress={handleDownloadPhoto}
          disabled={!order.photoUri}
          activeOpacity={0.82}
        >
          <Ionicons name="cloud-download-outline" size={16} color={order.photoUri ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.downloadBtnText, !order.photoUri && styles.downloadBtnTextDisabled]}>
            {order.photoUri ? "Download Restored Photo" : "No Photo Uploaded Yet"}
          </Text>
        </TouchableOpacity>

        {/* Process Order / fulfilled */}
        {isOrdered ? (
          <View style={styles.fulfilledBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.fulfilledText}>Sent to Bags of Love</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder} activeOpacity={0.82}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.processBtnText}>Process Order — Open Bags of Love</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Lock screen */
  lockRoot: { flex: 1, paddingHorizontal: 24 },
  lockCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, marginTop: -60 },
  lockIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  lockTitle: { fontSize: 26, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  lockSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  pinBox: { width: "100%", borderWidth: 1.5, borderRadius: 14, marginTop: 8 },
  pinInput: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 16, letterSpacing: 12 },
  pinError: { fontSize: 13, color: "#FF3B30", fontFamily: "Inter_400Regular", marginTop: -4 },
  unlockBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 50, marginTop: 4 },
  unlockBtnText: { fontSize: 17, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  pinHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },

  /* Dashboard layout */
  root: { flex: 1 },
  header: { flexDirection: "row" as const, alignItems: "center" as const, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, alignItems: "center" as const, justifyContent: "center" as const },
  headerCenter: { flex: 1, alignItems: "center" as const },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  refreshBtn: { width: 36, height: 36, alignItems: "center" as const, justifyContent: "center" as const },
  loader: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const },
  list: { padding: 16, gap: 0 },

  /* Sections */
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between", marginBottom: 10 },
  sectionHeaderLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  newBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "#CCFBF1",
    borderWidth: 1,
    borderColor: "#99F6E4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  newBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#0D9488" },
  newBadgeText: { fontSize: 11, fontWeight: "700" as const, color: "#0D9488", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  sectionLabel: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14 },
  sectionLabelText: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  /* Shared card shell */
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, flexDirection: "row" as const, marginBottom: 12 },
  inquiryCard: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, flexDirection: "row" as const, marginBottom: 12 },
  cardStrip: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 12 },
  cardTopRow: { flexDirection: "row" as const, gap: 12, alignItems: "flex-start" as const },
  photoThumb: { width: 64, height: 64, borderRadius: 10, flexShrink: 0 },
  photoPlaceholder: { backgroundColor: "#F0F0F5", alignItems: "center" as const, justifyContent: "center" as const },
  customerInfo: { flex: 1, gap: 3 },
  orderIdRow: { flexDirection: "row" as const, justifyContent: "space-between" as const },
  orderId: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  orderTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  customerName: { fontSize: 15, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  addressRow: { flexDirection: "row" as const, gap: 3, alignItems: "flex-start" as const },
  customerAddress: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  productRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  productName: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", flex: 1 },
  markBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, backgroundColor: "#0055FF", paddingVertical: 12, borderRadius: 12 },
  markBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  fulfilledBadge: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#E8F5E9" },
  fulfilledText: { fontSize: 14, fontWeight: "600" as const, color: "#34C759", fontFamily: "Inter_600SemiBold" },

  /* Inquiry-specific */
  inquiryTopRow: { flexDirection: "row" as const, gap: 12, alignItems: "flex-start" as const },
  inquiryIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#CCFBF1", alignItems: "center" as const, justifyContent: "center" as const, flexShrink: 0 },
  inquiryMeta: { flex: 1, gap: 3 },
  inquiryTimeRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#0D9488" },
  questionBox: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  questionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const, letterSpacing: 1, textTransform: "uppercase" as const },
  questionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inquiryPhotoWrap: { borderRadius: 10, overflow: "hidden", height: 120, position: "relative" as const },
  inquiryPhoto: { width: "100%", height: "100%" },
  inquiryPhotoLabel: { position: "absolute" as const, bottom: 8, left: 8, flexDirection: "row" as const, alignItems: "center" as const, gap: 4, backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  inquiryPhotoLabelText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  /* Profit breakdown row */
  profitRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 0,
  },
  profitItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 3,
  },
  profitDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
  },
  profitLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  profitAmount: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34C759",
  },

  /* Personalisation block */
  personalisationBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  personalisationHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
  },
  personalisationTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: "#B45309",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  personalisationText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#78350F",
    lineHeight: 19,
    fontStyle: "italic" as const,
  },
  personalisationFontRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 2,
  },
  personalisationFont: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#92400E",
  },
  personalisationNone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic" as const,
    textAlign: "center" as const,
    paddingVertical: 4,
  },

  /* Subscriber analytics */
  analyticsSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular" },
  analyticsMetricsRow: {
    flexDirection: "row" as const,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  analyticsStat: { flex: 1, alignItems: "center" as const, gap: 2 },
  analyticsStatValue: { fontSize: 17, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  analyticsStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  analyticsStatDivider: { width: 1, marginVertical: 4 },
  analyticsCard: { borderRadius: 10, padding: 10, gap: 7, marginBottom: 8, backgroundColor: "#F9F9FB" },
  analyticsCardHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, marginBottom: 2 },
  analyticsCardTitle: { fontSize: 11, fontFamily: "Inter_700Bold", fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  analyticsBarRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 },
  analyticsBarLabel: { width: 36, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  analyticsBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" as const },
  analyticsBarFill: { height: "100%" as unknown as number, borderRadius: 3 },
  analyticsBarCount: { width: 20, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" as const },

  /* Download photo button */
  downloadBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "#1D4ED8",
    paddingVertical: 11,
    borderRadius: 12,
  },
  downloadBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  downloadBtnTextDisabled: {
    color: "#9CA3AF",
  },

  /* Process order button */
  processBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "#15803D",
    paddingVertical: 13,
    borderRadius: 12,
  },
  processBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },

  markReadBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, backgroundColor: "#0D9488", paddingVertical: 12, borderRadius: 12 },
  markReadBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  readBadge: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F3F4F6" },
  readBadgeText: { fontSize: 14, fontWeight: "600" as const, color: "#9CA3AF", fontFamily: "Inter_600SemiBold" },
});
