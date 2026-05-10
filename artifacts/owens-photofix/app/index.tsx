import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useColors } from "@/hooks/useColors";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ProPaywall } from "@/components/ProPaywall";

type Mode = "sharpen" | "colorize";
type AppState = "idle" | "selected" | "processing" | "done";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [paywallVisible, setPaywallVisible] = useState(false);
  const [appState, setAppState] = useState<AppState>("idle");
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [resultLocalUri, setResultLocalUri] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("sharpen");
  const [statusMessage, setStatusMessage] = useState("Preparing...");

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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setOriginalUri(result.assets[0].uri);
      setResultBase64(null);
      setResultLocalUri(null);
      setAppState("selected");
    }
  };

  const processPhoto = async () => {
    if (!originalUri) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAppState("processing");
    setStatusMessage("Reading your photo...");

    try {
      const base64 = await FileSystem.readAsStringAsync(originalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setStatusMessage(
        mode === "sharpen"
          ? "Sharpening your photo..."
          : "Restoring colour to your photo...",
      );

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const apiUrl = `https://${domain}/api/process`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mode }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Processing failed");
      }

      const b64: string = data.resultBase64;
      setResultBase64(b64);

      const localPath =
        (FileSystem.documentDirectory ?? "") + "photofix_result.jpg";
      await FileSystem.writeAsStringAsync(localPath, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setResultLocalUri(localPath);

      setAppState("done");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Error", message, [
        { text: "Try Again", onPress: () => setAppState("selected") },
      ]);
    }
  };

  const saveToLibrary = async () => {
    if (!resultLocalUri) return;

    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Saving to Photos is only available on iPhone.");
      return;
    }

    try {
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
      <View style={s.header}>
        <View>
          <Text style={s.headerTitleTop}>ONJJEM</Text>
          <Text style={s.headerTitleBottom}>SNAP LAB</Text>
        </View>
        {appState !== "idle" && (
          <TouchableOpacity onPress={resetApp} style={s.resetBtn}>
            <Ionicons name="refresh" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {appState === "idle" && (
          <>
            <Pressable
              style={({ pressed }) => [s.uploadArea, pressed && s.pressed]}
              onPress={pickImage}
            >
              <View style={s.uploadInner}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={s.logoIcon}
                />
                <Text style={s.uploadTitle}>Upload a Photo</Text>
                <Text style={s.uploadSub}>Tap to choose from your library</Text>
              </View>
            </Pressable>

            <TouchableOpacity style={s.proBtnGlow} onPress={() => setPaywallVisible(true)} activeOpacity={0.88}>
              <LinearGradient
                colors={["#FFE566", "#F5C030", "#E08800"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.proBtn}
              >
                <Ionicons name="star" size={22} color="#fff" />
                <Text style={s.proBtnText}>Unlock Pro</Text>
                <View style={s.proBadge}>
                  <Text style={s.proBadgeText}>✦ PREMIUM</Text>
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
          <View style={s.processingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.processingText}>{statusMessage}</Text>
          </View>
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
                  Colorize
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
      </ScrollView>

      <View style={s.dedication}>
        <Text style={s.dedicationText}>
          Built for Niamh · Erin · Owen · Mikey · Jake · Jimmy
        </Text>
      </View>

      <ProPaywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
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
    header: {
      paddingTop: topPad + 8,
      paddingHorizontal: 24,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitleTop: {
      fontSize: 40,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: 4,
      lineHeight: 42,
      textShadowColor: "rgba(0,85,255,0.22)",
      textShadowOffset: { width: 3, height: 3 },
      textShadowRadius: 0,
    },
    headerTitleBottom: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      letterSpacing: 7,
      textShadowColor: "rgba(0,85,255,0.3)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 0,
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
      padding: 20,
      paddingBottom: bottomPad,
      gap: 16,
    },
    uploadArea: {
      borderRadius: colors.radius * 1.5,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
      backgroundColor: colors.card,
      minHeight: 260,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    logoIcon: {
      width: 80,
      height: 80,
      borderRadius: 18,
    },
    uploadInner: {
      alignItems: "center",
      gap: 12,
      padding: 32,
    },
    uploadTitle: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      textShadowColor: "rgba(0,0,0,0.12)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 1,
    },
    uploadSub: {
      fontSize: 18,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
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
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 40,
      alignItems: "center",
      gap: 16,
    },
    processingText: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
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
