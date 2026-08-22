import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useSubscription } from "@/lib/revenuecat";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_GAP = 3;
const THUMB_SIZE = (SCREEN_WIDTH - 40 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type Phase =
  | "idle"
  | "permission-denied"
  | "picking"
  | "picked"
  | "generating"
  | "done"
  | "error"
  | "paywall";

export default function CartoonScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cartoonUri, setCartoonUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const { isSubscribed, photoCredits, oneCartoonPackage, threeCartoonPackage, fiveCartoonPackage, purchase, isPurchasing } =
    useSubscription();

  const checkAccessThenPick = async () => {
    if (isSubscribed) {
      openPicker();
      return;
    }
    if (photoCredits > 0) {
      openPicker();
      return;
    }
    setPhase("paywall");
  };

  const openPicker = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg("We need permission to access your photos to continue. You can enable this in Settings.");
        setPhase("permission-denied");
        return;
      }

      setPhase("picking");
      setLoadingAssets(true);
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 60,
      });
      setAssets(result.assets);
      setLoadingAssets(false);
    } catch (err) {
      setErrorMsg("Could not load your photos. Please try again.");
      setPhase("error");
    }
  };

  const selectAsset = useCallback(async (asset: MediaLibrary.Asset) => {
    try {
      setPhase("picked");
      const info = await MediaLibrary.getAssetInfoAsync(asset.id);
      const localUri = info.localUri ?? info.uri ?? asset.uri;

      setPhotoUri(localUri);

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = localUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      generateCartoon(base64, mimeType);
    } catch (err) {
      setErrorMsg("Could not read that photo. Please try a different one.");
      setPhase("error");
    }
  }, [isSubscribed, photoCredits]);

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

        if (!isSubscribed && photoCredits > 0) {
          await useSubscriptionCredit();
        }
      } else {
        setErrorMsg(data.error || "Couldn't create the cartoon. Please try again.");
        setPhase("error");
      }
    } catch (err) {
      setErrorMsg("Could not connect. Please check your connection and try again.");
      setPhase("error");
    }
  };

  const { consumePhotoCredit } = useSubscription();
  const useSubscriptionCredit = async () => {
    await consumePhotoCredit();
  };

  const buyPackage = async (pkg: typeof oneCartoonPackage) => {
    if (!pkg) return;
    try {
      await purchase(pkg);
      setPhase("idle");
      openPicker();
    } catch (err) {
      // Purchase cancelled or failed
    }
  };

  const reset = () => {
    setPhase("idle");
    setPhotoUri(null);
    setCartoonUri(null);
    setErrorMsg("");
    setAssets([]);
  };

  const openShop = () => Linking.openURL("https://onjjem.com/shop");
  const openSettings = () => Linking.openSettings();

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => (phase === "picking" || phase === "paywall" ? setPhase("idle") : router.back())}
          style={s.backBtn}
        >
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
            <Image
              source={{ uri: "https://onjjem.com/products/cartoonify-preview.jpeg" }}
              style={s.previewImage}
              resizeMode="cover"
            />
            <Text style={s.startTitle}>Turn any photo into a cartoon</Text>
            <Text style={s.freeNote}>Animated-movie style · Vivid colour · Ready in seconds</Text>
            <TouchableOpacity onPress={checkAccessThenPick} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "paywall" && (
          <View style={s.startCard}>
            <Ionicons name="sparkles" size={40} color="#C9960C" />
            <Text style={s.startTitle}>Get Cartoon Scans</Text>
            <Text style={s.paywallSubtitle}>
              Choose how many scans you'd like
            </Text>
            
            <View style={s.optionsContainer}>
              {oneCartoonPackage && (
                <TouchableOpacity 
                  onPress={() => buyPackage(oneCartoonPackage)}
                  disabled={isPurchasing}
                  style={s.optionButton}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#0F0D09" />
                  ) : (
                    <>
                      <Text style={s.optionTitle}>1 Scan</Text>
                      <Text style={s.optionPrice}>{oneCartoonPackage.product.priceString}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {threeCartoonPackage && (
                <TouchableOpacity 
                  onPress={() => buyPackage(threeCartoonPackage)}
                  disabled={isPurchasing}
                  style={[s.optionButton, s.recommendedButton]}
                >
                  <View style={s.recommendedBadge}>
                    <Text style={s.recommendedText}>Recommended</Text>
                  </View>
                  {isPurchasing ? (
                    <ActivityIndicator color="#0F0D09" />
                  ) : (
                    <>
                      <Text style={s.optionTitle}>3 Scans</Text>
                      <Text style={s.optionPrice}>{threeCartoonPackage.product.priceString}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {fiveCartoonPackage && (
                <TouchableOpacity 
                  onPress={() => buyPackage(fiveCartoonPackage)}
                  disabled={isPurchasing}
                  style={s.optionButton}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#0F0D09" />
                  ) : (
                    <>
                      <Text style={s.optionTitle}>5 Scans</Text>
                      <Text style={s.optionPrice}>{fiveCartoonPackage.product.priceString}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity onPress={reset} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "permission-denied" && (
          <View style={s.startCard}>
            <Ionicons name="lock-closed-outline" size={40} color="#e05252" />
            <Text style={s.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={openSettings} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "picking" && (
          <View>
            <Text style={s.pickerTitle}>Choose a photo</Text>
            {loadingAssets ? (
              <View style={s.loaderWrap}>
                <ActivityIndicator color="#C9960C" size="large" />
              </View>
            ) : assets.length === 0 ? (
              <Text style={s.emptyText}>No photos found on this device.</Text>
            ) : (
              <FlatList
                data={assets}
                keyExtractor={(item) => item.id}
                numColumns={GRID_COLUMNS}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => selectAsset(item)} activeOpacity={0.7}>
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 6 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              />
            )}
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
  freeNote: { fontSize: 13, color: "#C9960C", fontFamily: "Inter_600SemiBold" },
  paywallSubtitle: { fontSize: 14, color: "rgba(245,237,216,0.8)", textAlign: "center" },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 4,
  },
  errorText: { fontSize: 14, color: "rgba(245,237,216,0.8)", textAlign: "center" },
  primaryBtn: { backgroundColor: "#C9960C", borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32, width: "100%" },
  primaryBtnText: { color: "#0F0D09", fontFamily: "Inter_700Bold", fontSize: 15, textAlign: "center" },
  secondaryBtn: { marginTop: 4, paddingVertical: 10, width: "100%" },
  secondaryBtnText: { color: "rgba(245,237,216,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center" },
  
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionButton: {
    backgroundColor: "rgba(201,150,12,0.1)",
    borderWidth: 1.5,
    borderColor: "#C9960C",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedButton: {
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 2,
    borderColor: "#C9960C",
  },
  recommendedBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: "#C9960C",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendedText: {
    color: "#0F0D09",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  optionTitle: {
    color: "#F5EDD8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 8,
  },
  optionPrice: {
    color: "#C9960C",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 4,
  },
  
  pickerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#F5EDD8", marginBottom: 12 },
  loaderWrap: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "rgba(245,237,216,0.6)", textAlign: "center", paddingVertical: 40 },
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
