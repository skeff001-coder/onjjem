import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
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
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Path,
  RadialGradient as SvgRadial,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { PRICING } from "@/lib/pricing";
import { SubscribeModal } from "@/components/SubscribeModal";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PinchZoomView } from "@/components/PinchZoomView";
import { ProPaywall } from "@/components/ProPaywall";
import { EnhancementPaywall } from "@/components/EnhancementPaywall";
import { ContactExpertsModal } from "@/components/ContactExpertsModal";
import { ReferralModal } from "@/components/ReferralModal";
import { GraffitiTitle } from "@/components/GraffitiTitle";
import { TrustFooter } from "@/components/TrustFooter";
import { RubyHeartIcon } from "@/components/RubyHeartIcon";
import { WelcomeModal } from "@/components/WelcomeModal";
import { EnhancementTipSheet } from "@/components/EnhancementTipSheet";
import { ResultTipSheet } from "@/components/ResultTipSheet";
import { saveToHistory } from "@/lib/photoHistory";

type EnhancementMode = "sharpen" | "brighten" | "denoise" | "restore" | "vivid" | "colourize";
type AppState = "idle" | "selected" | "processing" | "done" | "batch-selected" | "batch-processing" | "batch-done";

type BatchItem = {
  id: string;
  uri: string;
  base64: string | null;
  resultBase64: string | null;
  resultLocalUri: string | null;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string;
};

