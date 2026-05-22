import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ visible, onAccept, onDecline }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#C9960C", "#F5D78E", "#C9960C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.goldBar}
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.iconWrap}>
            <Ionicons name="shield-checkmark" size={38} color="#C9960C" />
          </View>

          <Text style={s.heading}>Your Privacy &amp; Data Use</Text>
          <Text style={s.sub}>
            Before we process your photo, please read how your data is handled. Your permission is required to continue.
          </Text>

          <View style={s.card}>

            {/* What is sent */}
            <View style={s.cardRow}>
              <Ionicons name="image-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>What data is sent</Text>
                <Text style={s.rowBody}>
                  Only the photo you selected is transmitted. No other files, contacts, location, or personal information from your device is accessed or sent.
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Who receives it */}
            <View style={s.cardRow}>
              <Ionicons name="server-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>Who receives it</Text>
                <Text style={s.rowBody}>
                  Your photo is sent to and processed entirely on ONJJEM's own server (onjjem.com), operated by ONJJEM, United Kingdom. It is processed using computer vision algorithms running on that server.
                </Text>
                <View style={s.highlightBox}>
                  <Ionicons name="checkmark-circle" size={14} color="#27AE60" style={{ marginTop: 1 }} />
                  <Text style={s.highlightText}>
                    <Text style={s.highlightBold}>No third-party AI service is used.</Text>{" "}
                    Your photo is never sent to OpenAI, Replicate, Google, or any other external company. Processing happens entirely within ONJJEM's own infrastructure.
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {/* How it is used */}
            <View style={s.cardRow}>
              <Ionicons name="trash-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>How it is used &amp; deleted</Text>
                <Text style={s.rowBody}>
                  Your photo is used only to apply the enhancement you selected. It is processed and immediately deleted from the server. It is never stored, shared, sold, or used for advertising or AI training.
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Protection */}
            <View style={s.cardRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>How it is protected</Text>
                <Text style={s.rowBody}>
                  All data is transmitted over an encrypted HTTPS connection. The server meets industry-standard security requirements.
                </Text>
              </View>
            </View>

          </View>

          <TouchableOpacity
            onPress={() => router.push("/privacy")}
            style={s.privacyLink}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={14} color="#C9960C" />
            <Text style={s.privacyLinkText}>Read our full Privacy Policy</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.88}
            style={s.acceptWrap}
          >
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.acceptBtn}
            >
              <Ionicons name="checkmark-circle" size={19} color="#0A0804" />
              <Text style={s.acceptText}>I Understand &amp; Allow</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDecline} style={s.declineBtn} activeOpacity={0.7}>
            <Text style={s.declineText}>No Thanks — Don't Process</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const DARK = "#0E0C08";
const CREAM = "#FAF7F2";

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK,
  },
  goldBar: {
    height: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 8,
  },
  iconWrap: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: CREAM,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 31,
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.6)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(201,150,12,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.22)",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  rowIcon: {
    marginTop: 1,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#F5D78E",
    letterSpacing: 0.2,
  },
  rowBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.65)",
    lineHeight: 19,
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(39,174,96,0.1)",
    borderWidth: 1,
    borderColor: "rgba(39,174,96,0.25)",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  highlightText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.75)",
    lineHeight: 18,
  },
  highlightBold: {
    fontFamily: "Inter_700Bold",
    color: "#5DE391",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(201,150,12,0.12)",
    marginHorizontal: 16,
  },
  privacyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 6,
  },
  privacyLinkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#C9960C",
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  acceptWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
  },
  acceptText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0A0804",
    letterSpacing: 0.2,
  },
  declineBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  declineText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(250,247,242,0.4)",
  },
});
