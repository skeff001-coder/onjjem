import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const ONJJEM_URL = "https://www.onjjem.com/shop/";

const GIFTS = [
  {
    id: "canvas",
    name: "Stretched Canvas Print",
    hook: "Hang them on the wall forever",
    desc: "A proper keepsake. Museum-grade inks on artist-grade canvas — the one gift they'll never throw away.",
    icon: "image-outline" as const,
  },
  {
    id: "jigsaw",
    name: "Jigsaw Puzzle",
    hook: "A fun afternoon for the whole family",
    desc: "Their face in 110 or 500 pieces. Comes in a premium gift tin — ready to wrap.",
    icon: "shapes-outline" as const,
  },
  {
    id: "mug",
    name: "Photo Mug",
    hook: "Every morning coffee sorted",
    desc: "Full wrap-around portrait on an 11oz ceramic mug. Dishwasher safe, smile guaranteed.",
    icon: "cafe-outline" as const,
  },
  {
    id: "coasters",
    name: "Wooden Coasters",
    hook: "The gift that lives on the coffee table",
    desc: "Set of 4 cork-backed coasters with their face. High-gloss finish — subtle, beautiful, personal.",
    icon: "disc-outline" as const,
  },
  {
    id: "tag",
    name: "Dog ID Tag",
    hook: "Keep them safe in style",
    desc: "Laser-engraved stainless steel tag with their photo and name. 3 sizes. Built to last.",
    icon: "pricetag-outline" as const,
  },
  {
    id: "more",
    name: "Tote Bags, Cushions & More",
    hook: "Something for everyone",
    desc: "Over 20 personalised gifts at onjjem.com — all printed to order, all delivered gift-ready.",
    icon: "gift-outline" as const,
  },
];

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const openShop = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await Linking.canOpenURL(ONJJEM_URL);
    if (ok) Linking.openURL(ONJJEM_URL);
    else Alert.alert("Visit onjjem.com in your browser.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: isWeb ? 40 : insets.bottom + 100, paddingHorizontal: 20, gap: 14 }}
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Doggie Gifts</Text>
          <Text style={[styles.subheading, { color: colors.gold }]}>Personalised keepsakes for dog lovers</Text>
        </View>

        {/* Emotional hook */}
        <View style={[styles.hookCard, { backgroundColor: colors.navyMid, borderColor: colors.gold + "44" }]}>
          <Text style={[styles.hookTitle, { color: colors.foreground }]}>
            Want to surprise someone?{"\n"}Or keep your dog's face forever?
          </Text>
          <Text style={[styles.hookBody, { color: colors.mutedForeground }]}>
            Every gift is made to order with your dog's photo — printed, packed, and delivered gift-ready in 3–5 days.
          </Text>
          <TouchableOpacity onPress={openShop} activeOpacity={0.85} style={[styles.mainBtn, { backgroundColor: colors.gold }]}>
            <Ionicons name="globe-outline" size={18} color={colors.navy} />
            <Text style={[styles.mainBtnText, { color: colors.navy }]}>SEE PRICES AT ONJJEM.COM</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Gift list */}
        <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>WHAT'S AVAILABLE</Text>

        {GIFTS.map((gift) => (
          <TouchableOpacity
            key={gift.id}
            onPress={openShop}
            activeOpacity={0.8}
            style={[styles.giftRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.navyMid }]}>
              <Ionicons name={gift.icon} size={22} color={colors.gold} />
            </View>
            <View style={styles.giftText}>
              <Text style={[styles.giftName, { color: colors.foreground }]}>{gift.name}</Text>
              <Text style={[styles.giftHook, { color: colors.gold }]}>{gift.hook}</Text>
              <Text style={[styles.giftDesc, { color: colors.mutedForeground }]}>{gift.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        ))}

        {/* Bottom CTA */}
        <TouchableOpacity onPress={openShop} activeOpacity={0.85} style={[styles.bottomBtn, { backgroundColor: colors.navyMid, borderColor: colors.gold + "55" }]}>
          <Text style={[styles.bottomBtnLabel, { color: colors.mutedForeground }]}>All gifts, prices, and ordering at</Text>
          <Text style={[styles.bottomBtnSite, { color: colors.gold }]}>onjjem.com</Text>
          <Text style={[styles.bottomBtnSub, { color: colors.mutedForeground }]}>Tap to see everything →</Text>
        </TouchableOpacity>

        {/* Trust strip */}
        <View style={[styles.trustStrip, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
          {[
            { icon: "shield-checkmark-outline" as const, label: "Ethically\nmade" },
            { icon: "car-outline" as const, label: "3–5 day\ndelivery" },
            { icon: "refresh-outline" as const, label: "Hassle-free\nreturns" },
            { icon: "leaf-outline" as const, label: "Print on\ndemand" },
          ].map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <Ionicons name={t.icon} size={20} color={colors.gold} />
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: { gap: 4, marginBottom: 4 },
  heading: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subheading: { fontSize: 13, fontFamily: "Inter_500Medium" },
  hookCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  hookTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3, lineHeight: 28 },
  hookBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  mainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  mainBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.6, flex: 1, textAlign: "center" },
  listLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 4 },
  giftRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  giftText: { flex: 1, gap: 3 },
  giftName: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  giftHook: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  giftDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  bottomBtn: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 4 },
  bottomBtnLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bottomBtnSite: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  bottomBtnSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  trustStrip: { flexDirection: "row", justifyContent: "space-around", borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8 },
  trustItem: { alignItems: "center", gap: 5 },
  trustLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 13 },
});
