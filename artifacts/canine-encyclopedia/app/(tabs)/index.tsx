import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Animated,
  Linking,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { ScanButton } from "@/components/ScanButton";
import AmbientBarks from "@/components/AmbientBarks";
import { identifyBreedFromBase64, getBreedKnowledge } from "@/lib/gemini";
import { COLLAGE_ONLY } from "@/constants/recordingMode";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const COLS = 5;
const TILE = Math.ceil(width / COLS);
const GRID_ROWS = Math.ceil(height / TILE) + 1;
const GRID_TOTAL = COLS * GRID_ROWS;

const FACE_SIZE = 58;
const FACES = ["🐶", "🐕", "🦮", "🐩", "🐕‍🦺", "🐶", "🐕", "🦮"];
function buildFaces(count: number) {
  const list = [];
  const PHI = 137.508;
  for (let i = 0; i < count; i++) {
    const x = ((i * 0.618033) % 1) * (width - FACE_SIZE);
    const y = ((i * 0.381966) % 1) * (height - FACE_SIZE);
    const rot = ((i * PHI) % 360) - 180;
    list.push({ x, y, rot, emoji: FACES[i % FACES.length], op: 0.35 + (i % 7) * 0.06 });
  }
  return list;
}
const SCATTERED_FACES = buildFaces(72);

/* ─── Whats Up Dog Hero ─── */
const DOG_ICON = require("@/assets/images/icon.png");
const HERO_DOG = require("@/assets/images/hero_scanner.png");

function GraffitiTitle() {
  return (
    <View style={gStyles.wrap}>
      <View style={gStyles.card}>
        <Image source={DOG_ICON} style={gStyles.heroIcon} />
        <Text style={gStyles.thats}>WHAT'S UP</Text>
        <Text style={gStyles.dog}>DOG!</Text>
        <Text style={gStyles.sub}>The ultimate AI dog breed scanner</Text>
      </View>
    </View>
  );
}

const gStyles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: 16, paddingTop: 0, alignItems: "center" },
  card: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(10,14,26,0.78)",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 2,
  },
  heroIcon: {
    width: 280,
    height: 280,
    borderRadius: 42,
    marginBottom: 14,
  },
  thats: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 5,
    textAlign: "center",
  },
  dog: {
    fontSize: 52,
    fontFamily: "Nunito_900Black",
    color: "#c9a84c",
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 58,
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
    textAlign: "center",
    marginTop: 4,
  },
});

/* ─── Blinking Footer (recording mode only) ─── */
function BlinkingFooter() {
  const native = Platform.OS !== "web";
  const blink = useRef(new Animated.Value(1)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(blink, { toValue: 1, duration: 0, useNativeDriver: native }), Animated.delay(200), Animated.timing(blink, { toValue: 0, duration: 0, useNativeDriver: native }), Animated.delay(400)])).start();
    Animated.loop(Animated.sequence([Animated.timing(scanY, { toValue: height, duration: 2200, useNativeDriver: native }), Animated.timing(scanY, { toValue: 0, duration: 2200, useNativeDriver: native })])).start();
  }, [blink, scanY]);
  return (
    <>
      <Animated.View style={{ position: "absolute", left: 0, right: 0, height: 3, backgroundColor: "#FFE600", shadowColor: "#FFE600", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 18, transform: [{ translateY: scanY }], pointerEvents: "none" } as any} />
      <Animated.View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", opacity: blink, pointerEvents: "none" } as any}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 38, letterSpacing: 1, color: "#ffffff", textShadowColor: "#ffffff", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24 }}>What's Up Dog!</Text>
      </Animated.View>
    </>
  );
}

