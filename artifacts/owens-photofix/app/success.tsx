import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { SecureCheckoutBadge } from "@/components/SecureCheckoutBadge";

export default function SuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top space */}
      <View style={styles.topSpacer} />

      {/* Check circle */}
      <Animated.View style={[styles.checkCircleOuter, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.checkCircleRing}>
          <View style={styles.checkCircleInner}>
            <Ionicons name="checkmark" size={72} color="#fff" />
          </View>
        </View>
      </Animated.View>

      {/* Payment successful */}
      <View style={styles.titleBlock}>
        <Text style={[styles.successLabel, { color: "#34C759" }]}>PAYMENT SUCCESSFUL</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Thank You!</Text>
        <Text style={styles.confirmationText}>
          You will receive a confirmation email within 24 hours once your order has been sent to our master printers.
        </Text>
      </View>

      {/* Card — your memories are in good hands */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: "#D1FAE5" },
        ]}
      >
        {/* Green top accent */}
        <View style={styles.cardAccentBar} />

        <View style={styles.cardContent}>
          <View style={styles.cardIconRow}>
            <View style={styles.cardIconBg}>
              <Ionicons name="heart" size={22} color="#34C759" />
            </View>
            <Text style={[styles.cardHeading, { color: colors.foreground }]}>
              Your memories are in good hands
            </Text>
          </View>

          <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
            We are now expertly restoring your photo using our AI-powered tools.
          </Text>

          <View style={[styles.divider, { backgroundColor: "#E8F5E9" }]} />

          {/* Steps */}
          {[
            {
              icon: "sparkles" as const,
              color: "#4F8EF7",
              label: "AI Restoration",
              sub: "Your photo is being enhanced right now",
            },
            {
              icon: "cube-outline" as const,
              color: "#FF9F0A",
              label: "Expert Preparation",
              sub: "We will personally prepare your order",
            },
            {
              icon: "car-outline" as const,
              color: "#BF5AF2",
              label: "Shipped to You",
              sub: "Delivered straight to your address",
            },
          ].map((step, i) => (
            <View key={step.label} style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${step.color}18` }]}>
                <Ionicons name={step.icon} size={18} color={step.color} />
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>{step.sub}</Text>
              </View>
              {i < 2 && (
                <View style={[styles.stepConnector, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />

      {/* Secure payment badge */}
      <View style={styles.badgeWrapper}>
        <SecureCheckoutBadge />
      </View>

      {/* Return to home button */}
      <View style={[styles.btnWrapper, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: "#34C759" }]}
          onPress={() => router.replace("/")}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={22} color="#fff" />
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topSpacer: {
    height: 32,
  },
  checkCircleOuter: {
    alignItems: "center",
    marginBottom: 28,
  },
  checkCircleRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(52,199,89,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleInner: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  successLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
  },
  title: {
    fontSize: 36,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6C6C70",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    paddingHorizontal: 8,
    fontStyle: "italic",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardAccentBar: {
    height: 5,
    backgroundColor: "#34C759",
  },
  cardContent: {
    padding: 20,
    gap: 14,
  },
  cardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52,199,89,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    flex: 1,
    lineHeight: 22,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  divider: {
    height: 1,
    borderRadius: 1,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    position: "relative",
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    gap: 2,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  stepSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  stepConnector: {
    position: "absolute",
    left: 17,
    top: 40,
    width: 2,
    height: 18,
    borderRadius: 1,
  },
  bottomSpacer: {
    flex: 1,
  },
  badgeWrapper: {
    paddingHorizontal: 0,
    paddingBottom: 14,
  },
  btnWrapper: {
    paddingHorizontal: 0,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  homeBtnText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});
