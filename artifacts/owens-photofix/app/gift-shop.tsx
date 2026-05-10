import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const BLUE = "#0066FF";
const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Product = {
  id: string;
  title: string;
  size?: string;
  desc: string;
  price: string;
  emoji: string;
  iconBg: string;
  wide?: boolean;
  bestSeller?: boolean;
  photo?: ReturnType<typeof require>;
  premiumBadge?: boolean;
};

type Category = {
  id: string;
  label: string;
  emoji: string;
  subtitle: string;
  fulfillment: string;
  headerGradient: readonly [string, string];
  products: Product[];
};

const CATEGORIES: Category[] = [
  {
    id: "living",
    label: "Living Room",
    emoji: "🛋️",
    subtitle: "Canvases, prints & cushions for your walls and sofas",
    fulfillment: "Master Print Lab & Master Textiles",
    headerGradient: ["#2E86C1", "#1A5276"],
    products: [
      {
        id: "canvas_classic",
        title: "Classic Canvas",
        size: "30×20 cm",
        desc: "Hand stretched on solid wood",
        price: "£29.99",
        emoji: "🎨",
        iconBg: "#EAF4FF",
      },
      {
        id: "canvas_large",
        title: "Large Canvas",
        size: "60×40 cm",
        desc: "Statement wall art, gallery grade",
        price: "£49.99",
        emoji: "🖼️",
        iconBg: "#E3EDFF",
      },
      {
        id: "photo_print",
        title: "Standard Photo Print",
        size: "7×5 inch",
        desc: "Professional gloss finish",
        price: "£4.99",
        emoji: "📷",
        iconBg: "#EEF4FF",
      },
      {
        id: "poster",
        title: "A4 Photo Poster",
        size: "A4",
        desc: "High quality gallery paper",
        price: "£12.99",
        emoji: "📜",
        iconBg: "#E8F4FF",
      },
      {
        id: "cushion_square",
        title: "Square Photo Cushion",
        size: "40 cm",
        desc: "Plump, vibrant & machine washable",
        price: "£29.99",
        emoji: "🟦",
        iconBg: "#EEE8FF",
      },
      {
        id: "cushion_large",
        title: "Large Luxury Cushion",
        size: "60 cm",
        desc: "Our most comfortable cushion",
        price: "£39.99",
        emoji: "🛋️",
        iconBg: "#F5E8FF",
        bestSeller: true,
      },
    ],
  },
  {
    id: "bedroom",
    label: "Bedroom",
    emoji: "🛏️",
    subtitle: "Quilts & pillowcases for a personal touch",
    fulfillment: "Master Textiles",
    headerGradient: ["#7B2FBE", "#4A1080"],
    products: [
      {
        id: "pillowcase",
        title: "Premium Pillowcase",
        desc: "Soft touch fabric, perfect for memories",
        price: "£24.99",
        emoji: "😴",
        iconBg: "#FDE8F5",
        wide: true,
      },
      {
        id: "quilt_single",
        title: "Single Photo Quilt",
        size: "Single",
        desc: "Hand stitched and delightfully cosy",
        price: "£135",
        emoji: "🛏️",
        iconBg: "#F3E8FF",
        wide: true,
      },
      {
        id: "quilt_double",
        title: "Double Photo Quilt",
        size: "Double",
        desc: "Premium quality comfort",
        price: "£165",
        emoji: "🛏️",
        iconBg: "#EDE0FF",
        wide: true,
      },
      {
        id: "quilt_king",
        title: "King-Size Quilt",
        size: "King",
        desc: "Our largest, most detailed gift",
        price: "£195",
        emoji: "🌟",
        iconBg: "#E8DAFF",
        wide: true,
        bestSeller: true,
      },
    ],
  },
  {
    id: "personal",
    label: "Personal Gifts",
    emoji: "🎁",
    subtitle: "Keyrings, mugs & keepsakes for everyone",
    fulfillment: "Master Print Lab",
    headerGradient: ["#E07000", "#BF4500"],
    products: [
      {
        id: "magnet",
        title: "Fridge Magnet",
        desc: "Acrylic memory for your kitchen",
        price: "£9.99",
        emoji: "🧲",
        iconBg: "#FFF4E0",
      },
      {
        id: "keyring",
        title: "Photo Keyring",
        desc: "Take your memories everywhere",
        price: "£12.99",
        emoji: "🔑",
        iconBg: "#FFF9E6",
      },
      {
        id: "mug_classic",
        title: "Classic Photo Mug",
        size: "11 oz",
        desc: "Dishwasher safe, vibrant print",
        price: "£14.99",
        emoji: "☕",
        iconBg: "#FFF3E0",
      },
      {
        id: "mug_travel",
        title: "Tall Travel Mug",
        size: "15 oz",
        desc: "Keep memories warm on the go",
        price: "£19.99",
        emoji: "🧋",
        iconBg: "#FFF8F0",
      },
    ],
  },
  {
    id: "jigsaws",
    label: "Jigsaws",
    emoji: "🧩",
    subtitle: "Every puzzle ships in a premium metal gift tin",
    fulfillment: "Master Print Lab",
    headerGradient: ["#2E7D32", "#1B5E20"],
    products: [
      {
        id: "jigsaw_30",
        title: "Mini Wooden Jigsaw",
        size: "30 pieces",
        desc: "Wooden pieces · perfect for little ones",
        price: "£19.99",
        emoji: "🪵",
        iconBg: "#E8F5E9",
      },
      {
        id: "jigsaw_252",
        title: "Classic Jigsaw",
        size: "252 pieces",
        desc: "Cardboard · great family activity",
        price: "£29.99",
        emoji: "🧩",
        iconBg: "#F1F8E9",
      },
      {
        id: "jigsaw_500",
        title: "Standard Jigsaw",
        size: "500 pieces",
        desc: "Cardboard · satisfying challenge",
        price: "£39.99",
        emoji: "🧩",
        iconBg: "#E8F5E9",
      },
      {
        id: "jigsaw_1000",
        title: "Deluxe Jigsaw",
        size: "1000 pieces",
        desc: "Cardboard · the ultimate memory puzzle",
        price: "£49.99",
        emoji: "🧩",
        iconBg: "#DCEDC8",
        bestSeller: true,
      },
    ],
  },
  {
    id: "leather",
    label: "Luxury Leather",
    emoji: "👜",
    subtitle: "Handcrafted leather goods with your photo",
    fulfillment: "Master Leather Goods",
    headerGradient: ["#6D4C41", "#3E2723"],
    products: [
      {
        id: "leather_purse",
        title: "Nappa Leather Purse",
        desc: "Expertly handmade in London using buttery soft nappa leather. Features a smooth or textured finish with your memories printed in high definition.",
        price: "£109",
        emoji: "👛",
        iconBg: "#EFEBE9",
        wide: true,
        premiumBadge: true,
        photo: require("@/assets/leather/purse.jpg"),
      },
      {
        id: "leather_wallet",
        title: "Groom's Leather Wallet",
        desc: "A timeless gift. Hand stitched genuine leather with a hidden photo compartment for a truly personal touch.",
        price: "£45",
        emoji: "💳",
        iconBg: "#F5F0EB",
        wide: true,
        premiumBadge: true,
        photo: require("@/assets/leather/wallet.jpg"),
      },
      {
        id: "leather_handbag",
        title: "Designer Leather Tote",
        desc: "Make a statement with a 100% real leather handbag — durable, stylish, and completely unique to you.",
        price: "£139",
        emoji: "👜",
        iconBg: "#EDE0D4",
        wide: true,
        premiumBadge: true,
        photo: require("@/assets/leather/tote.jpg"),
      },
    ],
  },
];

