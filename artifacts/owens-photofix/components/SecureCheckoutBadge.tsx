import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function CardPill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.cardPill, { backgroundColor: bg }]}>
      <Text style={[s.cardPillText, { color }]}>{label}</Text>
    </View>
  );
}

export function SecureCheckoutBadge() {
  return (
    <View style={s.wrapper}>
      {/* Card brand logos */}
      <View style={s.cardsRow}>
        <CardPill label="VISA" bg="#1A1F71" color="#fff" />
        <CardPill label="MC" bg="#EB001B" color="#fff" />
        <CardPill label="AMEX" bg="#2E77BC" color="#fff" />
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Secure text */}
      <View style={s.textRow}>
        <Ionicons name="lock-closed" size={13} color="#3A7D44" />
        <View style={s.textBlock}>
          <Text style={s.headline}>100% Encrypted & Secure Payment</Text>
          <Text style={s.sub}>
            Your data is protected by industry-leading security.
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6EAD8",
    backgroundColor: "#F6FBF6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  cardPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 52,
    alignItems: "center",
  },
  cardPillText: {
    fontSize: 11,
    fontWeight: "800" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C8E0CA",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#1C4D23",
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 11,
    color: "#4A7A52",
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
});
