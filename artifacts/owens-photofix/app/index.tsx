import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ProPaywall } from "@/components/ProPaywall";
import { ContactExpertsModal } from "@/components/ContactExpertsModal";
import { ReferralModal } from "@/components/ReferralModal";
import { LivingMemoriesModal } from "@/components/LivingMemoriesModal";
import { GraffitiTitle } from "@/components/GraffitiTitle";
import { TrustFooter } from "@/components/TrustFooter";

type Mode = "sharpen" | "colorize";
type AppState = "idle" | "selected" | "processing" | "done";


const GALLERY_POOL = [
  require("@/assets/gallery/childhood_before.png"),
  require("@/assets/gallery/childhood_after.png"),
  require("@/assets/gallery/grandma_before.png"),
  require("@/assets/gallery/grandma_after.png"),
  require("@/assets/gallery/portrait_before.png"),
  require("@/assets/gallery/portrait_after.png"),
  require("@/assets/gallery/victorian_before.png"),
  require("@/assets/gallery/victorian_after.png"),
  require("@/assets/gallery/wedding_before.png"),
  require("@/assets/gallery/wedding_after.png"),
];

const { height: SCREEN_H } = Dimensions.get("window");

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [paywallVisible, setPaywallVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [referralVisible, setReferralVisible] = useState(false);
  const [livingMemoriesVisible, setLivingMemoriesVisible] = useState(false);
  const [appState, setAppState] = useState<AppState>("idle");
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [resultLocalUri, setResultLocalUri] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("sharpen");
  const [statusMessage, setStatusMessage] = useState("Preparing...");
  const msgIndexRef = useRef(0);
  const cancelledRef = useRef(false);

  const COMFORT_MESSAGES = [
    "Restoring your photo to our highest standards…",
    "Analysing every precious detail of your photograph…",
    "Applying our Cinema-Grade AI restoration…",
    "Our master process is working its magic…",
    "Bringing out every fine detail with care…",
    "Calibrating tones and colour with expert precision…",
    "Almost there — perfecting the final touches…",
    "Your masterpiece is nearly ready…",
  ];

  useEffect(() => {
    if (appState !== "processing") return;
    msgIndexRef.current = 0;
    setStatusMessage(COMFORT_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIndexRef.current = (msgIndexRef.current + 1) % COMFORT_MESSAGES.length;
      setStatusMessage(COMFORT_MESSAGES[msgIndexRef.current]);
    }, 4000);
    return () => clearInterval(interval);
  }, [appState]);

  const bgImages = useMemo(() => {
    const shuffled = [...GALLERY_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, []);

  // Best available photo URI to show in print mockups
  const previewUri: string | null =
    appState === "done" && resultBase64
      ? `data:image/jpeg;base64,${resultBase64}`
      : originalUri;

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to use this app.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      const commitPhoto = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setOriginalUri(asset.uri);
        setResultBase64(null);
        setResultLocalUri(null);
        setAppState("selected");
      };

      // Hard-stop quality gate: 200 DPI minimum for a 4-inch minimum print dimension
      const imgW = asset.width ?? 0;
      const imgH = asset.height ?? 0;
      const MIN_PX = 800; // 200 DPI × 4 inches
      if (imgW > 0 && imgH > 0 && Math.min(imgW, imgH) < MIN_PX) {
        Alert.alert(
          "Low Quality Photo",
          `This image is only ${imgW}×${imgH} pixels.\n\nFor print-quality results at 200 DPI we recommend at least 1600×1200 pixels. At this resolution the maximum print size is approximately ${(imgW / 200).toFixed(1)}″ × ${(imgH / 200).toFixed(1)}″.\n\nFor the best prints, please choose a higher-resolution photo.`,
          [
            { text: "Choose Different Photo", style: "cancel" },
            { text: "Use Anyway", onPress: commitPhoto },
          ],
          { cancelable: false },
        );
        return;
      }

      await commitPhoto();
    }
  };

  const cancelProcessing = () => {
    cancelledRef.current = true;
    setAppState("selected");
  };

  const processPhoto = async () => {
    if (!originalUri) return;

    cancelledRef.current = false;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAppState("processing");

    try {
      // Read image as base64 — web returns blob: URIs that FileSystem cannot handle
      let base64: string;
      const isWebUri =
        originalUri.startsWith("blob:") ||
        (originalUri.startsWith("http") && !originalUri.startsWith("https://localhost"));

      if (isWebUri) {
        const resp = await fetch(originalUri);
        if (cancelledRef.current) return;
        const blob = await resp.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1] ?? "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(originalUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (cancelledRef.current) return;

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error("API domain not configured — please contact support.");
      const apiUrl = `https://${domain}/api/process`;

      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 90_000);

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mode }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(fetchTimeoutId);
      }

      if (cancelledRef.current) return;

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Processing failed");
      }

      const b64: string = data.resultBase64;
      setResultBase64(b64);

      // Save to local filesystem on native only
      if (!isWebUri) {
        const localPath =
          (FileSystem.documentDirectory ?? "") + "photofix_result.jpg";
        await FileSystem.writeAsStringAsync(localPath, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setResultLocalUri(localPath);
      }

      if (!cancelledRef.current) {
        setAppState("done");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      if (cancelledRef.current) return;
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setAppState("selected");
      Alert.alert("Restoration Failed", message, [{ text: "Try Again" }]);
    }
  };

  const saveToLibrary = async () => {
    if (!resultLocalUri) return;

    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Saving to Photos is only available on iPhone.");
      return;
    }

    try {
      const MediaLibrary = await import("expo-media-library");
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow access to your Photos library to save images.",
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(resultLocalUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your enhanced photo has been saved to your Photos library.");
    } catch {
      Alert.alert("Error", "Could not save to Photos. Please try again.");
    }
  };

  const shareOnWhatsApp = async () => {
    if (!resultLocalUri) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (Platform.OS === "web") {
        Alert.alert("Share", "Open WhatsApp and share the saved image.");
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not supported on this device.",
        );
        return;
      }

      await Sharing.shareAsync(resultLocalUri, {
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
        dialogTitle: "Share your fixed photo",
      });
    } catch {
      Alert.alert("Error", "Could not share the image. Please try again.");
    }
  };

  const resetApp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppState("idle");
    setOriginalUri(null);
    setResultBase64(null);
    setResultLocalUri(null);
  };

  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      {/* Background photo mosaic */}
      <View style={s.bgMosaic}>
        {bgImages.map((src, i) => (
          <Image key={i} source={src} style={s.bgTile} resizeMode="cover" />
        ))}
      </View>
      <LinearGradient
        colors={["rgba(18,10,0,0.38)", "rgba(245,235,210,0.72)"]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}
      />

      {/* Promo announcement banner */}
      <LinearGradient
        colors={["#1C1A14", "#2E2818"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.promoBanner}
      >
        <Ionicons name="sparkles" size={13} color="#F5D78E" />
        <Text style={s.promoBannerText}>
          NEW CUSTOMERS: Get <Text style={s.promoBannerBold}>£10 OFF</Text> your first order over £20 · code:{" "}
          <Text style={s.promoBannerCode}>EXPERT10</Text>
        </Text>
      </LinearGradient>

      <View style={s.header}>
        <View style={s.headerCenter}>
          <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} activeOpacity={0.8}>
            <GraffitiTitle fontSize={52} letterSpacing={9} />
          </TouchableOpacity>

          <Text style={s.headerTagline}>Bringing your Gems of Love to Life</Text>
        </View>
        {appState !== "idle" && (
          <TouchableOpacity onPress={resetApp} style={s.resetBtn}>
            <Ionicons name="refresh" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {appState === "idle" && (
          <>
            {/* Masterpiece Gallery button */}
            <TouchableOpacity
              style={s.galleryBtn}
              onPress={() => router.push("/gallery")}
              activeOpacity={0.88}
            >
              <Ionicons name="images-outline" size={20} color="#C9960C" />
              <Text style={s.galleryBtnText}>Masterpiece Gallery</Text>
              <Ionicons name="chevron-forward" size={16} color="#C9960C" />
            </TouchableOpacity>

            <Pressable
              style={({ pressed }) => [s.uploadArea, pressed && s.pressed]}
              onPress={pickImage}
            >
              <View style={s.uploadInner}>
                <View style={s.uploadIconWrap}>
                  <Ionicons name="image-outline" size={28} color="#C9960C" />
                </View>
                <View style={s.uploadTextWrap}>
                  <Text style={s.uploadTitle}>Upload a Photo</Text>
                  <Text style={s.uploadSub}>Tap to restore your memories</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(201,150,12,0.55)" />
              </View>
              <View style={{ alignItems: "center", paddingVertical: 22, paddingBottom: 10 }}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={{ width: 130, height: 130, borderRadius: 28 }}
                  resizeMode="contain"
                />
              </View>
            </Pressable>

            {/* Living Memories */}
            <TouchableOpacity
              style={s.livingMemoriesBtn}
              onPress={() => setLivingMemoriesVisible(true)}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={["#0D1B2A", "#162236"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.livingMemoriesBtnGradient}
              >
                <LinearGradient
                  colors={[colors.primary, "#F5D78E", colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.livingMemoriesGoldBar}
                />
                <View style={s.livingMemoriesRow}>
                  <View style={s.livingMemoriesIconWrap}>
                    <Text style={s.livingMemoriesIconEmoji}>🎬</Text>
                  </View>
                  <View style={s.livingMemoriesTextWrap}>
                    <View style={s.livingMemoriesTopRow}>
                      <Text style={s.livingMemoriesTitle}>
                        Your first Living Memory is FREE
                      </Text>
                      <View style={s.livingMemoriesAiBadge}>
                        <Ionicons name="sparkles" size={9} color={colors.primary} />
                        <Text style={s.livingMemoriesAiBadgeText}>AI</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* ── CANVAS PRINTS — STANDALONE HERO ── */}
            <TouchableOpacity
              style={s.canvasHeroGlow}
              onPress={() => router.push("/canvas-prints")}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={["#0D1B2A", "#162236", "#0A1520"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.canvasHero}
              >
                <LinearGradient
                  colors={["#C9960C", "#F5D78E", "#C9960C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.canvasHeroGoldBar}
                />
                <View style={s.canvasHeroInner}>
                  <View style={s.canvasHeroLeft}>
                    <View style={s.canvasHeroEyebrowRow}>
                      <Ionicons name="sparkles" size={10} color="#C9960C" />
                      <Text style={s.canvasHeroEyebrow}>ONJJEM SIGNATURE · #1 BESTSELLER</Text>
                    </View>
                    <Text style={s.canvasHeroTitle}>Canvas Prints</Text>
                    <Text style={s.canvasHeroSub}>
                      Your restored photo hand-stretched on a premium gallery frame — ready to hang, delivered to your door
                    </Text>
                    <View style={s.canvasHeroChipRow}>
                      {["A4 · A3 · A2 · A1", "Ready to Hang", "Lifetime Guarantee"].map((c) => (
                        <View key={c} style={s.canvasHeroChip}>
                          <Text style={s.canvasHeroChipText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={s.canvasHeroRight}>
                    <Ionicons name="chevron-forward" size={18} color="rgba(201,150,12,0.7)" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.giftBtnGlow}
              onPress={() => router.push("/gift-shop")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#0A0A0A", "#111111", "#0A0A0A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.giftBtn}
              >
                <LinearGradient
                  colors={["#C9960C", "#F5D78E", "#C9960C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.giftBtnGoldBar}
                />
                <View style={s.giftBtnInner}>
                  <View style={s.giftBtnTop}>
                    <View style={s.giftBtnIconWrap}>
                      <Text style={s.giftBtnIconEmoji}>🎁</Text>
                    </View>
                    <View style={s.giftBtnTitleWrap}>
                      <Text style={s.giftBtnLabel}>OUR GIFT STORE</Text>
                      <Text style={s.giftBtnText}>Candles · Cushions · Jigsaws · Throws</Text>
                    </View>
                    <View style={s.giftBtnCountBadge}>
                      <Text style={s.giftBtnCountText}>50+</Text>
                      <Text style={s.giftBtnCountSub}>gifts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View style={s.giftBtnChipRow}>
                    {["Candles", "Cushions", "Jigsaws", "Throws", "& More"].map((tag) => (
                      <View key={tag} style={s.giftBtnChip}>
                        <Text style={s.giftBtnChipText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Referral button */}
            <TouchableOpacity
              style={s.referralBtn}
              onPress={() => setReferralVisible(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#1A0C04", "#2C1608", "#1A0C04"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.referralBtnGradient}
              >
                <Text style={s.referralBtnEmoji}>🎁</Text>
                <View style={s.referralBtnTextWrap}>
                  <Text style={s.referralBtnPrimary}>Give £10, Get £10</Text>
                  <Text style={s.referralBtnSub}>Share the Memories</Text>
                </View>
                <View style={s.referralBtnBadge}>
                  <Text style={s.referralBtnBadgeText}>REFER</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </>
        )}

        {appState === "selected" && originalUri && (
          <View style={s.imageBlock}>
            <Text style={s.imageLabel}>Selected Photo</Text>
            <Image source={{ uri: originalUri }} style={s.image} />
          </View>
        )}

        {appState === "processing" && (
          <LinearGradient
            colors={["#1C1A14", "#2E2A1E"]}
            style={s.processingBox}
          >
            <View style={s.processingCrownWrap}>
              <Text style={s.processingCrown}>👑</Text>
            </View>
            <ActivityIndicator size="large" color="#C9960C" />
            <Text style={s.processingTitle}>ONJJEM Master Restoration</Text>
            <Text style={s.processingText}>{statusMessage}</Text>
            <View style={s.processingDivider} />
            <Text style={s.processingNote}>
              Our Cinema-Grade AI is working on your photograph with the care it deserves.
            </Text>
            <TouchableOpacity
              onPress={cancelProcessing}
              activeOpacity={0.7}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {appState === "done" && originalUri && resultBase64 && (
          <View style={s.imageBlock}>
            <Text style={s.imageLabel}>
              {mode === "sharpen" ? "Sharpened" : "Colour Restored"} — drag to
              compare
            </Text>
            <BeforeAfterSlider
              beforeUri={originalUri}
              afterBase64={resultBase64}
            />
          </View>
        )}

        {appState === "selected" && (
          <>
            <Text style={s.sectionTitle}>Choose Enhancement</Text>
            <View style={s.modeRow}>
              <TouchableOpacity
                style={[
                  s.modeBtn,
                  mode === "sharpen" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setMode("sharpen");
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="sparkles"
                  size={28}
                  color={mode === "sharpen" ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    s.modeBtnTitle,
                    mode === "sharpen" && { color: "#fff" },
                  ]}
                >
                  Sharpen
                </Text>
                <Text
                  style={[
                    s.modeBtnSub,
                    mode === "sharpen" && {
                      color: "rgba(255,255,255,0.75)",
                    },
                  ]}
                >
                  Fix blurry{"\n"}photos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.modeBtn,
                  mode === "colorize" && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => {
                  setMode("colorize");
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="palette-outline"
                  size={28}
                  color={
                    mode === "colorize" ? "#000" : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    s.modeBtnTitle,
                    mode === "colorize" && { color: "#000" },
                  ]}
                >
                  Colourise
                </Text>
                <Text
                  style={[
                    s.modeBtnSub,
                    mode === "colorize" && { color: "rgba(0,0,0,0.6)" },
                  ]}
                >
                  Restore colour{"\n"}to old photos
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.processBtn}
              onPress={processPhoto}
              activeOpacity={0.85}
            >
              <Ionicons name="color-wand" size={26} color="#fff" />
              <Text style={s.processBtnText}>Fix My Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Text style={s.secondaryBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {appState === "done" && (
          <>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={saveToLibrary}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={26} color="#fff" />
              <Text style={s.saveBtnText}>Save to Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={shareOnWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#fff" />
              <Text style={s.whatsappBtnText}>Share on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => {
                setResultBase64(null);
                setResultLocalUri(null);
                setAppState("selected");
              }}
              activeOpacity={0.7}
            >
              <Text style={s.secondaryBtnText}>Try Different Enhancement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.ghostBtn}
              onPress={resetApp}
              activeOpacity={0.7}
            >
              <Text style={s.ghostBtnText}>Fix Another Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Anniversary & Jubilee Collection */}
        <TouchableOpacity
          style={s.jubileeBtn}
          onPress={() => router.push("/gift-shop?tab=anniversaries")}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={["#080808", "#0E0E0E", "#050505"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.jubileeGradient}
          >
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#A8E6FF", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.jubileeGoldBar}
            />
            <View style={s.jubileeInner}>
              {/* Header row */}
              <View style={s.jubileeHeaderRow}>
                <View style={s.jubileeIconWrap}>
                  <Text style={s.jubileeEmoji}>💎</Text>
                </View>
                <View style={s.jubileeTextWrap}>
                  <Text style={s.jubileeEyebrow}>ANNIVERSARY &amp; JUBILEE COLLECTION</Text>
                  <Text style={s.jubileeTitle}>Celebrate a Lifetime of Love</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#C9960C" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Feature Walls */}
        <TouchableOpacity
          style={s.featureWallsBtn}
          onPress={() => router.push("/feature-walls")}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={["#1C1A14", "#2E2A1E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.featureWallsGradient}
          >
            <LinearGradient
              colors={[colors.primary, "#F5D78E", colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.featureWallsGoldBar}
            />
            <View style={s.featureWallsRow}>
              <View style={s.featureWallsIconWrap}>
                <Text style={s.featureWallsEmoji}>🖼️</Text>
              </View>
              <View style={s.featureWallsTextWrap}>
                <Text style={s.featureWallsTitle}>Bespoke Feature Walls</Text>
                <Text style={s.featureWallsSub}>Custom murals up to 4m × 3m · Heritage & Wedding</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Collections Directory */}
        <View style={s.collectionsDir}>
          <View style={s.collectionsDirHeader}>
            <Text style={s.collectionsDirEyebrow}>ONJJEM COLLECTIONS</Text>
            <Text style={s.collectionsDirTitle}>Explore Our Gift Range</Text>
          </View>
          <View style={s.collectionsDirCard}>
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.collectionsDirGoldBar}
            />
            {([
              { label: "Jubilees & Anniversaries", sub: "Silver · Ruby · Golden · Diamond · Platinum", icon: "diamond-outline" as const, route: "/gift-shop?tab=anniversaries" },
              { label: "Canvas & Fine Art Prints",  sub: "Gallery-stretched · A4 to A0 · Ready to hang", icon: "image-outline" as const,   route: "/gift-shop?tab=prints" },
              { label: "Lounge & Home Gifts",       sub: "Cushions · Luxury throws · Silk keepsakes",   icon: "home-outline" as const,    route: "/gift-shop?tab=lounge" },
              { label: "Heritage Jigsaws",           sub: "Heart · Collage · Cardboard · Premium wood",  icon: "grid-outline" as const,    route: "/gift-shop?tab=heritage_jigsaws" },
            ] as const).map((col, i, arr) => (
              <TouchableOpacity
                key={col.label}
                style={[s.collectionRow, i < arr.length - 1 && s.collectionRowBorder]}
                onPress={() => router.push(col.route as Parameters<typeof router.push>[0])}
                activeOpacity={0.8}
              >
                <View style={s.collectionRowIconWrap}>
                  <Ionicons name={col.icon} size={18} color="#C9960C" />
                </View>
                <View style={s.collectionRowText}>
                  <Text style={s.collectionRowLabel}>{col.label}</Text>
                  <Text style={s.collectionRowSub}>{col.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(201,150,12,0.6)" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={s.collectionsCtaBtn}
            onPress={() => router.push("/gift-shop")}
            activeOpacity={0.87}
          >
            <LinearGradient
              colors={["#C9960C", "#A67C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.collectionsCtaGradient}
            >
              <Ionicons name="gift-outline" size={18} color="#fff" />
              <Text style={s.collectionsCtaText}>Browse the Full Gift Shop</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TrustFooter />

        {/* Contact Support — very bottom */}
        <TouchableOpacity
          style={s.contactSupportBtn}
          onPress={() => router.push("/contact")}
          activeOpacity={0.8}
        >
          <Ionicons name="headset-outline" size={18} color={colors.mutedForeground} />
          <Text style={s.contactSupportText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>

      {/* Contact our experts button */}
      <View style={s.contactBtnWrapper}>
        <TouchableOpacity
          style={s.contactBtn}
          onPress={() => setContactVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={s.contactBtnText}>Contact Our Experts</Text>
        </TouchableOpacity>
      </View>

      <ProPaywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      <ContactExpertsModal visible={contactVisible} onClose={() => setContactVisible(false)} />
      <ReferralModal visible={referralVisible} onClose={() => setReferralVisible(false)} />
      <LivingMemoriesModal visible={livingMemoriesVisible} onClose={() => setLivingMemoriesVisible(false)} />
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
  insets: { top: number; bottom: number; left: number; right: number },
) {
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bgMosaic: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    bgTile: {
      width: "50%",
      height: SCREEN_H / 3,
    },
    header: {
      paddingTop: 16,
      paddingHorizontal: 24,
      paddingBottom: 14,
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerCenter: {
      alignItems: "center" as const,
    },
    headerTitleTop: {
      fontSize: 52,
      fontFamily: "BebasNeue_400Regular",
      color: colors.foreground,
      letterSpacing: 6,
      lineHeight: 54,
    },
    headerTagline: {
      fontSize: 16,
      fontFamily: "Cinzel_400Regular",
      color: "#C9960C",
      letterSpacing: 1,
      marginTop: 5,
      fontStyle: "italic" as const,
      textAlign: "center" as const,
      textShadowColor: "rgba(201,150,12,0.55)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    gemRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 5,
      marginTop: 6,
      marginBottom: 2,
    },
    gemDot: {
      fontSize: 9,
      opacity: 0.85,
    },
    headerTaglineHeart: {
      fontSize: 17,
      color: "#C9960C",
      fontStyle: "normal" as const,
    },
    headerAwardRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      marginTop: 5,
      backgroundColor: "rgba(201,150,12,0.12)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start" as const,
    },
    headerAwardStar: {
      fontSize: 12,
    },
    headerAwardText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: "#A67C00",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    resetBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: bottomPad,
      gap: 16,
    },
    uploadArea: {
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "#E8D48B",
      borderStyle: "dashed",
      backgroundColor: "#FDF6DC",
      marginTop: 0,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    uploadInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    uploadThumbRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 6,
      gap: 6,
    },
    uploadThumb: {
      width: 72,
      height: 52,
      borderRadius: 8,
      flex: 1,
    },
    uploadThumbArrow: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#FDF6DC",
      borderWidth: 1,
      borderColor: "#E8D48B",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    uploadThumbSpacer: {
      flex: 1,
    },
    uploadThumbAppIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      flexShrink: 0,
    },
    uploadIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(201,150,12,0.12)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    uploadBARow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
      paddingBottom: 12,
      gap: 6,
    },
    uploadBAPair: {
      alignItems: "center" as const,
      gap: 3,
    },
    uploadBAImg: {
      width: 62,
      height: 52,
      borderRadius: 7,
      backgroundColor: "#EDE8DC",
    },
    uploadBALabel: {
      fontSize: 9,
      fontFamily: "Inter_500Medium",
      color: "#7A6E57",
      letterSpacing: 0.3,
    },
    uploadBAArrow: {
      marginBottom: 12,
    },
    uploadBADivider: {
      width: 1,
      height: 44,
      backgroundColor: "rgba(201,150,12,0.25)",
      marginHorizontal: 2,
    },
    uploadTextWrap: {
      flex: 1,
      gap: 2,
    },
    uploadTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: "#C9960C",
      fontFamily: "Cinzel_400Regular",
    },
    uploadSub: {
      fontSize: 12,
      color: "#7A6E57",
      fontFamily: "Inter_400Regular",
    },
    /* Canvas hero */
    canvasHeroGlow: {
      borderRadius: 18,
      shadowColor: "#C9960C",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.4)",
    },
    canvasHero: {
      borderRadius: 18,
      overflow: "hidden" as const,
    },
    canvasHeroGoldBar: {
      height: 4,
    },
    canvasHeroInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    canvasHeroLeft: {
      flex: 1,
      gap: 4,
    },
    canvasHeroEyebrowRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    canvasHeroEyebrow: {
      fontSize: 8,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
      letterSpacing: 1.5,
    },
    canvasHeroTitle: {
      fontSize: 20,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#C9960C",
      letterSpacing: 0.2,
      lineHeight: 26,
    },
    canvasHeroSub: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "#8BA4BA",
      lineHeight: 16,
    },
    canvasHeroChipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 4,
      marginTop: 0,
    },
    canvasHeroChip: {
      backgroundColor: "rgba(201,150,12,0.15)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      borderRadius: 20,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    canvasHeroChipText: {
      fontSize: 9,
      fontFamily: "Inter_500Medium",
      color: "#C9960C",
      letterSpacing: 0.3,
    },
    canvasHeroRight: {
      alignItems: "center" as const,
      gap: 6,
      flexShrink: 0,
    },
    canvasHeroPriceBox: {
      alignItems: "center" as const,
      backgroundColor: "rgba(201,150,12,0.15)",
      borderWidth: 1.5,
      borderColor: "rgba(201,150,12,0.45)",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 1,
    },
    canvasHeroPriceFrom: {
      fontSize: 9,
      fontFamily: "Inter_400Regular",
      color: "rgba(201,150,12,0.75)",
      letterSpacing: 0.5,
    },
    canvasHeroPrice: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#F5D78E",
      letterSpacing: -0.5,
    },
    imageBlock: {
      gap: 8,
    },
    imageLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
    image: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: colors.radius,
      resizeMode: "cover" as const,
      backgroundColor: colors.card,
    },
    processingBox: {
      borderRadius: colors.radius,
      padding: 32,
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
    },
    processingCrownWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(201,150,12,0.12)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    processingCrown: {
      fontSize: 26,
    },
    processingTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
      letterSpacing: 2.5,
      textAlign: "center",
    },
    processingText: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: "#F5EDD8",
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
      lineHeight: 23,
      paddingHorizontal: 8,
    },
    processingDivider: {
      width: 44,
      height: 1.5,
      borderRadius: 1,
      backgroundColor: "rgba(201,150,12,0.4)",
    },
    processingNote: {
      fontSize: 12,
      color: "rgba(245,237,216,0.5)",
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginTop: 4,
      textShadowColor: "rgba(0,0,0,0.1)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 0,
    },
    modeRow: {
      flexDirection: "row",
      gap: 12,
    },
    modeBtn: {
      flex: 1,
      borderRadius: colors.radius,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 18,
      gap: 8,
      alignItems: "flex-start",
    },
    modeBtnTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    modeBtnSub: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    processBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 22,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    processBtnText: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      textShadowColor: "rgba(0,0,100,0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    saveBtn: {
      backgroundColor: "#0A84FF",
      borderRadius: colors.radius,
      paddingVertical: 22,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    saveBtnText: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      textShadowColor: "rgba(0,0,100,0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    whatsappBtn: {
      backgroundColor: "#25D366",
      borderRadius: colors.radius,
      paddingVertical: 24,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 4,
    },
    whatsappBtnText: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      textShadowColor: "rgba(0,80,30,0.35)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    secondaryBtn: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingVertical: 18,
      alignItems: "center",
    },
    secondaryBtnText: {
      fontSize: 19,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    ghostBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    ghostBtnText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    giftBtnGlow: {
      borderRadius: colors.radius,
      shadowColor: "#C9960C",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 10,
    },
    giftBtn: {
      borderRadius: colors.radius,
      overflow: "hidden" as const,
    },
    giftBtnGoldBar: {
      height: 3,
    },
    giftBtnInner: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      gap: 12,
    },
    giftBtnTop: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    giftBtnIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    giftBtnIconEmoji: {
      fontSize: 24,
    },
    giftBtnTitleWrap: {
      flex: 1,
      gap: 2,
    },
    giftBtnLabel: {
      fontSize: 10,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#F5D78E",
      letterSpacing: 2.5,
    },
    giftBtnText: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: "#C9960C",
      fontFamily: "Cinzel_400Regular",
      letterSpacing: 0.1,
    },
    giftBtnCountBadge: {
      alignItems: "center" as const,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    giftBtnCountText: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      lineHeight: 20,
    },
    giftBtnCountSub: {
      fontSize: 9,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
      letterSpacing: 0.5,
    },
    giftBtnChipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
    },
    giftBtnChip: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    },
    giftBtnChipText: {
      fontSize: 11,
      color: "rgba(255,255,255,0.92)",
      fontFamily: "Inter_500Medium",
    },
    proBtnGlow: {
      borderRadius: colors.radius,
      shadowColor: "#F5C030",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.65,
      shadowRadius: 16,
      elevation: 10,
    },
    proBtn: {
      borderRadius: colors.radius,
      paddingVertical: 20,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    proBtnText: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
      textShadowColor: "rgba(120,70,0,0.45)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    proBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    proBadgeText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      letterSpacing: 1,
    },
    printShop: {
      marginTop: 28,
      gap: 16,
    },
    printShopHeader: {
      gap: 5,
    },
    printShopEyebrow: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      letterSpacing: 2.5,
    },
    printShopTitle: {
      fontSize: 22,
      fontWeight: "400" as const,
      color: "#C9960C",
      fontFamily: "Cinzel_400Regular",
      letterSpacing: 0.2,
    },
    printShopSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    printGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 12,
    },
    printCard: {
      width: "47.5%",
      borderRadius: 18,
      overflow: "hidden" as const,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.28)",
    },
    printCardGradient: {
      overflow: "hidden" as const,
    },
    printCardGoldBar: {
      height: 3,
      width: "100%" as const,
    },
    printCardInner: {
      paddingTop: 18,
      paddingBottom: 22,
      paddingHorizontal: 12,
      alignItems: "center" as const,
      gap: 8,
    },
    printCardEmojiRing: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "rgba(201,150,12,0.15)",
      borderWidth: 1.5,
      borderColor: "rgba(201,150,12,0.5)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 2,
    },
    printCardEmoji: {
      fontSize: 26,
    },
    printCardCategory: {
      fontSize: 9,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "rgba(201,150,12,0.85)",
      letterSpacing: 2.2,
    },
    printCardTitle: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: "#F5EDD8",
      fontFamily: "Inter_700Bold",
      textAlign: "center" as const,
      lineHeight: 19,
    },
    printCardPriceBadge: {
      backgroundColor: "rgba(201,150,12,0.18)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.45)",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      marginTop: 2,
    },
    printCardPrice: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
    },

    /* Collections Directory */
    collectionsDir: {
      marginTop: 28,
      gap: 14,
    },
    collectionsDirHeader: {
      gap: 5,
    },
    collectionsDirEyebrow: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: "#C9960C",
      fontFamily: "Inter_700Bold",
      letterSpacing: 2.5,
    },
    collectionsDirTitle: {
      fontSize: 22,
      fontWeight: "400" as const,
      color: "#C9960C",
      fontFamily: "Cinzel_400Regular",
      letterSpacing: 0.2,
    },
    collectionsDirCard: {
      borderRadius: 16,
      overflow: "hidden" as const,
      backgroundColor: "#0D1B2A",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
    },
    collectionsDirGoldBar: {
      height: 2,
    },
    collectionRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    collectionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(201,150,12,0.12)",
    },
    collectionRowIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "rgba(201,150,12,0.1)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    collectionRowText: {
      flex: 1,
      gap: 3,
    },
    collectionRowLabel: {
      fontSize: 14,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#F5EDD8",
    },
    collectionRowSub: {
      fontSize: 11,
      color: "#6B8EA8",
      fontFamily: "Inter_400Regular",
    },
    collectionsCtaBtn: {
      borderRadius: 14,
      overflow: "hidden" as const,
    },
    collectionsCtaGradient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    collectionsCtaText: {
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      flex: 1,
      textAlign: "center" as const,
    },

    livingMemoriesBtn: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderRadius: 16,
      overflow: "hidden" as const,
      shadowColor: "#C9960C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 7,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
    },
    livingMemoriesBtnGradient: {
      overflow: "hidden" as const,
    },
    livingMemoriesGoldBar: {
      height: 3,
      width: "100%" as const,
    },
    livingMemoriesRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    livingMemoriesIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(201,150,12,0.15)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    livingMemoriesIconEmoji: { fontSize: 22 },
    livingMemoriesTextWrap: { flex: 1, gap: 3 },
    livingMemoriesTopRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 7,
      flexWrap: "wrap" as const,
    },
    livingMemoriesTitle: {
      fontSize: 14,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#C9960C",
    },
    livingMemoriesAiBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      backgroundColor: "rgba(201,150,12,0.2)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.4)",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    livingMemoriesAiBadgeText: {
      fontSize: 9,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
      letterSpacing: 1,
    },
    livingMemoriesSub: {
      fontSize: 11,
      color: "#D4A843",
      fontFamily: "Inter_400Regular",
      fontStyle: "italic" as const,
      textShadowColor: "rgba(201,150,12,0.45)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6,
    },
    livingMemoriesPriceWrap: {
      alignItems: "flex-end" as const,
      gap: 2,
    },
    livingMemoriesPrice: {
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
    },
    referralBtn: {
      borderRadius: 14,
      overflow: "hidden" as const,
      borderWidth: 2,
      borderColor: "#C9960C",
      shadowColor: "#C9960C",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 14,
      elevation: 8,
    },
    referralBtnGradient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: 15,
      paddingHorizontal: 18,
      gap: 12,
    },
    referralBtnEmoji: { fontSize: 24 },
    referralBtnTextWrap: { flex: 1, gap: 2 },
    referralBtnPrimary: {
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#F5D78E",
    },
    referralBtnSub: {
      fontSize: 12,
      color: "rgba(245,216,142,0.65)",
      fontFamily: "Inter_400Regular",
    },
    referralBtnBadge: {
      backgroundColor: "rgba(201,150,12,0.55)",
      borderWidth: 1.5,
      borderColor: "#C9960C",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    referralBtnBadgeText: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#FAF7F2",
      letterSpacing: 1.5,
    },
    promoBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 7,
      paddingTop: topPad + 10,
      paddingBottom: 10,
      paddingHorizontal: 14,
    },
    promoBannerText: {
      fontSize: 11,
      color: "rgba(245,215,142,0.85)",
      fontFamily: "Inter_400Regular",
      textAlign: "center" as const,
      flexShrink: 1,
      lineHeight: 16,
    },
    promoBannerBold: {
      fontFamily: "Inter_700Bold",
      fontWeight: "700" as const,
      color: "#F5D78E",
    },
    promoBannerCode: {
      fontFamily: "Inter_700Bold",
      fontWeight: "700" as const,
      color: "#FFE88A",
      letterSpacing: 1.2,
    },
    galleryBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: "#FDF6DC",
      borderWidth: 1.5,
      borderColor: "#E8D48B",
    },
    galleryBtnText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#C9960C",
      textAlign: "center" as const,
    },
    contactSupportBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.45)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.2)",
    },
    contactSupportText: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: "#7A6E57",
      textAlign: "center" as const,
    },
    /* ── Jubilee Banner ── */
    jubileeBtn: {
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 16,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "rgba(147,197,253,0.25)",
    },
    jubileeGradient: {
      borderRadius: 16,
      overflow: "hidden" as const,
    },
    jubileeGoldBar: {
      height: 2,
    },
    jubileeInner: {
      padding: 16,
      gap: 14,
    },
    jubileeHeaderRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 12,
    },
    jubileeIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(147,197,253,0.12)",
      borderWidth: 1,
      borderColor: "rgba(147,197,253,0.3)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    jubileeEmoji: {
      fontSize: 22,
    },
    jubileeTextWrap: {
      flex: 1,
      gap: 3,
    },
    jubileeEyebrow: {
      fontSize: 8,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#93C5FD",
      letterSpacing: 2.2,
    },
    jubileeTitle: {
      fontSize: 17,
      fontFamily: "Cinzel_400Regular",
      fontWeight: "400" as const,
      color: "#F5D78E",
      lineHeight: 22,
    },
    jubileeSub: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(200,210,240,0.65)",
      lineHeight: 16,
    },
    jubileeMilestones: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 7,
    },
    jubileeMilestoneChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: "rgba(255,255,255,0.05)",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    jubileeMilestoneEmoji: {
      fontSize: 13,
    },
    jubileeMilestoneYear: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      lineHeight: 14,
    },
    jubileeMilestoneGem: {
      fontSize: 9,
      fontFamily: "Inter_400Regular",
      color: "rgba(200,210,240,0.55)",
      lineHeight: 12,
    },

    featureWallsBtn: {
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 14,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
    },
    featureWallsGradient: {
      borderRadius: 14,
      overflow: "hidden" as const,
    },
    featureWallsGoldBar: {
      height: 2,
    },
    featureWallsRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    featureWallsIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(201,150,12,0.15)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    featureWallsEmoji: {
      fontSize: 20,
    },
    featureWallsTextWrap: {
      flex: 1,
      gap: 3,
    },
    featureWallsTitle: {
      fontSize: 15,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#C9960C",
    },
    featureWallsSub: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,237,216,0.6)",
    },
    featureWallsPriceWrap: {
      alignItems: "flex-end" as const,
      gap: 2,
    },
    featureWallsPrice: {
      fontSize: 14,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    contactBtnWrapper: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: colors.background,
    },
    contactBtn: {
      backgroundColor: "#0D9488",
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 10,
      shadowColor: "#0D9488",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    contactBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    dedication: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: bottomPad + 6,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    dedicationText: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.5,
      textAlign: "center",
      opacity: 0.65,
    },
  });
}
