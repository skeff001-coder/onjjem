import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  Linking,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, type GalleryEntry } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const ONJJEM_URL = "https://onjjem.com";
const ONJJEM_BUNDLE_URL = "https://onjjem.com/bundle";

// Physical merchandise is designed and paid for on onjjem.com (Stripe + Prodigi),
// never through Apple/Google in-app purchase — Apple's guidelines require
// physical goods to be sold outside IAP, and only onjjem.com can actually
// fulfil the order via Prodigi.
function buildOnjjemUrl(productId: string, dogName?: string) {
  const params = new URLSearchParams({ product: productId });
  if (dogName) params.set("dogName", dogName);
  return `${ONJJEM_BUNDLE_URL}?${params.toString()}`;
}

// Bags of Love product catalogue — prices carry ~55% margin over BoL wholesale
const CATALOGUE = [
  {
    id: "canvas_a3",
    name: "Large Gallery Wrap Canvas",
    sub: "60 × 40 cm · Best Seller",
    tagline: "Our most popular size — a true statement piece",
    price: "£49.99",
    bolCost: "~£32",
    icon: "image-outline" as const,
    color: "#c9a84c",
    featured: true,
    emoji: "🖼️",
    desc: "Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame. Lifetime Fade-Resistant Guarantee.",
  },
  {
    id: "canvas_20",
    name: "Classic Gallery Wrap Canvas",
    sub: "30 × 20 cm",
    tagline: "Gallery-ready art of your dog",
    price: "£29.99",
    bolCost: "~£18",
    icon: "image-outline" as const,
    color: "#c9a84c",
    featured: false,
    emoji: "🖼️",
    desc: "Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame for a stunning gallery wrap finish.",
  },
  {
    id: "canvas_a2",
    name: "Bespoke Canvas",
    sub: "Made to Measure · Any Dimensions",
    tagline: "Any exact size for your wall",
    price: "from £49.99",
    bolCost: "~£45",
    icon: "image-outline" as const,
    color: "#c9a84c",
    featured: false,
    emoji: "📐",
    desc: "Cinema-Grade AI Restoration included. Our master printers produce your canvas at any custom dimensions, hand-stretched over a 2.5cm deep FSC-certified wooden frame.",
  },
  {
    id: "framed_print",
    name: "Framed Photo Print",
    sub: "A4 in white or black frame",
    tagline: "Classic portrait, ready to gift",
    price: "£44.99",
    bolCost: "~£28",
    icon: "albums-outline" as const,
    color: "#9b7dcf",
    featured: false,
    emoji: "🪞",
    desc: "High-res photo print mounted in a premium MDF frame. Glass-fronted, gift-boxed.",
  },
  {
    id: "cushion",
    name: "Portrait Cushion",
    sub: "40 × 40 cm",
    tagline: "Curl up with their face",
    price: "£34.99",
    bolCost: "~£22",
    icon: "bed-outline" as const,
    color: "#7cb87c",
    featured: false,
    emoji: "🛋️",
    desc: "Velvet-touch cover with full-colour portrait. Comes with premium hollow-fibre inner.",
  },
  {
    id: "dog_lead",
    name: "Personalised Dog Lead",
    sub: "120 cm · photo printed",
    tagline: "Their face on every walk",
    price: "£32.99",
    bolCost: "~£18",
    icon: "link-outline" as const,
    color: "#e07c5a",
    featured: false,
    emoji: "🦮",
    desc: "Durable polyester lead with your dog's portrait printed along the length. Strong metal clasp.",
  },
  {
    id: "tote",
    name: "Personalised Tote Bag",
    sub: "350 gsm natural cotton",
    tagline: "Take them everywhere",
    price: "£22.99",
    bolCost: "~£13",
    icon: "bag-outline" as const,
    color: "#4a9eca",
    featured: false,
    emoji: "👜",
    desc: "Heavy-duty eco-cotton tote with reinforced handles. Dye-sub print that lasts.",
  },
  {
    id: "mug",
    name: "Photo Mug",
    sub: "11 oz ceramic",
    tagline: "Morning coffee with your best friend",
    price: "£17.99",
    bolCost: "~£10",
    icon: "cafe-outline" as const,
    color: "#4a9eca",
    featured: false,
    emoji: "☕",
    desc: "Vibrant wrap-around dog portrait on ceramic. Dishwasher and microwave safe.",
  },
  {
    id: "blanket",
    name: "Photo Fleece Blanket",
    sub: "130 × 150 cm",
    tagline: "Snuggle with their portrait",
    price: "£54.99",
    bolCost: "~£34",
    icon: "snow-outline" as const,
    color: "#9b7dcf",
    featured: false,
    emoji: "🛏️",
    desc: "Ultra-soft anti-pill fleece with full-bleed photographic print. Machine washable.",
  },
  {
    id: "jigsaw",
    name: "Photo Jigsaw Puzzle",
    sub: "252 or 500 pieces",
    tagline: "The ultimate dog lover's challenge",
    price: "£28.99",
    bolCost: "~£18",
    icon: "extension-puzzle-outline" as const,
    color: "#e07c5a",
    featured: false,
    emoji: "🧩",
    desc: "Full-colour puzzle from your dog's photo. Great gift, hours of fun.",
  },
  {
    id: "dog_ball",
    name: "Personalised Dog Ball",
    sub: "Natural rubber · Standard or Large",
    tagline: "Their face on every bounce",
    price: "£24.99",
    bolCost: "~£14",
    icon: "football-outline" as const,
    color: "#7cb87c",
    featured: false,
    emoji: "⚽",
    desc: "Premium rubber ball with UV-stable dye-sub portrait. Dishwasher safe.",
  },
  {
    id: "bandana",
    name: "Dog Photo Bandana",
    sub: "Printed fabric · S / M / L",
    tagline: "The most stylish pup on the block",
    price: "£14.99",
    bolCost: "~£8",
    icon: "shirt-outline" as const,
    color: "#c9a84c",
    featured: false,
    emoji: "🎀",
    desc: "Soft printed bandana with your dog's portrait. Tie-on style. Washable.",
  },
  {
    id: "phone_case",
    name: "Photo Phone Case",
    sub: "iPhone & Samsung",
    tagline: "Your dog in your pocket",
    price: "£22.99",
    bolCost: "~£13",
    icon: "phone-portrait-outline" as const,
    color: "#e07c5a",
    featured: false,
    emoji: "📱",
    desc: "Slim hard-shell case with full-wrap dog portrait. Precise cutouts, drop-tested.",
  },
  {
    id: "notebook",
    name: "Personalised Notebook",
    sub: "A5 · 128 lined pages",
    tagline: "Notes worthy of their name",
    price: "£18.99",
    bolCost: "~£11",
    icon: "book-outline" as const,
    color: "#7cb87c",
    featured: false,
    emoji: "📓",
    desc: "Soft-touch matte cover with dog portrait. 90 gsm premium paper inside.",
  },
  {
    id: "photo_book",
    name: "Pet Memory Book",
    sub: "A4 hardback · 20 pages",
    tagline: "Their whole story, beautifully bound",
    price: "£49.99",
    bolCost: "~£31",
    icon: "images-outline" as const,
    color: "#9b7dcf",
    featured: false,
    emoji: "📖",
    desc: "Lay-flat hardback photo book with your dog's portraits. Professional print, gift-boxed.",
  },
  {
    id: "keyring",
    name: "Personalised Keyring",
    sub: "Acrylic · double-sided",
    tagline: "Carry them everywhere",
    price: "£12.99",
    bolCost: "~£7",
    icon: "key-outline" as const,
    color: "#e07c5a",
    featured: false,
    emoji: "🔑",
    desc: "Laser-cut acrylic charm with full-colour dog portrait, both sides. Shatterproof.",
  },
  {
    id: "bauble",
    name: "Christmas Bauble",
    sub: "8 cm ceramic ornament",
    tagline: "The most festive decoration",
    price: "£16.99",
    bolCost: "~£9",
    icon: "star-outline" as const,
    color: "#c9a84c",
    featured: false,
    emoji: "🎄",
    desc: "Ceramic bauble with your dog's photo. Gold ribbon hanger. Gift-wrapped in tissue.",
  },
  {
    id: "coaster_set",
    name: "Coaster Set",
    sub: "4 cork-backed coasters",
    tagline: "Coffee tastes better with their face",
    price: "£24.99",
    bolCost: "~£14",
    icon: "disc-outline" as const,
    color: "#4a9eca",
    featured: false,
    emoji: "🥤",
    desc: "Set of 4 round coasters, each printed with your dog's portrait. Heat and water resistant.",
  },
  {
    id: "water_bottle",
    name: "Personalised Water Bottle",
    sub: "500 ml stainless steel",
    tagline: "Hydrate with your best friend",
    price: "£32.99",
    bolCost: "~£19",
    icon: "water-outline" as const,
    color: "#7cb87c",
    featured: false,
    emoji: "🍶",
    desc: "Double-walled stainless steel bottle with dye-sub dog portrait. Keeps cold 24 h, hot 12 h.",
  },
  {
    id: "desk_calendar",
    name: "Desk Calendar",
    sub: "A5 standing · 12 months",
    tagline: "365 days of their best angles",
    price: "£34.99",
    bolCost: "~£20",
    icon: "calendar-outline" as const,
    color: "#9b7dcf",
    featured: false,
    emoji: "📅",
    desc: "A5 standing desk calendar featuring your dog across 12 monthly pages. Premium 250 gsm card.",
  },
];

