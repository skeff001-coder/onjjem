import AsyncStorage from "@react-native-async-storage/async-storage";
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
const FREE_USED_KEY = "onjjem_free_video_used";

type Step = "intro" | "confirming" | "processing" | "done" | "error";
type Plan = "free" | "single" | "monthly" | "annual";

const PLAN_LABELS: Record<Plan, string> = {
  free:    "FREE",
  single:  "£5.99",
  monthly: "£17.99/month",
  annual:  "£29.99/year",
};

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
  const [hasUsedFree, setHasUsedFree] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free");
  const msgIndexRef = useRef(0);

  /* Load free-video status from storage */
  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(FREE_USED_KEY).then((val) => {
        const used = val === "true";
        setHasUsedFree(used);
        setSelectedPlan(used ? "single" : "free");
      });
    }
  }, [visible]);

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
    if (selectedPlan !== "free") {
      if (!email.trim() || !email.includes("@")) {
        Alert.alert("Email required", "Please enter your email so we can send your payment link and delivery confirmation.");
        return;
      }
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
          body: JSON.stringify({ imageBase64: base64, email: email.trim(), plan: selectedPlan }),
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

      /* Mark free video as used */
      if (selectedPlan === "free") {
        await AsyncStorage.setItem(FREE_USED_KEY, "true");
        setHasUsedFree(true);
      }

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

        {/* Rich evocative description */}
        <Text style={styles.bodyDesc}>
          Imagine watching your grandmother's eyes slowly blink open. Her hair shifts softly in an unseen breeze. The light in the room seems to breathe. That smile — captured decades ago — flickers with life, just for a moment.
        </Text>
        <Text style={styles.bodyDesc}>
          That is what a Living Memory does. Our Cinema-Grade AI has been trained on millions of portraits to understand how real people actually move — the subtle drift of a gaze, the gentle rise and fall of breathing, the way emotion lives in a face. It does not simply animate your photograph. It imagines the person inside it.
        </Text>

        {/* What you'll see — detailed breakdown */}
        <View style={styles.whatYoullSeeCard}>
          <LinearGradient
            colors={["rgba(201,150,12,0.12)", "rgba(201,150,12,0.04)"]}
            style={styles.whatYoullSeeGradient}
          >
            <View style={styles.whatYoullSeeHeader}>
              <Ionicons name="sparkles" size={13} color={GOLD} />
              <Text style={styles.whatYoullSeeTitle}>What you will see in your video</Text>
            </View>
            {[
              { icon: "eye-outline" as const,            label: "Eyes that blink naturally",            detail: "Pupils shift with subtle awareness, lids close and reopen just as they would in real life" },
              { icon: "partly-sunny-outline" as const,   label: "Hair breathing in a gentle breeze",    detail: "Individual strands lift and settle — no exaggeration, just the lightest, most natural motion" },
              { icon: "body-outline" as const,           label: "A living, breathing presence",         detail: "The shoulders and chest carry a subtle rhythm of breath, giving your loved one back their vitality" },
              { icon: "sunny-outline" as const,          label: "Light that pulses and shifts",         detail: "Shadows soften, highlights warm — as if a lamp in the room flickered for just a moment" },
              { icon: "color-palette-outline" as const,  label: "Atmosphere that deepens",             detail: "Backgrounds gently pulse with life, making the scene feel like a memory recalled, not just a picture frozen" },
              { icon: "film-outline" as const,           label: "~8 seconds of HD video · MP4",        detail: "Silently looping · perfectly sized for WhatsApp, Instagram, iCloud and digital photo frames" },
            ].map((f) => (
              <View key={f.label} style={styles.whatYoullSeeRow}>
                <View style={styles.whatYoullSeeIconWrap}>
                  <Ionicons name={f.icon} size={15} color={GOLD} />
                </View>
                <View style={styles.whatYoullSeeText}>
                  <Text style={styles.whatYoullSeeLabel}>{f.label}</Text>
                  <Text style={styles.whatYoullSeeDetail}>{f.detail}</Text>
                </View>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Emotional testimonial-style quote */}
        <View style={styles.quoteCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={GOLD} style={{ marginBottom: 6 }} />
          <Text style={styles.quoteText}>
            "I had not seen my father move in thirty years. Watching this video, I burst into tears. It is the greatest gift I have ever received."
          </Text>
          <Text style={styles.quoteAuthor}>— Margaret, Suffolk</Text>
        </View>

        {/* ── PRICING ── */}
        {!hasUsedFree ? (
          /* First visit — free offer */
          <View style={styles.pricingCard}>
            <LinearGradient colors={[DARK, NAVY]} style={styles.pricingGradient}>
              <LinearGradient
                colors={[GOLD, "#F5D78E", GOLD]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.pricingGoldBar}
              />

              {/* FREE banner */}
              <View style={styles.freeBanner}>
                <Ionicons name="gift-outline" size={18} color={GOLD} />
                <View style={styles.freeBannerText}>
                  <Text style={styles.freeBannerTitle}>Your first video is FREE</Text>
                  <Text style={styles.freeBannerSub}>No payment, no card — just your photo</Text>
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
                  <Text style={styles.ctaBtnText}>Get My FREE Living Memory</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Future pricing preview */}
              <Text style={styles.futurePricingLabel}>After your free video:</Text>
              <View style={styles.planPreviewRow}>
                {[
                  { label: "Per video", price: "£5.99" },
                  { label: "Monthly", price: "£17.99" },
                  { label: "Annual", price: "£29.99" },
                ].map((p) => (
                  <View key={p.label} style={styles.planPreviewChip}>
                    <Text style={styles.planPreviewPrice}>{p.price}</Text>
                    <Text style={styles.planPreviewLabel}>{p.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        ) : (
          /* Returning visitor — plan selector */
          <View style={styles.pricingCard}>
            <LinearGradient colors={[DARK, NAVY]} style={styles.pricingGradient}>
              <LinearGradient
                colors={[GOLD, "#F5D78E", GOLD]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.pricingGoldBar}
              />
              <Text style={styles.planSectionTitle}>Choose your plan</Text>

              {/* Single */}
              <TouchableOpacity
                style={[styles.planRow, selectedPlan === "single" && styles.planRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan("single")}
              >
                <View style={[styles.planRadio, selectedPlan === "single" && styles.planRadioSelected]}>
                  {selectedPlan === "single" && <View style={styles.planRadioDot} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Single video</Text>
                  <Text style={styles.planDesc}>One Living Memory · MP4 delivered · yours to keep</Text>
                </View>
                <Text style={styles.planPrice}>£5.99</Text>
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                style={[styles.planRow, selectedPlan === "monthly" && styles.planRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan("monthly")}
              >
                <View style={[styles.planRadio, selectedPlan === "monthly" && styles.planRadioSelected]}>
                  {selectedPlan === "monthly" && <View style={styles.planRadioDot} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planDesc}>Unlimited Living Memories · cancel anytime</Text>
                </View>
                <View style={styles.planPriceWrap}>
                  <Text style={styles.planPrice}>£17.99</Text>
                  <Text style={styles.planPricePer}>/month</Text>
                </View>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              </TouchableOpacity>

              {/* Annual */}
              <TouchableOpacity
                style={[styles.planRow, selectedPlan === "annual" && styles.planRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan("annual")}
              >
                <View style={[styles.planRadio, selectedPlan === "annual" && styles.planRadioSelected]}>
                  {selectedPlan === "annual" && <View style={styles.planRadioDot} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Annual — Best Value</Text>
                  <Text style={styles.planDesc}>Unlimited all year · less than 58p per week</Text>
                </View>
                <View style={styles.planPriceWrap}>
                  <Text style={styles.planPrice}>£29.99</Text>
                  <Text style={styles.planPricePer}>/year</Text>
                </View>
                <View style={[styles.popularBadge, styles.bestValueBadge]}>
                  <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                </View>
              </TouchableOpacity>

              {/* Annual expanded detail — shown when annual is selected */}
              {selectedPlan === "annual" && (
                <View style={styles.annualDetailCard}>
                  <LinearGradient
                    colors={["rgba(52,211,153,0.08)", "rgba(52,211,153,0.03)"]}
                    style={styles.annualDetailGradient}
                  >
                    <View style={styles.annualDetailHeader}>
                      <Ionicons name="checkmark-circle" size={14} color="#34D399" />
                      <Text style={styles.annualDetailHeading}>Everything included in your £29.99 annual plan</Text>
                    </View>
                    {[
                      { icon: "infinite-outline" as const,        text: "Unlimited Living Memory videos — every person, every occasion, all year long" },
                      { icon: "flash-outline" as const,           text: "Priority AI processing — your video goes to the front of the queue, every time" },
                      { icon: "film-outline" as const,            text: "Full HD 1080p output — the sharpest, most detailed animation we can produce" },
                      { icon: "shield-checkmark-outline" as const,text: "Watermark-free — your video belongs entirely to you, with no ONJJEM branding" },
                      { icon: "cloud-upload-outline" as const,    text: "Save to your Photos, iCloud, or share directly to WhatsApp, Instagram & email" },
                      { icon: "people-outline" as const,          text: "Whole family covered — parents, grandparents, children, group shots, pets" },
                      { icon: "ribbon-outline" as const,          text: "ONJJEM Master Lab quality guarantee — if you are ever unhappy, we re-do it free" },
                      { icon: "headset-outline" as const,         text: "Dedicated priority support — speak directly with our restoration experts" },
                    ].map((item) => (
                      <View key={item.text} style={styles.annualDetailRow}>
                        <View style={styles.annualDetailIconWrap}>
                          <Ionicons name={item.icon} size={13} color="#34D399" />
                        </View>
                        <Text style={styles.annualDetailText}>{item.text}</Text>
                      </View>
                    ))}
                    <View style={styles.annualSavingBadge}>
                      <Text style={styles.annualSavingText}>
                        Animate every week for a year — that is just 58p per Living Memory
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

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
                  <Text style={styles.ctaBtnText}>
                    Choose a Photo · {PLAN_LABELS[selectedPlan]}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.ctaNote}>
                Secure order · payment link sent to your email · results in 3–5 minutes
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>
    </ScrollView>
  );

  /* ── Price shown on confirming screen ── */
  const confirmPrice = selectedPlan === "free"
    ? "FREE"
    : selectedPlan === "single"
    ? "£5.99"
    : selectedPlan === "monthly"
    ? "£17.99/month"
    : "£29.99/year";

  const confirmingScreen = (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
      )}

      <View style={styles.body}>
        <Text style={styles.bodyTitle}>
          {selectedPlan === "free" ? "Confirm your free video" : "Confirm your order"}
        </Text>
        <Text style={styles.bodyDesc}>
          {selectedPlan === "free"
            ? "Your photograph will be gently animated into an ~8 second Living Memory video — completely free."
            : `Your photograph will be animated into an ~8 second Living Memory MP4. A payment link for ${confirmPrice} will be sent to your email.`}
        </Text>

        {/* Order summary */}
        <View style={styles.orderSummary}>
          <View style={styles.orderRow}>
            <Ionicons name="film-outline" size={15} color={GOLD} />
            <Text style={styles.orderLabel}>Living Memory Animation</Text>
            <Text style={selectedPlan === "free" ? styles.orderFree : styles.orderPrice}>
              {confirmPrice}
            </Text>
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
            <Text style={selectedPlan === "free" ? styles.orderFree : styles.orderTotal}>
              {confirmPrice}
            </Text>
          </View>
        </View>

        {/* Email input — always shown; required for paid plans */}
        <View style={styles.emailSection}>
          <Text style={styles.emailLabel}>
            {selectedPlan === "free" ? "Your email (optional — for delivery confirmation)" : "Your email address"}
          </Text>
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
            {selectedPlan === "free"
              ? "We'll send your video link here."
              : "We'll send your payment link and delivery confirmation here."}
          </Text>
        </View>

        {/* Confirm button */}
        {selectedPlan === "free" ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.87}
            onPress={startAnimation}
          >
            <LinearGradient
              colors={[GOLD, "#A67C00"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtnGradient}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Animate for FREE</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
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
              <Text style={styles.ctaBtnText}>Confirm & Animate · {confirmPrice}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={pickPhoto} style={styles.changePhotoBtn}>
          <Text style={styles.changePhotoText}>Choose a different photo</Text>
        </TouchableOpacity>

        {selectedPlan !== "free" && (
          <Text style={styles.secureNote}>
            🔒  Secure order · No card details stored · Stripe payment link sent by email
          </Text>
        )}
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
        <Text style={styles.doneSub}>Your photograph has been beautifully animated</Text>
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

        {/* Animate another — show upsell if they just used free */}
        <View style={styles.animateAnotherCard}>
          <LinearGradient colors={[DARK, NAVY]} style={styles.animateAnotherGradient}>
            <LinearGradient
              colors={[GOLD, "#F5D78E", GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.pricingGoldBar}
            />
            <Text style={styles.animateAnotherTitle}>Animate another photo</Text>
            <View style={styles.miniPlanRow}>
              {[
                { label: "Per video", price: "£5.99" },
                { label: "/month", price: "£17.99" },
                { label: "/year", price: "£29.99" },
              ].map((p) => (
                <View key={p.label} style={styles.miniPlanChip}>
                  <Text style={styles.miniPlanPrice}>{p.price}</Text>
                  <Text style={styles.miniPlanLabel}>{p.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.ctaBtn, { marginTop: 4 }]}
              activeOpacity={0.87}
              onPress={() => { setStep("intro"); setPhotoUri(null); setVideoUrl(null); setSelectedPlan("single"); }}
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
          </LinearGradient>
        </View>
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
    intro:      "Living Memories",
    confirming: "Confirm Order",
    processing: "Creating Your Animation",
    done:       "Animation Complete",
    error:      "Error",
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

  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

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

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(201,150,12,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 13,
    color: "#C5D8E8",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  /* What you'll see card */
  whatYoullSeeCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
  },
  whatYoullSeeGradient: {
    padding: 16,
    gap: 12,
  },
  whatYoullSeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },
  whatYoullSeeTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.6,
  },
  whatYoullSeeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  whatYoullSeeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(201,150,12,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  whatYoullSeeText: { flex: 1, gap: 2 },
  whatYoullSeeLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  whatYoullSeeDetail: {
    fontSize: 12,
    color: "#6B8EA8",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  /* Testimonial quote */
  quoteCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.15)",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  quoteText: {
    fontSize: 13,
    color: "#C5D8E8",
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    textAlign: "center",
    fontStyle: "italic",
  },
  quoteAuthor: {
    fontSize: 11,
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginTop: 4,
  },

  /* Annual plan expanded detail */
  annualDetailCard: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },
  annualDetailGradient: {
    padding: 14,
    gap: 10,
  },
  annualDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },
  annualDetailHeading: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
    flex: 1,
    lineHeight: 16,
  },
  annualDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  annualDetailIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(52,211,153,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  annualDetailText: {
    fontSize: 12,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  annualSavingBadge: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  annualSavingText: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
    textAlign: "center",
    lineHeight: 18,
  },

  /* Pricing card */
  pricingCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
  },
  pricingGradient: {
    padding: 18,
    gap: 14,
  },
  pricingGoldBar: { height: 2, position: "absolute", top: 0, left: 0, right: 0 },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pricingLabel: {
    fontSize: 11,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  pricingAmount: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  pricingNote: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  pricingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pricingBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },

  /* Free banner */
  freeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 12,
    padding: 14,
  },
  freeBannerText: { flex: 1, gap: 2 },
  freeBannerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  freeBannerSub: {
    fontSize: 12,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
  },

  /* Future pricing preview */
  futurePricingLabel: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  planPreviewRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  planPreviewChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  planPreviewPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#C5D8E8",
  },
  planPreviewLabel: {
    fontSize: 10,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
  },

  /* Plan selector */
  planSectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8BA4BA",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
  },
  planRowSelected: {
    backgroundColor: "rgba(201,150,12,0.1)",
    borderColor: "rgba(201,150,12,0.5)",
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2A3F55",
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioSelected: {
    borderColor: GOLD,
  },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
  },
  planInfo: { flex: 1, gap: 2 },
  planName: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  planDesc: {
    fontSize: 11,
    color: "#8BA4BA",
    fontFamily: "Inter_400Regular",
  },
  planPriceWrap: { alignItems: "flex-end" },
  planPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  planPricePer: {
    fontSize: 10,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: 10,
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bestValueBadge: {
    backgroundColor: "#34D399",
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.6,
  },

  /* CTA button */
  ctaBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  ctaBtnPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.8)",
  },
  ctaNote: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
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
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderLabel: {
    flex: 1,
    fontSize: 13,
    color: "#C5D8E8",
    fontFamily: "Inter_400Regular",
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  orderFree: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#34D399",
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  orderDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  /* Email */
  emailSection: { gap: 8 },
  emailLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_700Bold",
    color: "#C5D8E8",
  },
  emailInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#F5EDD8",
    fontFamily: "Inter_400Regular",
  },
  emailHint: {
    fontSize: 11,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
  },

  changePhotoBtn: { alignSelf: "center", paddingVertical: 4 },
  changePhotoText: {
    fontSize: 13,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  secureNote: {
    fontSize: 11,
    color: "#34D399",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  /* Processing */
  processingWrap: { flex: 1 },
  processingGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 28,
  },
  processingRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingRingMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(201,150,12,0.65)",
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
  },
  processingEst: {
    fontSize: 12,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  stepsWrap: { gap: 8, alignSelf: "stretch", marginTop: 8 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepText: {
    fontSize: 13,
    color: "rgba(201,150,12,0.45)",
    fontFamily: "Inter_400Regular",
  },
  stepDone: { color: "#34D399" },

  /* Done */
  doneHero: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
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

  /* Animate another card */
  animateAnotherCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
  },
  animateAnotherGradient: {
    padding: 18,
    gap: 12,
  },
  animateAnotherTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
    textAlign: "center",
  },
  miniPlanRow: {
    flexDirection: "row",
    gap: 8,
  },
  miniPlanChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  miniPlanPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  miniPlanLabel: {
    fontSize: 10,
    color: "#4A6A84",
    fontFamily: "Inter_400Regular",
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
