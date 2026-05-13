import React, { useEffect, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const GOLD = "#C9960C";
const DARK = "#0D1B2A";
const NAVY = "#162236";

type Step = "intro" | "confirming" | "processing" | "done" | "error";

const PROCESSING_MESSAGES = [
  "Analysing every precious detail of your photograph…",
  "Our Cinema-Grade AI is breathing life into your image…",
  "Adding subtle motion to eyes and atmosphere…",
  "Generating hair and lighting movement…",
  "Rendering your living memory frame by frame…",
  "Perfecting the motion with master-level precision…",
  "Almost there — polishing every frame with care…",
  "Your Living Memory is nearly ready…",
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LivingMemoriesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("intro");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState(PROCESSING_MESSAGES[0]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const msgIndexRef = useRef(0);

  /* Cycle comfort messages during processing */
  useEffect(() => {
    if (step !== "processing") return;
    msgIndexRef.current = 0;
    setStatusMsg(PROCESSING_MESSAGES[0]);
    const id = setInterval(() => {
      msgIndexRef.current = (msgIndexRef.current + 1) % PROCESSING_MESSAGES.length;
      setStatusMsg(PROCESSING_MESSAGES[msgIndexRef.current]);
    }, 5_000);
    return () => clearInterval(id);
  }, [step]);

  /* Reset when modal is closed */
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep("intro");
        setPhotoUri(null);
        setEmail("");
        setVideoUrl(null);
        setErrorMsg("");
      }, 400);
    }
  }, [visible]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPhotoUri(result.assets[0].uri);
      setStep("confirming");
    }
  }

  async function startAnimation() {
    if (!photoUri) return;
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Email required", "Please enter your email so we can send your payment link and delivery confirmation.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep("processing");

    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error("API domain not configured.");
      const apiUrl = `https://${domain}/api/living-memories`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 330_000);

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, email: email.trim() }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const data = await response.json() as { videoUrl?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Animation failed — please try again.");
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setVideoUrl(data.videoUrl ?? null);
      setStep("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMsg(msg);
      setStep("error");
    }
  }

  async function shareVideo() {
    if (!videoUrl) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localPath = (FileSystem.documentDirectory ?? "") + "living_memory.mp4";
      await FileSystem.downloadAsync(videoUrl, localPath);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localPath, {
          mimeType: "video/mp4",
          dialogTitle: "Share Your Living Memory",
          UTI: "public.movie",
        });
      } else {
        Alert.alert("Saved", "Your Living Memory video has been saved to your device.");
      }
    } catch {
      Alert.alert("Error", "Could not download your video. Please try again.");
    }
  }

  /* ── Screens ── */

  const introScreen = (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={["#0D1B2A", "#162236", "#0D1B2A"]}
        style={styles.heroPanel}
      >
        <LinearGradient
          colors={[GOLD, "#F5D78E", GOLD]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.heroGoldBar}
        />
        {/* Animated rings */}
        <View style={styles.ringOuter}>
          <View style={styles.ringMiddle}>
            <View style={styles.ringInner}>
              <Ionicons name="film" size={34} color={GOLD} />
            </View>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>NOW LIVE</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.bodyTitle}>Watch your photo come alive</Text>
        <Text style={styles.bodyDesc}>
          Our Cinema-Grade AI subtly animates the eyes, hair and atmosphere of
          your cherished photograph — creating a beautiful, haunting video you
          can keep and share with family forever.
        </Text>

        {/* Feature list */}
        {[
          { icon: "eye-outline" as const,      label: "Subtle eye & face movement" },
          { icon: "partly-sunny-outline" as const, label: "Hair, light & atmosphere motion" },
          { icon: "film-outline" as const,     label: "~8 seconds · delivered as MP4" },
          { icon: "share-social-outline" as const, label: "Share instantly to WhatsApp & Photos" },
        ].map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={f.icon} size={16} color={GOLD} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}

        {/* Pricing card */}
        <View style={styles.pricingCard}>
          <LinearGradient colors={[DARK, NAVY]} style={styles.pricingGradient}>
            <LinearGradient
              colors={[GOLD, "#F5D78E", GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.pricingGoldBar}
            />
            <View style={styles.pricingRow}>
              <View>
                <Text style={styles.pricingLabel}>One-time · per animation</Text>
                <Text style={styles.pricingAmount}>£14.99</Text>
                <Text style={styles.pricingNote}>Delivered as MP4 · ready to share</Text>
              </View>
              <View style={styles.pricingBadge}>
                <Ionicons name="sparkles" size={12} color={GOLD} />
                <Text style={styles.pricingBadgeText}>AI Enhanced</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.87}
              onPress={pickPhoto}
            >
              <LinearGradient
                colors={[GOLD, "#A67C00"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaBtnGradient}
              >
                <Ionicons name="images-outline" size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>Choose a Photo</Text>
                <Text style={styles.ctaBtnPrice}>£14.99</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.ctaNote}>
              Secure order · payment link sent to your email · results in 3–5 minutes
            </Text>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );

  const confirmingScreen = (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo preview */}
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
      )}

      <View style={styles.body}>
        <Text style={styles.bodyTitle}>Confirm your order</Text>
        <Text style={styles.bodyDesc}>
          Your photograph will be gently animated into an ~8 second Living Memory video.
          A payment link for £14.99 will be sent to your email once your order is confirmed.
        </Text>

        {/* Order summary */}
        <View style={styles.orderSummary}>
          <View style={styles.orderRow}>
            <Ionicons name="film-outline" size={15} color={GOLD} />
            <Text style={styles.orderLabel}>Living Memory Animation</Text>
            <Text style={styles.orderPrice}>£14.99</Text>
          </View>
          <View style={styles.orderDivider} />
          <View style={styles.orderRow}>
            <Ionicons name="checkmark-circle" size={15} color="#34D399" />
            <Text style={styles.orderLabel}>MP4 delivery</Text>
            <Text style={styles.orderFree}>FREE</Text>
          </View>
          <View style={styles.orderDivider} />
          <View style={styles.orderRow}>
            <Ionicons name="sparkles" size={15} color={GOLD} />
            <Text style={[styles.orderLabel, { fontWeight: "700" }]}>Total</Text>
            <Text style={styles.orderTotal}>£14.99</Text>
          </View>
        </View>

        {/* Email input */}
        <View style={styles.emailSection}>
          <Text style={styles.emailLabel}>Your email address</Text>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#4A6A84"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.emailHint}>
            We'll send your payment link and delivery confirmation here.
          </Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.ctaBtn, (!email.trim() || !email.includes("@")) && styles.ctaBtnDisabled]}
          activeOpacity={0.87}
          onPress={startAnimation}
          disabled={!email.trim() || !email.includes("@")}
        >
          <LinearGradient
            colors={email.trim() && email.includes("@") ? [GOLD, "#A67C00"] : ["#2A3F55", "#2A3F55"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>Confirm & Animate — £14.99</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={pickPhoto} style={styles.changePhotoBtn}>
          <Text style={styles.changePhotoText}>Choose a different photo</Text>
        </TouchableOpacity>

        <Text style={styles.secureNote}>
          🔒  Secure order · No card details stored · Stripe payment link sent by email
        </Text>
      </View>
    </ScrollView>
  );

  const processingScreen = (
    <View style={styles.processingWrap}>
      <LinearGradient
        colors={["#0D1B2A", "#162236", "#0D1B2A"]}
        style={styles.processingGradient}
      >
        <LinearGradient
          colors={[GOLD, "#F5D78E", GOLD]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.heroGoldBar}
        />

        {/* Pulsing rings */}
        <View style={styles.processingRingOuter}>
          <View style={styles.processingRingMiddle}>
            <View style={styles.processingRingInner}>
              <ActivityIndicator color={GOLD} size="large" />
            </View>
          </View>
        </View>

        <Text style={styles.processingTitle}>Creating Your Living Memory</Text>
        <Text style={styles.processingMsg}>{statusMsg}</Text>
        <Text style={styles.processingEst}>
          This usually takes 3–5 minutes · Please keep the app open
        </Text>

        {/* Progress steps */}
        <View style={styles.stepsWrap}>
          {[
            "Photo uploaded securely",
            "AI analysing your photograph",
            "Generating frame-by-frame animation",
            "Rendering & quality check",
          ].map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={i === 0 ? "#34D399" : "rgba(201,150,12,0.4)"}
              />
              <Text style={[styles.stepText, i === 0 && styles.stepDone]}>{s}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );

  const doneScreen = (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Success hero */}
      <LinearGradient colors={["#0A2518", "#0F3D28"]} style={styles.doneHero}>
        <LinearGradient
          colors={["#34D399", "#10B981", "#34D399"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.heroGoldBar}
        />
        <View style={styles.doneIconWrap}>
          <Ionicons name="checkmark-circle" size={52} color="#34D399" />
        </View>
        <Text style={styles.doneTitle}>Your Living Memory is Ready</Text>
        <Text style={styles.doneSub}>
          Your photograph has been beautifully animated
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.videoReady}>
          <Ionicons name="film" size={28} color={GOLD} />
          <View style={styles.videoReadyText}>
            <Text style={styles.videoReadyTitle}>Living Memory MP4</Text>
            <Text style={styles.videoReadyDesc}>~8 seconds · ready to share</Text>
          </View>
          <View style={styles.videoReadyBadge}>
            <Text style={styles.videoReadyBadgeText}>READY</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.87} onPress={shareVideo}>
          <LinearGradient
            colors={["#34D399", "#10B981"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.ctaBtnText}>Save or Share Your Video</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.shareOptions}>
          {["💬 WhatsApp", "📸 Photos", "📧 Email", "🔗 Copy link"].map((opt) => (
            <View key={opt} style={styles.shareChip}>
              <Text style={styles.shareChipText}>{opt}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.shareNote}>
          The share sheet lets you save to Photos, send via WhatsApp, email, or any app on your iPhone.
        </Text>

        <TouchableOpacity
          style={[styles.ctaBtn, { marginTop: 4 }]}
          activeOpacity={0.87}
          onPress={() => { setStep("intro"); setPhotoUri(null); setVideoUrl(null); }}
        >
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>Animate Another Photo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const errorScreen = (
    <View style={styles.errorWrap}>
      <View style={styles.errorIconWrap}>
        <Ionicons name="alert-circle" size={52} color="#F87171" />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMsg}>{errorMsg}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => setStep("confirming")}>
        <LinearGradient
          colors={[GOLD, "#A67C00"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaBtnGradient}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const headerTitle: Record<Step, string> = {
    intro: "Living Memories",
    confirming: "Confirm Order",
    processing: "Creating Your Animation",
    done: "Animation Complete",
    error: "Error",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={step === "processing" ? undefined : onClose}
    >
      <View style={[styles.root, { paddingBottom: Platform.OS === "ios" ? insets.bottom : 16 }]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={GOLD} />
              <Text style={styles.aiBadgeText}>AI ENHANCED</Text>
            </View>
            <Text style={styles.headerTitle}>{headerTitle[step]}</Text>
          </View>
          {step !== "processing" && (
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Content */}
        {step === "intro"       && introScreen}
        {step === "confirming"  && confirmingScreen}
        {step === "processing"  && processingScreen}
        {step === "done"        && doneScreen}
        {step === "error"       && errorScreen}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK,
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
    backgroundColor: "#2A3F55",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: { gap: 4 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  /* Scroll wrapper */
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  /* Hero panel */
  heroPanel: {
    height: 200,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroGoldBar: { height: 2, position: "absolute", top: 0, left: 0, right: 0 },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(201,150,12,0.65)",
    backgroundColor: "rgba(201,150,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52,211,153,0.15)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
    letterSpacing: 1.2,
  },

  /* Body */
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 14,
  },
  bodyTitle: {
    fontSize: 21,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    lineHeight: 28,
  },
  bodyDesc: {
    fontSize: 14,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },

  /* Feature rows */
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(201,150,12,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 14,
    color: "#A8C1D8",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  /* Pricing */
  pricingCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
  },
  pricingGradient: { overflow: "hidden" },
  pricingGoldBar: { height: 3, width: "100%" },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 14,
  },
  pricingLabel: {
    fontSize: 11,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    lineHeight: 36,
  },
  pricingNote: {
    fontSize: 11,
    color: "#5A7A94",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  pricingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pricingBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },

  /* CTA */
  ctaBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 20,
    gap: 10,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  ctaBtnPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.85)",
    marginRight: 4,
  },
  ctaNote: {
    fontSize: 11,
    color: "#5A7A94",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  /* Photo preview */
  photoPreview: {
    width: "100%",
    height: 240,
  },

  /* Order summary */
  orderSummary: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    borderRadius: 14,
    overflow: "hidden",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  orderLabel: {
    flex: 1,
    fontSize: 14,
    color: "#A8C1D8",
    fontFamily: "Inter_400Regular",
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  orderFree: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  orderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(201,150,12,0.15)",
    marginHorizontal: 14,
  },

  /* Email */
  emailSection: { gap: 6 },
  emailLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8BA4BA",
    letterSpacing: 0.3,
  },
  emailInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#F5EDD8",
  },
  emailHint: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  /* Misc confirm */
  changePhotoBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  changePhotoText: {
    fontSize: 14,
    color: GOLD,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  secureNote: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    paddingBottom: 8,
  },

  /* Processing */
  processingWrap: { flex: 1 },
  processingGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  processingRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingRingMiddle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingRingInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "rgba(201,150,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  processingMsg: {
    fontSize: 14,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    minHeight: 44,
  },
  processingEst: {
    fontSize: 12,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  stepsWrap: {
    width: "100%",
    gap: 10,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.15)",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepText: {
    fontSize: 13,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
  },
  stepDone: { color: "#34D399" },

  /* Done */
  doneHero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 10,
    overflow: "hidden",
  },
  doneIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(52,211,153,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  doneSub: {
    fontSize: 13,
    color: "#34D399",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  videoReady: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(201,150,12,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    borderRadius: 14,
    padding: 14,
  },
  videoReadyText: { flex: 1, gap: 2 },
  videoReadyTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  videoReadyDesc: {
    fontSize: 12,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
  },
  videoReadyBadge: {
    backgroundColor: "rgba(52,211,153,0.15)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.4)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoReadyBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
    letterSpacing: 1,
  },
  shareOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shareChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareChipText: {
    fontSize: 12,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
  },
  shareNote: {
    fontSize: 12,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    textAlign: "center",
  },

  /* Error */
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  errorIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(248,113,113,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 14,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
});
