import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

interface ChangeEntry {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  title: string;
  body: string;
}

interface VersionNotes {
  headline: string;
  items: ChangeEntry[];
}

/**
 * Add a new entry here for each release.
 * The key must match the version string in app.json exactly.
 */
export const CHANGELOG: Record<string, VersionNotes> = {
  "1.0.12": {
    headline: "What's New in v1.0.12",
    items: [
      {
        icon: "sparkles-outline",
        accent: "#C9960C",
        title: "Improvements & Bug Fixes",
        body: "Behind-the-scenes improvements and small fixes to keep your photo restorations running smoothly.",
      },
    ],
  },
  "1.0.11": {
    headline: "What's New in v1.0.11",
    items: [
      {
        icon: "sparkles-outline",
        accent: "#C9960C",
        title: "Improvements & Bug Fixes",
        body: "Behind-the-scenes improvements and small fixes to keep your photo restorations running smoothly.",
      },
    ],
  },
  "1.0.10": {
    headline: "What's New in v1.0.10",
    items: [
      {
        icon: "sparkles-outline",
        accent: "#C9960C",
        title: "Improvements & Bug Fixes",
        body: "Behind-the-scenes improvements and small fixes to keep your photo restorations running smoothly.",
      },
    ],
  },
  "1.0.9": {
    headline: "What's New in v1.0.9",
    items: [
      {
        icon: "shield-checkmark-outline",
        accent: "#C9960C",
        title: "Privacy & Transparency",
        body: "We now clearly explain what happens to your photo before it is processed — what is sent, who receives it, and how it is protected.",
      },
      {
        icon: "lock-closed-outline",
        accent: "#4A90D9",
        title: "Your Data, Your Choice",
        body: "You are asked for permission before your photo is sent for enhancement. Your photo is processed and immediately deleted — never stored or shared.",
      },
    ],
  },
  "1.0.8": {
    headline: "What's New in v1.0.8",
    items: [
      {
        icon: "shield-checkmark-outline",
        accent: "#C9960C",
        title: "Privacy & Transparency",
        body: "We now clearly explain what happens to your photo before it is processed — what is sent, who receives it, and how it is protected.",
      },
      {
        icon: "lock-closed-outline",
        accent: "#4A90D9",
        title: "Your Data, Your Choice",
        body: "You are asked for permission before your photo is sent for enhancement. Your photo is processed and immediately deleted — never stored or shared.",
      },
    ],
  },
  "1.0.7": {
    headline: "What's New in v1.0.7",
    items: [
      {
        icon: "shield-checkmark-outline",
        accent: "#C9960C",
        title: "Privacy & Transparency",
        body: "We now clearly explain what happens to your photo before it is processed — what is sent, who receives it, and how it is protected.",
      },
      {
        icon: "lock-closed-outline",
        accent: "#4A90D9",
        title: "Your Data, Your Choice",
        body: "You are asked for permission before your photo is sent for enhancement. Your photo is processed and immediately deleted — never stored or shared.",
      },
    ],
  },
  "1.0.6": {
    headline: "What's New in v1.0.6",
    items: [
      {
        icon: "shield-checkmark-outline",
        accent: "#C9960C",
        title: "Privacy & Transparency",
        body: "We now clearly explain what happens to your photo before it is processed — what is sent, who receives it, and how it is protected.",
      },
      {
        icon: "lock-closed-outline",
        accent: "#4A90D9",
        title: "Your Data, Your Choice",
        body: "You are asked for permission before your photo is sent for enhancement. Your photo is processed and immediately deleted — never stored or shared.",
      },
    ],
  },
  "1.0.1": {
    headline: "What's New in v1.0.1",
    items: [
      {
        icon: "images-outline",
        accent: "#4A90D9",
        title: "Batch Enhancements",
        body: "Select multiple photos at once and restore them all in a single tap.",
      },
      {
        icon: "time-outline",
        accent: "#27AE60",
        title: "Restoration Gallery",
        body: "Every enhanced photo is now saved to your personal gallery for easy before/after comparison.",
      },
      {
        icon: "color-filter-outline",
        accent: "#E74C3C",
        title: "Vivid & Denoise Modes",
        body: "Two new enhancements: boost colours with Vivid or strip film grain with Denoise.",
      },
      {
        icon: "share-outline",
        accent: "#C9960C",
        title: "WhatsApp Sharing",
        body: "Share your restored photos directly to WhatsApp or any app via the native share sheet.",
      },
    ],
  },
};

/** Returns true if the CHANGELOG has notes for the given version string. */
export function hasWhatsNewForVersion(version: string): boolean {
  return version in CHANGELOG;
}

/**
 * Returns the most recent version key in the CHANGELOG, or null if empty.
 * Versions are compared using semver ordering so "1.0.10" > "1.0.9".
 */
export function getLatestChangelogVersion(): string | null {
  const keys = Object.keys(CHANGELOG);
  if (keys.length === 0) return null;
  return keys.reduce((best, cur) => {
    const parse = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
    const [bMaj, bMin, bPat] = parse(best);
    const [cMaj, cMin, cPat] = parse(cur);
    if (cMaj !== bMaj) return cMaj > bMaj ? cur : best;
    if (cMin !== bMin) return cMin > bMin ? cur : best;
    return cPat > bPat ? cur : best;
  });
}

interface Props {
  visible: boolean;
  version: string;
  onDismiss: () => void;
}

export function WhatsNewModal({ visible, version, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const notes = CHANGELOG[version];

  if (!notes) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <LinearGradient
            colors={["#1A1710", "#13100A"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Handle */}
          <View style={styles.handle} />

          {/* Badge */}
          <View style={styles.badgeRow}>
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Ionicons name="sparkles" size={10} color="#0A0804" />
              <Text style={styles.badgeText}>JUST UPDATED</Text>
            </LinearGradient>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>{notes.headline}</Text>

          {/* Change items */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {notes.items.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={[styles.iconWrap, { backgroundColor: item.accent + "22" }]}>
                  <Ionicons name={item.icon} size={22} color={item.accent} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemBody}>{item.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.88}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Got It</Text>
              <Ionicons name="checkmark" size={18} color="#0A0804" />
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: SCREEN_W,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(245,237,216,0.2)",
    marginBottom: 20,
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 1.4,
  },
  headline: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F5EDD8",
    textAlign: "center",
    letterSpacing: 0.4,
    marginBottom: 20,
  },
  scroll: {
    width: "100%",
    flexGrow: 0,
    maxHeight: 320,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5EDD8",
    letterSpacing: 0.2,
  },
  itemBody: {
    fontSize: 13,
    color: "rgba(245,237,216,0.58)",
    lineHeight: 19,
  },
  ctaWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 0.3,
  },
});
