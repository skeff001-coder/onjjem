import React from "react";

import {

Linking,

ScrollView,

StyleSheet,

Text,

TouchableOpacity,

View,

Dimensions,

Image,

Platform,

} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { ArtisanSubtitle } from "@/components/ArtisanSubtitle";
import { IS_US, SITE, SHOP_TILES, MUG_URL, DEALS_URL, DELIVERY_URL } from "@/lib/region";

const { width: SCREEN_W } = Dimensions.get("window");

const TILES = SHOP_TILES;

// Real customer reviews only (same as onjjem.com).
const REVIEWS = [
  { name: "Worz", product: "Christmas gifts", text: "Very professional, fast and friendly. Good communication, would recommend to anyone. Very happy with all my purchases." },
  { name: "C. Murphy", product: "Magic Reveal mug", text: "My Yorkshire terrier on the Magic mug is class in the cartoon style. Kids love it!" },
  { name: "W Taylor", product: "Cartoon prints", text: "My cartoon style prints of my kids arrived in just 3 days, and the colours look brilliant. Will definitely buy again! Thanks ONJJEM" },
  { name: "Niamh", product: "Colour-changing mug", text: "Love the mug I ordered. Such a cute design and the heat-activated effect works perfectly. Really happy with it!" },
];

const SHOWN_REVIEWS = IS_US ? REVIEWS.filter(r => !/magic|colour-changing/i.test(r.product)) : REVIEWS;

// Seasonal banner that changes by itself, so the app never shows an out-of-date offer.
function seasonBanner() {
  const now = new Date();
  const m = now.getMonth(), d = now.getDate();
  if (IS_US) {
    if (m === 10 || (m === 11 && d <= 10)) return { title: "HOLIDAY GIFTS", icon: "gift-outline", text: "Personalized gifts made with your photo · order early for the holidays" };
    return { title: "GIFT IDEAS", icon: "gift-outline", text: "Personalized photo gifts for every occasion" };
  }
  if (m === 10) return { title: "BLACK FRIDAY", icon: "pricetag-outline", text: "15% off + a FREE £5 gift card with every order · ends 30 Nov" };
  if (m === 11 && d <= 12) return { title: "CHRISTMAS GIFTS", icon: "gift-outline", text: "Order by 12 December for Christmas delivery" };
  if (m === 1 && d <= 14) return { title: "VALENTINE'S DAY", icon: "heart-outline", text: "Personalised gifts for someone special" };
  return { title: "GIFT IDEAS", icon: "gift-outline", text: "Personalised photo gifts for every occasion" };
}

