import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as StoreReview from "expo-store-review";
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
  Modal,
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
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { PRICING } from "@/lib/pricing";
import { SubscribeModal } from "@/components/SubscribeModal";
import { useSubscription } from "@/lib/revenuecat";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PinchZoomView } from "@/components/PinchZoomView";
import { ProPaywall } from "@/components/ProPaywall";
import { EnhancementPaywall } from "@/components/EnhancementPaywall";
import { ContactExpertsModal } from "@/components/ContactExpertsModal";
import { ReferralModal } from "@/components/ReferralModal";
import { GraffitiTitle } from "@/components/GraffitiTitle";
import { TrustFooter } from "@/components/TrustFooter";
import { RubyHeartIcon } from "@/components/RubyHeartIcon";
import { AIConsentModal } from "@/components/AIConsentModal";
import { WelcomeModal } from "@/components/WelcomeModal";
import { WhatsNewModal, hasWhatsNewForVersion, getLatestChangelogVersion } from "@/components/WhatsNewModal";
import { EnhancementTipSheet } from "@/components/EnhancementTipSheet";
import { ResultTipSheet } from "@/components/ResultTipSheet";
import { pruneHistory, saveToHistory } from "@/lib/photoHistory";
import { PaywallStatsModal } from "@/components/PaywallStatsModal";
import { ProWelcomeBanner } from "@/components/ProWelcomeBanner";

type EnhancementMode = "sharpen" | "brighten" | "denoise" | "restore" | "vivid" | "colorize";
type AppState = "idle" | "selected" | "processing" | "done" | "batch-selected" | "batch-processing" | "batch-done";

type BatchItem = {
  id: string;
  uri: string;
  base64: string | null;
  resultBase64: string | null;
  resultLocalUri: string | null;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string;
  modes: Set<EnhancementMode>;
};

