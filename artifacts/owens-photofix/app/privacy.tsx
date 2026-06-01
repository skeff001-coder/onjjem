import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Who We Are",
    body: "ONJJEM Photo Restoration is operated by ONJJEM. We provide AI-powered photo restoration and enhancement services via this app.\n\nIf you have any questions about this policy, contact us at: privacy@onjjem.com",
  },
  {
    title: "What Information We Collect",
    body: "Photos you choose to upload for restoration. We do not collect your name, email address, or any account information — no sign-up is required to use this app.\n\nWe do not store your photos on our servers after processing is complete. Your photo is sent to our server, enhanced, and the result is returned to your device. Nothing is retained.",
  },
  {
    title: "How We Use Your Photos",
    body: "Your photo is used solely to perform the AI enhancement you requested. It is processed on our secure UK-based server and immediately discarded after the result is returned to your device.\n\nWe never use your photos for advertising, training AI models, or any other purpose.",
  },
  {
    title: "Payments",
    body: "All payments are processed securely by Apple through the App Store's In-App Purchase system. ONJJEM never sees, stores, or has access to your payment card details.\n\nFor subscription management, cancellation, and refunds, please use: iPhone Settings → Apple ID → Subscriptions.",
  },
  {
    title: "Your Photo Library",
    body: "When you tap 'Upload a Photo', the app requests permission to access your photo library. This permission is used only to let you select a photo — we do not scan, copy, or access any other photos on your device.\n\nYou can revoke this permission at any time in: iPhone Settings → Privacy & Security → Photos → ONJJEM.",
  },
  {
    title: "AI Processing Service",
    body: "To enhance your photos, the image you select is transmitted over an encrypted HTTPS connection to ONJJEM's processing server (photo-fix-ai.replit.app), operated by ONJJEM and hosted in the United Kingdom.\n\nFor free-tier previews, processing happens entirely on ONJJEM's own infrastructure. For paid HD photo processing, ONJJEM uses Replicate AI (a third-party AI service) to apply AI-based image enhancement (sharpening, colour restoration, noise removal, etc.). Your photo is encrypted during transmission and permanently deleted from the server as soon as processing is complete — it is never stored, retained, or shared.\n\nYour permission is requested before your photo is sent for the first time. You may withdraw consent at any time by uninstalling the app.",
  },
  {
    title: "Face Data",
    body: "Photos you upload may contain faces. ONJJEM does not use face recognition, face detection, or any biometric analysis. Your photo is processed as a complete image for visual enhancement only (sharpening, colour restoration, noise removal).\n\nFace data is NOT retained. No face-specific data is extracted, stored, or transmitted separately from the photo. The entire photo is processed as a single image file and immediately discarded after processing is complete.\n\nWe do not share face data with any third parties. For free-tier previews, processing is entirely on ONJJEM's own infrastructure. For paid HD enhancements, the photo is processed through Replicate AI (replicate.com) and immediately deleted after processing.",
  },
  {
    title: "Data Sharing",
    body: "We do not sell, rent, or share your personal data or photos with any third parties.\n\nYour selected photo is sent to ONJJEM's secure processing server over an encrypted HTTPS connection. For free-tier previews, processing is done entirely on our own infrastructure. For paid HD enhancements, the photo is processed through Replicate AI (replicate.com) and immediately deleted after processing.",
  },
  {
    title: "Data Retention",
    body: "We do not retain your photos after processing. Your device may cache the enhanced result locally so you can share or save it — this data stays on your device and is under your control.",
  },
  {
    title: "Children's Privacy",
    body: "This app is not directed at children under the age of 13. We do not knowingly collect any information from children.",
  },
  {
    title: "Changes to This Policy",
    body: "If we make significant changes to this privacy policy, we will update the app with the new policy. Continued use of the app after changes constitutes your acceptance.",
  },
  {
    title: "Contact Us",
    body: "For any privacy-related questions or requests:\n\nEmail: privacy@onjjem.com\nWebsite: www.onjjem.com\n\nONJJEM, Preston, United Kingdom",
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#C9960C", "#F5D78E", "#C9960C"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="rgba(250,247,242,0.7)" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.updated}>Last updated: May 2026</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.introBanner}>
          <Ionicons name="shield-checkmark" size={22} color="#C9960C" />
          <Text style={s.introText}>
            Your privacy matters. ONJJEM does not store your photos, sell your data, or require an account. Your photos are processed and immediately discarded.
          </Text>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const CREAM = "#FAF7F2";
const DARK  = "#0E0C08";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  goldBar: { height: 3 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,150,12,0.15)",
    gap: 4,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.7)",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: CREAM,
  },
  updated: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.35)",
  },

  scroll: { padding: 20, gap: 20 },

  introBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(201,150,12,0.10)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    borderRadius: 14,
    padding: 16,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.75)",
    lineHeight: 20,
  },

  section: {
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#F5D78E",
  },
  sectionBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.65)",
    lineHeight: 21,
  },
});
