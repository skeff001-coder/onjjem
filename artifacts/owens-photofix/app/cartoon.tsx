import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

type Phase = "idle" | "picked" | "generating" | "done" | "error";

export default function CartoonScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cartoonUri, setCartoonUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/heic", "image/webp"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhase("picked");

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = asset.mimeType ?? "image/jpeg";
      generateCartoon(base64, mimeType);
    } catch (err) {
      setErrorMsg("Could not open the photo picker. Please try again.");
      setPhase("error");
    }
  };

  const generateCartoon = async (base64: string, mimeType: string) => {
    setPhase("generating");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/cartoonify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64, mimeType }),
      });
      const data = await res.json();
      if (data.base64Image) {
        setCartoonUri(`data:${data.mimeType ?? "image/png"};base64,${data.base64Image}`);
        setPhase("done");
      } else {
        setErrorMsg(data.error || "Couldn't create the cartoon. Please try again.");
        setPhase("error");
      }
    } catch (err) {
      setErrorMsg("Could not connect. Please check your connection and try again.");
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("idle");
    setPhotoUri(null);
    setCartoonUri(null);
    setErrorMsg("");
  };

  const openShop = () => Linking.openURL("https://onjjem.com/shop");

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#F5EDD8" />
        </TouchableOpacity>

        <View style={s.hero}>
          <View style={s.goldLine} />
          <Text style={s.title}>Cartoon-ify</Text>
          <Text style={s.subtitle}>
            Turn any photo into a vibrant, animated-movie-style illustration
          </Text>
          <View style={s.goldLine} />
        </View>

        {phase === "idle" && (
          <View style={s.startCard}>
            <Ionicons name="color-wand-outline" size={48} color="#C9960C" />
            <Text style={s.startTitle}>Choose a photo to transform</Text>
            <TouchableOpacity onPress={pickPhoto} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {(phase === "generating" || phase === "picked") && photoUri && (
          <View style={s.previewCard}>
            <Image source={{ uri: photoUri }} style={s.previewImg} resizeMode="cover" />
            <View style={s.loadingRow}>
              <ActivityIndicator color="#C9960C" />
              <Text style={s.loadingText}>Creating your cartoon...</Text>
            </View>
          </View>
        )}

        {phase === "error" && (
          <View style={s.startCard}>
            <Ionicons name="alert-circle-outline" size={40} color="#e05252" />
            <Text style={s.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={reset} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "done" && cartoonUri && (
          <View style={s.resultCard}>
            <Image source={{ uri: cartoonUri }} style={s.resultImg} resizeMode="cover" />
            <Text style={s.resultLabel}>✨ Here's your cartoon!</Text>
            <TouchableOpacity onPress={openShop} style={s.printBtn}>
              <Ionicons name="print-outline" size={18} color="#0F0D09" />
              <Text style={s.printBtnText}>Get This Printed at ONJJEM</Text>
            </TouchableOpacity>
            <Text style={s.printNote}>
              Mugs, canvas, glow-in-the-dark posters & more — all featuring your cartoon
            </Text>
            <TouchableOpacity onPress={reset} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>Try Another Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0D09" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  backBtn: { marginBottom: 8, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 28 },
  goldLine: { width: 48, height: 1, backgroundColor: "#C9960C", opacity: 0.5, marginVertical: 10 },
  title: { fontSize: 32, fontFamily: "PlayfairDisplay_900Black", color: "#F5EDD8", letterSpacing: 1 },
  subtitle: { fontSize: 14, color: "rgba(245,237,216,0.65)", textAlign: "center", marginTop: 4, paddingHorizontal: 20 },
  startCard: {
    alignItems: "center",
    backgroundColor: "rgba(201,150,12,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.25)",
    borderRadius: 20,
    padding: 32,
    gap: 16,
  },
  startTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#F5EDD8", textAlign: "center" },
  errorText: { fontSize: 14, color: "rgba(245,237,216,0.8)", textAlign: "center" },
  primaryBtn: { backgroundColor: "#C9960C", borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32 },
  primaryBtnText: { color: "#0F0D09", fontFamily: "Inter_700Bold", fontSize: 15 },
  secondaryBtn: { marginTop: 4, paddingVertical: 10 },
  secondaryBtnText: { color: "rgba(245,237,216,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  previewCard: { borderRadius: 20, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.03)" },
  previewImg: { width: "100%", height: 320, opacity: 0.5 },
  loadingRow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#F5EDD8", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resultCard: { alignItems: "center", gap: 14 },
  resultImg: { width: "100%", height: 340, borderRadius: 20 },
  resultLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#F5EDD8" },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#C9960C",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  printBtnText: { color: "#0F0D09", fontFamily: "Inter_700Bold", fontSize: 15 },
  printNote: { fontSize: 12, color: "rgba(245,237,216,0.55)", textAlign: "center", paddingHorizontal: 30 },
});
