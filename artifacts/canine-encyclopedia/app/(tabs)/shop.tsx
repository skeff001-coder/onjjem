import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/lib/revenuecat";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;
const ONJJEM_URL = "https://onjjem.com";

// ── Product catalogue (WUD-exclusive items with native Stripe checkout) ───────
// Prices shown to customer. Bundle buyers get 15% off automatically.
const PRODUCTS = [
  {
    id: "postcard",
    name: "Classic Personalised Postcard",
    subtitle: "6x4\" gloss finish, posted to your door",
    description:
      "A stunning 350gsm gloss postcard featuring your dog's photo — printed edge to edge in rich, fade-resistant colour. The perfect keepsake or gift. Normally £4.99, free with The Full Story Bundle.",
    icon: "mail-outline" as const,
    price: 499,
    rrp: null as number | null,
    freeWithBundle: true,
    sku: "wud-gift-postcard",
    emoji: "📮",
  },
  {
    id: "sticker-small",
    name: "Pet Vinyl Sticker",
    subtitle: "3\" × 4\" gloss kiss-cut",
    description:
      "Your dog's face on a premium waterproof gloss vinyl sticker. Kiss-cut for easy peeling, suitable for laptops, water bottles, phone cases and more.",
    icon: "star-outline" as const,
    price: 499,
    rrp: null as number | null,
    freeWithBundle: false,
    sku: "wud-sticker-small",
    emoji: "⭐",
  },
  {
    id: "sticker-xl",
    name: "XL Pet Vinyl Sticker",
    subtitle: "14\" × 14\" showstopper",
    description:
      "A massive 14x14 inch premium gloss vinyl sticker featuring your dog. Perfect for doors, walls, car windows or anywhere you want to make a statement.",
    icon: "expand-outline" as const,
    price: 2499,
    rrp: null as number | null,
    freeWithBundle: false,
    sku: "wud-sticker-xl",
    emoji: "🌟",
  },
  {
    id: "magic-mug",
    name: "Magic Colour-Change Mug",
    subtitle: "Reveals your dog with hot water",
    description:
      "The most magical mug you'll own. Appears jet black when cold — pour in hot water and your dog's photo magically appears in full colour. A guaranteed conversation starter.",
    icon: "cafe-outline" as const,
    price: 1699,
    rrp: 1999 as number | null,
    freeWithBundle: false,
    sku: "wud-magic-mug",
    emoji: "☕",
  },
  {
    id: "bandanna",
    name: "Personalised Dog Bandanna",
    subtitle: "Edge-to-edge print, double-turned hem",
    description:
      "A premium personalised bandanna featuring your dog's photo printed edge to edge on soft polyester jersey. Hand-stitched double-turned hem. Your dog wearing their own face — because why not.",
    icon: "ribbon-outline" as const,
    price: 1999,
    rrp: 2999 as number | null,
    freeWithBundle: false,
    sku: "wud-bandanna",
    emoji: "🎀",
    loyaltyExclusive: true,
  },
  {
    id: "jigsaw",
    name: "30-Piece Photo Jigsaw",
    subtitle: "Loyal customer exclusive price",
    description:
      "A fun, high-quality 30-piece jigsaw featuring your dog's photo. Perfect for kids, grandparents, or anyone who loves your dog as much as you do.",
    icon: "extension-puzzle-outline" as const,
    price: 1999,
    rrp: 2499 as number | null,
    freeWithBundle: false,
    sku: "wud-jigsaw",
    emoji: "🧩",
    loyaltyExclusive: true,
  },
  {
    id: "invitation-card",
    name: "Personalised Invitation Card",
    subtitle: "With blank envelope, posted to you",
    description:
      "A beautiful personalised greeting card featuring your dog's photo — printed on premium card stock and supplied with a blank envelope ready to address. Perfect for birthdays, Christmas or any occasion.",
    icon: "envelope-outline" as const,
    price: 599,
    rrp: null as number | null,
    freeWithBundle: false,
    sku: "wud-invitation-card",
    emoji: "💌",
  },
];

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function discountedPrice(pence: number, hasBundleDiscount: boolean): number {
  if (!hasBundleDiscount) return pence;
  return Math.round(pence * 0.85); // 15% off
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { currentPhotoUri, currentDogName, gallery } = useApp();
  const { hasMixedBreed } = useSubscription();

  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  // Use the most recently scanned dog's photo if currentPhotoUri isn't set
  const dogPhoto =
    currentPhotoUri ||
    ([...gallery].sort((a, b) => b.timestamp - a.timestamp)[0]?.uri ?? null);

  const dogName = currentDogName || gallery[0]?.dogName || "your dog";
  const hasBundleDiscount = hasMixedBreed;

  const openCheckout = async (product: (typeof PRODUCTS)[0]) => {
    if (!dogPhoto) {
      Alert.alert(
        "No dog photo yet",
        "Scan a dog first using the Scanner tab — we need their photo to personalise your order.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoadingProduct(product.id);
    try {
      // Read the dog photo as base64
      const base64 = await FileSystem.readAsStringAsync(dogPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = dogPhoto.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";

      const finalPrice = discountedPrice(product.price, hasBundleDiscount);

      const res = await fetch(`${API_BASE}/api/stripe/redeem-gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftSku: product.sku,
          photoBase64: base64,
          mimeType,
          dogName,
          overridePrice: finalPrice,
          successUrl: `${ONJJEM_URL}/?order=success`,
          cancelUrl: `${ONJJEM_URL}/`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        throw new Error(data.error || "Could not create checkout");
      }
    } catch (err) {
      Alert.alert(
        "Couldn't open checkout",
        "Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingProduct(null);
    }
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 100,
      paddingHorizontal: 16,
    },
    header: { marginBottom: 20 },
    title: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 4,
      fontFamily: "Inter_400Regular",
    },
    dogPhotoWrap: {
      alignItems: "center",
      marginBottom: 20,
    },
    dogPhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#d4af37",
    },
    dogPhotoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: "rgba(212,175,55,0.3)",
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(212,175,55,0.05)",
    },
    dogNameText: {
      marginTop: 8,
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    discountBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(212,175,55,0.1)",
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.3)",
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    discountBannerText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "#d4af37",
    },
    noBundleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.03)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    noBundleBannerText: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
    },
    cardEmoji: { fontSize: 28 },
    cardTextWrap: { flex: 1 },
    cardName: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    cardSubtitle: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    cardDesc: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      lineHeight: 18,
      marginBottom: 12,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    price: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    rrp: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textDecorationLine: "line-through",
    },
    savingBadge: {
      backgroundColor: "rgba(212,175,55,0.15)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    savingText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: "#d4af37",
    },
    freeBadge: {
      backgroundColor: "rgba(74,222,128,0.15)",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    freeText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: "#4ade80",
    },
    buyBtn: {
      backgroundColor: "#d4af37",
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    buyBtnText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#0a0a0a",
    },
    freeBtn: {
      backgroundColor: "rgba(74,222,128,0.15)",
      borderWidth: 1,
      borderColor: "rgba(74,222,128,0.3)",
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    freeBtnText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#4ade80",
    },
    exclusiveBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 8,
    },
    exclusiveText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: "#d4af37",
      letterSpacing: 0.5,
    },
    onjjemLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      marginTop: 8,
    },
    onjjemLinkText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
    },
  });

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🐾 My Dog's Shop</Text>
          <Text style={s.subtitle}>
            Everything personalised with {dogName}'s photo — printed and posted to your door
          </Text>
        </View>

        {/* Dog photo */}
        <View style={s.dogPhotoWrap}>
          {dogPhoto ? (
            <Image source={{ uri: dogPhoto }} style={s.dogPhoto} resizeMode="cover" />
          ) : (
            <View style={s.dogPhotoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color="rgba(212,175,55,0.5)" />
            </View>
          )}
          <Text style={s.dogNameText}>
            {dogPhoto ? dogName : "Scan a dog to get started"}
          </Text>
        </View>

        {/* Bundle discount banner */}
        {hasBundleDiscount ? (
          <View style={s.discountBanner}>
            <Ionicons name="sparkles" size={18} color="#d4af37" />
            <Text style={s.discountBannerText}>
              Bundle member — 15% off everything in this shop
            </Text>
          </View>
        ) : (
          <View style={s.noBundleBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
            <Text style={s.noBundleBannerText}>
              Buy The Full Story Bundle (£2.99) from the Scanner tab to unlock 15% off all orders
            </Text>
          </View>
        )}

        {/* Products */}
        {PRODUCTS.map((product) => {
          const isLoading = loadingProduct === product.id;
          const isFreeWithBundle = product.freeWithBundle && hasMixedBreed;
          const finalPrice = isFreeWithBundle
            ? 0
            : discountedPrice(product.price, hasBundleDiscount);
          const saving =
            hasBundleDiscount && !isFreeWithBundle
              ? product.price - finalPrice
              : product.rrp
              ? product.price - product.rrp < 0
                ? product.rrp - product.price
                : null
              : null;

          return (
            <View key={product.id} style={s.card}>
              {product.loyaltyExclusive && (
                <View style={s.exclusiveBadge}>
                  <Ionicons name="trophy-outline" size={12} color="#d4af37" />
                  <Text style={s.exclusiveText}>LOYAL CUSTOMER EXCLUSIVE</Text>
                </View>
              )}

              <View style={s.cardTop}>
                <Text style={s.cardEmoji}>{product.emoji}</Text>
                <View style={s.cardTextWrap}>
                  <Text style={s.cardName}>{product.name}</Text>
                  <Text style={s.cardSubtitle}>{product.subtitle}</Text>
                </View>
              </View>

              <Text style={s.cardDesc}>{product.description}</Text>

              {/* Price row */}
              <View style={s.priceRow}>
                {isFreeWithBundle ? (
                  <View style={s.freeBadge}>
                    <Text style={s.freeText}>FREE with your bundle</Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.price}>{formatPrice(finalPrice)}</Text>
                    {product.rrp && (
                      <Text style={s.rrp}>{formatPrice(product.rrp)}</Text>
                    )}
                    {hasBundleDiscount && (
                      <View style={s.savingBadge}>
                        <Text style={s.savingText}>15% off</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Buy button */}
              {isFreeWithBundle ? (
                <TouchableOpacity
                  style={s.freeBtn}
                  onPress={() => openCheckout(product)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#4ade80" />
                  ) : (
                    <Text style={s.freeBtnText}>Claim Your Free Postcard →</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={s.buyBtn}
                  onPress={() => openCheckout(product)}
                  disabled={isLoading || !dogPhoto}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0a0a0a" />
                  ) : (
                    <>
                      <Ionicons name="bag-outline" size={16} color="#0a0a0a" />
                      <Text style={s.buyBtnText}>
                        Order Now — {formatPrice(finalPrice)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* ONJJEM link for everything else */}
        <TouchableOpacity
          style={s.onjjemLink}
          onPress={() => Linking.openURL(ONJJEM_URL)}
        >
          <Text style={s.onjjemLinkText}>
            Canvases, framed art, foil posters & more at onjjem.com
          </Text>
          <Ionicons name="arrow-forward-outline" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
