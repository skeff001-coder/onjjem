import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const ONJJEM_URL = "https://www.onjjem.com/shop/";

const GIFTS = [
  { name: "Dog ID Tag", price: "£12.99" },
  { name: "Temporary Tattoo", price: "£14.99" },
  { name: "Photo Mug", price: "£17.99" },
  { name: "Custom Playing Cards", price: "£19.99" },
  { name: "Jigsaw Puzzle — 30 pieces", price: "£19.99" },
  { name: "Jigsaw Puzzle — 110 pieces", price: "£22.99" },
  { name: "Wooden Coasters", price: "£24.99" },
  { name: "Tough Phone Case", price: "£24.99" },
  { name: "Jigsaw Puzzle — 252 pieces", price: "£28.99" },
  { name: "Jigsaw Puzzle — 500 pieces", price: "£32.99" },
  { name: "Canvas Cushion", price: "£32.99" },
  { name: "Eco Canvas", price: "£39.99" },
  { name: "Jigsaw Puzzle — 1000 pieces", price: "£39.99" },
  { name: "Classic Framed Print", price: "£44.99" },
  { name: "Stretched Canvas", price: "£49.99" },
];

const PHOTO_CONFIGS = [
  { x: 0.02, y: 0.01, size: 88, rot: -12, period: 3800, drift: 18 },
  { x: 0.60, y: 0.00, size: 76, rot: 9,   period: 4200, drift: 14 },
  { x: 0.76, y: 0.16, size: 100, rot: -6,  period: 3500, drift: 20 },
  { x: -0.02, y: 0.28, size: 82, rot: 11,  period: 4600, drift: 16 },
  { x: 0.68, y: 0.40, size: 74, rot: -15,  period: 3900, drift: 12 },
  { x: 0.08, y: 0.55, size: 94, rot: 6,    period: 4100, drift: 22 },
  { x: 0.62, y: 0.60, size: 84, rot: -8,   period: 3600, drift: 15 },
  { x: 0.28, y: 0.70, size: 70, rot: 14,   period: 4400, drift: 10 },
  { x: 0.74, y: 0.76, size: 90, rot: -10,  period: 4000, drift: 18 },
  { x: -0.02, y: 0.82, size: 78, rot: 7,   period: 3700, drift: 13 },
  { x: 0.44, y: 0.87, size: 86, rot: -5,   period: 4300, drift: 17 },
  { x: 0.78, y: 0.90, size: 72, rot: 12,   period: 3950, drift: 11 },
];

function FloatingPhoto({
  url,
  config,
  index,
}: {
  url: string;
  config: (typeof PHOTO_CONFIGS)[0];
  index: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startDelay = index * 280;

  useEffect(() => {
    translateY.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(-config.drift, {
            duration: config.period,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(config.drift, {
            duration: config.period,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    translateX.value = withDelay(
      startDelay + 400,
      withRepeat(
        withSequence(
          withTiming(-config.drift * 0.5, {
            duration: config.period * 1.4,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(config.drift * 0.5, {
            duration: config.period * 1.4,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${config.rot}deg` },
    ],
  }));

  const left = config.x * SCREEN_W;
  const top = config.y * SCREEN_H;

  return (
    <Animated.View
      style={[
        styles.floatingPhoto,
        {
          left,
          top,
          width: config.size,
          height: config.size,
          borderRadius: config.size * 0.18,
        },
        animStyle,
      ]}
    >
      <Image
        source={{ uri: url }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </Animated.View>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const [dogPhotos, setDogPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetch("https://dog.ceo/api/breeds/image/random/12")
      .then((r) => r.json())
      .then((data: { message: unknown }) => {
        if (Array.isArray(data.message)) setDogPhotos(data.message as string[]);
      })
      .catch(() => {});
  }, []);

  const openShop = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await Linking.canOpenURL(ONJJEM_URL);
    if (ok) Linking.openURL(ONJJEM_URL);
    else Alert.alert("Visit onjjem.com in your browser.");
  };

  return (
    <View style={styles.container}>
      {dogPhotos.length > 0 &&
        PHOTO_CONFIGS.map((cfg, i) => (
          <FloatingPhoto
            key={i}
            url={dogPhotos[i % dogPhotos.length]}
            config={cfg}
            index={i}
          />
        ))}

      <View style={styles.overlay} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 20,
          paddingBottom: isWeb ? 40 : insets.bottom + 100,
          paddingHorizontal: 22,
        }}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.appTitleTop}>WHAT'S UP</Text>
          <Text style={styles.appTitleDog}>DOG!</Text>
          <Text style={styles.tagline}>Personalised gifts for dog lovers</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listHeading}>DOGGIE GIFTS</Text>
          {GIFTS.map((gift, i) => (
            <View
              key={gift.name}
              style={[
                styles.giftRow,
                i < GIFTS.length - 1 && styles.giftRowBorder,
              ]}
            >
              <Text style={styles.giftName}>{gift.name}</Text>
              <Text style={styles.giftPrice}>{gift.price}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={openShop}
          activeOpacity={0.85}
          style={styles.shopBtn}
        >
          <Ionicons name="globe-outline" size={18} color="#0A0E1A" />
          <Text style={styles.shopBtnText}>ORDER AT ONJJEM.COM</Text>
          <Ionicons name="chevron-forward" size={16} color="#0A0E1A" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  floatingPhoto: {
    position: "absolute",
    overflow: "hidden",
    opacity: 0.65,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,14,26,0.52)",
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 28,
    gap: 2,
  },
  appTitleTop: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: 3,
    textAlign: "center",
  },
  appTitleDog: {
    fontFamily: "Nunito_900Black",
    fontSize: 72,
    color: "#c9a84c",
    letterSpacing: 4,
    textAlign: "center",
    lineHeight: 76,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 6,
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    backgroundColor: "rgba(10,14,26,0.88)",
    paddingHorizontal: 20,
    paddingBottom: 6,
    marginBottom: 18,
  },
  listHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#c9a84c",
    letterSpacing: 2,
    textAlign: "center",
    paddingVertical: 16,
  },
  giftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  giftRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  giftName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  giftPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#c9a84c",
    marginLeft: 14,
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#c9a84c",
    paddingVertical: 16,
    borderRadius: 16,
  },
  shopBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0A0E1A",
    letterSpacing: 0.8,
    flex: 1,
    textAlign: "center",
  },
});
