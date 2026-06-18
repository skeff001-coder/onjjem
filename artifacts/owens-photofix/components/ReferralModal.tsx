import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  buildEmailBody,
  buildReferralLink,
  buildWhatsAppMessage,
  getReferralCode,
} from "@/lib/referral";

const GOLD = "#C9960C";
const GOLD_LIGHT = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ReferralModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      getReferralCode().then((c) => {
        setCode(c);
        setLink(buildReferralLink(c));
      });
    }
  }, [visible]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch {
      // silent — copied state still shown
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = async () => {
    const msg = encodeURIComponent(buildWhatsAppMessage(link));
    const url = `whatsapp://send?text=${msg}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      const webUrl = `https://api.whatsapp.com/send?text=${msg}`;
      await Linking.openURL(webUrl);
    }
  };

  const handleEmail = async () => {
    const subject = encodeURIComponent("£10 off your first photo restoration — ONJJEM");
    const body = encodeURIComponent(buildEmailBody(link));
    await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color="#6B7280" />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero banner */}
          <LinearGradient
            colors={["#1C1A14", "#2E2818", "#1C1A14"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Gold shimmer bar */}
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goldBar}
            />

            {/* Gift icon */}
            <View style={styles.giftIconWrap}>
              <Text style={styles.giftEmoji}>🎁</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroTitle}>Share the Memories</Text>
            <Text style={styles.heroTagline}>Give £10 · Get £10</Text>

            {/* Gold divider */}
            <View style={styles.heroDivider} />

            {/* Description */}
            <Text style={styles.heroDesc}>
              Invite a friend to restore their memories.{"\n"}
              They'll get <Text style={styles.heroHighlight}>£10 off</Text> their first order, and you'll get{" "}
              <Text style={styles.heroHighlight}>£10 credit</Text> towards your next masterpiece.
            </Text>
          </LinearGradient>

          {/* How it works */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>How it works</Text>
            {[
              { icon: "share-social-outline" as const, text: "Share your unique link with friends and family" },
              { icon: "image-outline" as const, text: "They restore a photo using your link" },
              { icon: "gift-outline" as const, text: "You both receive £10 automatically" },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon} size={18} color={GOLD} />
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Referral link box */}
          <View style={styles.linkSection}>
            <Text style={styles.linkLabel}>Your unique referral link</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnDone]}
                onPress={handleCopy}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copied ? "#fff" : GOLD}
                />
                <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.refCodeLabel}>
              Your referral code: <Text style={styles.refCode}>{code}</Text>
            </Text>
          </View>

          {/* Share buttons */}
          <View style={styles.shareButtons}>
            {/* WhatsApp */}
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleWhatsApp}
              activeOpacity={0.87}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share via WhatsApp</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={handleEmail}
              activeOpacity={0.87}
            >
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share via Email</Text>
            </TouchableOpacity>
          </View>

          {/* Fine print */}
          <Text style={styles.finePrint}>
            Credit applied automatically after your friend's first order is complete. No expiry.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 16,
  },

  /* Hero */
  heroBanner: {
    borderRadius: 22,
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#3A3320",
  },
  goldBar: {
    width: "100%",
    height: 4,
    marginBottom: 24,
  },
  giftIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(201,150,12,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(201,150,12,0.35)",
    marginBottom: 14,
  },
  giftEmoji: { fontSize: 36 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 16,
  },
  heroDivider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: GOLD,
    marginBottom: 16,
    opacity: 0.6,
  },
  heroDesc: {
    fontSize: 15,
    color: "rgba(245,237,216,0.82)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  heroHighlight: {
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },

  /* Steps */
  stepsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    padding: 16,
    gap: 14,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD_LIGHT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GOLD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: DARK,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  /* Referral link */
  linkSection: { gap: 8 },
  linkLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: MUTED,
    letterSpacing: 0.5,
  },
  linkBox: {
    flexDirection: "row" as const,
    alignItems: "center",
    backgroundColor: GOLD_LIGHT,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: DARK,
    fontFamily: "Inter_400Regular",
  },
  copyBtn: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  copyBtnDone: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
  },
  copyBtnTextDone: { color: "#fff" },
  refCodeLabel: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  refCode: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: GOLD,
    letterSpacing: 1.5,
  },

  /* Share buttons */
  shareButtons: { gap: 10 },
  whatsappBtn: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#25D366",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  emailBtn: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1D4ED8",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  /* Fine print */
  finePrint: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
