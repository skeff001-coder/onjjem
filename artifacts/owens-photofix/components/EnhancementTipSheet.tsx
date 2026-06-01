import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const TIPS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  title: string;
  body: string;
}[] = [
  {
    icon: "aperture-outline",
    accent: "#4A90D9",
    title: "Sharpen",
    body: "Fixes blurry, soft or low-resolution photos using AI upscaling.",
  },
  {
    icon: "sunny-outline",
    accent: "#F5A623",
    title: "Brighten",
    body: "Lifts dark, underexposed shots so every detail becomes visible.",
  },
  {
    icon: "water-outline",
    accent: "#9B59B6",
    title: "Denoise",
    body: "Removes grain, digital noise and film specks for a clean result.",
  },
  {
    icon: "time-outline",
    accent: "#27AE60",
    title: "Restore",
    body: "Full old-photo restoration — sharpens, brightens and removes damage in one pass.",
  },
  {
    icon: "color-filter-outline",
    accent: "#E74C3C",
    title: "Vivid",
    body: "Boosts colours and contrast to make your photos bold and striking.",
  },
];

export function EnhancementTipSheet({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Ionicons name="sparkles" size={10} color="#0A0804" />
              <Text style={styles.badgeText}>CHOOSE YOUR ENHANCEMENT</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>What does each mode do?</Text>
          <Text style={styles.subtitle}>
            Pick one or more enhancements below your photo — here's what each one does.
          </Text>

          {/* Tips list */}
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {TIPS.map((tip) => (
              <View key={tip.title} style={styles.row}>
                <View style={[styles.iconWrap, { borderColor: tip.accent + "55" }]}>
                  <Ionicons name={tip.icon} size={20} color={tip.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: tip.accent }]}>{tip.title}</Text>
                  <Text style={styles.rowBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.88} style={styles.ctaWrap}>
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Got it</Text>
              <Ionicons name="checkmark" size={18} color="#0A0804" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#0F0D09",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(201,150,12,0.18)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(245,237,216,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  headerRow: {
    alignItems: "center",
    marginBottom: 14,
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
    fontSize: 9,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5EDD8",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(245,237,216,0.5)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  list: {
    maxHeight: 320,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    paddingTop: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  rowBody: {
    fontSize: 13,
    color: "rgba(245,237,216,0.55)",
    lineHeight: 18,
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 0.3,
  },
});
