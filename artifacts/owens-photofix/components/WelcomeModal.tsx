import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
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

const FEATURES = [
  {
    icon: "aperture-outline" as const,
    accent: "#4A90D9",
    title: "Sharpen",
    body: "Bring blurry, soft or low-resolution photos back to life with Cinema-Grade AI upscaling.",
  },
  {
    icon: "color-palette-outline" as const,
    accent: "#C9960C",
    title: "Colourize",
    body: "Add vivid, natural colour to old black-and-white family photos — in seconds.",
  },
  {
    icon: "sunny-outline" as const,
    accent: "#F5A623",
    title: "Brighten & Restore",
    body: "Lift dark shots, remove grain, and give faded prints a full professional restoration.",
  },
];

export function WelcomeModal({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={["#0A0804", "#13100A", "#1C1810"]}
        style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
      >
        {/* Top badge */}
        <View style={styles.badgeRow}>
          <LinearGradient
            colors={["#C9960C", "#F5D78E", "#C9960C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Ionicons name="sparkles" size={11} color="#0A0804" />
            <Text style={styles.badgeText}>CINEMA-GRADE AI</Text>
          </LinearGradient>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Welcome to{"\n"}ONJJEM</Text>
        <Text style={styles.subheadline}>
          Restore and enhance your precious photos{"\n"}with professional AI — in one tap.
        </Text>

        {/* Feature cards */}
        <View style={styles.cards}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.card}>
              <View style={[styles.iconCircle, { borderColor: f.accent + "55" }]}>
                <Ionicons name={f.icon} size={22} color={f.accent} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: f.accent }]}>{f.title}</Text>
                <Text style={styles.cardBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

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
            <Text style={styles.ctaText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A0804" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Free to try · No account required
        </Text>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    marginBottom: 28,
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
    fontSize: 42,
    fontWeight: "900",
    color: "#F5EDD8",
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 50,
    marginBottom: 14,
  },
  subheadline: {
    fontSize: 15,
    color: "rgba(245,237,216,0.60)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  cards: {
    width: "100%",
    gap: 14,
    marginBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardBody: {
    fontSize: 13,
    color: "rgba(245,237,216,0.58)",
    lineHeight: 19,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 28,
  },
  ctaWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
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
  footnote: {
    fontSize: 12,
    color: "rgba(245,237,216,0.35)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