const ENHANCEMENTS: {
  id: EnhancementMode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
}[] = [
  { id: "sharpen",   title: "Sharpen",   subtitle: "Fix soft &\nblurry photos",    description: "Uses AI upscaling to recover lost detail in soft, out-of-focus, or low-resolution photos. Great for old prints that have gone fuzzy over time.",          icon: "aperture-outline",       accent: "#4A90D9" },
  { id: "brighten",  title: "Brighten",  subtitle: "Lift dark &\nunderexposed",     description: "Intelligently lifts shadows and recovers detail in underexposed shots without blowing out bright areas. Perfect for indoor or poorly lit photos.",          icon: "sunny-outline",          accent: "#F5A623" },
  { id: "denoise",   title: "Denoise",   subtitle: "Remove grain\n& film noise",    description: "Cleans up digital noise, grain, and ISO artefacts while preserving fine detail. Ideal for high-ISO shots or scanned film photographs.",                   icon: "water-outline",          accent: "#9B59B6" },
  { id: "restore",   title: "Restore",   subtitle: "Full old photo\nrestoration",   description: "A full-strength treatment for damaged, faded, or scratched old photos. Repairs creases and marks, sharpens faces, and brings lost tones back to life.",    icon: "time-outline",           accent: "#27AE60" },
  { id: "vivid",     title: "Vivid",     subtitle: "Bold colours\n& contrast",      description: "Boosts colour saturation and contrast to make flat or washed-out photos pop. Best used on colour prints that have faded or look lifeless.",                icon: "color-filter-outline",   accent: "#E74C3C" },
  { id: "colorize",  title: "Colorize",  subtitle: "Black & white\nto colour",     description: "Add vivid, natural colour to old black-and-white photos. Perfect for family portraits, wedding photos, and vintage memories.",                            icon: "color-palette-outline",  accent: "#C9960C" },
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
  const [welcomeInitialIndex, setWelcomeInitialIndex] = useState(0);
  const [lastWelcomeIndex, setLastWelcomeIndex] = useState(0);
  const [whatsNewVisible, setWhatsNewVisible] = useState(false);
  const [whatsNewVersion, setWhatsNewVersion] = useState("");
  const [whatsNewManualVisible, setWhatsNewManualVisible] = useState(false);
  const [whatsNewManualVersion, setWhatsNewManualVersion] = useState("");
  const [tipSheetVisible, setTipSheetVisible] = useState(false);
  const [resultTipVisible, setResultTipVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [referralVisible, setReferralVisible] = useState(false);
  const [subscribeVisible, setSubscribeVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [descModalMode, setDescModalMode] = useState<EnhancementMode | null>(null);
  const versionTapCountRef = useRef(0);
  const versionTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reviewNudgeCount, setReviewNudgeCount] = useState<number | null>(null);
  const [proWelcomeVisible, setProWelcomeVisible] = useState(false);
  const proWelcomeCheckedRef = useRef(false);
  const [aiConsentVisible, setAiConsentVisible] = useState(false);
  const pendingProcessRef = useRef<"single" | "batch" | null>(null);
  const { perPhotoPackage, purchase: purchaseSubscription, isSubscribed, isLoading: isSubscriptionLoading, photoCredits, consumePhotoCredit } = useSubscription();

  const buyOnePhoto = async () => {
    if (!perPhotoPackage) {
      Alert.alert(
        "Unavailable",
        "We couldn't reach the App Store right now. Please check your connection and try again in a moment.",
      );
      return;
    }
    try {
      await purchaseSubscription(perPhotoPackage);
      Alert.alert(
        "Purchase Complete",
        "You can now enhance one photo at full HD quality with no watermark.",
      );
    } catch (err: any) {
      if (err?.userCancelled) return;
      Alert.alert("Purchase Failed", err?.message ?? "Unable to complete the purchase.");
    }
  };
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
  const [perPhotoPickerItemId, setPerPhotoPickerItemId] = useState<string | null>(null);

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

  // Request an App Store review after the 3rd successful enhancement.
  // iOS enforces a hard cap on how often the dialog can actually appear
  // (once per app version), so the dialog won't spam users even if this
  // function is called multiple times.
  //
  // `photosCompleted` lets the batch path count each individually enhanced
  // photo rather than treating an entire batch as a single enhancement.
  //
  // `enhancementCount` is reset to 0 on each app version upgrade (see the
  // "Reset review prompt on version upgrade" useEffect below), so iOS's
  // per-version allowance and our 3-enhancement threshold stay in sync.
  const maybeRequestReview = useCallback(async (photosCompleted = 1) => {
    try {
      const raw = await AsyncStorage.getItem("enhancementCount");
      const prev = parseInt(raw ?? "0", 10) || 0;
      const next = prev + photosCompleted;
      await AsyncStorage.setItem("enhancementCount", String(next));
      // Trigger when the count crosses the 3-enhancement threshold for the
      // first time (handles single-photo and batch cases uniformly).
      if (prev < 3 && next >= 3 && await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
      // Keep the nudge in sync — hide permanently once review triggers
      setReviewNudgeCount(next < 3 ? 3 - next : null);
    } catch {
      // Non-critical — never block the happy path
    }
  }, []);

  // Initialise the review nudge count from persisted storage so the nudge
  // shows correctly if the user had already done some enhancements before
  // this session.
  useEffect(() => {
    AsyncStorage.getItem("enhancementCount")
      .then((raw) => {
        const count = parseInt(raw ?? "0", 10) || 0;
        if (count < 3) setReviewNudgeCount(3 - count);
        // count >= 3 means the review was already triggered — leave null (hidden)
      })
      .catch(() => {});
  }, []);

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

  // Show "What's New" once per version bump for returning users.
  //
  // Strategy:
  //   1. On the very first launch ever, record "installVersion" and stop — no
  //      update has occurred so there is nothing new to announce.
  //   2. On subsequent launches, if currentVersion differs from both the stored
  //      installVersion and the last seen version, show the modal.
  //   3. If there is no CHANGELOG entry for this version (e.g. a patch with no
  //      user-visible changes), mark it as seen immediately so we don't retry
  //      every launch.
  useEffect(() => {
    const currentVersion = Constants.expoConfig?.version ?? "";
    if (!currentVersion) return;

    void (async () => {
      try {
        const [seenVersion, installVersion] = await Promise.all([
          AsyncStorage.getItem("whatsNewSeenVersion"),
          AsyncStorage.getItem("installVersion"),
        ]);

        // First ever launch — record the baseline version, don't show modal
        if (!installVersion) {
          await AsyncStorage.setItem("installVersion", currentVersion);
          return;
        }

        // Already seen the notes for this version
        if (seenVersion === currentVersion) return;

        // The app was installed at this version (no update occurred)
        if (installVersion === currentVersion) return;

        // No CHANGELOG entry — mark as seen silently to avoid retrying every launch
        if (!hasWhatsNewForVersion(currentVersion)) {
          await AsyncStorage.setItem("whatsNewSeenVersion", currentVersion);
          return;
        }

        setWhatsNewVersion(currentVersion);
        setWhatsNewVisible(true);
      } catch {
        // Non-critical — skip silently
      }
    })();
  }, []);

  // Reset review prompt on version upgrade.
  //
  // iOS allows one review dialog per app version. We track `enhancementCount`
  // against `reviewPromptVersion` in AsyncStorage. When the app updates, we
  // reset the counter to 0 so the 3-enhancement threshold fires again on the
  // new version — giving loyal, returning users another chance to be prompted.
  useEffect(() => {
    const currentVersion = Constants.expoConfig?.version ?? "";
    if (!currentVersion) return;

    void (async () => {
      try {
        const stored = await AsyncStorage.getItem("reviewPromptVersion");
        if (stored !== currentVersion) {
          await Promise.all([
            AsyncStorage.setItem("enhancementCount", "0"),
            AsyncStorage.setItem("reviewPromptVersion", currentVersion),
          ]);
        }
      } catch {
        // Non-critical — counter will simply not reset this launch
      }
    })();
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

  const handleWhatsNewDismiss = async () => {
    try {
      await AsyncStorage.setItem("whatsNewSeenVersion", whatsNewVersion);
    } catch {
      // Non-critical
    }
    setWhatsNewVisible(false);
  };

  const handleShowWhatsNewManually = useCallback(() => {
    const currentVersion = Constants.expoConfig?.version ?? "";
    const displayVersion = hasWhatsNewForVersion(currentVersion)
      ? currentVersion
      : getLatestChangelogVersion() ?? currentVersion;
    if (!displayVersion) return;
    setWhatsNewManualVersion(displayVersion);
    setWhatsNewManualVisible(true);
  }, []);

  // Open the native App Store review sheet if the OS supports it; otherwise
  // fall back to the App Store product page so the user can leave a review there.
  const handleRateApp = useCallback(async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        await Linking.openURL(
          "https://apps.apple.com/app/id6770767370?action=write-review",
        );
      }
    } catch {
      // Non-critical — silently ignore if neither path is available
    }
  }, []);

  const handleProWelcomeDismiss = () => {
    setProWelcomeVisible(false);
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

  // Show "Welcome to Pro" banner the first time the app opens after a subscription upgrade.
  //
  // Strategy:
  //   1. Wait until RevenueCat has finished loading the subscription state.
  //   2. Read the previously stored subscription state from AsyncStorage.
  //   3. If the stored state was "not subscribed" (or absent for new installs that
  //      never purchased) and the current state is subscribed → this is a fresh
  //      upgrade; show the banner and record the new state.
  //   4. Always update the stored state once we know the current state, so the
  //      next launch starts from the correct baseline.
  //   5. Use proWelcomeCheckedRef to ensure we only run this logic once per
  //      session, even if isSubscriptionLoading briefly flickers.
  useEffect(() => {
    if (isSubscriptionLoading) return;
    if (proWelcomeCheckedRef.current) return;
    proWelcomeCheckedRef.current = true;

    void (async () => {
      try {
        const stored = await AsyncStorage.getItem("onjjem_last_subscribed");
        const wasSubscribed = stored === "1";

        if (isSubscribed && !wasSubscribed) {
          setProWelcomeVisible(true);
        }

        await AsyncStorage.setItem("onjjem_last_subscribed", isSubscribed ? "1" : "0");
      } catch {
        // Non-critical — skip silently
      }
    })();
  }, [isSubscriptionLoading, isSubscribed]);

  // Prune old gallery entries on every launch
  useEffect(() => {
    void pruneHistory();
  }, []);

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
    try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    const canProceed =
      permission.granted || (permission.status as string) === "limited";

    if (!canProceed) {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Photos Access Blocked",
          "ONJJEM needs access to your photo library. Please go to iPhone Settings → Privacy & Security → Photos → ONJJEM and choose 'All Photos'.",
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
      const BATCH_CAP = 10;
      if (result.assets.length > BATCH_CAP) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Too Many Photos",
            `You selected ${result.assets.length} photos. ONJJEM can process up to ${BATCH_CAP} photos at a time to keep things fast and reliable.\n\nWould you like to restore the first ${BATCH_CAP} photos?`,
            [
              {
                text: `Process First ${BATCH_CAP}`,
                onPress: () => resolve(true),
              },
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
            ],
          );
        });
        if (!confirmed) return;
        result.assets.splice(BATCH_CAP);
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const defaultModes = new Set(selectedModes);
      const items: BatchItem[] = result.assets.map((asset) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        uri: asset.uri,
        base64: asset.base64 ?? null,
        resultBase64: null,
        resultLocalUri: null,
        status: "pending" as const,
        modes: new Set(defaultModes),
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not open photo library";
      Alert.alert("Unable to Open Photos", msg, [{ text: "OK" }]);
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

  const handleProcessWithConsent = async (type: "single" | "batch") => {
    try {
      const consent = await AsyncStorage.getItem("ai_processing_consent_v2");
      if (consent === "accepted") {
        if (type === "batch") {
          void processBatch();
        } else {
          void processPhoto();
        }
        return;
      }
    } catch {
      // Fall through to show consent modal
    }
    pendingProcessRef.current = type;
    setAiConsentVisible(true);
  };

  const handleConsentAccept = async () => {
    try {
      await AsyncStorage.setItem("ai_processing_consent_v2", "accepted");
    } catch {
      // Non-critical
    }
    setAiConsentVisible(false);
    const pending = pendingProcessRef.current;
    pendingProcessRef.current = null;
    if (pending === "batch") {
      void processBatch();
    } else if (pending === "single") {
      void processPhoto();
    }
  };

  const handleConsentDecline = () => {
    pendingProcessRef.current = null;
    setAiConsentVisible(false);
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
        try {
          base64 = await FileSystem.readAsStringAsync(originalUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          throw new Error(
            "Could not read the selected photo. Please try a different photo or restart the app."
          );
        }
      }
      // Strip any data-URL prefix that expo-image-picker may include
      if (base64.startsWith("data:")) {
        base64 = base64.split(",")[1] ?? "";
      }

      if (cancelledRef.current) return;

      const domain = process.env.EXPO_PUBLIC_DOMAIN || "photo-fix-ai.replit.app";
      const apiUrl = `https://${domain}/api/process`;

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
            freePreview: !(isSubscribed || photoCredits > 0),
          }),
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
        // Consume a photo credit if user isn't subscribed but has credits
        if (!isSubscribed && photoCredits > 0) {
          await consumePhotoCredit();
        }
        setAppState("done");
        // Show result tip sheet on first successful enhancement
        AsyncStorage.getItem("hasSeenResultTip").then((seen) => {
          if (!seen) setResultTipVisible(true);
        }).catch(() => setResultTipVisible(true));
        // Mark free trial as used — persisted so it survives app restarts
        await AsyncStorage.setItem("freeTrialUsed", "1");
        setHasUsedFreeTrial(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void maybeRequestReview();
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

    const domain = process.env.EXPO_PUBLIC_DOMAIN || "photo-fix-ai.replit.app";
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
            try {
              base64 = await FileSystem.readAsStringAsync(item.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } catch {
              throw new Error(
                "Could not read one of the selected photos. Please try different photos or restart the app."
              );
            }
          }
        }
        // Strip any data-URL prefix that expo-image-picker may include
        if (base64 && base64.startsWith("data:")) {
          base64 = base64.split(",")[1] ?? "";
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
              modes: Array.from(item.modes),
              freePreview: !(isSubscribed || photoCredits > 0),
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
            modes: Array.from(item.modes),
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
      // Consume photo credits for each successfully processed item
      const successCount = updatedItems.filter((it) => it.status === "done").length;
      if (!isSubscribed && photoCredits > 0) {
        const creditsToConsume = Math.min(successCount, photoCredits);
        for (let i = 0; i < creditsToConsume; i++) {
          await consumePhotoCredit();
        }
      }
      setAppState("batch-done");
      void maybeRequestReview(successCount);
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
      <WelcomeModal
        visible={welcomeVisible}
        onDismiss={handleWelcomeDismiss}
        initialIndex={welcomeInitialIndex}
        onIndexChange={setLastWelcomeIndex}
      />
      <WhatsNewModal visible={whatsNewVisible} version={whatsNewVersion} onDismiss={handleWhatsNewDismiss} />
      <WhatsNewModal visible={whatsNewManualVisible} version={whatsNewManualVersion} onDismiss={() => setWhatsNewManualVisible(false)} />
      <EnhancementTipSheet visible={tipSheetVisible} onDismiss={handleTipSheetDismiss} />
      <ResultTipSheet visible={resultTipVisible} onDismiss={handleResultTipDismiss} />
      <ProWelcomeBanner visible={proWelcomeVisible} onDismiss={handleProWelcomeDismiss} />
      <AIConsentModal
        visible={aiConsentVisible}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      {/* Enhancement description bottom sheet */}
      {(() => {
        const activeEnh = ENHANCEMENTS.find((e) => e.id === descModalMode);
        return (
          <Modal
            visible={descModalMode !== null}
            transparent
            animationType="slide"
            onRequestClose={() => setDescModalMode(null)}
          >
            <Pressable style={s.descBackdrop} onPress={() => setDescModalMode(null)}>
              <Pressable style={s.descSheet} onPress={() => {}}>
                {activeEnh && (
                  <>
                    <View style={[s.descIconCircle, { backgroundColor: `${activeEnh.accent}26`, borderColor: `${activeEnh.accent}66` }]}>
                      <Ionicons name={activeEnh.icon} size={34} color={activeEnh.accent} />
                    </View>
                    <Text style={[s.descTitle, { color: activeEnh.accent }]}>{activeEnh.title}</Text>
                    <Text style={s.descBody}>{activeEnh.description}</Text>
                    <TouchableOpacity style={[s.descDismissBtn, { borderColor: activeEnh.accent }]} onPress={() => setDescModalMode(null)} activeOpacity={0.8}>
                      <Text style={[s.descDismissBtnText, { color: activeEnh.accent }]}>Got it</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}

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
            onPress={() => {
              setWelcomeInitialIndex(lastWelcomeIndex);
              setWelcomeVisible(true);
            }}
            style={s.infoBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="rgba(201,150,12,0.75)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const domain = process.env.EXPO_PUBLIC_DOMAIN || "photo-fix-ai.replit.app";
              void Linking.openURL(`https://${domain}/onjjem-website/`);
            }}
            style={s.shopHeaderBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-handle-outline" size={22} color="rgba(201,150,12,0.75)" />
          </TouchableOpacity>
        </View>

        {appState === "idle" && (
          <>
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

            <TouchableOpacity
              style={s.shopCTA}
              onPress={() => {
                const domain = process.env.EXPO_PUBLIC_DOMAIN || "photo-fix-ai.replit.app";
                void Linking.openURL(`https://${domain}/onjjem-website/`);
              }}
              activeOpacity={0.85}
            >
              <View style={s.shopCTAInner}>
                <Ionicons name="bag-outline" size={20} color="#C9960C" />
                <View style={s.shopCTAText}>
                  <Text style={s.shopCTATitle}>Print Shop</Text>
                  <Text style={s.shopCTASub}>Canvas, jigsaws & gifts from your photos</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(201,150,12,0.6)" />
              </View>
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
              {batchItems.length} Photos Selected — tap to customise
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.batchThumbRow}
            >
              {batchItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={s.batchThumbWrap}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPerPhotoPickerItemId(item.id);
                  }}
                  activeOpacity={0.75}
                >
                  <Image source={{ uri: item.uri }} style={s.batchThumb} resizeMode="cover" />
                  <View style={s.batchThumbBadge}>
                    <Text style={s.batchThumbNum}>{idx + 1}</Text>
                  </View>
                  {/* Mode dot badges — one per selected enhancement */}
                  <View style={s.batchThumbDotsRow}>
                    {Array.from(item.modes).map((modeId) => {
                      const enh = ENHANCEMENTS.find((e) => e.id === modeId);
                      if (!enh) return null;
                      return (
                        <View
                          key={modeId}
                          style={[s.batchThumbModeDot, { backgroundColor: enh.accent }]}
                        />
                      );
                    })}
                  </View>
                  {/* Edit icon overlay */}
                  <View style={s.batchThumbEditOverlay}>
                    <Ionicons name="options-outline" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.batchEstTime}>
              {(() => {
                const totalSecs = batchItems.length * selectedModes.size * 15;
                if (totalSecs < 60) return `~${totalSecs}s estimated`;
                const mins = Math.ceil(totalSecs / 60);
                return `~${mins} minute${mins === 1 ? "" : "s"} estimated`;
              })()}
            </Text>
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
          <View style={s.imageBlock}>
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
            <TouchableOpacity
              onPress={() => setSubscribeVisible(true)}
              activeOpacity={0.85}
              style={s.imageTapHint}
            >
              <Ionicons name="sparkles" size={12} color="#C9960C" />
              <Text style={s.imageTapHintText}>Tap here to unlock full quality</Text>
              <Ionicons name="sparkles" size={12} color="#C9960C" />
            </TouchableOpacity>
          </View>
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

            {/* Pricing strip — 3 equal tiles */}
            <View style={s.pricingTileRow}>
              {hasUsedFreeTrial ? (
                <>
                  <TouchableOpacity style={[s.pricingTile, { backgroundColor: "#1A1408", borderColor: "#E8A020" }]} onPress={() => setSubscribeVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="camera" size={20} color="#E8A020" />
                    <Text style={[s.pricingTilePrice, { color: "#E8A020" }]}>{PRICING.perPhoto.amount}</Text>
                    <Text style={[s.pricingTileLabel, { color: "rgba(232,160,32,0.7)" }]}>per photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.pricingTile, { backgroundColor: "#0E1828", borderColor: "#4A90D9" }]} onPress={() => setSubscribeVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="calendar" size={20} color="#4A90D9" />
                    <Text style={[s.pricingTilePrice, { color: "#4A90D9" }]}>{PRICING.monthly.amount}</Text>
                    <Text style={[s.pricingTileLabel, { color: "rgba(74,144,217,0.7)" }]}>per month</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[s.pricingTile, { backgroundColor: "#0E1A0E", borderColor: "#27AE60" }]} onPress={() => {
                    if (selectedModes.size === 0) {
                      Alert.alert("Pick an Enhancement", "Select one of the enhancement types below, then tap Enhance Free.");
                    } else {
                      appState === "batch-selected"
                        ? void handleProcessWithConsent("batch")
                        : void handleProcessWithConsent("single");
                    }
                  }} activeOpacity={0.8}>
                    <Ionicons name="sparkles" size={20} color="#27AE60" />
                    <Text style={[s.pricingTilePrice, { color: "#27AE60" }]}>Free</Text>
                    <Text style={[s.pricingTileLabel, { color: "rgba(39,174,96,0.7)" }]}>1 sample</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.pricingTile, { backgroundColor: "#1A1408", borderColor: "#E8A020" }]} onPress={() => setSubscribeVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="camera" size={20} color="#E8A020" />
                    <Text style={[s.pricingTilePrice, { color: "#E8A020" }]}>{PRICING.perPhoto.amount}</Text>
                    <Text style={[s.pricingTileLabel, { color: "rgba(232,160,32,0.7)" }]}>per photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.pricingTile, { backgroundColor: "#0E1828", borderColor: "#4A90D9" }]} onPress={() => setSubscribeVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="calendar" size={20} color="#4A90D9" />
                    <Text style={[s.pricingTilePrice, { color: "#4A90D9" }]}>{PRICING.monthly.amount}</Text>
                    <Text style={[s.pricingTileLabel, { color: "rgba(74,144,217,0.7)" }]}>per month</Text>
                  </TouchableOpacity>
                </>
              )}
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
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDescModalMode(enh.id);
                    }}
                    delayLongPress={350}
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
                ? (hasUsedFreeTrial && !isSubscribed && photoCredits === 0
                    ? () => setSubscribeVisible(true)
                    : appState === "batch-selected"
                      ? () => void handleProcessWithConsent("batch")
                      : () => void handleProcessWithConsent("single"))
                : undefined}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={hasUsedFreeTrial && !isSubscribed && photoCredits === 0
                  ? ["#A67C00", "#C9960C", "#E8B422", "#C9960C"]
                  : ["#1A8C40", "#27AE60", "#2ECC71", "#27AE60"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.processBtnGradient}
              >
                <Ionicons name={hasUsedFreeTrial && !isSubscribed && photoCredits === 0 ? "sparkles" : "sparkles"} size={24} color="#fff" />
                <Text style={s.processBtnText}>
                  {hasUsedFreeTrial && !isSubscribed && photoCredits === 0
                    ? "Subscribe to Enhance"
                    : appState === "batch-selected"
                      ? `Enhance Free — ${batchItems.length} Photos${selectedModes.size > 1 ? ` (${selectedModes.size} effects)` : ""}`
                      : `Enhance Free${selectedModes.size > 1 ? ` (${selectedModes.size} effects)` : " — First Photo Free"}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </>
        )}

        {appState === "done" && (
          <>
            <EnhancementPaywall
              selectedModeCount={selectedModes.size}
              onUpgradeSingle={buyOnePhoto}
              onUpgradeUnlimited={() => setSubscribeVisible(true)}
            />
            <TouchableOpacity
              onPress={() => setResultTipVisible(true)}
              activeOpacity={0.7}
              style={s.resultInfoBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="information-circle-outline" size={16} color="rgba(201,150,12,0.75)" />
              <Text style={s.resultInfoBtnText}>What can I do with this photo?</Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={shareOnWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={s.whatsappBtnText}>Share to WhatsApp</Text>
            </TouchableOpacity>
            {reviewNudgeCount !== null && reviewNudgeCount > 0 && (
              <View style={s.reviewNudge}>
                <Ionicons name="star-outline" size={13} color="rgba(255,214,0,0.45)" />
                <Text style={s.reviewNudgeText}>
                  {reviewNudgeCount === 1
                    ? "One more restoration unlocks a surprise"
                    : `${reviewNudgeCount} more restorations unlock something special`}
                </Text>
              </View>
            )}
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
                  <BeforeAfterSlider
                    beforeUri={item.uri}
                    afterBase64={item.resultBase64}
                    style={s.batchCardImage}
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
            {reviewNudgeCount !== null && reviewNudgeCount > 0 && (
              <View style={s.reviewNudge}>
                <Ionicons name="star-outline" size={13} color="rgba(255,214,0,0.45)" />
                <Text style={s.reviewNudgeText}>
                  {reviewNudgeCount === 1
                    ? "One more restoration unlocks a surprise"
                    : `${reviewNudgeCount} more restorations unlock something special`}
                </Text>
              </View>
            )}
          </>
        )}

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

        {/* Rate the app */}
        <TouchableOpacity
          style={s.contactSupportBtn}
          onPress={() => void handleRateApp()}
          activeOpacity={0.8}
        >
          <Ionicons name="star-outline" size={18} color={colors.mutedForeground} />
          <Text style={s.contactSupportText}>Rate ONJJEM on the App Store</Text>
        </TouchableOpacity>

        {/* What's New / Release Notes */}
        <TouchableOpacity
          style={s.contactSupportBtn}
          onPress={handleShowWhatsNewManually}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles-outline" size={18} color={colors.mutedForeground} />
          <Text style={s.contactSupportText}>What's New</Text>
        </TouchableOpacity>

        {/* Version label — long-press opens dev paywall stats; 5 quick taps opens dev settings */}
        <TouchableOpacity
          activeOpacity={0.6}
          onLongPress={() => setStatsVisible(true)}
          delayLongPress={800}
          onPress={() => {
            versionTapCountRef.current += 1;
            if (versionTapTimerRef.current) clearTimeout(versionTapTimerRef.current);
            if (versionTapCountRef.current >= 5) {
              versionTapCountRef.current = 0;
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push("/dev-settings" as Parameters<typeof router.push>[0]);
            } else {
              versionTapTimerRef.current = setTimeout(() => {
                versionTapCountRef.current = 0;
              }, 1500);
            }
          }}
          style={s.versionLabel}
        >
          <Text style={s.versionLabelText}>
            v{Constants.expoConfig?.version ?? "—"}
          </Text>
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
      <PaywallStatsModal visible={statsVisible} onClose={() => setStatsVisible(false)} />

      {/* Per-photo enhancement picker bottom sheet */}
      {(() => {
        const pickerItem = batchItems.find((it) => it.id === perPhotoPickerItemId) ?? null;
        if (!pickerItem) return null;
        const itemIdx = batchItems.findIndex((it) => it.id === perPhotoPickerItemId);
        return (
          <Modal
            visible={!!pickerItem}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={() => setPerPhotoPickerItemId(null)}
          >
            <Pressable
              style={s.perPhotoBackdrop}
              onPress={() => setPerPhotoPickerItemId(null)}
            >
              <Pressable style={[s.perPhotoSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                {/* Handle */}
                <View style={s.perPhotoHandle} />

                {/* Header */}
                <View style={s.perPhotoHeaderRow}>
                  <Image
                    source={{ uri: pickerItem.uri }}
                    style={s.perPhotoThumbPreview}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <LinearGradient
                      colors={["#C9960C", "#F5D78E", "#C9960C"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={s.perPhotoBadge}
                    >
                      <Ionicons name="options-outline" size={10} color="#0A0804" />
                      <Text style={s.perPhotoBadgeText}>PHOTO {itemIdx + 1} OF {batchItems.length}</Text>
                    </LinearGradient>
                    <Text style={s.perPhotoTitle}>Choose Enhancements</Text>
                    <Text style={s.perPhotoSub}>Select up to 3 for this photo</Text>
                  </View>
                </View>

                {/* Enhancement grid — 3×2 */}
                <View style={s.perPhotoGrid}>
                  {ENHANCEMENTS.map((enh) => {
                    const isSelected = pickerItem.modes.has(enh.id);
                    const atLimit = pickerItem.modes.size >= 3 && !isSelected;
                    return (
                      <TouchableOpacity
                        key={enh.id}
                        style={[
                          s.perPhotoCard,
                          isSelected && { borderColor: enh.accent, borderWidth: 2 },
                          atLimit && { opacity: 0.4 },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (atLimit) return;
                          Haptics.selectionAsync();
                          setBatchItems((prev) =>
                            prev.map((it) => {
                              if (it.id !== pickerItem.id) return it;
                              const next = new Set(it.modes);
                              if (next.has(enh.id)) {
                                if (next.size === 1) return it;
                                next.delete(enh.id);
                              } else {
                                next.add(enh.id);
                              }
                              return { ...it, modes: next };
                            })
                          );
                        }}
                      >
                        <LinearGradient
                          colors={
                            isSelected
                              ? [`${enh.accent}28`, `${enh.accent}12`]
                              : ["#1C1A14", "#16140F"]
                          }
                          style={s.perPhotoCardGradient}
                        >
                          {isSelected && (
                            <View style={[s.perPhotoCheckBadge, { backgroundColor: enh.accent }]}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                          <View
                            style={[
                              s.perPhotoIconCircle,
                              { backgroundColor: `${enh.accent}26`, borderColor: `${enh.accent}66` },
                              isSelected && { backgroundColor: `${enh.accent}44`, borderColor: enh.accent },
                            ]}
                          >
                            <Ionicons name={enh.icon} size={24} color={enh.accent} />
                          </View>
                          <Text style={[s.perPhotoCardTitle, { color: enh.accent }]}>{enh.title}</Text>
                          <Text style={s.perPhotoCardSub}>{enh.subtitle}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Done button */}
                <TouchableOpacity
                  onPress={() => setPerPhotoPickerItemId(null)}
                  activeOpacity={0.88}
                  style={s.perPhotoDoneBtnWrap}
                >
                  <LinearGradient
                    colors={["#C9960C", "#F5D78E", "#C9960C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.perPhotoDoneBtn}
                  >
                    <Text style={s.perPhotoDoneBtnText}>Done</Text>
                    <Ionicons name="checkmark" size={18} color="#0A0804" />
                  </LinearGradient>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}
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
    shopHeaderBtn: {
      position: "absolute" as const,
      top: 20,
      left: 24,
      width: 36,
      height: 36,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    shopCTA: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.35)",
      backgroundColor: "rgba(13,27,42,0.75)",
      overflow: "hidden" as const,
    },
    shopCTAInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    shopCTAText: {
      flex: 1,
    },
    shopCTATitle: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#F5EDD8",
      letterSpacing: 0.3,
    },
    shopCTASub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,237,216,0.55)",
      marginTop: 2,
      lineHeight: 16,
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
    pricingTileRow: {
      flexDirection: "row" as const,
      gap: 8,
    },
    pricingTile: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRadius: 14,
      borderWidth: 1.5,
      paddingVertical: 12,
      paddingHorizontal: 4,
      gap: 4,
    },
    pricingTilePrice: {
      fontSize: 15,
      fontWeight: "800" as const,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
    pricingTileLabel: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      textAlign: "center" as const,
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
    descBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end" as const,
    },
    descSheet: {
      backgroundColor: "#1A1814",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 28,
      paddingBottom: insets.bottom + 24,
      paddingHorizontal: 28,
      alignItems: "center" as const,
      gap: 14,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    descIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 4,
    },
    descTitle: {
      fontSize: 22,
      fontWeight: "800" as const,
      fontFamily: "Inter_700Bold",
      textAlign: "center" as const,
      letterSpacing: 0.3,
    },
    descBody: {
      fontSize: 15,
      color: "rgba(250,247,242,0.8)",
      fontFamily: "Inter_400Regular",
      textAlign: "center" as const,
      lineHeight: 22,
    },
    descDismissBtn: {
      marginTop: 8,
      borderWidth: 1.5,
      borderRadius: 50,
      paddingVertical: 12,
      paddingHorizontal: 40,
    },
    descDismissBtnText: {
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
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
    resultInfoBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignSelf: "center" as const,
    },
    resultInfoBtnText: {
      fontSize: 13,
      color: "rgba(201,150,12,0.75)",
      fontWeight: "500" as const,
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
    reviewNudge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingTop: 6,
      paddingBottom: 2,
      opacity: 0.8,
    },
    reviewNudgeText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(245,215,142,0.6)",
      textAlign: "center",
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
    versionLabel: {
      alignItems: "center" as const,
      paddingVertical: 12,
      paddingBottom: bottomPad + 4,
    },
    versionLabelText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.18)",
      letterSpacing: 0.8,
    },
    /* ── Jubilee Banner ── */

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
    batchEstTime: {
      fontSize: 11,
      color: "rgba(255,255,255,0.45)",
      marginTop: 8,
      textAlign: "center" as const,
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
    batchThumbDotsRow: {
      position: "absolute" as const,
      bottom: 4,
      left: 4,
      flexDirection: "row" as const,
      gap: 3,
    },
    batchThumbModeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
    },
    batchThumbEditOverlay: {
      position: "absolute" as const,
      bottom: 4,
      right: 4,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 6,
      padding: 3,
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

    perPhotoBackdrop: {
      flex: 1,
      justifyContent: "flex-end" as const,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    perPhotoSheet: {
      backgroundColor: "#0F0D09",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "rgba(201,150,12,0.18)",
    },
    perPhotoHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(245,237,216,0.2)",
      alignSelf: "center" as const,
      marginBottom: 18,
    },
    perPhotoHeaderRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      marginBottom: 20,
    },
    perPhotoThumbPreview: {
      width: 56,
      height: 56,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.4)",
      flexShrink: 0,
    },
    perPhotoBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      alignSelf: "flex-start" as const,
      marginBottom: 6,
    },
    perPhotoBadgeText: {
      fontSize: 9,
      fontWeight: "800" as const,
      color: "#0A0804",
      letterSpacing: 1.2,
    },
    perPhotoTitle: {
      fontSize: 18,
      fontWeight: "800" as const,
      color: "#F5EDD8",
      letterSpacing: 0.2,
    },
    perPhotoSub: {
      fontSize: 12,
      color: "rgba(245,237,216,0.45)",
      marginTop: 2,
    },
    perPhotoGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginBottom: 18,
    },
    perPhotoCard: {
      width: "30.5%" as any,
      borderRadius: 12,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "rgba(201,150,12,0.18)",
    },
    perPhotoCardGradient: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center" as const,
      gap: 6,
      minHeight: 90,
      justifyContent: "center" as const,
    },
    perPhotoCheckBadge: {
      position: "absolute" as const,
      top: 6,
      right: 6,
      borderRadius: 8,
      width: 16,
      height: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    perPhotoIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    perPhotoCardTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      textAlign: "center" as const,
      letterSpacing: 0.2,
    },
    perPhotoCardSub: {
      fontSize: 10,
      color: "rgba(245,237,216,0.45)",
      textAlign: "center" as const,
      lineHeight: 13,
    },
    perPhotoDoneBtnWrap: {
      borderRadius: 14,
      overflow: "hidden" as const,
    },
    perPhotoDoneBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 16,
    },
    perPhotoDoneBtnText: {
      fontSize: 16,
      fontWeight: "800" as const,
      color: "#0A0804",
      letterSpacing: 0.3,
    },
  });
}