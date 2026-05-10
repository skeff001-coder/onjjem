import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

const ADMIN_PIN = "1234";

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
      fetchOrders();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const data = await loadOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  const handleMarkOrdered = async (id: string) => {
    await markOrderAsOrdered(id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, markedAsOrdered: true } : o))
    );
  };

  const pending = orders.filter((o) => !o.markedAsOrdered);
  const done = orders.filter((o) => o.markedAsOrdered);

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
          {pinError && (
            <Text style={styles.pinError}>Incorrect PIN. Please try again.</Text>
          )}

          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: "#0055FF", opacity: pin.length === 4 ? 1 : 0.5 }]}
            onPress={tryUnlock}
            disabled={pin.length !== 4}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-open-outline" size={18} color="#fff" />
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>

          <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>Default PIN: 1234</Text>
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
            {pending.length} pending · {done.length} fulfilled
          </Text>
        </View>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pending.length > 0 ? (
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
            )
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              colors={colors}
              onMarkOrdered={() => handleMarkOrdered(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isOrdered ? "#D1FAE5" : colors.border,
          borderLeftColor: isOrdered ? "#34C759" : "#FF9F0A",
        },
      ]}
    >
      {/* Status strip */}
      <View style={[styles.cardStrip, { backgroundColor: isOrdered ? "#34C759" : "#FF9F0A" }]} />

      <View style={styles.cardBody}>
        {/* Top row: photo + customer info */}
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

        {/* Product row */}
        <View style={[styles.productRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={[styles.productName, { color: colors.foreground }]}>{order.product}</Text>
        </View>

        {/* Action */}
        {isOrdered ? (
          <View style={styles.fulfilledBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.fulfilledText}>Sent to printer</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.markBtn}
            onPress={onMarkOrdered}
            activeOpacity={0.82}
          >
            <Ionicons name="print-outline" size={16} color="#fff" />
            <Text style={styles.markBtnText}>Mark as Ordered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Lock screen */
  lockRoot: {
    flex: 1,
    paddingHorizontal: 24,
  },
  lockCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: -60,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  lockSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  pinBox: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    marginTop: 8,
  },
  pinInput: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    paddingVertical: 16,
    letterSpacing: 12,
  },
  pinError: {
    fontSize: 13,
    color: "#FF3B30",
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginTop: 4,
  },
  unlockBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  pinHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },

  /* Dashboard */
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 0,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },

  /* Order card */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
  },
  cardStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    flexShrink: 0,
  },
  photoPlaceholder: {
    backgroundColor: "#F0F0F5",
    alignItems: "center",
    justifyContent: "center",
  },
  customerInfo: {
    flex: 1,
    gap: 3,
  },
  orderIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderId: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  orderTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  addressRow: {
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-start",
  },
  customerAddress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 16,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  markBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0055FF",
    paddingVertical: 12,
    borderRadius: 12,
  },
  markBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  fulfilledBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
  },
  fulfilledText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#34C759",
    fontFamily: "Inter_600SemiBold",
  },
});
