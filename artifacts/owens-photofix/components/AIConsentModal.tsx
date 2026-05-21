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

          <Text style={s.heading}>Before We Enhance Your Photo</Text>
          <Text style={s.sub}>
            We need your permission to process your photo. Please read the following before continuing.
          </Text>

          <View style={s.card}>
            <View style={s.cardRow}>
              <Ionicons name="image-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>What is sent</Text>
                <Text style={s.rowBody}>
                  The photo you selected is sent to our processing server as an encrypted image. No other files, contacts, or data from your device are accessed or transmitted.
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.cardRow}>
              <Ionicons name="server-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>Who receives it</Text>
                <Text style={s.rowBody}>
                  Your photo is sent to ONJJEM's secure AI processing server (photo-fix-ai.replit.app), operated by ONJJEM, based in the United Kingdom. No third-party AI companies receive your photo.
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.cardRow}>
              <Ionicons name="trash-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>How it is used</Text>
                <Text style={s.rowBody}>
                  Your photo is used solely to perform the AI enhancement you requested. It is processed and immediately deleted from our server. It is never stored, shared, or used for any other purpose including advertising or AI training.
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.cardRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#C9960C" style={s.rowIcon} />
              <View style={s.rowText}>
                <Text style={s.rowTitle}>How it is protected</Text>
                <Text style={s.rowBody}>
                  All data is transmitted over an encrypted HTTPS connection. Our server is hosted on infrastructure that meets industry-standard security requirements.
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
    gap: 4,
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
