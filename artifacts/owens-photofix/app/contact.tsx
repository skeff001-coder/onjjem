import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

const BUSINESS_EMAIL = "hello@onjjem.co.uk";
const BUSINESS_PHONE = "+44 20 1234 5678";
const PRIVACY_URL = "https://onjjem.co.uk/privacy";
const HOURS = "Mon – Fri · 9 am – 6 pm GMT";

function ContactRow({
  icon,
  label,
  value,
  sub,
  onPress,
  actionLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIconWrap}>
        <Ionicons name={icon} size={22} color={GOLD} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
        {sub && <Text style={styles.contactSub}>{sub}</Text>}
      </View>
      {onPress && (
        <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
          <Text style={styles.actionBtnText}>{actionLabel ?? "Open"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openEmail = () =>
    Linking.openURL(`mailto:${BUSINESS_EMAIL}?subject=ONJJEM Enquiry`).catch(() =>
      Alert.alert("Could not open Mail", `Please email us at ${BUSINESS_EMAIL}`)
    );

  const openPhone = () =>
    Linking.openURL(`tel:${BUSINESS_PHONE.replace(/\s/g, "")}`).catch(() =>
      Alert.alert("Could not open Phone", `Please call us on ${BUSINESS_PHONE}`)
    );

  const openPrivacy = () =>
    Linking.openURL(PRIVACY_URL).catch(() =>
      Alert.alert("Could not open browser", `Visit ${PRIVACY_URL}`)
    );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Gold top bar */}
      <LinearGradient
        colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.goldBar}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>ONJJEM</Text>
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="headset-outline" size={36} color={GOLD} />
          </View>
          <Text style={styles.heroTitle}>We're Here to Help</Text>
          <Text style={styles.heroSub}>
            Our London-based support team are on hand for any questions about your order, restoration, or products.
          </Text>
        </View>

        {/* Contact details card */}
        <View style={styles.card}>
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardBar}
          />
          <Text style={styles.cardTitle}>Get in Touch</Text>

          <ContactRow
            icon="mail-outline"
            label="Business Email"
            value={BUSINESS_EMAIL}
            sub="We aim to reply within 24 hours"
            onPress={openEmail}
            actionLabel="Email Us"
          />
          <View style={styles.rowDivider} />
          <ContactRow
            icon="call-outline"
            label="Phone Number"
            value={BUSINESS_PHONE}
            sub={HOURS}
            onPress={openPhone}
            actionLabel="Call Us"
          />
        </View>

        {/* Legal card */}
        <View style={styles.card}>
          <LinearGradient
            colors={[GOLD, "#F5D78E", GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardBar}
          />
          <Text style={styles.cardTitle}>Legal</Text>

          <ContactRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            value="onjjem.co.uk/privacy"
            sub="How we handle your photos and data"
            onPress={openPrivacy}
            actionLabel="View"
          />
        </View>

        {/* Response promise */}
        <View style={styles.promiseRow}>
          {[
            { icon: "time-outline" as const, text: "24-hour reply guarantee" },
            { icon: "lock-closed-outline" as const, text: "Your photos stay private" },
            { icon: "ribbon-outline" as const, text: "London-based team" },
          ].map((p) => (
            <View key={p.text} style={styles.promiseItem}>
              <Ionicons name={p.icon} size={18} color={GOLD} />
              <Text style={styles.promiseText}>{p.text}</Text>
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>🇬🇧  ONJJEM PHOTO RESTORATION</Text>
          <Text style={styles.addressText}>London Studio · United Kingdom</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CREAM,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: GOLD_BG,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerEyebrow: { fontSize: 9, color: GOLD, letterSpacing: 4, fontFamily: "Inter_600SemiBold" },
  headerTitle: { fontSize: 17, fontFamily: "Cinzel_700Bold", color: DARK, letterSpacing: 0.5 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },

  hero: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GOLD_BG,
    borderWidth: 1.5, borderColor: GOLD_BORDER,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontFamily: "Cinzel_700Bold", color: DARK, textAlign: "center" },
  heroSub: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: MUTED,
    textAlign: "center", lineHeight: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1, borderColor: GOLD_BORDER,
    overflow: "hidden",
  },
  cardBar: { height: 3 },
  cardTitle: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: MUTED, letterSpacing: 2,
    textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },

  contactRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  contactIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center", justifyContent: "center",
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: MUTED, marginBottom: 2 },
  contactValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: DARK },
  contactSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: MUTED, marginTop: 2 },
  actionBtn: {
    backgroundColor: GOLD_BG,
    borderWidth: 1, borderColor: GOLD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: GOLD },
  rowDivider: { height: 1, backgroundColor: "#F0EAD8", marginHorizontal: 16 },

  promiseRow: {
    backgroundColor: GOLD_BG,
    borderRadius: 14,
    borderWidth: 1, borderColor: GOLD_BORDER,
    padding: 16, gap: 12,
  },
  promiseItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  promiseText: { fontSize: 13, fontFamily: "Inter_400Regular", color: DARK },

  addressBlock: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  addressLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: DARK, letterSpacing: 1 },
  addressText: { fontSize: 12, fontFamily: "Inter_400Regular", color: MUTED },
});