// PLACEHOLDER reviews — swap for real customer quotes (Trustpilot / App Store)
// before this ships. Do not launch with invented testimonials.
const REVIEWS = [
  {
    name: "Sarah M.",
    dogName: "Biscuit",
    product: "a canvas print",
    quote: "Arrived beautifully packaged and the print quality is gorgeous. Didn't expect it to link to a real shop but glad it did.",
  },
  {
    name: "Tom R.",
    dogName: "Frankie",
    product: "a photo mug",
    quote: "Ordered in the app, checked out on the ONJJEM site in under a minute. Mug looks brilliant.",
  },
  {
    name: "Priya K.",
    dogName: "Max",
    product: "a keyring",
    quote: "Nice to know it's the same people behind the app making the gifts — felt trustworthy straight away.",
  },
];

// Simple product mockup: dog photo inside a styled frame
function ProductMockup({
  imageUri,
  productId,
  color,
  size,
}: {
  imageUri?: string;
  productId: string;
  color: string;
  size: number;
}) {
  const isCircle = ["cushion", "dog_ball"].includes(productId);
  const isRounded = ["phone_case", "bandana"].includes(productId);
  const borderRadius = isCircle ? size / 2 : isRounded ? 18 : 8;
  const borderColor = productId.startsWith("canvas") || productId === "framed_print" ? "#c8b89a" : color + "66";
  const borderWidth = productId.startsWith("canvas") || productId === "framed_print" ? 7 : 3;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        borderWidth,
        borderColor,
        overflow: "hidden",
        backgroundColor: color + "18",
      }}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.38 }}>🐕</Text>
        </View>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gallery } = useApp();

  const [previewEntry, setPreviewEntry] = useState<GalleryEntry | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof CATALOGUE[0] | null>(null);
  const [orderVisible, setOrderVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const activeEntry = previewEntry ?? gallery[0] ?? null;
  const previewUri = activeEntry?.uri;
  const dogName = activeEntry?.dogName ?? "";

  const featured = CATALOGUE[0];
  const rest = CATALOGUE.slice(1);
  const CARD_W = (width - 52) / 2;

  const openExternalShop = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await Linking.canOpenURL(ONJJEM_URL);
    if (ok) Linking.openURL(ONJJEM_URL);
    else Alert.alert("Visit onjjem.com in your browser.");
  };

  const openOrder = (product: typeof CATALOGUE[0]) => {
    setSelectedProduct(product);
    setOrderVisible(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDesignAtOnjjem = async () => {
    if (!selectedProduct) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = buildOnjjemUrl(selectedProduct.id, dogName || undefined);
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert("Visit onjjem.com/bundle in your browser to design this gift.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>That's My Dog!</Text>
            <Text style={[styles.subtitle, { color: colors.gold }]}>Premium personalised dog gifts</Text>
          </View>
          <View style={[styles.starBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
            <Ionicons name="paw" size={14} color={colors.gold} />
          </View>
        </View>

        {/* onJJem shop banner */}
        <View style={[styles.partnerBanner, { backgroundColor: colors.navyMid, borderColor: colors.gold + "44" }]}>
          <View style={styles.partnerRow}>
            <View style={[styles.officialChip, { backgroundColor: colors.gold }]}>
              <Ionicons name="star" size={12} color={colors.navy} />
              <Text style={[styles.officialChipText, { color: colors.navy }]}>PREMIUM GIFTS</Text>
            </View>
          </View>
          <Text style={[styles.partnerHeading, { color: colors.foreground }]}>That's My Dog!</Text>
          <Text style={[styles.partnerBody, { color: colors.mutedForeground }]}>
            ONJJEM is our sister company — made by the same team behind What's Up Dog! and our other apps. They make every personalised keepsake here: canvases, blankets, leads, mugs, balls and more. Museum-grade inks, delivered gift-wrapped in 3–5 business days.
          </Text>
          <TouchableOpacity onPress={openExternalShop} activeOpacity={0.85} style={[styles.visitBtn, { backgroundColor: colors.gold }]}>
            <Ionicons name="globe-outline" size={17} color={colors.navy} />
            <Text style={[styles.visitBtnText, { color: colors.navy }]}>VISIT ONJJEM.COM</Text>
            <Ionicons name="open-outline" size={15} color={colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Preview photo picker */}
        {gallery.length > 0 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>PREVIEW WITH YOUR DOG</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {gallery.map((entry) => {
                const active = (activeEntry?.id) === entry.id;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => { setPreviewEntry(entry); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[styles.pickerThumb, { borderColor: active ? colors.gold : colors.border, borderWidth: active ? 2.5 : 1 }]}
                  >
                    <Image source={{ uri: entry.uri }} style={styles.pickerThumbImg} resizeMode="cover" />
                    {entry.dogName ? (
                      <View style={[styles.pickerNameWrap, { backgroundColor: colors.background + "ee" }]}>
                        <Text style={[styles.pickerName, { color: colors.gold }]} numberOfLines={1}>{entry.dogName}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Featured canvas — large with canvas-frame mockup */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Featured</Text>
          <TouchableOpacity onPress={() => openOrder(featured)} activeOpacity={0.88}
            style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
            <View style={[styles.featuredMockup, { backgroundColor: colors.navyMid }]}>
              {previewUri
                ? <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontSize: 90 }}>🐕</Text>
                  </View>
              }
              {/* Canvas frame border */}
              <View style={[StyleSheet.absoluteFill, { borderWidth: 16, borderColor: "#c8b89a", borderRadius: 4 }]} pointerEvents="none" />
              <View style={[styles.bestSellerBadge, { backgroundColor: colors.gold }]}>
                <Text style={[styles.bestSellerText, { color: colors.navy }]}>BEST SELLER</Text>
              </View>
            </View>
            <View style={styles.featuredMeta}>
              <View style={styles.featuredRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featuredName, { color: colors.foreground }]}>{featured.name}</Text>
                  <Text style={[styles.featuredSub, { color: colors.gold }]}>{featured.sub}</Text>
                  <Text style={[styles.featuredTagline, { color: colors.mutedForeground }]}>{featured.tagline}</Text>
                </View>
                <Text style={[styles.featuredPrice, { color: colors.gold }]}>{featured.price}</Text>
              </View>
              <Text style={[styles.featuredDesc, { color: colors.mutedForeground }]}>{featured.desc}</Text>
              <View style={[styles.orderRowBtn, { backgroundColor: colors.gold }]}>
                <Ionicons name="bag-add-outline" size={17} color={colors.navy} />
                <Text style={[styles.orderRowBtnText, { color: colors.navy }]}>
                  {dogName ? `Order for ${dogName}` : "Customise & Order"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Full range grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Full Gift Range</Text>
          <View style={styles.grid}>
            {rest.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => openOrder(product)}
                activeOpacity={0.75}
                style={[styles.gridCard, { width: CARD_W, backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Mockup */}
                <View style={[styles.gridMockupWrap, { backgroundColor: colors.navyMid }]}>
                  <ProductMockup
                    imageUri={previewUri}
                    productId={product.id}
                    color={product.color}
                    size={CARD_W * 0.58}
                  />
                </View>
                {/* Name + sub on their own lines, no overlap */}
                <View style={styles.gridMeta}>
                  <Text style={[styles.gridName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.gridSub, { color: product.color }]} numberOfLines={1}>{product.sub}</Text>
                  <Text style={[styles.gridTagline, { color: colors.mutedForeground }]} numberOfLines={2}>{product.tagline}</Text>
                </View>
                <View style={[styles.gridFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.gridPrice, { color: colors.foreground }]}>{product.price}</Text>
                  <View style={[styles.addBtn, { backgroundColor: product.color }]}>
                    <Ionicons name="open-outline" size={13} color="#0a0e1a" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reviews — real What's Up Dog! customers who ordered via ONJJEM */}
        {/* TODO(Owen): replace REVIEWS below with real quotes before release —
            e.g. pulled from ONJJEM's Trustpilot or App Store reviews. */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>What owners say</Text>
          <View style={{ gap: 10 }}>
            {REVIEWS.map((r) => (
              <View
                key={r.name}
                style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.reviewStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name="star" size={13} color={colors.gold} />
                  ))}
                </View>
                <Text style={[styles.reviewQuote, { color: colors.foreground }]}>"{r.quote}"</Text>
                <Text style={[styles.reviewMeta, { color: colors.mutedForeground }]}>
                  {r.name} · bought {r.product} for {r.dogName} via ONJJEM
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trust strip */}
        <View style={[styles.trustStrip, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
          {[
            { icon: "shield-checkmark-outline" as const, label: "Ethically\nmade" },
            { icon: "car-outline" as const, label: "3–5 day\ndelivery" },
            { icon: "refresh-outline" as const, label: "Hassle-free\nreturns" },
            { icon: "star-outline" as const, label: "4.9★\nreviews" },
          ].map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <Ionicons name={t.icon} size={20} color={colors.gold} />
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Order Modal */}
      <Modal visible={orderVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOrderVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={() => setOrderVisible(false)} style={[styles.modalClose, { backgroundColor: colors.navyMid }]}>
            <Ionicons name="close" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 32 }]}>
            {selectedProduct && (
              <View style={styles.modalHeader}>
                <View style={[styles.modalMockupWrap, { backgroundColor: colors.navyMid, borderRadius: 14 }]}>
                  <ProductMockup imageUri={previewUri} productId={selectedProduct.id} color={selectedProduct.color} size={width * 0.45} />
                </View>
                <View style={styles.modalHeaderMeta}>
                  <Text style={[styles.modalProductName, { color: colors.foreground }]}>{selectedProduct.name}</Text>
                  <Text style={[styles.modalProductSub, { color: selectedProduct.color }]}>{selectedProduct.sub}</Text>
                  <Text style={[styles.modalProductPrice, { color: selectedProduct.color }]}>{selectedProduct.price}</Text>
                  {dogName ? (
                    <Text style={[styles.modalForDog, { color: colors.gold }]}>For {dogName}</Text>
                  ) : null}
                  <Text style={[styles.modalProductDesc, { color: colors.mutedForeground }]} numberOfLines={4}>{selectedProduct.desc}</Text>
                </View>
              </View>
            )}

            <View style={[styles.qualityCredit, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
              <Ionicons name="star-outline" size={14} color={colors.gold} />
              <Text style={[styles.qualityCreditText, { color: colors.mutedForeground }]}>
                Made by <Text style={{ color: colors.gold }}>ONJJEM</Text>, our sister company · Museum-grade inks · Gift-wrapped
              </Text>
            </View>

            <Text style={[styles.modalSection, { color: colors.foreground }]}>
              {dogName ? `${dogName} can be on this — or anything else.` : "This can be their photo — or anything else."}
            </Text>
            <Text style={[styles.modalProductDesc, { color: colors.mutedForeground, marginTop: -8 }]}>
              Design and check out securely on onjjem.com. Your order is fulfilled and shipped directly by ONJJEM.
            </Text>

            <TouchableOpacity
              onPress={handleDesignAtOnjjem}
              style={[styles.placeBtn, { backgroundColor: selectedProduct?.color ?? colors.gold }]}
            >
              <Ionicons name="color-palette-outline" size={20} color="#0a0e1a" />
              <Text style={[styles.placeBtnText, { color: "#0a0e1a" }]}>
                {dogName ? `Design for ${dogName} at ONJJEM.com` : "Design at ONJJEM.com"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              Opens onjjem.com/bundle in your browser · Delivery 3–5 business days
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 3 },
  starBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginTop: 4, alignItems: "center", justifyContent: "center" },
  partnerBanner: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, marginBottom: 16 },
  partnerRow: { flexDirection: "row" },
  officialChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  officialChipText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  partnerHeading: { fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  partnerBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  visitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14 },
  visitBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  pickerSection: { marginBottom: 14, gap: 6 },
  pickerLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, paddingLeft: 20 },
  pickerRow: { paddingHorizontal: 20, gap: 10 },
  pickerThumb: { borderRadius: 14, overflow: "hidden", width: 72, height: 72 },
  pickerThumbImg: { width: "100%", height: "100%" },
  pickerNameWrap: { position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 3, paddingHorizontal: 4 },
  pickerName: { fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeading: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.2 },
  featuredCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  featuredMockup: { width: "100%", height: width - 32, position: "relative" },
  bestSellerBadge: { position: "absolute", top: 14, right: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  bestSellerText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  featuredMeta: { padding: 18, gap: 10 },
  featuredRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featuredName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  featuredSub: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  featuredTagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  featuredPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  featuredDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  orderRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  orderRowBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  gridMockupWrap: { height: 120, alignItems: "center", justifyContent: "center" },
  gridMeta: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, gap: 3 },
  gridName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gridSub: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  gridTagline: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  gridFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  gridPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  addBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  reviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewQuote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  reviewMeta: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  trustStrip: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 8 },
  trustItem: { alignItems: "center", gap: 5 },
  trustLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 13 },
  modal: { flex: 1, paddingTop: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalClose: { position: "absolute", right: 16, top: 16, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", zIndex: 10 },
  modalScroll: { paddingHorizontal: 20, gap: 16 },
  modalHeader: { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingTop: 8 },
  modalMockupWrap: { alignItems: "center", justifyContent: "center", width: width * 0.45, height: width * 0.45, overflow: "hidden" },
  modalHeaderMeta: { flex: 1, gap: 4 },
  modalProductName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  modalProductSub: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalProductPrice: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  modalForDog: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalProductDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  qualityCredit: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  qualityCreditText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modalSection: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  placeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 16 },
  placeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
  confirmedWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  confirmedIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  confirmedTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  confirmedDog: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmedBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  confirmedSub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneBtn: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, marginTop: 8 },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
