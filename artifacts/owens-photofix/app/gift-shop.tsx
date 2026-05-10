import React from "react";
import {
  Alert,
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

const PRODUCTS = [
  {
    id: "canvas",
    title: "Canvas Prints",
    desc: "Museum-quality canvas stretched over a solid wood frame. Ready to hang.",
    price: "$9.99",
    icon: "image-outline" as const,
    gradient: ["#4F8EF7", "#2255CC"] as const,
    accent: "#2255CC",
    badge: "Most Popular",
  },
  {
    id: "keyring",
    title: "Photo Keyrings",
    desc: "Carry your favourite memory wherever you go. Durable & crystal clear.",
    price: "$9.99",
    icon: "key-outline" as const,
    gradient: ["#FF9F0A", "#FF6B00"] as const,
    accent: "#FF6B00",
    badge: "Best Seller",
  },
  {
    id: "large",
    title: "Large Format Prints",
    desc: "Up to A0 size. Professional lab printing on premium archival paper.",
    price: "$9.99",
    icon: "expand-outline" as const,
    gradient: ["#34C759", "#1A8C3A"] as const,
    accent: "#1A8C3A",
    badge: "New",
  },
  {
    id: "quilt",
    title: "Photo Bed Quilts",
    desc: "Cosy, machine-washable quilts with your photos printed in vivid colour.",
    price: "$9.99",
    icon: "grid-outline" as const,
    gradient: ["#BF5AF2", "#7B2FBE"] as const,
    accent: "#7B2FBE",
    badge: "Gift Favourite",
  },
];

export default function GiftShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={["#FF6B6B", "#FF9F0A", "#FFD60A", "#34C759", "#4F8EF7", "#BF5AF2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerGradientBar}
      />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Gift Shop</Text>
          <Text style={s.headerSub}>Print · Gift · Remember</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="gift" size={26} color="#FF6B6B" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <LinearGradient
          colors={["#FFF9EC", "#FFF0F5"]}
          style={s.heroBanner}
        >
          <Text style={s.heroEmoji}>🎁</Text>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Turn Photos Into{"\n"}Treasured Gifts</Text>
            <Text style={s.heroSub}>Upload once, print on anything</Text>
          </View>
        </LinearGradient>

        {/* Product grid */}
        <Text style={s.sectionLabel}>Choose a Product</Text>
        <View style={s.grid}>
          {PRODUCTS.map((p) => (
            <View key={p.id} style={s.card}>
              {/* Colourful gradient top */}
              <LinearGradient
                colors={[...p.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.cardTop}
              >
                <Ionicons name={p.icon} size={44} color="rgba(255,255,255,0.95)" />
                <View style={s.cardBadge}>
                  <Text style={s.cardBadgeText}>{p.badge}</Text>
                </View>
              </LinearGradient>

              {/* Card body */}
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{p.title}</Text>
                <Text style={s.cardDesc}>{p.desc}</Text>

                <View style={s.cardFooter}>
                  <View>
                    <Text style={s.cardFrom}>Starting from</Text>
                    <Text style={[s.cardPrice, { color: p.accent }]}>{p.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.designBtn, { backgroundColor: p.accent }]}
                    activeOpacity={0.82}
                    onPress={() =>
                      Alert.alert(
                        "Coming Soon",
                        `${p.title} designer is launching soon. We'll notify you!`
                      )
                    }
                  >
                    <Ionicons name="brush-outline" size={15} color="#fff" />
                    <Text style={s.designBtnText}>Design Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Trust strip */}
        <View style={s.trustRow}>
          {[
            { icon: "shield-checkmark-outline" as const, label: "Quality\nGuaranteed" },
            { icon: "car-outline" as const, label: "Fast\nDelivery" },
            { icon: "refresh-outline" as const, label: "Easy\nReturns" },
          ].map((t) => (
            <View key={t.label} style={s.trustItem}>
              <Ionicons name={t.icon} size={22} color={colors.primary} />
              <Text style={s.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    headerGradientBar: {
      height: 4,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    headerSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      letterSpacing: 1.5,
      marginTop: 1,
    },
    headerRight: {
      width: 40,
      alignItems: "center",
    },
    scroll: {
      padding: 16,
      gap: 16,
    },
    heroBanner: {
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      borderWidth: 1,
      borderColor: "#FFE0A3",
    },
    heroEmoji: {
      fontSize: 52,
    },
    heroText: {
      flex: 1,
      gap: 4,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      lineHeight: 28,
    },
    heroSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_700Bold",
      letterSpacing: 1.2,
      textTransform: "uppercase" as const,
      marginBottom: -4,
    },
    grid: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardTop: {
      height: 120,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    cardBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(255,255,255,0.25)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
    },
    cardBadgeText: {
      fontSize: 11,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    cardBody: {
      padding: 18,
      gap: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    cardDesc: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    cardFrom: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    cardPrice: {
      fontSize: 24,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    designBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 50,
    },
    designBtnText: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    trustRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    trustItem: {
      alignItems: "center",
      gap: 6,
    },
    trustLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
      lineHeight: 16,
    },
  });
}