export default function HomeScreen() {

const insets = useSafeAreaInsets();

const openShop = () => WebBrowser.openBrowserAsync(SITE);
const openUrl = (u: string) => WebBrowser.openBrowserAsync(u);
const banner = seasonBanner();
const openMugShop = () => WebBrowser.openBrowserAsync(MUG_URL);

return (

<View style={s.root}>

<ScrollView

contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}

showsVerticalScrollIndicator={false}

>

<View style={s.hero}>

<View style={s.goldLine} />

<View style={s.brandWrap}>

<Text style={s.brandShadow} numberOfLines={1} adjustsFontSizeToFit>ONJJEM</Text>

<Text style={s.brandMid} numberOfLines={1} adjustsFontSizeToFit>ONJJEM</Text>

<Text style={s.brandTop} numberOfLines={1} adjustsFontSizeToFit>ONJJEM</Text>

</View>

<ArtisanSubtitle fontSize={15} letterSpacing={2} />

<Text style={s.tagline}>A UK family business</Text>

<View style={s.goldLine} />

</View>

<View style={s.simpleSteps}>

<View style={s.simpleStep}>
<Text style={s.simpleStepNum}>1</Text>
<Text style={s.simpleStepLabel}>Visit Shop</Text>
</View>

<View style={s.simpleStep}>
<Text style={s.simpleStepNum}>2</Text>
<Text style={s.simpleStepLabel}>Upload Pic</Text>
</View>

<View style={s.simpleStep}>
<Text style={s.simpleStepNum}>3</Text>
<Text style={s.simpleStepLabel}>We Create</Text>
</View>

</View>

<TouchableOpacity
  style={s.primaryCta}
  onPress={openShop}
  activeOpacity={0.88}
>
  <Text style={s.primaryCtaText}>Browse Gifts →</Text>
</TouchableOpacity>

<View style={s.badgeRow}>

<View style={s.badgeItem}>
  <Ionicons name="shield-checkmark-outline" size={16} color="#C9960C" />
  <Text style={s.badgeText}>UK Family Business</Text>
</View>

<View style={s.badgeDivider} />

<View style={s.badgeItem}>
  <Ionicons name="rocket-outline" size={16} color="#C9960C" />
  <Text style={s.badgeText}>Fast Delivery</Text>
</View>

<View style={s.badgeDivider} />

<View style={s.badgeItem}>
  <Ionicons name="lock-closed-outline" size={16} color="#C9960C" />
  <Text style={s.badgeText}>Secure Checkout</Text>
</View>

</View>

<TouchableOpacity

style={s.cartoonCard}

onPress={() => router.push("/cartoon")}

activeOpacity={0.88}

>

<View style={s.cartoonIconWrap}>

<Ionicons name="color-wand-outline" size={28} color="#0A0804" />

</View>

<View style={{ flex: 1 }}>

<Text style={s.cartoonTitle}>Try Cartoon-ify ✨</Text>

<Text style={s.cartoonSub}>Turn any photo into a vibrant animated illustration</Text>

</View>

<Ionicons name="chevron-forward" size={20} color="#0A0804" style={{ opacity: 0.6 }} />

</TouchableOpacity>

<Text style={s.sectionTitle}>Browse Our Gifts</Text>

<View style={s.grid}>

{TILES.map((t, i) => (

<TouchableOpacity key={i} style={s.card} onPress={() => openUrl(t.url)} activeOpacity={0.8}>

<Ionicons name={t.icon as any} size={28} color="#C9960C" />

<Text style={s.cardName}>{t.name}</Text>

</TouchableOpacity>

))}

</View>

<TouchableOpacity style={s.xmasBanner} onPress={() => openUrl(DEALS_URL)} activeOpacity={0.85}>
<Text style={s.xmasTitle}>{banner.title}</Text>
<View style={s.xmasRow}>
<Ionicons name={banner.icon as any} size={16} color="#F5D78E" />
<Text style={s.xmasItem}>{banner.text}</Text>
</View>
</TouchableOpacity>

{!IS_US && (
<View style={s.mugFeature}>

<Text style={s.mugLabel}>{IS_US ? "A GIFT THEY'LL USE EVERY DAY" : "OUR BESTSELLER"}</Text>

<Text style={s.mugTitle}>{IS_US ? "The Photo Mug" : "The Magic Reveal Mug"}</Text>

<View style={s.mugImageRow}>

<Image source={{ uri: "https://onjjem.com/products/magic-mug.jpg" }} style={s.mugImageHalf} resizeMode="contain" />

<Image source={{ uri: "https://onjjem.com/products/Magicbaby.jpg" }} style={s.mugImageHalf} resizeMode="contain" />

</View>

<Text style={s.mugDesc}>

Add hot water. Watch the magic. ✨

</Text>

<Text style={s.mugDescSub}>

Prank the family. Surprise your partner. The perfect gift for birthdays, anniversaries, Christmas, or their favourite footballer obsession.

</Text>

<Text style={s.mugDescSub}>

The mug starts black. Pour in a hot drink and your photo slowly appears.

</Text>

<TouchableOpacity style={s.mugBtn} onPress={openMugShop} activeOpacity={0.85}>

<Text style={s.mugBtnText}>{IS_US ? "Order a Photo Mug" : "Order the Magic Reveal Mug"}</Text>

<Ionicons name="chevron-forward" size={14} color="#0A0804" />

</TouchableOpacity>

</View>
)}

<View style={s.divider}><Text style={s.dividerText}>What Our Customers Say</Text></View>

<Text style={s.reviewSub}>Real reviews from our customers</Text>

{SHOWN_REVIEWS.map((r, i) => (

<View key={i} style={s.reviewCard}>

<View style={s.reviewStarsRow}>

{[1,2,3,4,5].map(n => (

<Ionicons key={n} name="star" size={12} color="#C9960C" />

))}

<Text style={s.reviewProduct}>{r.product}</Text>

</View>

<Text style={s.reviewText}>{r.text}</Text>

<Text style={s.reviewName}>{r.name}</Text>

</View>

))}

<View style={s.deliveryBox}>

<Ionicons name="rocket-outline" size={26} color="#C9960C" />

<View style={{ flex: 1 }}>

<Text style={s.deliveryTitle}>{IS_US ? "Tracked US Delivery" : "Free UK Delivery"}</Text>

<Text style={s.deliverySub}>

{IS_US ? "Tracked delivery across the USA. Every gift is made to order with your photo." : "Free tracked delivery to your door. Every gift is made to order with your photo."}

</Text>

</View>

</View>

<TouchableOpacity style={s.ctaGold} onPress={openShop} activeOpacity={0.85}>

<Ionicons name="camera-outline" size={20} color="#0A0804" />

<Text style={s.ctaGoldText}>Upload Your Photo and Create</Text>

<Ionicons name="chevron-forward" size={16} color="#0A0804" />

</TouchableOpacity>

<View style={s.badges}>

{(IS_US ? ["UK Family Business", "Secure Payment", "Ships Across the USA", "5 Star Reviews"] : ["UK Family Business", "Secure Payment", "Free UK Delivery", "5 Star Reviews"]).map((b, i) => (

<View key={i} style={s.badge}>

<Text style={s.badgeText}>{b}</Text>

</View>

))}

</View>

<View style={s.footerBrandWrap}>

<Text style={s.footerBrand}>ONJJEM</Text>

<Text style={s.footerSub}>Personalised Photo Gifts · A UK family business</Text>

</View>

<TouchableOpacity style={s.footerLink} onPress={() => Linking.openURL(DELIVERY_URL)}>

<Text style={s.footerLinkText}>Delivery Info</Text>

</TouchableOpacity>

<TouchableOpacity style={s.footerLink} onPress={() => Linking.openURL("https://onjjem.com/terms.html")}>

<Text style={s.footerLinkText}>Terms and Conditions</Text>

</TouchableOpacity>

<TouchableOpacity style={s.footerLink} onPress={() => Linking.openURL("https://skeff001-coder.github.io/PRIVACY-POLICY-FOR-ONJJEM/")}>

<Text style={s.footerLinkText}>Privacy Policy</Text>

</TouchableOpacity>

</ScrollView>

</View>

);

}

