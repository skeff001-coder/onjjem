import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CONTACT_EMAIL = "privacy@whatsupdog.app";
const LAST_UPDATED = "28 May 2025";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#c9a84c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="About What's Up Dog!">
          What's Up Dog! ("the App") is operated by ONJJEM Ltd. This Privacy Policy explains how we
          collect, use, and protect your information when you use our dog breed scanner and
          encyclopedia app.
        </Section>

        <Section title="Information We Collect">
          <BulletPoint label="Photos you submit for scanning">
            Photos you take or select from your library are sent to our AI server to identify your
            dog's breed. We do not store these photos on our servers. They are processed in real
            time and immediately discarded.
          </BulletPoint>
          <BulletPoint label="Scan results and breed data">
            Breed identification results are stored locally on your device only (your "My Pack"
            gallery). We do not upload your scan history to our servers.
          </BulletPoint>
          <BulletPoint label="Anonymous analytics">
            We collect anonymised usage data (e.g. which features are used) to improve the app. No
            personally identifiable information is included.
          </BulletPoint>
        </Section>

        <Section title="How We Use Your Information">
          {"• To identify dog breeds using AI (Gemini by Google).\n• To improve app performance and features.\n• We do not sell your data to third parties."}
        </Section>

        <Section title="Third-Party Services">
          The App uses the following third-party services:{"\n\n"}
          {"• "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://policies.google.com/privacy")}>
            Google Gemini API
          </Text>
          {" — AI-powered image analysis.\n• "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://dog.ceo/dog-api")}>
            Dog CEO API
          </Text>
          {" — Breed photo library (public domain).\n• "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://onjjem.com/privacy")}>
            ONJJEM
          </Text>
          {" — Merchandise orders placed through the app."}
        </Section>

        <Section title="Camera & Photos">
          The App requests camera and photo library access solely to enable you to photograph your
          dog for breed identification. The App does not record video or audio. iOS requires
          microphone permission when the camera is active — we do not use the microphone.
        </Section>

        <Section title="Data Retention">
          Photos submitted for scanning are not retained by us. Scan results and your "My Pack"
          gallery exist only on your device. Deleting the app removes all locally stored data.
        </Section>

        <Section title="Children's Privacy">
          The App is not directed at children under 13. We do not knowingly collect personal
          information from children.
        </Section>

        <Section title="Your Rights">
          You have the right to request access to, correction of, or deletion of any personal
          data we hold. As we store no personal data on our servers, there is typically nothing
          to action. Contact us at the address below for any queries.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. Significant changes will be
          notified within the App. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="Contact Us">
          For any privacy questions, contact:{"\n\n"}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            {CONTACT_EMAIL}
          </Text>
          {"\n\nONJJEM Ltd\nUnited Kingdom"}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

function BulletPoint({ label, children }: { label: string; children: string }) {
  return (
    <Text style={styles.body}>
      {"• "}
      <Text style={styles.bold}>{label}: </Text>
      {children}
      {"\n"}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0e1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scroll: { flex: 1 },
  updated: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#c9a84c",
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  bold: { fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  link: { color: "#c9a84c", textDecorationLine: "underline" },
});
