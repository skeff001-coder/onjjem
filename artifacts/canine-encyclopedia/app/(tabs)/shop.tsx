import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    name: "Personalised Pet Sticker",
    subtitle: "3\" × 4\" premium gloss vinyl",
    description:
      "Your dog's face on a single premium waterproof gloss vinyl sticker — kiss-cut for easy peeling. Stick it on your laptop, water bottle, phone case, car, or anywhere you want to show off your dog. Printed in vivid, fade-resistant colour.",
    icon: "star-outline" as const,
    price: 399,
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
    price: 2099,
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
    price: 1499,
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
    price: 2499,
    rrp: 2999 as number | null,
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
    price: 499,
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
  const { hasMixedBreed, hasCartoon } = useSubscription();

  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [postcardClaimed, setPostcardClaimed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("wud_postcard_claimed").then((v) => {
      if (v === "true") setPostcardClaimed(true);
    });
  }, []);

  // Use the most recently scanned dog's photo if currentPhotoUri isn't set
  const dogPhoto =
    currentPhotoUri ||
    ([...gallery].sort((a, b) => b.timestamp - a.timestamp)[0]?.uri ?? null);

  const dogName = currentDogName || gallery[0]?.dogName || "your dog";
  const hasBundleDiscount = hasMixedBreed;

  const openCheckout = async (product: (typeof PRODUCTS)[0]) => {
    if (!dogPhoto) {
      Alert.alert(
        "No dog photo found",
        "We couldn't find a saved dog photo. Go to the Scanner tab and identify your dog's breed first — that photo is then used for all your personalised orders.",
        [{ text: "Got it" }]
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
        if (product.freeWithBundle) {
          await AsyncStorage.setItem("wud_postcard_claimed", "true");
          setPostcardClaimed(true);
        }
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
            Everything personalised with {dogName}'s saved photo — printed and posted to your door. No extra scanning needed.
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
            {dogPhoto ? dogName : "Identify your dog in the Scanner tab first"}
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
                  style={[s.freeBtn, postcardClaimed && { opacity: 0.5 }]}
                  onPress={() => !postcardClaimed && openCheckout(product)}
                  disabled={isLoading || postcardClaimed}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#4ade80" />
                  ) : (
                    <Text style={s.freeBtnText}>
                      {postcardClaimed ? "Postcard Already Claimed ✓" : "Claim Your Free Postcard →"}
                    </Text>
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

        {/* Cartoonify Elite 15% voucher */}
        <View style={{
          backgroundColor: hasCartoon ? "rgba(224,169,92,0.08)" : "rgba(255,255,255,0.02)",
          borderWidth: 1,
          borderColor: hasCartoon ? "rgba(224,169,92,0.3)" : "rgba(255,255,255,0.05)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>🎨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: hasCartoon ? "#e0a95c" : colors.foreground }}>
                15% Off ONJJEM — Cartoonify Reward
              </Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                Valid on anything at onjjem.com
              </Text>
            </View>
          </View>
          {hasCartoon ? (
            <>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20, marginBottom: 12 }}>
                Thank you for purchasing Cartoonify Elite! Your 15% discount is valid on canvases, framed wall art, magic mugs, glow-in-the-dark posters, foil prints and everything else at onjjem.com.
              </Text>
              <View style={{ backgroundColor: "rgba(224,169,92,0.15)", borderRadius: 10, padding: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#e0a95c", marginBottom: 4 }}>YOUR DISCOUNT CODE</Text>
                <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#e0a95c", letterSpacing: 3 }}>CARTOON15</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>Enter at checkout on onjjem.com</Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://onjjem.com/shop")}
                style={{ marginTop: 12, backgroundColor: "#e0a95c", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#0a0a0a" }}>Shop at ONJJEM Now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20 }}>
              Purchase Cartoonify Elite (£4.99) from the Scanner tab to unlock your 15% discount code for anything at onjjem.com.
            </Text>
          )}
        </View>

        {/* Loyalty Card teaser */}
        <View style={{
          backgroundColor: "rgba(212,175,55,0.08)",
          borderWidth: 1,
          borderColor: "rgba(212,175,55,0.3)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: "#d4af37" }}>
                Loyalty Card — Coming Soon
              </Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                Included FREE with The Full Story Bundle
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20, marginBottom: 12 }}>
            Collect photos of 10 different dog breeds to complete your Loyalty Card — and unlock some seriously exciting rewards. No scanning needed, just upload from your phone.
          </Text>
          <View style={{ gap: 8 }}>
            {[
              "🎨  Cartoonify Elite unlocked — FREE (worth £4.99)",
              "🎀  Exclusive Loyal Customer prices on the bandanna & jigsaw",
              "✨  15% off everything at ONJJEM.com",
              "🎁  More rewards being added all the time...",
            ].map((reward, i) => (
              <Text key={i} style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground }}>
                {reward}
              </Text>
            ))}
          </View>
          {!hasMixedBreed && (
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#d4af37", marginTop: 14, textAlign: "center" }}>
              Buy The Full Story Bundle (£2.99) from the Scanner tab to unlock your Loyalty Card
            </Text>
          )}
          {hasMixedBreed && (
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4ade80", marginTop: 14, textAlign: "center" }}>
              ✅ Your Loyalty Card is unlocked — coming to the Scanner tab soon!
            </Text>
          )}
        </View>

        {/* ONJJEM Voucher */}
        <View style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground }}>
                15% Off Anything at ONJJEM
              </Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                Canvases · Framed Art · Foil Posters · Mugs · And more
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20, marginBottom: 12 }}>
            Complete your Loyalty Card to unlock a 15% discount code valid on anything at onjjem.com — canvases, framed wall art, glow-in-the-dark posters, foil prints, temporary tattoos, and everything else in the full ONJJEM collection.
          </Text>
          {hasMixedBreed ? (
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textAlign: "center" }}>
              🔒 Complete your Loyalty Card to claim this reward
            </Text>
          ) : (
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textAlign: "center" }}>
              🔒 Unlocked when you complete the Loyalty Card
            </Text>
          )}
        </View>

        {/* Coming soon teaser */}
        <View style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 20, marginBottom: 8 }}>🚀</Text>
          <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center", marginBottom: 6 }}>
            Big Rewards Coming Soon
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
            We're adding new exclusive rewards, surprises and gifts for loyal What's Up Dog! members all the time. The more you explore, the more you unlock. Watch this space. 🐾
          </Text>
        </View>

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
