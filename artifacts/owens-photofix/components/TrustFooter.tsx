import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const GOLD = "#C9960C";
const GOLD_LIGHT = "#F5D78E";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const CREAM = "#FAF7F2";

const BADGES = [
  {
    icon: "seal" as const,
    fallbackIcon: "ribbon" as const,
    label: "Certified\nONJJEM Quality Seal",
    accent: GOLD,
    bg: "#FFF9E6",
  },
  {
    icon: "film" as const,
    fallbackIcon: "sparkles" as const,
    label: "Restored using\nCinema-Grade AI Technology",
    accent: "#4F8EF7",
    bg: "#EEF4FF",
  },
  {
    icon: "flag" as const,
    fallbackIcon: "medal" as const,
    label: "Finished by\nUK Master Printers",
    accent: "#C0390B",
    bg: "#FFF0EE",
  },
] as const;

export function TrustFooter() {
  return (
    <View style={styles.root}>
      {/* #1 Award Banner */}
      <LinearGradient
        colors={["#C9960C", "#F5D78E", "#C9960C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.awardBanner}
      >
        <Text style={styles.awardBannerText}>★  UK'S #1 PHOTO RESTORATION & GIFT STUDIO  ★</Text>
      </LinearGradient>

      <LinearGradient
        colors={[DARK, "#2E2818"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heading}
      >
        <View style={styles.headingDot} />
        <Text style={styles.headingText}>ONJJEM MASTER LAB</Text>
        <View style={styles.headingDot} />
      </LinearGradient>

      <View style={styles.row}>
        {BADGES.map((badge, i) => (
          <React.Fragment key={i}>
            <View style={styles.badge}>
              <View style={[styles.iconRing, { borderColor: badge.accent }]}>
                <View style={[styles.iconInner, { backgroundColor: badge.bg }]}>
                  <Ionicons name={badge.fallbackIcon} size={18} color={badge.accent} />
                </View>
              </View>
              <Text style={[styles.label, { color: DARK }]}>{badge.label}</Text>
            </View>
            {i < BADGES.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>Every order verified by the ONJJEM Master Lab</Text>
        <View style={styles.footerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: GOLD_BG,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    overflow: "hidden",
  },
  awardBanner: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  awardBannerText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1C1A14",
    letterSpacing: 1.8,
    textAlign: "center" as const,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  headingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD_LIGHT,
  },
  headingText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD_LIGHT,
    letterSpacing: 2.5,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-evenly",
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  badge: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  iconRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CREAM,
  },
  iconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 14,
  },
  divider: {
    width: 1,
    height: 52,
    backgroundColor: GOLD_BORDER,
    alignSelf: "center",
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD_BORDER,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 9,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    color: "#7A6E57",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
