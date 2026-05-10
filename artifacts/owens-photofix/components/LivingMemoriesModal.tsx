import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const GOLD = "#C9960C";
const GOLD_LIGHT = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#0D1B2A";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LivingMemoriesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={11} color={GOLD} />
              <Text style={styles.aiBadgeText}>AI ENHANCED</Text>
            </View>
            <Text style={styles.headerTitle}>Living Memories</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </Pressable>
        </View>

        {/* Preview panel — replaces video player */}
        <View style={styles.previewWrap}>
          <LinearGradient
            colors={["#0D1B2A", "#162236", "#0D1B2A"]}
            style={styles.previewGradient}
          >
            {/* Animated rings decoration */}
            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringInner}>
                  <Ionicons name="film" size={36} color={GOLD} />
                </View>
              </View>
            </View>

            {/* Coming soon label */}
            <View style={styles.comingSoonBadge}>
              <Ionicons name="time-outline" size={12} color={GOLD} />
              <Text style={styles.comingSoonText}>Launching Very Soon</Text>
            </View>

            {/* Bottom-left "Sample" label */}
            <View style={styles.sampleLabel}>
              <Ionicons name="film-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.sampleLabelText}>Sample animation</Text>
            </View>

            {/* Overlay gradient at bottom */}
            <LinearGradient
              colors={["transparent", "rgba(13,27,42,0.82)"]}
              style={styles.videoOverlay}
            />
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.body}>
          <Text style={styles.bodyTitle}>Watch your photo come alive</Text>
          <Text style={styles.bodyDesc}>
            Our AI subtly animates the eyes, hair and atmosphere of your
            restored photo — creating a beautiful, haunting 10-second video you
            can keep and share forever.
          </Text>

          {/* Feature pills */}
          <View style={styles.pillsRow}>
            {[
              "👁️ Subtle eye movement",
              "💨 Hair & atmosphere",
              "📱 Share-ready MP4",
            ].map((p) => (
              <View key={p} style={styles.pill}>
                <Text style={styles.pillText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Price + CTA */}
          <View style={styles.pricingCard}>
            <LinearGradient
              colors={["#0D1B2A", "#162236"]}
              style={styles.pricingGradient}
            >
              {/* Top gold rule */}
              <LinearGradient
                colors={[GOLD, "#F5D78E", GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pricingGoldBar}
              />

              <View style={styles.pricingRow}>
                <View>
                  <Text style={styles.pricingLabel}>One-time add-on</Text>
                  <Text style={styles.pricingAmount}>£14.99</Text>
                  <Text style={styles.pricingNote}>
                    Per animation · delivered as MP4
                  </Text>
                </View>
                <View style={styles.pricingBadge}>
                  <Ionicons name="sparkles" size={13} color={GOLD} />
                  <Text style={styles.pricingBadgeText}>AI Enhanced</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.87}
                onPress={() =>
                  Alert.alert(
                    "Coming Soon",
                    "Living Memories animation is launching very soon. Upload your photo and we'll let you know the moment it's ready!",
                  )
                }
              >
                <LinearGradient
                  colors={[GOLD, "#A67C00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaBtnGradient}
                >
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.ctaBtnText}>Animate My Photo</Text>
                  <Text style={styles.ctaBtnPrice}>£14.99</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.ctaNote}>
                Upload your photo first · Results in 2–4 minutes
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1B2A",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A3F55",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: { gap: 4 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  /* Preview panel */
  previewWrap: {
    height: 220,
    overflow: "hidden",
  },
  previewGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(201,150,12,0.6)",
    backgroundColor: "rgba(201,150,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,150,12,0.18)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.4,
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  sampleLabel: {
    position: "absolute",
    bottom: 10,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sampleLabelText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 14,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    lineHeight: 26,
  },
  bodyDesc: {
    fontSize: 14,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    color: "#A8C1D8",
    fontFamily: "Inter_400Regular",
  },

  /* Pricing */
  pricingCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
  },
  pricingGradient: {
    overflow: "hidden",
  },
  pricingGoldBar: {
    height: 3,
    width: "100%",
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 14,
  },
  pricingLabel: {
    fontSize: 11,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    lineHeight: 36,
  },
  pricingNote: {
    fontSize: 11,
    color: "#5A7A94",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  pricingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pricingBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  ctaBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 10,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  ctaBtnPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.85)",
    marginRight: 4,
  },
  ctaNote: {
    fontSize: 11,
    color: "#5A7A94",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 14,
  },
});