/* ─── Free Scanner Card ─── */
function FreeScannerCard({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== "web" }).start();
  }, [anim]);

  const nativeDriver = Platform.OS !== "web";
  const handleHoverIn = () => {
    setHovered(true);
    Animated.spring(scale, { toValue: 1.03, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handleHoverOut = () => {
    setHovered(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const color = "#c9a84c";

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity, width: CARD_WIDTH }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          cardStyles.card,
          {
            borderColor: hovered ? color : "rgba(255,255,255,0.08)",
            borderWidth: hovered ? 1.5 : 1,
            shadowColor: color,
            shadowOpacity: hovered ? 0.25 : 0.08,
            shadowRadius: hovered ? 20 : 8,
          },
        ]}
        {...(Platform.OS === "web" ? { onPointerEnter: handleHoverIn, onPointerLeave: handleHoverOut } as any : {})}
      >
        <View style={[cardStyles.freeBadge, { backgroundColor: "#4ade80" }]}>
          <Text style={cardStyles.freeBadgeText}>FREE</Text>
        </View>
        <View style={cardStyles.row}>
          <View style={[cardStyles.iconWrap, { backgroundColor: color + "18" }]}>
            <Ionicons name="scan-outline" size={26} color={color} />
          </View>
          <View style={cardStyles.textWrap}>
            <Text style={cardStyles.title}>Breed Identifier</Text>
            <Text style={cardStyles.subtitle}>Instant breed recognition</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={color} style={{ opacity: 0.6 }} />
        </View>
        <Text style={cardStyles.description}>Point your camera at any dog and our AI will identify the breed in seconds. Free for everyone.</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#0e1322",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  freeBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#0a0e1a", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)" },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", lineHeight: 18, marginTop: 2 },
});

/* ─── Premium Scanner Tile ─── */
interface PremiumTileDef {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  price: string;
}

const PREMIUM_TILES: PremiumTileDef[] = [
  { title: "Mixed Breed DNA", subtitle: "Genetic heritage breakdown", icon: "git-merge-outline", color: "#FF2D78", price: "99p" },
  { title: "Age Calculator",  subtitle: "Visual age estimation",       icon: "hourglass-outline",  color: "#00F5FF", price: "99p" },
  { title: "Personality Matcher", subtitle: "Viral shareable results", icon: "happy-outline",      color: "#B24BF3", price: "99p" },
];

