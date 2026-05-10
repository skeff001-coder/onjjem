import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const MUTED = "#7A6E57";
const DIVIDER = "#E8D48B";

const BADGES = [
  {
    icon: "ribbon-outline" as const,
    label: "Hand-Restored\nin London",
  },
  {
    icon: "shield-checkmark-outline" as const,
    label: "10-Year Print &\nStitch Guarantee",
  },
  {
    icon: "star-outline" as const,
    label: "UK Master\nCraftsmanship",
  },
];

export function TrustFooter() {
  return (
    <View style={styles.root}>
      {/* Top gold rule */}
      <View style={styles.rule} />

      <View style={styles.row}>
        {BADGES.map((badge, i) => (
          <React.Fragment key={badge.label}>
            <View style={styles.badge}>
              <View style={styles.iconWrap}>
                <Ionicons name={badge.icon} size={16} color={GOLD} />
              </View>
              <Text style={styles.label}>{badge.label}</Text>
            </View>
            {i < BADGES.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: GOLD_BG,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  rule: {
    height: 1,
    backgroundColor: GOLD_BORDER,
    marginBottom: 14,
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-evenly",
  },
  badge: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    color: MUTED,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 14,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: DIVIDER,
    alignSelf: "center",
    opacity: 0.6,
  },
});