const ENHANCEMENTS: {
  id: EnhancementMode;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
}[] = [
  { id: "sharpen",   title: "Sharpen",   subtitle: "Fix soft &\nblurry photos",    icon: "aperture-outline",       accent: "#4A90D9" },
  { id: "brighten",  title: "Brighten",  subtitle: "Lift dark &\nunderexposed",     icon: "sunny-outline",          accent: "#F5A623" },
  { id: "denoise",   title: "Denoise",   subtitle: "Remove grain\n& film noise",    icon: "water-outline",          accent: "#9B59B6" },
  { id: "restore",   title: "Restore",   subtitle: "Full old photo\nrestoration",   icon: "time-outline",           accent: "#27AE60" },
  { id: "vivid",     title: "Vivid",     subtitle: "Bold colours\n& contrast",      icon: "color-filter-outline",   accent: "#E74C3C" },
  { id: "colourize", title: "Colourize", subtitle: "Add colour to\nold B&W photos", icon: "color-palette-outline",  accent: "#C9960C" },
];


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

  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [tipSheetVisible, setTipSheetVisible] = useState(false);
  const [resultTipVisible, setResultTipVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [referralVisible, setReferralVisible] = useState(false);
  const [subscribeVisible, setSubscribeVisible] = useState(false);
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);
  const [appState, setAppState] = useState<AppState>("idle");
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const originalBase64Ref = useRef<string | null>(null);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [resultLocalUri, setResultLocalUri] = useState<string | null>(null);
  const [selectedModes, setSelectedModes] = useState<Set<EnhancementMode>>(new Set(["sharpen"]));
  const [statusMessage, setStatusMessage] = useState("Preparing...");
  const msgIndexRef = useRef(0);
  const cancelledRef = useRef(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);

  // Pinch-to-zoom discovery hint
  const [showPinchHint, setShowPinchHint] = useState(false);
  const pinchHintOpacity = useRef(new Animated.Value(0)).current;
  const pinchHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Show welcome screen on first launch
  useEffect(() => {
    AsyncStorage.getItem("hasSeenWelcome")
      .then((val) => {
        if (val !== "1") setWelcomeVisible(true);
      })
      .catch(() => {
        // If storage is unavailable, show the welcome screen anyway
        setWelcomeVisible(true);
      });
  }, []);

  // Fade out and remove the pinch-to-zoom hint (on first pinch or auto-timeout).
  const dismissPinchHint = useCallback(() => {
    if (pinchHintTimerRef.current !== null) {
      clearTimeout(pinchHintTimerRef.current);
      pinchHintTimerRef.current = null;
    }
    Animated.timing(pinchHintOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowPinchHint(false));
  }, []); // deps are stable refs/Animated.Value

  // Show the pinch hint the first time a result screen appears.
  useEffect(() => {
    if (appState !== "done") return;
    let cancelled = false;
    void AsyncStorage.getItem("hasSeenPinchHint").then((seen) => {
      if (seen || cancelled) return;
      void AsyncStorage.setItem("hasSeenPinchHint", "1");
      setShowPinchHint(true);
      pinchHintOpacity.setValue(0);
      Animated.timing(pinchHintOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        pinchHintTimerRef.current = setTimeout(dismissPinchHint, 2000);
      });
    });
    return () => {
      cancelled = true;
      if (pinchHintTimerRef.current !== null) {
        clearTimeout(pinchHintTimerRef.current);
        pinchHintTimerRef.current = null;
      }
    };
  }, [appState, dismissPinchHint]);

  const handleWelcomeDismiss = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "1");
    } catch {
      // Persistence failure is non-critical; modal is dismissed regardless
    }
    setWelcomeVisible(false);
  };

  const handleResultTipDismiss = async () => {
    try {
      await AsyncStorage.setItem("hasSeenResultTip", "1");
    } catch {
      // non-critical
    }
    setResultTipVisible(false);
  };

  const handleTipSheetDismiss = async () => {
    try {
      await AsyncStorage.setItem("hasSeenPickerTip", "1");
    } catch {
      // Non-critical
    }
    setTipSheetVisible(false);
  };

  // Load persisted free trial state on mount
  useEffect(() => {
    AsyncStorage.getItem("freeTrialUsed").then((val) => {
      if (val === "1") setHasUsedFreeTrial(true);
    });
  }, []);

  useEffect(() => {
    if (appState !== "processing" && appState !== "batch-processing") return;
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

    const canProceed =
      permission.granted || (permission.status as string) === "limited";

    if (!canProceed) {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Photos Access Blocked",
          "ONJJEM needs access to your photo library. Please go to iPhone Settings → Privacy → Photos → ONJJEM and choose 'All Photos'.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "Cancel", style: "cancel" },
          ],
        );
      } else {
        Alert.alert(
          "Permission Needed",
          "Please allow ONJJEM to access your photos so you can choose a photo to restore.",
        );
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.92,
      base64: true,
    });

    // ── Multi-select: start batch flow ───────────────────────────────────────
    if (!result.canceled && result.assets.length > 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const items: BatchItem[] = result.assets.map((asset) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        uri: asset.uri,
        base64: asset.base64 ?? null,
        resultBase64: null,
        resultLocalUri: null,
        status: "pending" as const,
      }));
      setBatchItems(items);
      setBatchCurrentIndex(0);
      setOriginalUri(null);
      originalBase64Ref.current = null;
      setResultBase64(null);
      setResultLocalUri(null);
      setSelectedModes(new Set(["sharpen"]));
      setAppState("batch-selected");
      return;
    }

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      const commitPhoto = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        originalBase64Ref.current = asset.base64 ?? null;
        setOriginalUri(asset.uri);
        setResultBase64(null);
        setResultLocalUri(null);
        setAppState("selected");

        // Show the enhancement tip sheet the very first time a photo is picked
        try {
          const seen = await AsyncStorage.getItem("hasSeenPickerTip");
          if (seen !== "1") {
            setTipSheetVisible(true);
          }
        } catch {
          // Non-critical — skip tip if storage is unavailable
        }
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
    if (appState === "batch-processing") {
      setAppState("batch-selected");
    } else {
      setAppState("selected");
    }
  };

  const processPhoto = async () => {
    if (!originalUri) return;

    cancelledRef.current = false;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAppState("processing");

    try {
      // Read image as base64.
      // Priority order:
      //   1. base64 already captured at pick time (works for ph:// library URIs on iOS)
      //   2. blob:/http URIs (web preview) — fetch then FileReader
      //   3. file:// URIs — FileSystem.readAsStringAsync
      const isWebUri =
        originalUri.startsWith("blob:") ||
        (originalUri.startsWith("http") && !originalUri.startsWith("https://localhost"));
      let base64: string;

      if (originalBase64Ref.current) {
        base64 = originalBase64Ref.current;
      } else if (isWebUri) {
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
          body: JSON.stringify({ imageBase64: base64, modes: Array.from(selectedModes) }),
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
        const ts = Date.now();
        const resultPath = (FileSystem.documentDirectory ?? "") + `photofix_result_${ts}.jpg`;
        await FileSystem.writeAsStringAsync(resultPath, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setResultLocalUri(resultPath);

        // Also persist the original so the gallery can show a before/after comparison
        const origPath = (FileSystem.documentDirectory ?? "") + `photofix_original_${ts}.jpg`;
        if (originalBase64Ref.current) {
          await FileSystem.writeAsStringAsync(origPath, originalBase64Ref.current, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          // Fall back: copy the picked file URI if it's a local file
          try {
            await FileSystem.copyAsync({ from: originalUri!, to: origPath });
          } catch {
            // If copy fails (e.g. ph:// URI), write an empty placeholder so history entry is still valid
            await FileSystem.writeAsStringAsync(origPath, b64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
        }

        // Save to personal history
        await saveToHistory({
          id: String(ts),
          timestamp: ts,
          modes: Array.from(selectedModes),
          originalLocalUri: origPath,
          resultLocalUri: resultPath,
        });
      }

      if (!cancelledRef.current) {
        setAppState("done");
        // Show result tip sheet on first successful enhancement
        AsyncStorage.getItem("hasSeenResultTip").then((seen) => {
          if (!seen) setResultTipVisible(true);
        }).catch(() => setResultTipVisible(true));
        // Mark free trial as used — persisted so it survives app restarts
        await AsyncStorage.setItem("freeTrialUsed", "1");
        setHasUsedFreeTrial(true);
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

  const processBatch = async () => {
    if (batchItems.length === 0) return;
    cancelledRef.current = false;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAppState("batch-processing");

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) {
      Alert.alert("Error", "API domain not configured — please contact support.");
      setAppState("batch-selected");
      return;
    }
    const apiUrl = `https://${domain}/api/process`;

    const updatedItems = batchItems.map((it) => ({ ...it }));

    for (let i = 0; i < updatedItems.length; i++) {
      if (cancelledRef.current) break;

      // Skip items already completed from a previous (cancelled) batch run
      if (updatedItems[i].status === "done" || updatedItems[i].status === "error") continue;

      setBatchCurrentIndex(i);
      updatedItems[i] = { ...updatedItems[i], status: "processing" };
      setBatchItems([...updatedItems]);

      const item = updatedItems[i];

      try {
        let base64 = item.base64;
        if (!base64) {
          const isWebUri =
            item.uri.startsWith("blob:") ||
            (item.uri.startsWith("http") && !item.uri.startsWith("https://localhost"));
          if (isWebUri) {
            const resp = await fetch(item.uri);
            const blob = await resp.blob();
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve((reader.result as string).split(",")[1] ?? "");
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            base64 = await FileSystem.readAsStringAsync(item.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
        }

        if (cancelledRef.current) break;

        const controller = new AbortController();
        const fetchTimeoutId = setTimeout(() => controller.abort(), 90_000);
        let response: Response;
        try {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              modes: Array.from(selectedModes),
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(fetchTimeoutId);
        }

        if (cancelledRef.current) break;

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Processing failed");
        }

        const resultB64: string = data.resultBase64;
        let resultLocalUri: string | null = null;

        const isWebUri =
          item.uri.startsWith("blob:") ||
          (item.uri.startsWith("http") && !item.uri.startsWith("https://localhost"));
        if (!isWebUri) {
          const ts = Date.now() + i;
          const resultPath =
            (FileSystem.documentDirectory ?? "") + `photofix_result_${ts}.jpg`;
          await FileSystem.writeAsStringAsync(resultPath, resultB64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          resultLocalUri = resultPath;

          const origPath =
            (FileSystem.documentDirectory ?? "") + `photofix_original_${ts}.jpg`;
          if (item.base64) {
            await FileSystem.writeAsStringAsync(origPath, item.base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } else {
            try {
              await FileSystem.copyAsync({ from: item.uri, to: origPath });
            } catch {
              await FileSystem.writeAsStringAsync(origPath, resultB64, {
                encoding: FileSystem.EncodingType.Base64,
              });
            }
          }

          await saveToHistory({
            id: String(ts),
            timestamp: ts,
            modes: Array.from(selectedModes),
            originalLocalUri: origPath,
            resultLocalUri: resultPath,
          });
        }

        updatedItems[i] = {
          ...updatedItems[i],
          status: "done",
          resultBase64: resultB64,
          resultLocalUri,
        };
      } catch (err) {
        updatedItems[i] = {
          ...updatedItems[i],
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Failed",
        };
      }

      setBatchItems([...updatedItems]);
    }

    if (!cancelledRef.current) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Mark free trial as used — same logic as processPhoto
      await AsyncStorage.setItem("freeTrialUsed", "1");
      setHasUsedFreeTrial(true);
      setAppState("batch-done");
    }
  };

  const saveLocalUri = async (localUri: string) => {
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
      await MediaLibrary.saveToLibraryAsync(localUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your enhanced photo has been saved to your Photos library.");
    } catch {
      Alert.alert("Error", "Could not save to Photos. Please try again.");
    }
  };

  const shareLocalUri = async (localUri: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === "web") {
        Alert.alert("Share", "Open WhatsApp and share the saved image.");
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Sharing unavailable", "Sharing is not supported on this device.");
        return;
      }
      await Sharing.shareAsync(localUri, {
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
        dialogTitle: "Share your fixed photo",
      });
    } catch {
      Alert.alert("Error", "Could not share. Please try again.");
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
    originalBase64Ref.current = null;
    setResultBase64(null);
    setResultLocalUri(null);
    setSelectedModes(new Set(["sharpen"]));
    setBatchItems([]);
    setBatchCurrentIndex(0);
  };

  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      <WelcomeModal visible={welcomeVisible} onDismiss={handleWelcomeDismiss} />
      <EnhancementTipSheet visible={tipSheetVisible} onDismiss={handleTipSheetDismiss} />
      <ResultTipSheet visible={resultTipVisible} onDismiss={handleResultTipDismiss} />

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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
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
            <GraffitiTitle fontSize={52} letterSpacing={8} />
            <Text style={s.headerTagline}>Bringing your Gems of Love to Life</Text>
          </View>
          {appState !== "idle" && (
            <TouchableOpacity onPress={resetApp} style={s.resetBtn}>
              <Ionicons name="refresh" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setWelcomeVisible(true)}
            style={s.infoBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="rgba(201,150,12,0.75)" />
          </TouchableOpacity>
        </View>

        {appState === "idle" && (
          <>
            {/* ONJJEM MasterLab feature strip */}
            <View style={s.masterLabStrip}>
              {(
                [
                  { icon: "sparkles" as const,          text: "Cinema-Grade AI" },
                  { icon: "ribbon" as const,             text: "UK Master Print Lab" },
                  { icon: "shield-checkmark" as const,   text: "10-Yr Guarantee" },
                  { icon: "people" as const,             text: "Expert Artisans" },
                ] as const
              ).map((f) => (
                <View key={f.text} style={s.masterLabChip}>
                  <Ionicons name={f.icon} size={11} color="#F5D78E" />
                  <Text style={s.masterLabChipText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Masterpiece Gallery button — dark emerald mystical */}
            <TouchableOpacity
              style={s.galleryBtn}
              onPress={() => router.push("/gallery")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#060F08", "#0C1E10", "#060F08"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.galleryBtnGradient}
              >
                <LinearGradient
                  colors={["#155220", "#4CAF58", "#155220"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.galleryBtnGreenBar}
                />
                <View style={s.galleryBtnInner}>
                  <Svg width={26} height={30} viewBox="0 0 20 24">
                    <Defs>
                      <SvgLinear id="idx_em_body" x1="0.25" y1="0" x2="0.8" y2="1">
                        <Stop offset="0%"   stopColor="#6EE080" />
                        <Stop offset="35%"  stopColor="#228A38" />
                        <Stop offset="72%"  stopColor="#0E5520" />
                        <Stop offset="100%" stopColor="#062E0C" />
                      </SvgLinear>
                      <SvgLinear id="idx_em_crown" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0%"   stopColor="#B0F0BC" />
                        <Stop offset="100%" stopColor="#44B858" />
                      </SvgLinear>
                      <SvgRadial id="idx_em_glint" cx="36%" cy="26%" r="32%">
                        <Stop offset="0%"   stopColor="rgba(220,255,228,0.96)" />
                        <Stop offset="100%" stopColor="rgba(120,220,140,0)" />
                      </SvgRadial>
                    </Defs>
                    <Path d="M 10 0 L 18 4 L 18 18 L 10 24 L 2 18 L 2 4 Z" fill="url(#idx_em_body)" />
                    <Path d="M 10 0 L 18 4 L 2 4 Z" fill="url(#idx_em_crown)" />
                    <Path d="M 18 4 L 18 18 L 10 24 L 10 8 Z" fill="rgba(0,0,0,0.20)" />
                    <Path d="M 10 0 L 18 4 L 18 18 L 10 24 L 2 18 L 2 4 Z" fill="url(#idx_em_glint)" />
                    <Path d="M 10 0 L 18 4 L 18 18 L 10 24 L 2 18 L 2 4 Z" fill="none" stroke="rgba(0,28,8,0.65)" strokeWidth={0.5} />
                    <Path d="M 2 4 L 18 4" fill="none" stroke="rgba(100,220,120,0.5)" strokeWidth={0.4} />
                  </Svg>
                  <Text style={s.galleryBtnText}>Masterpiece Gallery</Text>
                </View>
              </LinearGradient>
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
              </View>
              <View style={{ alignItems: "center", paddingVertical: 10, paddingBottom: 6 }}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={{ width: 80, height: 80, borderRadius: 18 }}
                  resizeMode="contain"
                />
              </View>
            </Pressable>

            {/* My Restorations button — gold */}
            <TouchableOpacity
              style={s.myPhotosBtn}
              onPress={() => router.push("/my-photos")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#0F0B03", "#1C1505", "#0F0B03"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.myPhotosBtnGradient}
              >
                <LinearGradient
                  colors={["#7A5800", "#C9960C", "#7A5800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.myPhotosBtnBar}
                />
                <View style={s.myPhotosBtnInner}>
                  <Ionicons name="images" size={20} color="#C9960C" />
                  <Text style={s.myPhotosBtnText}>My Restorations</Text>
                  <Ionicons name="chevron-forward" size={16} color="rgba(201,150,12,0.6)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* ── GIFT STORE (directly under uploader) ── */}
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
                      <Image
                        source={require("@/assets/images/icon_refined.png")}
                        style={{ width: 52, height: 52, borderRadius: 12 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={s.giftBtnTitleWrap}>
                      <Text style={s.giftBtnLabel}>OUR GIFT STORE</Text>
                      <Text style={s.giftBtnText}>Candles · Cushions · Jigsaws · Throws</Text>
                    </View>
                    <View style={s.giftBtnCountBadge}>
                      <Text style={s.giftBtnCountText}>50+</Text>
                      <Text style={s.giftBtnCountSub}>gifts</Text>
                    </View>
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
                  <View style={s.canvasHeroRight} />
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

        {appState === "batch-selected" && batchItems.length > 0 && (
          <View style={s.batchSelBlock}>
            <Text style={s.batchSelTitle}>
              {batchItems.length} Photos Selected
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.batchThumbRow}
            >
              {batchItems.map((item, idx) => (
                <View key={item.id} style={s.batchThumbWrap}>
                  <Image source={{ uri: item.uri }} style={s.batchThumb} resizeMode="cover" />
                  <View style={s.batchThumbBadge}>
                    <Text style={s.batchThumbNum}>{idx + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {(appState === "processing" || appState === "batch-processing") && (
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
            {appState === "batch-processing" && (
              <Text style={s.batchProgressLabel}>
                Photo {batchCurrentIndex + 1} of {batchItems.length}
              </Text>
            )}
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
          <TouchableOpacity
            style={s.imageBlock}
            onPress={() => setSubscribeVisible(true)}
            activeOpacity={0.92}
          >
            <View style={s.sampleBadgeRow}>
              <View style={s.sampleBadge}>
                <Ionicons name="eye-outline" size={12} color="#fff" />
                <Text style={s.sampleBadgeText}>FREE SAMPLE</Text>
              </View>
              <Text style={s.imageLabel}>
                {Array.from(selectedModes).map(m => ENHANCEMENTS.find(e => e.id === m)?.title).filter(Boolean).join(" + ")} — drag to compare
              </Text>
            </View>
            <View style={s.zoomWrapper}>
              <PinchZoomView
                style={{ width: "100%", height: "100%" }}
                onPinchStart={dismissPinchHint}
              >
                <BeforeAfterSlider
                  beforeUri={originalUri}
                  afterBase64={resultBase64}
                  modeName={Array.from(selectedModes).map(m => ENHANCEMENTS.find(e => e.id === m)?.title).filter(Boolean).join(" + ")}
                />
              </PinchZoomView>
              {showPinchHint && (
                <Animated.View
                  style={[s.pinchHintBadge, { opacity: pinchHintOpacity }]}
                  pointerEvents="none"
                >
                  <Ionicons name="expand-outline" size={14} color="#fff" />
                  <Text style={s.pinchHintText}>Pinch to zoom</Text>
                </Animated.View>
              )}
            </View>
            <View style={s.imageTapHint}>
              <Ionicons name="sparkles" size={12} color="#C9960C" />
              <Text style={s.imageTapHintText}>Tap photo to unlock full quality</Text>
              <Ionicons name="sparkles" size={12} color="#C9960C" />
            </View>
          </TouchableOpacity>
        )}

        {(appState === "selected" || appState === "batch-selected") && (
          <>
            {/* ── Enhancement picker ── */}
            <View style={s.enhanceHeader}>
              <View style={s.enhanceTitleRow}>
                <Text style={s.enhanceTitle}>Choose Your Enhancements</Text>
                <TouchableOpacity
                  onPress={() => setTipSheetVisible(true)}
                  style={s.enhanceInfoBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="information-circle-outline" size={20} color="rgba(201,150,12,0.75)" />
                </TouchableOpacity>
              </View>
              <Text style={s.enhanceSub}>Select up to 3 — they stack together</Text>
            </View>

            {/* Pricing strip */}
            <View style={s.pricingStrip}>
              <LinearGradient
                colors={hasUsedFreeTrial ? ["#0E1A0E", "#152015"] : ["#1C1A14", "#2E2818"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.pricingStripGradient}
              >
                {hasUsedFreeTrial ? (
                  <>
                    <TouchableOpacity
                      style={[s.pricingFreeChip, { backgroundColor: "#E8A020", borderColor: "#FFD27A" }]}
                      onPress={() => setSubscribeVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={13} color="#1C1A14" />
                      <Text style={[s.pricingFreeText, { color: "#1C1A14" }]}>{PRICING.perPhoto.amount}/photo</Text>
                    </TouchableOpacity>
                    <Text style={s.pricingDivider}>·</Text>
                    <TouchableOpacity
                      style={[s.pricingFreeChip, { backgroundColor: "#4A90D9", borderColor: "#A6CCEF" }]}
                      onPress={() => setSubscribeVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="infinite" size={13} color="#FFFFFF" />
                      <Text style={[s.pricingFreeText, { color: "#FFFFFF" }]}>{PRICING.monthly.amount}/mo</Text>
                    </TouchableOpacity>
                    <Text style={s.pricingDivider}>·</Text>
                    <TouchableOpacity
                      style={[s.pricingFreeChip, { backgroundColor: "#27AE60", borderColor: "#9FE3B8" }]}
                      onPress={() => setSubscribeVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={13} color="#FFFFFF" />
                      <Text style={[s.pricingFreeText, { color: "#FFFFFF" }]}>{PRICING.annual.amount}/yr</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[s.pricingFreeChip, { backgroundColor: "#27AE60", borderColor: "#9FE3B8" }]}>
                      <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                      <Text style={[s.pricingFreeText, { color: "#FFFFFF" }]}>1 free sample</Text>
                    </View>
                    <Text style={s.pricingDivider}>·</Text>
                    <TouchableOpacity
                      style={[s.pricingFreeChip, { backgroundColor: "#E8A020", borderColor: "#FFD27A" }]}
                      onPress={() => setSubscribeVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={13} color="#1C1A14" />
                      <Text style={[s.pricingFreeText, { color: "#1C1A14" }]}>{PRICING.perPhoto.amount}/photo</Text>
                    </TouchableOpacity>
                    <Text style={s.pricingDivider}>·</Text>
                    <TouchableOpacity
                      style={[s.pricingFreeChip, { backgroundColor: "#4A90D9", borderColor: "#A6CCEF" }]}
                      onPress={() => setSubscribeVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="infinite" size={13} color="#FFFFFF" />
                      <Text style={[s.pricingFreeText, { color: "#FFFFFF" }]}>{PRICING.monthly.amount}/mo</Text>
                    </TouchableOpacity>
                  </>
                )}
              </LinearGradient>
            </View>

            {/* 3×2 grid */}
            <View style={s.enhanceGrid}>
              {ENHANCEMENTS.map((enh) => {
                const isSelected = selectedModes.has(enh.id);
                const atLimit = selectedModes.size >= 3 && !isSelected;
                return (
                  <TouchableOpacity
                    key={enh.id}
                    style={[
                      s.enhanceCard,
                      isSelected && { borderColor: enh.accent, borderWidth: 2 },
                      atLimit && { opacity: 0.45 },
                    ]}
                    onPress={() => {
                      if (atLimit) return;
                      Haptics.selectionAsync();
                      setSelectedModes((prev) => {
                        const next = new Set(prev);
                        if (next.has(enh.id)) next.delete(enh.id);
                        else next.add(enh.id);
                        return next;
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? [`${enh.accent}28`, `${enh.accent}12`]
                          : ["#1C1A14", "#16140F"]
                      }
                      style={s.enhanceCardGradient}
                    >
                      {isSelected && (
                        <View style={[s.enhanceCheckBadge, { backgroundColor: enh.accent }]}>
                          <Ionicons name="checkmark" size={11} color="#fff" />
                        </View>
                      )}
                      <View
                        style={[
                          s.enhanceIconCircle,
                          { backgroundColor: `${enh.accent}26`, borderColor: `${enh.accent}66` },
                          isSelected && { backgroundColor: `${enh.accent}44`, borderColor: enh.accent },
                        ]}
                      >
                        <Ionicons
                          name={enh.icon}
                          size={30}
                          color={enh.accent}
                        />
                      </View>
                      <Text style={[s.enhanceCardTitle, { color: enh.accent }]}>
                        {enh.title}
                      </Text>
                      <Text style={s.enhanceCardSub}>{enh.subtitle}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected combo label */}
            {selectedModes.size > 1 && (
              <View style={s.comboLabel}>
                <Ionicons name="layers-outline" size={14} color="#C9960C" />
                <Text style={s.comboLabelText}>
                  Combo: {Array.from(selectedModes).map(m => ENHANCEMENTS.find(e => e.id === m)?.title).join(" + ")}
                </Text>
              </View>
            )}

            {/* Main CTA */}
            <TouchableOpacity
              style={[s.processBtn, selectedModes.size === 0 && { opacity: 0.45 }]}
              onPress={selectedModes.size > 0
                ? (hasUsedFreeTrial
                    ? () => setSubscribeVisible(true)
                    : appState === "batch-selected" ? processBatch : processPhoto)
                : undefined}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={hasUsedFreeTrial
                  ? ["#1A8C40", "#27AE60", "#2ECC71", "#27AE60"]
                  : ["#A67C00", "#C9960C", "#E8B422", "#C9960C"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.processBtnGradient}
              >
                <Ionicons name={hasUsedFreeTrial ? "infinite" : "color-wand"} size={24} color="#fff" />
                <Text style={s.processBtnText}>
                  {hasUsedFreeTrial
                    ? "Subscribe to Enhance — Unlimited"
                    : appState === "batch-selected"
                      ? `Restore ${batchItems.length} Photos${selectedModes.size > 1 ? ` (${selectedModes.size} effects)` : ""}`
                      : `Enhance My Photo${selectedModes.size > 1 ? ` (${selectedModes.size})` : ""}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </>
        )}

        {appState === "done" && (
          <>
            <EnhancementPaywall
              selectedModeCount={selectedModes.size}
              onUpgradeSingle={() =>
                Alert.alert(
                  `Single Photo HD Enhancement — ${PRICING.perPhoto.amount}`,
                  "Full HD quality with all 6 enhancement modes at 100% strength, no watermark, and save to Photos. Payments are coming very soon — you'll be first to know!",
                  [{ text: "Can't Wait!" }],
                )
              }
              onUpgradeUnlimited={() =>
                Alert.alert(
                  `Unlimited — ${PRICING.monthly.amount}/month`,
                  "Process as many photos as you like every month — unlimited HD restorations, priority processing, and early access to new tools. Payments coming very soon!",
                  [{ text: "Can't Wait!" }],
                )
              }
            />
            <TouchableOpacity
              style={s.myPhotosLinkBtn}
              onPress={() => router.push("/my-photos")}
              activeOpacity={0.82}
            >
              <Ionicons name="images-outline" size={16} color="#4A90D9" />
              <Text style={s.myPhotosLinkBtnText}>View in My Restorations</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(74,144,217,0.5)" />
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

        {appState === "batch-done" && batchItems.length > 0 && (
          <>
            <View style={s.batchDoneHeader}>
              <Text style={s.batchDoneTitle}>
                {batchItems.filter((it) => it.status === "done").length} of {batchItems.length} Photos Restored
              </Text>
              <Text style={s.batchDoneSub}>
                Each photo has been saved to your Restorations gallery.
              </Text>
            </View>
            {batchItems.map((item, idx) => (
              <View key={item.id} style={s.batchCard}>
                <View style={s.batchCardHeader}>
                  <View style={s.batchCardNumBadge}>
                    <Text style={s.batchCardNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={s.batchCardStatus}>
                    {item.status === "done"
                      ? "Restored"
                      : item.status === "error"
                        ? "Failed"
                        : "Skipped"}
                  </Text>
                  {item.status === "done" && (
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  )}
                  {item.status === "error" && (
                    <Ionicons name="warning-outline" size={16} color="#E74C3C" />
                  )}
                </View>
                {item.resultBase64 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.resultBase64}` }}
                    style={s.batchCardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={s.batchCardPlaceholder}>
                    <Ionicons
                      name={item.status === "error" ? "warning-outline" : "hourglass-outline"}
                      size={32}
                      color={item.status === "error" ? "#E74C3C" : "#555"}
                    />
                    <Text style={s.batchCardPlaceholderText}>
                      {item.status === "error"
                        ? (item.errorMessage ?? "Processing failed")
                        : "Not processed"}
                    </Text>
                  </View>
                )}
                {item.status === "done" && item.resultLocalUri && (
                  <View style={s.batchCardActions}>
                    <TouchableOpacity
                      style={s.batchActionBtn}
                      onPress={() => saveLocalUri(item.resultLocalUri!)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#1E3A5F", "#2C5282"]}
                        style={s.batchActionGradient}
                      >
                        <Ionicons name="download-outline" size={16} color="#fff" />
                        <Text style={s.batchActionText}>Save to Photos</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.batchActionBtn}
                      onPress={() => shareLocalUri(item.resultLocalUri!)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#1A4A2E", "#27AE60"]}
                        style={s.batchActionGradient}
                      >
                        <Ionicons name="share-outline" size={16} color="#fff" />
                        <Text style={s.batchActionText}>Share</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={s.ghostBtn}
              onPress={resetApp}
              activeOpacity={0.7}
            >
              <Text style={s.ghostBtnText}>Fix More Photos</Text>
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
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── PRINT YOUR MEMORIES ── */}
        <View style={s.printSection}>
          <LinearGradient
            colors={["#0E0C08", "#1A1610", "#0E0C08"]}
            style={s.printSectionCard}
          >
            <LinearGradient
              colors={["#C9960C", "#F5D78E", "#C9960C"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.printSectionBar}
            />
            <View style={s.printSectionHead}>
              <View style={s.printSectionEyebrowRow}>
                <Ionicons name="print-outline" size={12} color="#C9960C" />
                <Text style={s.printSectionEyebrow}>BRING YOUR PHOTOS TO LIFE</Text>
              </View>
              <Text style={s.printSectionTitle}>Print Your Memories</Text>
              <Text style={s.printSectionSub}>
                Three ways to turn your restored photos into something you can hold, display, and treasure.
              </Text>
            </View>

            {/* Option 1a: Monthly unlimited */}
            <View style={s.printRow}>
              <LinearGradient
                colors={["#4A90D922", "#4A90D911"]}
                style={s.printRowIcon}
              >
                <Ionicons name="infinite" size={22} color="#4A90D9" />
              </LinearGradient>
              <View style={s.printRowBody}>
                <View style={s.printRowTitleRow}>
                  <Text style={s.printRowTitle}>Monthly Plan — £11.99/month</Text>
                  <View style={[s.printRowBadge, { backgroundColor: "#4A90D922", borderColor: "#4A90D955" }]}>
                    <Text style={[s.printRowBadgeText, { color: "#4A90D9" }]}>UNLIMITED</Text>
                  </View>
                </View>
                <Text style={s.printRowDesc}>
                  Full studio-quality restoration every month — same high-end results as the annual plan. No limits, no per-photo charges. Cancel anytime.
                </Text>
              </View>
            </View>

            <View style={s.printDivider} />

            {/* Option 1b: Annual unlimited printing */}
            <View style={s.printRow}>
              <LinearGradient
                colors={["#27AE6022", "#27AE6011"]}
                style={s.printRowIcon}
              >
                <Ionicons name="infinite" size={22} color="#27AE60" />
              </LinearGradient>
              <View style={s.printRowBody}>
                <View style={s.printRowTitleRow}>
                  <Text style={s.printRowTitle}>Annual Plan — £24.99/year</Text>
                  <View style={[s.printRowBadge, { backgroundColor: "#27AE6022", borderColor: "#27AE6055" }]}>
                    <Text style={[s.printRowBadgeText, { color: "#27AE60" }]}>BEST VALUE</Text>
                  </View>
                </View>
                <Text style={s.printRowDesc}>
                  Everything in the monthly plan, all year — save 83% versus paying monthly. Download studio-quality HD files anytime, as many photos as you like.
                </Text>
              </View>
            </View>

            <View style={s.printDivider} />

            {/* Option 2: Concierge service */}
            <View style={s.printRow}>
              <LinearGradient
                colors={["#C9960C22", "#C9960C11"]}
                style={s.printRowIcon}
              >
                <Ionicons name="sparkles" size={22} color="#C9960C" />
              </LinearGradient>
              <View style={s.printRowBody}>
                <View style={s.printRowTitleRow}>
                  <Text style={s.printRowTitle}>We Do It For You</Text>
                  <View style={[s.printRowBadge, { backgroundColor: "#C9960C22", borderColor: "#C9960C55" }]}>
                    <Text style={[s.printRowBadgeText, { color: "#C9960C" }]}>CONCIERGE</Text>
                  </View>
                </View>
                <Text style={s.printRowDesc}>
                  Want it made really special? Just send us your pictures and we will do it all for you — beautifully printed on whatever you need. Canvas, cushions, mugs, jigsaws, throws, silk keepsakes, and more. You choose, we create and deliver.
                </Text>
                <TouchableOpacity
                  style={s.printRowCta}
                  onPress={() => router.push("/gift-shop")}
                  activeOpacity={0.85}
                >
                  <Text style={s.printRowCtaText}>Browse our Gift Shop →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.printDivider} />

            {/* Option 3: DIY */}
            <View style={s.printRow}>
              <LinearGradient
                colors={["#4A90D922", "#4A90D911"]}
                style={s.printRowIcon}
              >
                <Ionicons name="home-outline" size={22} color="#4A90D9" />
              </LinearGradient>
              <View style={s.printRowBody}>
                <View style={s.printRowTitleRow}>
                  <Text style={s.printRowTitle}>Do It Yourself</Text>
                  <View style={[s.printRowBadge, { backgroundColor: "#4A90D922", borderColor: "#4A90D955" }]}>
                    <Text style={[s.printRowBadgeText, { color: "#4A90D9" }]}>YOUR PRINTER</Text>
                  </View>
                </View>
                <Text style={s.printRowDesc}>
                  Already have a printer at home? Download your fully restored, studio-quality HD photo and print it all yourself — exactly how you want it, exactly when you want it. Total creative control, right in your hands.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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
      <SubscribeModal visible={subscribeVisible} onClose={() => setSubscribeVisible(false)} />
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
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 16,
      alignItems: "center",
      position: "relative" as const,
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
    masterLabStrip: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
      justifyContent: "center" as const,
      paddingHorizontal: 4,
      paddingBottom: 4,
    },
    masterLabChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderWidth: 1,
      borderColor: "rgba(245,215,142,0.45)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    masterLabChipText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "#F5D78E",
    },
    headerTagline: {
      fontSize: 16,
      fontFamily: "Cinzel_400Regular",
      color: "#F5D78E",
      letterSpacing: 1,
      marginTop: 5,
      fontStyle: "italic" as const,
      textAlign: "center" as const,
      textShadowColor: "rgba(0,0,0,0.75)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
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
    infoBtn: {
      position: "absolute" as const,
      top: 20,
      right: 24,
      width: 36,
      height: 36,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    scroll: {
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: bottomPad,
      gap: 16,
    },
    uploadArea: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      borderStyle: "solid" as const,
      backgroundColor: "#0D1B2A",
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
      backgroundColor: "rgba(201,150,12,0.18)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.45)",
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
      color: "#FAF7F2",
      fontFamily: "Cinzel_400Regular",
    },
    uploadSub: {
      fontSize: 12,
      color: "rgba(250,247,242,0.55)",
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
    sampleBadgeRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      marginBottom: 8,
      flexWrap: "wrap" as const,
    },
    sampleBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: "#E74C3C",
      borderRadius: 6,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    sampleBadgeText: {
      fontSize: 10,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: 1,
    },
    imageBlock: {
      gap: 8,
    },
    zoomWrapper: {
      width: "100%",
      aspectRatio: 1,
    },
    pinchHintBadge: {
      position: "absolute",
      bottom: 52,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    pinchHintText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
    imageTapHint: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      paddingVertical: 8,
      backgroundColor: "rgba(201,150,12,0.10)",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
    },
    imageTapHintText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: "#C9960C",
      letterSpacing: 0.3,
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
    // ── Enhancement picker ──────────────────────────────────────────
    enhanceHeader: {
      alignItems: "center" as const,
      paddingTop: 4,
      paddingBottom: 2,
    },
    enhanceTitleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    enhanceInfoBtn: {
      marginTop: 1,
    },
    enhanceTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center" as const,
    },
    enhanceSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      textAlign: "center" as const,
    },
    pricingStrip: {
      borderRadius: 50,
      overflow: "hidden" as const,
    },
    pricingStripGradient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 8,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.25)",
    },
    pricingFreeChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: "#27AE60",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#9FE3B8",
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    pricingFreeText: {
      fontSize: 13,
      fontWeight: "800" as const,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: 0.3,
    },
    pricingDivider: {
      fontSize: 14,
      color: "rgba(255,255,255,0.55)",
      fontFamily: "Inter_400Regular",
    },
    pricingPaidText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    pricingUnlimited: {
      fontSize: 12,
      color: "#C9960C",
      fontFamily: "Inter_700Bold",
      fontWeight: "700" as const,
    },
    enhanceGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 10,
    },
    enhanceCard: {
      width: "31.5%" as const,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.08)",
      overflow: "hidden" as const,
    },
    enhanceCardGradient: {
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: "center" as const,
      gap: 6,
      minHeight: 120,
      position: "relative" as const,
    },
    enhanceCheckBadge: {
      position: "absolute" as const,
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    enhanceIconCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1.5,
      borderColor: "transparent",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    enhanceCardTitle: {
      fontSize: 14,
      fontWeight: "800" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center" as const,
      letterSpacing: 0.2,
    },
    enhanceCardSub: {
      fontSize: 11.5,
      color: "rgba(250,247,242,0.85)",
      fontFamily: "Inter_400Regular",
      textAlign: "center" as const,
      lineHeight: 15,
    },
    comboLabel: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      backgroundColor: "rgba(201,150,12,0.1)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.3)",
      borderRadius: 50,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    comboLabelText: {
      fontSize: 12,
      color: "#C9960C",
      fontFamily: "Inter_700Bold",
      fontWeight: "700" as const,
    },
    processBtn: {
      borderRadius: colors.radius,
      overflow: "hidden" as const,
    },
    processBtnGradient: {
      paddingVertical: 22,
      paddingHorizontal: 24,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 10,
    },
    processBtnText: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
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
    myPhotosLinkBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 7,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: "rgba(74,144,217,0.10)",
      borderWidth: 1,
      borderColor: "rgba(74,144,217,0.28)",
    },
    myPhotosLinkBtnText: {
      fontSize: 14,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: "#4A90D9",
      flex: 1,
      textAlign: "center" as const,
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
      fontSize: 20,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#FFFFFF",
      letterSpacing: 1.5,
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
    // ── Print Your Memories section ──
    printSection: {
      borderRadius: 20,
      overflow: "hidden" as const,
    },
    printSectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.2)",
      overflow: "hidden" as const,
    },
    printSectionBar: { height: 4 },
    printSectionHead: {
      padding: 14,
      paddingBottom: 8,
      gap: 4,
    },
    printSectionEyebrowRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    printSectionEyebrow: {
      fontSize: 10,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
      letterSpacing: 2,
    },
    printSectionTitle: {
      fontSize: 24,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#FAF7F2",
      letterSpacing: -0.3,
    },
    printSectionSub: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(250,247,242,0.5)",
      lineHeight: 18,
    },
    printRow: {
      flexDirection: "row" as const,
      gap: 14,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    printRowIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
      marginTop: 2,
    },
    printRowBody: { flex: 1, gap: 6 },
    printRowTitleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      flexWrap: "wrap" as const,
      gap: 8,
    },
    printRowTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#FAF7F2",
    },
    printRowBadge: {
      borderRadius: 5,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    printRowBadgeText: {
      fontSize: 8,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.8,
    },
    printRowDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(250,247,242,0.55)",
      lineHeight: 19,
    },
    printRowCta: {
      marginTop: 4,
      alignSelf: "flex-start" as const,
    },
    printRowCtaText: {
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
    },
    printDivider: {
      height: 1,
      backgroundColor: "rgba(201,150,12,0.1)",
      marginHorizontal: 18,
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
      paddingVertical: 10,
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
    myPhotosBtn: {
      borderRadius: 14,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "#5C3D00",
      shadowColor: "#C9960C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    myPhotosBtnGradient: {
      borderRadius: 14,
      overflow: "hidden" as const,
    },
    myPhotosBtnBar: {
      height: 3,
    },
    myPhotosBtnInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    myPhotosBtnText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: "#F5D78E",
    },
    galleryBtn: {
      borderRadius: 14,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "#1E5C2A",
      shadowColor: "#2ECC52",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    galleryBtnGradient: {
      borderRadius: 14,
      overflow: "hidden" as const,
    },
    galleryBtnGreenBar: {
      height: 3,
    },
    galleryBtnInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    galleryBtnText: {
      fontSize: 15,
      fontWeight: "400" as const,
      fontFamily: "Cinzel_400Regular",
      color: "#C8F0CE",
      textAlign: "center" as const,
      textShadowColor: "rgba(80,220,100,0.7)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
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
    batchSelBlock: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
    },
    batchSelTitle: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
      letterSpacing: 1.8,
      textTransform: "uppercase" as const,
      marginBottom: 10,
    },
    batchThumbRow: {
      flexDirection: "row" as const,
      gap: 8,
      paddingRight: 4,
    },
    batchThumbWrap: {
      position: "relative" as const,
    },
    batchThumb: {
      width: 72,
      height: 72,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.4)",
    },
    batchThumbBadge: {
      position: "absolute" as const,
      top: 4,
      right: 4,
      backgroundColor: "rgba(201,150,12,0.9)",
      borderRadius: 9,
      width: 18,
      height: 18,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    batchThumbNum: {
      fontSize: 10,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#1C1A14",
    },
    batchProgressLabel: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(245,215,142,0.8)",
      marginTop: 10,
      letterSpacing: 0.5,
    },
    batchDoneHeader: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      alignItems: "center" as const,
    },
    batchDoneTitle: {
      fontSize: 17,
      fontFamily: "Cinzel_400Regular",
      fontWeight: "400" as const,
      color: "#C9960C",
      textAlign: "center" as const,
      marginBottom: 4,
    },
    batchDoneSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,237,216,0.55)",
      textAlign: "center" as const,
    },
    batchCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: "#0F0D09",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.2)",
      overflow: "hidden" as const,
    },
    batchCardHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(201,150,12,0.15)",
    },
    batchCardNumBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(201,150,12,0.18)",
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.5)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    batchCardNumText: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#C9960C",
    },
    batchCardStatus: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(245,237,216,0.65)",
    },
    batchCardImage: {
      width: "100%",
      height: 220,
    },
    batchCardPlaceholder: {
      height: 110,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    batchCardPlaceholderText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,237,216,0.35)",
      textAlign: "center" as const,
      paddingHorizontal: 20,
    },
    batchCardActions: {
      flexDirection: "row" as const,
      gap: 8,
      padding: 10,
    },
    batchActionBtn: {
      flex: 1,
      borderRadius: 8,
      overflow: "hidden" as const,
    },
    batchActionGradient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      paddingVertical: 10,
    },
    batchActionText: {
      fontSize: 13,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: "#fff",
    },
  });
}