function PremiumTile({ def, onPress }: { def: PremiumTileDef; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const nativeDriver = Platform.OS !== "web";
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start()}
      activeOpacity={0.9}
    >
      <Animated.View style={[premiumTileStyles.card, { borderColor: "rgba(255,255,255,0.08)", transform: [{ scale }] }]}>
        <View style={[premiumTileStyles.priceBadge, { backgroundColor: def.color }]}>
          <Text style={premiumTileStyles.priceText}>{def.price}</Text>
        </View>
        <View style={premiumTileStyles.row}>
          <View style={[premiumTileStyles.iconWrap, { backgroundColor: def.color + "18" }]}>
            <Ionicons name={def.icon} size={22} color={def.color} />
          </View>
          <View style={premiumTileStyles.textWrap}>
            <Text style={premiumTileStyles.title}>{def.title}</Text>
            <Text style={premiumTileStyles.subtitle}>{def.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={def.color} style={{ opacity: 0.7 }} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const premiumTileStyles = StyleSheet.create({
  card: {
    backgroundColor: "#0e1322",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
  },
  priceBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  priceText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#0a0e1a", letterSpacing: 0.4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)" },
});

/* ─── Main Screen ─── */
type ScanPhase = "idle" | "scanning" | "named";

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToGallery, setCurrentScan, setCurrentKnowledge, setCurrentDogName, cacheKnowledge, setGalleryEntryKnowledge, setSelectedGalleryEntry } = useApp();

  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scannedUri, setScannedUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [pendingScan, setPendingScan] = useState<Awaited<ReturnType<typeof identifyBreedFromBase64>> | null>(null);
  const [dogName, setDogName] = useState("");
  const [pendingGalleryId, setPendingGalleryId] = useState<string | null>(null);
  const nameInputRef = useRef<TextInput>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [dogPhotos, setDogPhotos] = useState<string[]>([]);
  useEffect(() => {
    fetch("https://dog.ceo/api/breeds/image/random/50")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.message)) {
          const massive = [...data.message, ...data.message, ...data.message, ...data.message];
          setDogPhotos(massive);
        }
      })
      .catch(() => {});
  }, []);

  const handleScannerTap = () => {
    startScan();
  };

  const startScan = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri, result.assets[0].base64 ?? "");
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri, result.assets[0].base64 ?? "");
    }
  };

  const processImage = async (uri: string, base64: string) => {
    setScannedUri(uri);
    setPhase("scanning");
    setStatusText("Identifying breed…");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const scanResult = await identifyBreedFromBase64(base64, "image/jpeg");
      setPendingScan(scanResult);
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      setPendingGalleryId(id);
      setPhase("named");
      setDogName("");
      setTimeout(() => nameInputRef.current?.focus(), 300);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Scan failed", e?.message ?? "Could not identify the breed. Please try again.");
      setPhase("idle");
      setScannedUri(null);
    } finally {
      setStatusText("");
    }
  };

  const handleContinue = async () => {
    if (!pendingScan || !pendingGalleryId || !scannedUri) return;
    const name = dogName.trim();
    setCurrentDogName(name);
    setCurrentScan(pendingScan);
    const galleryId = pendingGalleryId;
    const newEntry = {
      id: galleryId,
      uri: scannedUri,
      breed: pendingScan.breed,
      dogName: name || undefined,
      isMix: pendingScan.isMix,
      mixBreeds: pendingScan.mixBreeds,
      timestamp: Date.now(),
      hasDeepKnowledge: false,
      scanResult: pendingScan,
    };
    await addToGallery(newEntry);
    setSelectedGalleryEntry(newEntry);
    router.push("/breed");
    getBreedKnowledge(pendingScan.breed)
      .then((k) => {
        setCurrentKnowledge(k);
        cacheKnowledge(pendingScan.breed, k);
        setGalleryEntryKnowledge(galleryId, k);
      })
      .catch(() => {});
    setPhase("idle");
    setScannedUri(null);
    setPendingScan(null);
    setPendingGalleryId(null);
    setDogName("");
  };

  const handleReset = () => {
    setPhase("idle");
    setScannedUri(null);
    setPendingScan(null);
    setPendingGalleryId(null);
    setDogName("");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0a0e1a" }]}>
      {/* Ambient dog barks (home screen only) */}
      {!COLLAGE_ONLY && <AmbientBarks />}

      {/* FULL-SCREEN DOG PHOTO COLLAGE */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" } as any]}>
        {dogPhotos.length > 0 ? (
          Array.from({ length: GRID_TOTAL }).map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const photo = dogPhotos[i % dogPhotos.length];
            const dimmed = (col + row) % 2 === 0;
            return (
              <Image
                key={i}
                source={{ uri: photo }}
                style={{ position: "absolute", left: col * TILE, top: row * TILE, width: TILE, height: TILE, opacity: dimmed ? 0.78 : 0.95 }}
                resizeMode="cover"
              />
            );
          })
        ) : (
          SCATTERED_FACES.map((f, i) => (
            <Text key={i} style={[styles.scatteredFace, { left: f.x, top: f.y, opacity: f.op, transform: [{ rotate: `${f.rot}deg` }] }]}>
              {f.emoji}
            </Text>
          ))
        )}
      </View>

      {COLLAGE_ONLY && <BlinkingFooter />}

      {!COLLAGE_ONLY && (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: topPad + 2, paddingBottom: isWeb ? 140 : insets.bottom + 160 }}
          >
            {/* Graffiti Title */}
            <GraffitiTitle />

            {/* Hero dog banner */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <Image source={HERO_DOG} style={styles.heroBanner} resizeMode="cover" />
            </View>

            {/* Scanner Card */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <FreeScannerCard onPress={handleScannerTap} />
            </View>
          </ScrollView>

          {/* Fixed bottom scan button */}
          {phase === "idle" && (
            <View
              style={{
                position: "absolute",
                bottom: isWeb ? 80 : insets.bottom + 72,
                left: 0,
                right: 0,
                alignItems: "center",
                pointerEvents: "box-none",
              } as any}
            >
              <TouchableOpacity
                onPress={handleScannerTap}
                activeOpacity={0.85}
                style={{
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#c9a84c",
                  paddingHorizontal: 28,
                  paddingVertical: 11,
                  borderRadius: 50,
                  shadowColor: "#c9a84c",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.65,
                  shadowRadius: 14,
                  elevation: 10,
                  flexDirection: "row",
                }}
              >
                <Ionicons name="scan-outline" size={20} color="#0a0e1a" />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontFamily: "Nunito_900Black", color: "#0a0e1a", letterSpacing: 1 }}>
                    FREE SCAN
                  </Text>
                  <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(10,14,26,0.55)", letterSpacing: 0.3 }}>
                    Scan your dog · Always free
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Scanning overlay */}
          {phase === "scanning" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,14,26,0.85)", alignItems: "center", justifyContent: "center", zIndex: 50 }]}>
              <ActivityIndicator color="#c9a84c" size="large" />
              <Text style={{ marginTop: 16, fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#c9a84c" }}>{statusText}</Text>
            </View>
          )}
        </>
      )}

      {/* Dog Name Modal */}
      <Modal visible={phase === "named"} animationType="slide" transparent onRequestClose={handleReset}>
        <KeyboardAvoidingView style={styles.nameModalWrap} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleReset} />
          <View style={[styles.nameSheet, { backgroundColor: "#141927", borderColor: "rgba(255,255,255,0.1)" }]}>
            <View style={styles.nameHandle} />
            {pendingScan && (
              <View style={[styles.breedFoundRow, { backgroundColor: "#0a0e1a" }]}>
                {scannedUri && <Image source={{ uri: scannedUri }} style={styles.nameThumbnail} resizeMode="cover" />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.breedFoundLabel}>Identified</Text>
                  <Text style={styles.breedFoundName}>{pendingScan.breed}</Text>
                  {pendingScan.isMix && pendingScan.mixBreeds && (
                    <Text style={styles.breedFoundMix}>Mix: {pendingScan.mixBreeds.join(" · ")}</Text>
                  )}
                </View>
                <View style={styles.pawBadge}>
                  <Ionicons name="paw" size={20} color="#c9a84c" />
                </View>
              </View>
            )}
            <Text style={styles.nameQuestion}>What's their name?</Text>
            <Text style={styles.nameHint}>Optional — we'll personalise everything for them</Text>
            <TextInput
              ref={nameInputRef}
              value={dogName}
              onChangeText={setDogName}
              placeholder="e.g. Biscuit, Poppy, Max…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              onSubmitEditing={handleContinue}
              returnKeyType="go"
              style={[styles.nameInput, { borderColor: dogName ? "#c9a84c88" : "rgba(255,255,255,0.12)" }]}
            />
            <TouchableOpacity onPress={handleContinue} style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>
                {dogName.trim() ? `Meet ${dogName.trim()} →` : `View ${pendingScan?.breed ?? "breed"} →`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancel scan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("https://www.onjjem.com/shop/pets")} activeOpacity={0.75}>
              <Text style={styles.onjjemSmallPrint}>
                Working together with <Text style={{ color: "#c9a84c" }}>ONJJEM</Text> — beautiful, printed, everlasting pictures of your dog
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scatteredFace: { position: "absolute", fontSize: FACE_SIZE, lineHeight: FACE_SIZE + 8 },
  heroBanner: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
  },

  nameModalWrap: { flex: 1, justifyContent: "flex-end" },
  nameSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, padding: 24, paddingBottom: 44, gap: 14 },
  nameHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 6 },
  breedFoundRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  nameThumbnail: { width: 52, height: 52, borderRadius: 12 },
  breedFoundLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase" },
  breedFoundName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#c9a84c", marginTop: 2 },
  breedFoundMix: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: 2 },
  pawBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  nameQuestion: { fontSize: 23, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.2 },
  nameHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: -6, lineHeight: 18 },
  nameInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontFamily: "Inter_500Medium", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.05)" },
  continueBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", backgroundColor: "#c9a84c" },
  continueBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0a0e1a" },
  cancelLink: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)" },
  onjjemSmallPrint: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.28)", textAlign: "center", marginTop: 8, paddingHorizontal: 16, lineHeight: 15 },
});