export default function GiftShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("living");
  const [giftWrap, setGiftWrap] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab)!;

  const handleDesign = (title: string) => {
    const extra = giftWrap ? " + Deluxe Gift Wrapping (£4.99)" : "";
    Alert.alert("Coming Soon", `${title}${extra} ordering is launching very soon!`);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Rainbow bar */}
      <LinearGradient
        colors={["#FF6B6B", "#FF9F0A", "#FFD60A", "#34C759", "#4F8EF7", "#BF5AF2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.rainbowBar}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Gift Shop</Text>
          <Text style={s.headerSub}>Print · Gift · Remember</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="gift" size={26} color="#FF6B6B" />
        </View>
      </View>

      {/* Category tab bar — horizontally scrollable for 4 tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBarScroll}
        contentContainerStyle={s.tabBar}
      >
        {CATEGORIES.map((cat) => {
          const active = activeTab === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(cat.id)}
              activeOpacity={0.75}
            >
              <Text style={s.tabEmoji}>{cat.emoji}</Text>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{cat.label}</Text>
              {active && <View style={s.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        style={s.scrollView}
        key={activeTab}
      >
        {/* Section card */}
        <View style={s.section}>
          <LinearGradient
            colors={[...activeCategory.headerGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.sectionHeader}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>{activeCategory.emoji}  {activeCategory.label}</Text>
              <Text style={s.sectionSubtitle}>{activeCategory.subtitle}</Text>
            </View>
            <View style={s.fulfillmentBadge}>
              <Ionicons name="business-outline" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={s.fulfillmentText}>{activeCategory.fulfillment}</Text>
            </View>
          </LinearGradient>

          {/* Metal tin callout — jigsaws only */}
          {activeTab === "jigsaws" && (
            <View style={s.tinCallout}>
              <Text style={s.tinEmoji}>🥫</Text>
              <View style={s.tinText}>
                <Text style={s.tinTitle}>Includes Premium Metal Gift Tin</Text>
                <Text style={s.tinSub}>
                  Every jigsaw ships in a professional metal tin with your photo printed on the lid — ready to gift, no wrapping needed.
                </Text>
              </View>
            </View>
          )}

          <View style={s.productGrid}>
            {activeCategory.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleDesign(product.title)}
              />
            ))}
          </View>
        </View>

        {/* Gift wrapping toggle */}
        <View style={s.giftWrapCard}>
          <LinearGradient
            colors={["#7B2FBE", "#C2185B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.giftWrapHeader}
          >
            <Text style={s.giftWrapHeaderText}>✨  Luxury Touch</Text>
          </LinearGradient>

          <View style={s.giftWrapBody}>
            <View style={s.giftWrapRow}>
              <View style={s.giftWrapIconWrap}>
                <Text style={s.giftWrapEmoji}>🎀</Text>
              </View>
              <View style={s.giftWrapInfo}>
                <Text style={s.giftWrapTitle}>Deluxe Gift Wrapping</Text>
                <Text style={s.giftWrapPrice}>+ £4.99</Text>
              </View>
              <Switch
                value={giftWrap}
                onValueChange={setGiftWrap}
                trackColor={{ false: "#D1C9BE", true: BLUE }}
                thumbColor="#fff"
                ios_backgroundColor="#D1C9BE"
              />
            </View>
            {giftWrap ? (
              <View style={s.giftWrapDesc}>
                <Ionicons name="sparkles-outline" size={15} color={GOLD} />
                <Text style={s.giftWrapDescText}>
                  Your item will be beautifully hand wrapped in premium paper with a personalized ribbon and a handwritten gift note.
                </Text>
              </View>
            ) : (
              <Text style={s.giftWrapHint}>
                Toggle on to add a beautiful hand-wrapped finish to your order.
              </Text>
            )}
          </View>
        </View>

        {/* Quality promise banner */}
        <View style={s.promiseBanner}>
          <LinearGradient
            colors={["#1A3A6B", "#0A2040"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.promiseGradient}
          >
            <Text style={s.promiseFlag}>🇬🇧</Text>
            <View style={s.promiseCenter}>
              <Text style={s.promiseHeadline}>Handmade in London</Text>
              <Text style={s.promiseSub}>Every item crafted with care by our expert artisans</Text>
            </View>
          </LinearGradient>
          <View style={s.promiseGuaranteeRow}>
            <View style={s.promiseGuaranteeItem}>
              <Ionicons name="shield-checkmark" size={22} color={GOLD} />
              <View>
                <Text style={s.promiseGuaranteeTitle}>10 Year Print Guarantee</Text>
                <Text style={s.promiseGuaranteeSub}>Colours that last a decade, promise</Text>
              </View>
            </View>
            <View style={s.promiseDivider} />
            <View style={s.promiseGuaranteeItem}>
              <Ionicons name="airplane" size={22} color={BLUE} />
              <View>
                <Text style={s.promiseGuaranteeTitle}>UK Shipping Included</Text>
                <Text style={s.promiseGuaranteeSub}>Professional packaging, every time</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <View style={[s.productCard, product.wide && s.productCardWide]}>
      {product.bestSeller && (
        <View style={s.bestSellerBadge}>
          <Text style={s.bestSellerStar}>★</Text>
          <Text style={s.bestSellerText}>Best Seller</Text>
        </View>
      )}
      {product.premiumBadge && (
        <View style={s.premiumBadge}>
          <Text style={s.premiumBadgeStar}>♦</Text>
          <Text style={s.premiumBadgeText}>Premium Quality</Text>
        </View>
      )}

      {product.photo ? (
        <Image
          source={product.photo}
          style={[s.productPhoto, product.wide ? s.productPhotoWide : s.productPhotoSquare]}
          resizeMode="cover"
        />
      ) : (
        <View style={[
          s.productIconWrap,
          { backgroundColor: product.iconBg },
          product.wide && s.productIconWrapWide,
        ]}>
          <Text style={[s.productEmoji, product.wide && s.productEmojiWide]}>
            {product.emoji}
          </Text>
          {product.size && (
            <View style={s.sizePill}>
              <Text style={s.sizePillText}>{product.size}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[s.productBody, product.wide && s.productBodyWide]}>
        <Text style={s.productTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={s.productDesc}>{product.desc}</Text>
        <View style={s.productFooter}>
          <Text style={s.productPrice}>{product.price}</Text>
          <TouchableOpacity style={s.designBtn} activeOpacity={0.82} onPress={onPress}>
            <Text style={s.designBtnText}>Design Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  rainbowBar: { height: 4, width: "100%" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2D9CF",
    backgroundColor: CREAM,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E2D9CF",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" as const, color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, color: "#8E8E93", fontFamily: "Inter_400Regular", letterSpacing: 1.5, marginTop: 1 },
  headerRight: { width: 40, alignItems: "center" },

  /* Tab bar */
  tabBarScroll: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2D9CF",
    flexGrow: 0,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    position: "relative",
    gap: 3,
    minWidth: 88,
  },
  tabActive: {},
  tabEmoji: { fontSize: 18 },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#8E8E93",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  tabLabelActive: { color: BLUE },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: BLUE,
  },

  scrollView: { backgroundColor: CREAM },
  scroll: { padding: 16, gap: 16 },

  /* Section */
  section: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2D9CF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.82)", fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 15 },
  fulfillmentBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, flexShrink: 0,
  },
  fulfillmentText: { fontSize: 9, color: "rgba(255,255,255,0.9)", fontFamily: "Inter_600SemiBold" },

  productGrid: {
    flexDirection: "row", flexWrap: "wrap",
    padding: 10, gap: 8, backgroundColor: "#F5F0EA",
  },

  productCard: {
    width: "48%", flexGrow: 1,
    borderRadius: 14, borderWidth: 1, borderColor: "#E2D9CF",
    overflow: "hidden", backgroundColor: "#fff", position: "relative",
  },
  productCardWide: {
    width: "100%",
    flexDirection: "row",
  },

  bestSellerBadge: {
    position: "absolute", top: 8, right: 8, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: GOLD_BG, borderWidth: 1, borderColor: GOLD,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  bestSellerStar: { fontSize: 10, color: GOLD },
  bestSellerText: { fontSize: 10, fontWeight: "700" as const, color: GOLD, fontFamily: "Inter_700Bold" },

  premiumBadge: {
    position: "absolute", top: 8, right: 8, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FBF5E0",
    borderWidth: 1, borderColor: "#C9960C",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumBadgeStar: { fontSize: 9, color: "#9A6F00" },
  premiumBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#9A6F00", fontFamily: "Inter_700Bold", letterSpacing: 0.2 },

  productPhoto: { backgroundColor: "#F0EBE5" },
  productPhotoSquare: { width: "100%", height: 110 },
  productPhotoWide: { width: 110, alignSelf: "stretch" as const, flexShrink: 0 },
  productIconWrap: {
    height: 84, alignItems: "center", justifyContent: "center", position: "relative",
  },
  productIconWrapWide: { width: 88, height: undefined, flexShrink: 0 },
  productEmoji: { fontSize: 36 },
  productEmojiWide: { fontSize: 30 },

  sizePill: {
    position: "absolute", bottom: 6, right: 6,
    backgroundColor: "rgba(0,102,255,0.1)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  sizePillText: { fontSize: 9, fontWeight: "700" as const, color: BLUE, fontFamily: "Inter_700Bold" },

  productBody: { padding: 12, gap: 3, flex: 1 },
  productBodyWide: { justifyContent: "center" },
  productTitle: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold", lineHeight: 17, color: "#1C1C1E" },
  productDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15, color: "#6C6C70" },
  productFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 8, flexWrap: "wrap", gap: 4,
  },
  productPrice: { fontSize: 17, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: BLUE },
  designBtn: { backgroundColor: BLUE, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20 },
  designBtnText: { fontSize: 12, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },

  /* Gift wrapping */
  giftWrapCard: {
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#E2D9CF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, backgroundColor: "#fff",
  },
  giftWrapHeader: { paddingHorizontal: 18, paddingVertical: 12 },
  giftWrapHeaderText: { fontSize: 16, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  giftWrapBody: { padding: 16, gap: 12 },
  giftWrapRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftWrapIconWrap: { width: 50, height: 50, borderRadius: 14, backgroundColor: "#FDE8F1", alignItems: "center", justifyContent: "center" },
  giftWrapEmoji: { fontSize: 26 },
  giftWrapInfo: { flex: 1 },
  giftWrapTitle: { fontSize: 16, fontWeight: "700" as const, color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  giftWrapPrice: { fontSize: 14, fontWeight: "600" as const, color: BLUE, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  giftWrapDesc: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: GOLD_BG, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#F0D98A",
  },
  giftWrapDescText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#5C4A00", lineHeight: 19, flex: 1, fontStyle: "italic" },
  giftWrapHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8E8E93", lineHeight: 17, textAlign: "center" },

  /* Metal tin callout */
  tinCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tinEmoji: { fontSize: 32 },
  tinText: { flex: 1, gap: 3 },
  tinTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#1B5E20",
    fontFamily: "Inter_700Bold",
  },
  tinSub: {
    fontSize: 11,
    color: "#2E7D32",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  /* Quality promise banner */
  promiseBanner: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A3A6B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  promiseGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  promiseFlag: { fontSize: 36 },
  promiseCenter: { flex: 1, gap: 2 },
  promiseHeadline: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  promiseSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  promiseGuaranteeRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "center",
  },
  promiseGuaranteeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promiseGuaranteeTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    lineHeight: 16,
  },
  promiseGuaranteeSub: {
    fontSize: 10,
    color: "#6C6C70",
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
    marginTop: 1,
  },
  promiseDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2D9CF",
  },
});
