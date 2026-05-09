import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
import { useColors } from "@/hooks/useColors";

type Mode = "sharpen" | "colorize";
type AppState = "idle" | "selected" | "processing" | "done";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [appState, setAppState] = useState<AppState>("idle");
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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
      setResultUrl(null);
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
          : "Adding colour to your photo...",
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

      setResultUrl(data.resultUrl);
      setAppState("done");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Error", message, [
        {
          text: "Try Again",
          onPress: () => setAppState("selected"),
        },
      ]);
    }
  };

  const shareOnWhatsApp = async () => {
    if (!resultUrl) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localUri =
        FileSystem.documentDirectory + "photofix_result.jpg";
      await FileSystem.downloadAsync(resultUrl, localUri);

      if (Platform.OS === "web") {
        Alert.alert(
          "Share",
          "Image saved. Open WhatsApp to share it.",
        );
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

      await Sharing.shareAsync(localUri, {
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
        dialogTitle: "Share your fixed photo",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the image. Please try again.");
    }
  };

  const resetApp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppState("idle");
    setOriginalUri(null);
    setResultUrl(null);
  };

  const s = styles(colors, insets);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Owens Photofix</Text>
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
          <Pressable
            style={({ pressed }) => [s.uploadArea, pressed && s.pressed]}
            onPress={pickImage}
          >
            <View style={s.uploadInner}>
              <Ionicons name="image-outline" size={64} color={colors.primary} />
              <Text style={s.uploadTitle}>Upload a Photo</Text>
              <Text style={s.uploadSub}>
                Tap to choose from your library
              </Text>
            </View>
          </Pressable>
        )}

        {(appState === "selected" ||
          appState === "processing" ||
          appState === "done") &&
          originalUri && (
            <View style={s.imageContainer}>
              <Text style={s.imageLabel}>Original</Text>
              <Image source={{ uri: originalUri }} style={s.image} />
            </View>
          )}

        {appState === "done" && resultUrl && (
          <View style={s.imageContainer}>
            <Text style={[s.imageLabel, { color: colors.primary }]}>
              {mode === "sharpen" ? "Sharpened" : "Colourised"}
            </Text>
            <Image source={{ uri: resultUrl }} style={s.image} />
          </View>
        )}

        {appState === "processing" && (
          <View style={s.processingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.processingText}>{statusMessage}</Text>
            <Text style={s.processingNote}>
              This can take up to 60 seconds
            </Text>
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
                    s.modeBtnText,
                    mode === "sharpen" && { color: "#fff" },
                  ]}
                >
                  Sharpen
                </Text>
                <Text
                  style={[
                    s.modeBtnSub,
                    mode === "sharpen" && { color: "rgba(255,255,255,0.75)" },
                  ]}
                >
                  Make blurry photos crisp
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
                    s.modeBtnText,
                    mode === "colorize" && { color: "#000" },
                  ]}
                >
                  Colourize
                </Text>
                <Text
                  style={[
                    s.modeBtnSub,
                    mode === "colorize" && {
                      color: "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  Add colour to old photos
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
              style={s.changePhotoBtn}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Text style={s.changePhotoBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {appState === "done" && (
          <>
            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={shareOnWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#fff" />
              <Text style={s.whatsappBtnText}>Share on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.tryAgainBtn}
              onPress={() => setAppState("selected")}
              activeOpacity={0.7}
            >
              <Text style={s.tryAgainText}>Try Different Enhancement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.newPhotoBtn}
              onPress={resetApp}
              activeOpacity={0.7}
            >
              <Text style={s.newPhotoText}>Fix Another Photo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function styles(
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
  insets: { top: number; bottom: number; left: number; right: number },
) {
  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
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
    headerTitle: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
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
    uploadInner: {
      alignItems: "center",
      gap: 12,
      padding: 32,
    },
    uploadTitle: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    uploadSub: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    imageContainer: {
      gap: 8,
    },
    imageLabel: {
      fontSize: 13,
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
      padding: 32,
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
    processingNote: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginTop: 8,
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
      gap: 6,
      alignItems: "flex-start",
    },
    modeBtnText: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    modeBtnSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    processBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 20,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 4,
    },
    processBtnText: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    changePhotoBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    changePhotoBtnText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    whatsappBtn: {
      backgroundColor: "#25D366",
      borderRadius: colors.radius,
      paddingVertical: 22,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 8,
    },
    whatsappBtnText: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    tryAgainBtn: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingVertical: 18,
      alignItems: "center",
    },
    tryAgainText: {
      fontSize: 17,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    newPhotoBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    newPhotoText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
  });
}