const GOLD = "#C9960C";

const GOLD_LIGHT = "#F5D060";

const DARK = "#0A0804";

const s = StyleSheet.create({

root: { flex: 1, backgroundColor: DARK },

scroll: { paddingHorizontal: 18, gap: 14 },

hero: { alignItems: "center", gap: 6, paddingVertical: 10 },

goldLine: { width: 50, height: 1.5, backgroundColor: GOLD, opacity: 0.5 },

brandWrap: { width: "100%", height: 105, alignItems: "center", justifyContent: "center" },

brandShadow: { position: "absolute", fontSize: 84, fontWeight: "900", fontFamily: Platform.select({ ios: "Arial Black", android: "sans-serif-black" }), color: "#5A3F0A", letterSpacing: -1.36, width: "100%", textAlign: "center", top: 12 },

brandMid: { position: "absolute", fontSize: 84, fontWeight: "900", fontFamily: Platform.select({ ios: "Arial Black", android: "sans-serif-black" }), color: "#B8781E", letterSpacing: -1.36, width: "100%", textAlign: "center", top: 6 },

brandTop: { position: "absolute", fontSize: 84, fontWeight: "900", fontFamily: Platform.select({ ios: "Arial Black", android: "sans-serif-black" }), color: "#FFF6DD", letterSpacing: -1.36, width: "100%", textAlign: "center", top: 0 },

tagline: { fontSize: 14, color: "#F5D78E", letterSpacing: 1, textAlign: "center" },

simpleSteps: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 10,
  backgroundColor: "rgba(184,137,42,0.08)",
  borderWidth: 1,
  borderColor: "rgba(184,137,42,0.25)",
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 10,
  marginBottom: 18,
},

simpleStep: { alignItems: "center", gap: 4, minWidth: 78 },

simpleStepNum: {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: GOLD,
  color: "#1A1206",
  fontSize: 13,
  fontWeight: "800",
  textAlign: "center",
  lineHeight: 26,
  overflow: "hidden",
},

simpleStepLabel: { fontSize: 11.5, fontWeight: "700", color: "#F3E9D6", textAlign: "center" },


primaryCta: { backgroundColor: "#C9960C", borderRadius: 999, paddingVertical: 15, alignItems: "center", marginBottom: 18 },

primaryCtaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0A0804" },

badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, paddingVertical: 10 },

badgeItem: { flexDirection: "row", alignItems: "center", gap: 5 },

badgeDivider: { width: 1, height: 12, backgroundColor: "rgba(201,150,12,0.25)" },

badgeText: { fontSize: 11, fontWeight: "600", color: "rgba(245,237,216,0.75)" },

cartoonCard: {

backgroundColor: GOLD,

borderRadius: 16,

flexDirection: "row",

alignItems: "center",

gap: 14,

padding: 16,

marginBottom: 14,

},

cartoonIconWrap: {

width: 48,

height: 48,

borderRadius: 12,

backgroundColor: "rgba(10,8,4,0.12)",

alignItems: "center",

justifyContent: "center",

},

cartoonTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0A0804" },

cartoonSub: { fontSize: 12, color: "rgba(10,8,4,0.75)", marginTop: 2 },
cartoonGiftBadge: {
  backgroundColor: "rgba(10,8,4,0.12)",
  borderRadius: 6,
  paddingVertical: 3,
  paddingHorizontal: 8,
  alignSelf: "flex-start",
  marginTop: 6,
},
cartoonGiftBadgeText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#0A0804",
},

ctaGold: { backgroundColor: GOLD, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, paddingHorizontal: 20 },

ctaGoldText: { fontSize: 15, color: DARK, fontWeight: "700", flex: 1, textAlign: "center" },

sectionTitle: { fontSize: 17, color: "#F5D78E", fontWeight: "700", letterSpacing: 0.3 },

grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

card: { width: (SCREEN_W - 46) / 2, backgroundColor: "#1C1A14", borderRadius: 12, borderWidth: 1, borderColor: "rgba(201,150,12,0.2)", padding: 16, alignItems: "center", gap: 8, minHeight: 105, justifyContent: "center" },

cardName: { fontSize: 13, fontWeight: "700", color: "#F5EDD8", textAlign: "center" },

xmasBanner: { backgroundColor: "#7A0E0E", borderRadius: 12, padding: 14, gap: 8 },

xmasTitle: { fontSize: 12, fontWeight: "700", color: "#F5D78E", letterSpacing: 1.5, marginBottom: 2 },

xmasRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },

xmasItem: { fontSize: 12, color: "rgba(245,215,142,0.9)", flex: 1, lineHeight: 18 },

mugFeature: { backgroundColor: "#0F0A04", borderWidth: 1, borderColor: "rgba(201,150,12,0.35)", borderRadius: 12, padding: 10, gap: 5 },

mugLabel: { fontSize: 9, color: GOLD, letterSpacing: 2.5, fontWeight: "700" },

mugTitle: { fontSize: 14, color: "#FFF5E0", fontWeight: "800" },

mugImageRow: { flexDirection: "row", gap: 4, marginVertical: 8, borderRadius: 8, overflow: "hidden", backgroundColor: "#0F0A04" },

mugImageHalf: { flex: 1, height: 140, backgroundColor: "#0F0A04" },

mugDesc: { fontSize: 13, color: "#F3D078", fontWeight: "800" },

mugDescSub: { fontSize: 11, color: "rgba(245,237,216,0.75)", lineHeight: 16, marginTop: 6 },

mugBtn: { backgroundColor: GOLD, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },

mugBtnText: { fontSize: 12, fontWeight: "700", color: DARK },

divider: { borderTopWidth: 1, borderColor: "rgba(201,150,12,0.2)", paddingTop: 12, marginTop: 2 },

dividerText: { fontSize: 16, color: GOLD, fontWeight: "700" },

reviewSub: { fontSize: 11, color: "rgba(245,237,216,0.4)", fontStyle: "italic" },

reviewCard: { backgroundColor: "#141008", borderWidth: 1, borderColor: "rgba(201,150,12,0.12)", borderRadius: 10, padding: 14, gap: 6 },

reviewStarsRow: { flexDirection: "row", alignItems: "center", gap: 2 },

reviewProduct: { fontSize: 9, color: "rgba(201,150,12,0.7)", marginLeft: 6 },

reviewText: { fontSize: 12, color: "rgba(245,237,216,0.8)", lineHeight: 19, fontStyle: "italic" },

reviewName: { fontSize: 11, color: GOLD, fontWeight: "600" },

deliveryBox: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#0F1A0A", borderWidth: 1, borderColor: "rgba(100,180,80,0.2)", borderRadius: 10, padding: 14 },

deliveryTitle: { fontSize: 13, fontWeight: "700", color: "#A8D878", marginBottom: 3 },

deliverySub: { fontSize: 11, color: "rgba(245,237,216,0.55)", lineHeight: 18 },

badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },

badge: { backgroundColor: "rgba(201,150,12,0.06)", borderWidth: 1, borderColor: "rgba(201,150,12,0.15)", borderRadius: 50, paddingVertical: 4, paddingHorizontal: 9 },

badgeText: { fontSize: 9, color: "rgba(245,215,142,0.6)" },

footerBrandWrap: { alignItems: "center", gap: 4, paddingVertical: 6 },

footerBrand: { fontSize: 18, color: GOLD, fontWeight: "700", letterSpacing: 5 },

footerSub: { fontSize: 10, color: "rgba(245,215,142,0.3)", textAlign: "center" },

footerLink: { alignItems: "center", paddingVertical: 14, backgroundColor: "rgba(201,150,12,0.08)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(201,150,12,0.25)" },

footerLinkText: { fontSize: 13, color: "rgba(245,215,142,0.8)", fontWeight: "600" },

});
