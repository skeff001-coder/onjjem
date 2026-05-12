import React, { useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SecureCheckoutBadge } from "@/components/SecureCheckoutBadge";
import { ContactExpertsModal } from "@/components/ContactExpertsModal";
import { TrustFooter } from "@/components/TrustFooter";
import { PersonalisationModal, type PersonalisationData } from "@/components/PersonalisationModal";

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
  handmadeInLondon?: boolean;
  freePersonalisation?: boolean;
  heavyItem?: boolean;
  scents?: string[];
  options?: { label: string; choices: string[]; type?: "pills" | "dropdown" }[];
  onjjemSeal?: boolean;
  ukMasterPrinters?: boolean;
  teamPhotoUpload?: boolean;
  getQuote?: boolean;
  quoteType?: "wall" | "window";
  madeToMeasure?: boolean;
  quickBuy?: boolean;
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
        id: "photo_print",
        title: "Standard Photo Print",
        size: "7×5 inch",
        desc: "Professional gloss finish",
        price: "£24.99",
        emoji: "📷",
        iconBg: "#EEF4FF",
      },
      {
        id: "poster",
        title: "A4 Photo Poster",
        size: "A4",
        desc: "High quality gallery paper",
        price: "£24.99",
        emoji: "📜",
        iconBg: "#E8F4FF",
      },
      {
        id: "canvas_classic",
        title: "Classic Gallery Wrap Canvas",
        size: "30×20 cm",
        desc: "Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame for a stunning gallery wrap finish. A beautiful addition to any wall.",
        price: "£29.99",
        emoji: "🎨",
        iconBg: "#EAF4FF",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
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
      {
        id: "canvas_large",
        title: "Large Gallery Wrap Canvas",
        size: "60×40 cm",
        desc: "Cinema-Grade AI Restoration included. Our most popular canvas size — hand-stretched over a 2.5cm deep FSC-certified wooden frame with a 10-Year Fade-Resistant Guarantee. A true statement piece.",
        price: "£49.99",
        emoji: "🖼️",
        iconBg: "#E3EDFF",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
      },
      {
        id: "canvas_bespoke",
        title: "Bespoke Canvas — Any Size",
        size: "Made to Measure · Any Dimensions",
        desc: "Want an exact size for your wall? Our master printers will produce your canvas at any custom dimensions. Cinema-Grade AI Restoration included. Hand-stretched over a 2.5cm deep FSC-certified wooden frame.\n\nSmall bespoke sizes from £49.99. Larger bespoke sizes (e.g. 90×60 cm) from £225. Tap 'Request a Quote' with your exact width and height for a precise price.",
        price: "from £49.99",
        emoji: "📐",
        iconBg: "#FDF6DC",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        madeToMeasure: true,
        getQuote: true,
        quoteType: "wall" as const,
      },
      {
        id: "heritage_mini_canvas_trio",
        title: "Heritage Mini Canvas Trio",
        size: "Set of 3 · Vertical Display",
        desc: "Three of your precious memories, expertly restored and displayed on a beautiful vertical canvas set. Perfect for a desk or a bedside table.",
        price: "£34.99",
        emoji: "🎨",
        iconBg: "#FDF6DC",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
      },
    ],
  },
  {
    id: "bedroom",
    label: "Luxury Sleep",
    emoji: "🌙",
    subtitle: "Luxury Sleep Collection · Heirloom textiles for your bedroom",
    fulfillment: "ONJJEM Master Textiles · Handcrafted in London",
    headerGradient: ["#2D1B69", "#5B2D9E"] as const,
    products: [
      {
        id: "duvet_set",
        title: "Master Lab Duvet Set",
        size: "All standard UK sizes",
        desc: "Fully reversible with your restored photo on one side and a tonal backing on the other. Choose from crisp 100% cotton or silky-smooth poly-sheeting — both woven to Master Lab specification. Backed by our 5-Year Master Guarantee: if the print fades, we replace it free of charge.",
        price: "£59.00",
        emoji: "🌟",
        iconBg: "#EDE8FF",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        options: [
          { label: "Fabric", choices: ["100% Cotton", "Poly-Sheeting"] },
        ],
      },
      {
        id: "bedside_rug",
        title: "Plush Bedside Rug",
        size: "60×90 cm",
        desc: "Wake up to your most treasured memory every morning. Crafted in ultra-plush velvet with a non-slip latex base. Your restored photo is reproduced in vivid, deep colour — soft underfoot and beautiful to look at.",
        price: "£99",
        emoji: "🏡",
        iconBg: "#EDE0FF",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        heavyItem: true,
      },
      {
        id: "silk_duvet",
        title: "Pure Silk Duvet Cover",
        size: "All standard UK sizes",
        desc: "The ultimate in bedroom luxury. Hand-sewn in London from natural silk satin — renowned for being gentle on skin and hair and naturally temperature-regulating throughout the year. Your restored photo is reproduced in breathtaking clarity across the full face. Backed by our 10-Year Master Guarantee: print, fabric and stitching covered for a decade.",
        price: "£129.00",
        emoji: "✨",
        iconBg: "#F8F0FF",
        wide: true,
        bestSeller: true,
        premiumBadge: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "quilt_single",
        title: "Single Photo Quilt",
        size: "Single — 135×200 cm",
        desc: "Hand-stitched by our London artisans using premium hollowfibre fill and 300-thread-count cotton. Your restored photo printed in stunning detail — delightfully cosy and deeply personal.",
        price: "£135",
        emoji: "🛏️",
        iconBg: "#F5EEFF",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
      },
      {
        id: "quilt_double",
        title: "Double Photo Quilt",
        size: "Double — 200×200 cm",
        desc: "All the craftsmanship of the Single in a generous double size. Perfect for sharing a memory. Hand-stitched by our London artisans with premium comfort and lasting colour.",
        price: "£165",
        emoji: "🛏️",
        iconBg: "#EDE0FF",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
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
        price: "£24.99",
        emoji: "🧲",
        iconBg: "#FFF4E0",
      },
      {
        id: "keyring",
        title: "Photo Keyring",
        desc: "Take your memories everywhere",
        price: "£24.99",
        emoji: "🔑",
        iconBg: "#FFF9E6",
      },
      {
        id: "mug_classic",
        title: "Classic Photo Mug",
        size: "11 oz",
        desc: "Dishwasher safe, vibrant print",
        price: "£29.99",
        emoji: "☕",
        iconBg: "#FFF3E0",
      },
      {
        id: "leather_keyring",
        title: "Handmade Leather Keyring",
        size: "Genuine Nappa Leather",
        desc: "Crafted from buttery-soft Genuine Nappa Leather — the same quality as our designer bags. A beautiful, tactile way to carry your cherished memory with you every day.",
        price: "£34.99",
        emoji: "🔑",
        iconBg: "#EFEBE9",
        wide: true,
        premiumBadge: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
      },
      {
        id: "mug_travel",
        title: "Tall Travel Mug",
        size: "15 oz",
        desc: "Keep memories warm on the go",
        price: "£34.99",
        emoji: "🧋",
        iconBg: "#FFF8F0",
      },
    ],
  },
  {
    id: "heritage_jigsaws",
    label: "Heritage Jigsaws",
    emoji: "🧩",
    subtitle: "Every puzzle ships in a Luxury Presentation Tin · Cinema-Grade AI Restoration included",
    fulfillment: "ONJJEM Master Print Lab · Luxury Presentation Tin included",
    headerGradient: ["#1B3A1B", "#2E7D32"] as const,
    products: [
      // — Specialty Collection —
      {
        id: "jigsaw_heart",
        title: "The Anniversary Heart Jigsaw",
        size: "Specialty Collection · Heart Shaped",
        desc: "A romantic heart-shaped puzzle for your most precious wedding or anniversary memories.",
        price: "£34.99",
        emoji: "❤️",
        iconBg: "#FFF0F0",
        wide: true,
        onjjemSeal: true,
        premiumBadge: true,
      },
      {
        id: "jigsaw_collage",
        title: "The Generations Collage Puzzle",
        size: "Specialty Collection · 500 Pieces",
        desc: "Can't pick just one? Our experts will arrange your favourite restored photos into a stunning 500-piece collage.",
        price: "£29.99",
        emoji: "🖼️",
        iconBg: "#F0F7FF",
        wide: true,
        onjjemSeal: true,
        freePersonalisation: true,
      },
      {
        id: "jigsaw_ceramic",
        title: "The Luxury Ceramic Hexagon",
        size: "Specialty Collection · Ceramic Pieces",
        desc: "Our most unique puzzle. Hand-finished ceramic pieces for a truly unbelievable tactile experience.",
        price: "£89.00",
        emoji: "⬡",
        iconBg: "#FDF6DC",
        wide: true,
        onjjemSeal: true,
        premiumBadge: true,
        handmadeInLondon: true,
      },
      // — Classic Cardboard Collection —
      {
        id: "jigsaw_1000",
        title: "1000 Piece Giant Puzzle",
        size: "Classic Cardboard · Satin-Finish",
        desc: "A true family challenge for those big stadium or heritage shots.",
        price: "£49.99",
        emoji: "🧩",
        iconBg: "#E8F5E9",
        wide: true,
        onjjemSeal: true,
        bestSeller: true,
      },
      {
        id: "jigsaw_500",
        title: "500 Piece Standard Puzzle",
        size: "Classic Cardboard · Satin-Finish",
        desc: "Our most popular size for everyday memories.",
        price: "£39.99",
        emoji: "🧩",
        iconBg: "#F1F8E9",
        wide: true,
        onjjemSeal: true,
      },
      {
        id: "jigsaw_250_card",
        title: "250 Piece Small Puzzle",
        size: "Classic Cardboard · Satin-Finish",
        desc: "Perfect for a quick afternoon of fun.",
        price: "£29.99",
        emoji: "🧩",
        iconBg: "#DCEDC8",
        wide: true,
        onjjemSeal: true,
      },
      // — Premium Heirloom Wooden Collection —
      {
        id: "jigsaw_wood_xl",
        title: "250 Piece X-Large Wooden",
        size: "Premium Wooden · 3mm Luxury Wood",
        desc: "The ultimate heirloom. Hand-cut from luxury wood for a perfect click.",
        price: "£84.99",
        emoji: "🪵",
        iconBg: "#FFF3E0",
        wide: true,
        onjjemSeal: true,
        premiumBadge: true,
        handmadeInLondon: true,
      },
      {
        id: "jigsaw_wood_100",
        title: "100 Piece Premium Wooden",
        size: "Premium Wooden · 3mm Luxury Wood",
        desc: "A thick, durable masterpiece that will last for generations.",
        price: "£64.99",
        emoji: "🪵",
        iconBg: "#FFF8E1",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
      },
      {
        id: "jigsaw_wood_kids",
        title: "30 Piece Kids Wooden",
        size: "Premium Wooden · 3mm Luxury Wood",
        desc: "A sturdy, unbreakable puzzle for the little ones.",
        price: "£29.99",
        emoji: "🧸",
        iconBg: "#FFFDE7",
        wide: true,
        onjjemSeal: true,
      },
    ],
  },
  {
    id: "large_format",
    label: "Feature Walls",
    emoji: "🏛️",
    subtitle: "Life-Sized Feature Walls · Bespoke prints made to fit your room",
    fulfillment: "ONJJEM Master Print Lab · Architectural Tube Shipping",
    headerGradient: ["#1C1A14", "#2E2A1E"] as const,
    products: [
      {
        id: "masterpiece_mural",
        title: "The Masterpiece Wall Mural",
        size: "Any size — made to measure",
        desc: "Turn your entire wall into a high-definition sports stadium or heritage family portrait. Printed on premium, easy-to-hang wallpaper with eco-friendly, fade-resistant inks.\n\nPriced by the square metre — starts at £14.99 for small sections. Click 'Request Custom Size Quote' and share your wall width and height for an exact price.",
        price: "from £14.99 / m²",
        emoji: "🖼️",
        iconBg: "#FDF6DC",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        madeToMeasure: true,
        getQuote: true,
        quoteType: "wall" as const,
      },
      {
        id: "bespoke_mural",
        title: "Bespoke Wall Mural (Custom Sizes to Fit Your Room)",
        size: "Any size — made to measure",
        desc: "The ultimate statement wall. Your restored photo reproduced at life-sized scale using UV-resistant inks on 180gsm satin paper — printed, matched, and hand-trimmed to fit your exact wall. No standard sizes. No compromise.\n\nFinal price depends on your wall dimensions. Click 'Get a Quote' for a master restorer to calculate your exact price.",
        price: "from £149.00",
        emoji: "🏛️",
        iconBg: "#FDF6DC",
        wide: true,
        bestSeller: true,
        premiumBadge: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        getQuote: true,
        quoteType: "wall" as const,
      },
      {
        id: "wallpaper_sample_walls",
        title: "Master Lab Wallpaper Sample",
        size: "Large sample · approx. 62×30 cm",
        desc: "See the stunning detail of our Cinema-Grade AI restoration in person. Printed on the same premium wallpaper we use for our full murals — so you can feel the quality and see the colours before you commit.\n\nIf you decide to order a full mural after receiving your sample, we will credit the £5.00 back to your order!",
        price: "£5.00",
        emoji: "🧾",
        iconBg: "#FDF6DC",
        wide: false,
        quickBuy: true,
        onjjemSeal: true,
      },
      {
        id: "standard_photo_poster",
        title: "Standard Photo Poster",
        size: "A3 · 30×42 cm",
        desc: "A crisp, gallery-quality print of your restored photo — ready to frame and hang in minutes. No quotes, no measurements. Just add to basket.",
        price: "£29.99",
        emoji: "🖼️",
        iconBg: "#FDF6DC",
        bestSeller: true,
        quickBuy: true,
        ukMasterPrinters: true,
      },
      {
        id: "poster_a2",
        title: "A2 Boutique Poster",
        size: "A2 · 42×59 cm",
        desc: "Perfect for framing — a refined, gallery-quality finish.",
        price: "£34.99",
        emoji: "🖼️",
        iconBg: "#FDF6DC",
        bestSeller: true,
      },
      {
        id: "poster_a1",
        title: "A1 Statement Poster",
        size: "A1 · 59×84 cm",
        desc: "A high-impact gallery look that fills the room.",
        price: "£54.99",
        emoji: "📜",
        iconBg: "#FDF6DC",
      },
      {
        id: "poster_a0",
        title: "A0 Giant Poster",
        size: "A0 · 84×119 cm",
        desc: "Our largest standard paper print — truly commanding.",
        price: "£89.99",
        emoji: "📐",
        iconBg: "#FDF6DC",
        wide: true,
      },
      {
        id: "panoramic_150",
        title: "Massive Panoramic Print",
        size: "150 cm wide",
        desc: "Breathtaking wide-angle restoration — walls brought to life.",
        price: "£115.00",
        emoji: "🌅",
        iconBg: "#FDF6DC",
        wide: true,
        premiumBadge: true,
      },
    ],
  },
  {
    id: "wearable",
    label: "Wearable Memories",
    emoji: "👕",
    subtitle: "Cut and sewn by hand in London · 10-year print guarantee",
    fulfillment: "Master London Garments",
    headerGradient: ["#4A0080", "#2D0050"] as const,
    products: [
      {
        id: "tee_kids",
        title: "Personalised Kids Tee",
        size: "Ages 2–12",
        desc: "Perfect for family reunions or gifts — vivid, washable, joyful.",
        price: "£34.99",
        emoji: "🧒",
        iconBg: "#EDE0FF",
        wide: true,
      },
      {
        id: "tee_adult",
        title: "Custom All-Over Print Tee",
        size: "XS–3XL",
        desc: "Your restored photo printed edge-to-edge on soft jersey fabric.",
        price: "£44.99",
        emoji: "👕",
        iconBg: "#F3E8FF",
        wide: true,
        bestSeller: true,
      },
    ],
  },
  {
    id: "little_treasures",
    label: "Little Treasures",
    emoji: "✨",
    subtitle: "Handmade in London · Beautifully gift-boxed keepsakes",
    fulfillment: "Bags of Love · Master Artisans",
    headerGradient: ["#7B4F00", "#4A2D00"] as const,
    products: [
      {
        id: "mouse_mat",
        title: "Photo Mouse Mat",
        size: "6mm thick",
        desc: "Non-slip rubber base with a smooth cloth surface — your memory on your desk, every single day.",
        price: "£19.99",
        emoji: "🖱️",
        iconBg: "#FFFBF0",
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "coasters",
        title: "High-Gloss Coasters",
        size: "Set of 4",
        desc: "Heat-resistant with a solid wooden base. Your restored photo sealed under a mirror-gloss finish.",
        price: "£24.99",
        emoji: "🟫",
        iconBg: "#FDF3E3",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "notebook",
        title: "Handmade Notebook",
        size: "A5",
        desc: "Premium ivory paper interior with a hand-stitched spine. A keepsake that writes as beautifully as it looks.",
        price: "£24.99",
        emoji: "📔",
        iconBg: "#FFF9EE",
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "scented_candle",
        title: "Glass Scented Candle",
        size: "50-hour burn",
        desc: "100% vegan soy wax in a luxury gift box. A personalised memory you can see, smell and treasure.",
        price: "£29.99",
        emoji: "🕯️",
        iconBg: "#FFF8E7",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
    ],
  },
  {
    id: "bargain_memories",
    label: "Bargain",
    emoji: "🏷️",
    subtitle: "Brilliant everyday gifts · Free expert personalisation · Prices exclude shipping",
    fulfillment: "ONJJEM Master Artisans · London Studio",
    headerGradient: ["#C0390B", "#7A1E00"] as const,
    products: [
      {
        id: "fabric_labels",
        title: "Custom Fabric Labels",
        size: "Sheet of 12",
        desc: "Perfect for crafters and hobbyists. Your restored photo woven into iron-on fabric labels — a unique finishing touch for quilts, cushions and handmade gifts.",
        price: "£24.99",
        emoji: "🏷️",
        iconBg: "#FFF3E0",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "memory_stickers",
        title: "Memory Stickers",
        size: "Sheet of 20",
        desc: "Share your restored photos everywhere. Waterproof, UV-resistant vinyl stickers — perfect for laptops, water bottles, journals and scrapbooks.",
        price: "£19.99",
        emoji: "⭐",
        iconBg: "#FFF9E8",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "tea_towel",
        title: "Heritage Tea Towel",
        size: "50×70 cm",
        desc: "A kitchen staple made beautiful. 100% cotton with a vivid dye-sublimation print of your restored photograph — machine washable and colour-fast.",
        price: "£29.99",
        emoji: "🧺",
        iconBg: "#FBF3E8",
        wide: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "face_socks",
        title: "Face Socks",
        size: "One Size",
        desc: "Our most fun way to wear a memory. Soft, stretchy and brilliantly printed — put your favourite face on someone's feet. Perfect gift every time.",
        price: "£29.99",
        emoji: "🧦",
        iconBg: "#FFF8E1",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
    ],
  },
  {
    id: "living_comforts",
    label: "Comforts",
    emoji: "🛋️",
    subtitle: "Ultra-soft fleece throws · Hand-finished in London",
    fulfillment: "ONJJEM Master Artisans · London Studio",
    headerGradient: ["#2D4A2D", "#1B3020"] as const,
    products: [
      {
        id: "throw_small",
        title: "Luxury Photo Throw Blanket",
        size: "100×75cm",
        desc: "Ultra-soft fleece, hand-finished in London. Vibrant, permanent print of your restored memory — perfect draped over the back of your sofa.",
        price: "£54.99",
        emoji: "🛋️",
        iconBg: "#F0F7F0",
        wide: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "throw_medium",
        title: "Luxury Photo Throw Blanket",
        size: "145×106cm",
        desc: "Our most popular size — drapes beautifully over sofas and armchairs. Ultra-soft fleece with a vibrant, permanent photographic print.",
        price: "£74.99",
        emoji: "🛋️",
        iconBg: "#EBF5EB",
        wide: true,
        bestSeller: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "throw_large",
        title: "Luxury Photo Throw Blanket",
        size: "198×145cm",
        desc: "The ultimate statement piece. Generous king-size dimensions for wrapping in warmth — and in memories. Hand-finished by our London artisans.",
        price: "£94.99",
        emoji: "🛋️",
        iconBg: "#E6F0E6",
        wide: true,
        premiumBadge: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "throw_sherpa",
        title: "The Luxury Sherpa Masterpiece",
        size: "198×145cm · Sherpa Reverse",
        desc: "Our most luxurious throw. Features your restored photo on silky smooth fleece with a sumptuously soft woolly Sherpa reverse. Hand-finished in London with a 10-year guarantee.",
        price: "£94.99",
        emoji: "✨",
        iconBg: "#FDF6DC",
        wide: true,
        bestSeller: true,
        premiumBadge: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
    ],
  },
  {
    id: "home_rugs",
    label: "Rugs",
    emoji: "🏡",
    subtitle: "Marbled Velvet · Non-slip latex base · 10-year print guarantee",
    fulfillment: "ONJJEM Master Artisans · London Studio",
    headerGradient: ["#3B2A1A", "#5C3D1E"] as const,
    products: [
      {
        id: "rug_hallway",
        title: "The Hallway Runner",
        size: "180×63cm",
        desc: "Handmade in London using luxurious Marbled Velvet with a non-slip latex base. Every rug is expertly restored and features a 10-year print guarantee. Perfect for high-traffic memories.",
        price: "£145.00",
        emoji: "🏡",
        iconBg: "#FDF5EC",
        wide: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        heavyItem: true,
      },
      {
        id: "rug_square",
        title: "Large Square Rug",
        size: "128×128cm",
        desc: "Handmade in London using luxurious Marbled Velvet with a non-slip latex base. Every rug is expertly restored and features a 10-year print guarantee. Unique modern styling.",
        price: "£155.00",
        emoji: "🏡",
        iconBg: "#F7EDE2",
        wide: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        heavyItem: true,
      },
      {
        id: "rug_classic",
        title: "Classic Area Rug",
        size: "135×105cm",
        desc: "Handmade in London using luxurious Marbled Velvet with a non-slip latex base. Every rug is expertly restored and features a 10-year print guarantee. A beautiful centrepiece for any room.",
        price: "£165.00",
        emoji: "🏡",
        iconBg: "#FBF2E8",
        wide: true,
        bestSeller: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        heavyItem: true,
      },
      {
        id: "rug_statement",
        title: "The Statement Rug",
        size: "128×200cm",
        desc: "Handmade in London using luxurious Marbled Velvet with a non-slip latex base. Every rug is expertly restored and features a 10-year print guarantee. Our largest velvet-finish rug.",
        price: "£195.00",
        emoji: "🏡",
        iconBg: "#F9EFE4",
        wide: true,
        premiumBadge: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        heavyItem: true,
      },
    ],
  },
  {
    id: "car_keepsakes",
    label: "Car Journey",
    emoji: "🚙",
    subtitle: "Car Journey Keepsakes · Your memories on every drive",
    fulfillment: "ONJJEM Master Print Lab · UK Master Printers",
    headerGradient: ["#1A237E", "#283593"] as const,
    products: [
      {
        id: "window_stickers",
        title: "Heritage Car Window Stickers",
        size: "Pack of 4",
        desc: "Pack of 4 high-definition photo stickers, designed to be placed on the inside of your car windows. UV-resistant glass-cling film — wipe-clean, easy to reposition, and simple to remove without leaving any residue.",
        price: "£24.99",
        emoji: "🪟",
        iconBg: "#E3F2FD",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
      {
        id: "air_freshener",
        title: "Personalised Photo Air Freshener",
        size: "Heart · Round · Rectangular",
        desc: "Your restored photo printed on a premium air freshener with a soft elastic cord. Hangs beautifully from any rear-view mirror. Available in three shapes and four luxury scents.",
        price: "£29.99",
        emoji: "🌿",
        iconBg: "#E8F5E9",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
        options: [
          { label: "Shape", choices: ["Heart", "Round", "Rectangular"] },
          { label: "Scent", choices: ["New Car", "Ocean Mist", "Vanilla Dream", "Fresh Linen"], type: "dropdown" as const },
        ],
      },
      {
        id: "sun_visor_strip",
        title: "Photo Sun Visor Strip",
        size: "Universal fit",
        desc: "A custom sun visor strip printed with your cherished restored photo. Durable UV-resistant film fits most car windscreens — vivid colour that won't fade in the sun.",
        price: "£29.99",
        emoji: "☀️",
        iconBg: "#FFF8E1",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
      {
        id: "travel_coffee_mug",
        title: "Travel Coffee Mug",
        size: "Spill-proof lid",
        desc: "Designed to fit perfectly into any standard car cup holder. Your restored photo printed in vivid HD on a durable double-walled mug with a secure, spill-proof lid — your memory on every journey.",
        price: "£24.99",
        emoji: "☕",
        iconBg: "#FFF3E0",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
    ],
  },
  {
    id: "junior_sports",
    label: "Junior Sports",
    emoji: "⚽",
    subtitle: "Junior Champions & Sports · Personalised team keepsakes",
    fulfillment: "ONJJEM Master Print Lab · Handcrafted in London",
    headerGradient: ["#1B5E20", "#2E7D32"] as const,
    products: [
      {
        id: "junior_throw",
        title: "Junior Throw Blanket",
        size: "100×75 cm — Super Soft Fleece",
        desc: "A soft, snuggly fleece throw featuring their local team or sports hero — the perfect bedroom companion for any young champion. " + "Our master restorers will professionally enhance your team's colours to ensure they look sharp and vibrant on every item.",
        price: "£54.99",
        emoji: "🏆",
        iconBg: "#E8F5E9",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        teamPhotoUpload: true,
      },
      {
        id: "sports_duvet",
        title: "Sports Hero Duvet Set",
        size: "All standard UK sizes",
        desc: "Personalised bedding set in vibrant colours that never fade in the wash. Send us your favourite team photo or stadium shot and we'll do the rest. " + "Our master restorers will professionally enhance your team's colours to ensure they look sharp and vibrant on every item.",
        price: "£69.00",
        emoji: "🛏️",
        iconBg: "#F1F8E9",
        wide: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        teamPhotoUpload: true,
      },
      {
        id: "junior_wallpaper_sample",
        title: "Master Lab Wallpaper Sample",
        size: "Large sample · approx. 62×30 cm",
        desc: "See the stunning detail of our Cinema-Grade AI restoration in person before ordering a full room mural. Printed on the same premium wallpaper we use for our stadium murals.\n\nIf you decide to order a full mural after receiving your sample, we will credit the £5.00 back to your order!",
        price: "£5.00",
        emoji: "🧾",
        iconBg: "#E8F5E9",
        wide: false,
        quickBuy: true,
        onjjemSeal: true,
      },
      {
        id: "junior_peel_stick",
        title: "Peel & Stick Team Poster",
        size: "A1 · 59×84 cm",
        desc: "The perfect giant sticker for their bedroom door or wall. Just peel and stick — no frames required! Send us your favourite team photo and our master restorers will sharpen and colour-enhance it to look incredible at poster size.",
        price: "£34.99",
        emoji: "📌",
        iconBg: "#E8F5E9",
        wide: true,
        bestSeller: true,
        quickBuy: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        teamPhotoUpload: true,
      },
      {
        id: "junior_wall_mural",
        title: "Bespoke Wall Mural (Full Room)",
        size: "Any size — made to measure",
        desc: "Our largest project. We create a custom-fit, life-sized stadium or team mural for any wall — printed on premium, easy-to-hang wallpaper with eco-friendly, fade-resistant inks.\n\nFinal price depends on your wall dimensions. Click 'Get a Quote' to send us your wall measurements and a master restorer will calculate your exact price.",
        price: "from £149.00",
        emoji: "🏟️",
        iconBg: "#E8F5E9",
        wide: true,
        premiumBadge: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        madeToMeasure: true,
        getQuote: true,
        quoteType: "wall" as const,
      },
      {
        id: "team_curtains",
        title: "Bespoke Team Curtains",
        size: "Hand-made to your exact window measurements",
        desc: "Send us your favourite team photo or stadium shot — we will restore the colours and create custom-fit blackout curtains for your child's bedroom. Hand-made to your exact window measurements. Blackout lining included as standard. A truly unique statement piece no other family will have.\n\nOur master restorers will professionally enhance your team's colours to ensure they look sharp and vibrant on every item.\n\nFinal price depends on your window dimensions. Click 'Get a Quote' for a master restorer to calculate your exact price.",
        price: "from £125",
        emoji: "🪟",
        iconBg: "#E8F5E9",
        wide: true,
        premiumBadge: true,
        onjjemSeal: true,
        ukMasterPrinters: true,
        handmadeInLondon: true,
        freePersonalisation: true,
        getQuote: true,
        quoteType: "window" as const,
      },
    ],
  },
  {
    id: "grand_presentation",
    label: "Grand Presentation",
    emoji: "🎁",
    subtitle: "Luxury gift wrapping · Hand-printed in London",
    fulfillment: "ONJJEM Master Print Lab · London",
    headerGradient: ["#4A148C", "#7B1FA2"] as const,
    products: [
      {
        id: "photo_ribbon",
        title: "Bespoke Photo Ribbon",
        size: "Per metre · satin finish",
        desc: "Add a touch of elegance with satin-finish ribbon featuring your restored memories. Perfect for gifts and cakes. Each metre is hand-finished to order at the ONJJEM Master Print Lab in London.",
        price: "£14.95 / m",
        emoji: "🎀",
        iconBg: "#F3E5F5",
        bestSeller: true,
        quickBuy: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        freePersonalisation: true,
      },
      {
        id: "heritage_gift_tags",
        title: "Heritage Gift Tags",
        size: "Pack of 20 · double-sided premium card",
        desc: "Double-sided premium tags with your photos and message. Includes luxury hanging chains or ribbon. Each tag is printed on heavyweight card with a satin-gloss finish — the finishing touch that turns a gift into an heirloom.",
        price: "£24.99",
        emoji: "🏷️",
        iconBg: "#EDE7F6",
        wide: true,
        bestSeller: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
      {
        id: "giftwrap_sheet",
        title: "Luxury Personalised Gift Wrap — Single Sheet",
        size: "Single sheet · 140gsm satin-gloss",
        desc: "Don't just give a gift; tell a story before they even open it. Our 140gsm luxury thick paper features your restored photos in a stunning satin-gloss finish. Hand-printed in London.\n\nSave on shipping by adding gift wrap to your Masterpiece order!",
        price: "£14.99",
        emoji: "🎀",
        iconBg: "#F3E5F5",
        bestSeller: true,
        quickBuy: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
      {
        id: "giftwrap_roll",
        title: "Luxury Personalised Gift Wrap — Full Roll",
        size: "Full roll · 140gsm satin-gloss · multiple gifts",
        desc: "Don't just give a gift; tell a story before they even open it. Our 140gsm luxury thick paper features your restored photos in a stunning satin-gloss finish. Hand-printed in London. A full roll gives you enough to wrap multiple gifts with matching paper — perfect for Christmas or a milestone birthday.\n\nSave on shipping by adding gift wrap to your Masterpiece order!",
        price: "£24.99",
        emoji: "🎁",
        iconBg: "#EDE7F6",
        wide: true,
        premiumBadge: true,
        onjjemSeal: true,
        handmadeInLondon: true,
        ukMasterPrinters: true,
        freePersonalisation: true,
      },
    ],
  },
];

const MENU_TABS = ["living", "heritage_jigsaws", "living_comforts", "large_format", "bargain_memories"];

const MASTER_RESTORER_NOTE = "Our master restorers will professionally enhance your team's colours to ensure they look sharp and vibrant on every item.";

const PROMO_CODES: Record<string, { discount: number; minSpend: number }> = {
  EXPERT10: { discount: 10, minSpend: 20 },
};

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[£,]/g, "")) || 0;
}

export default function GiftShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("living");
  const [giftWrap, setGiftWrap] = useState(false);
  const [heritageCardAdded, setHeritageCardAdded] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [personalisingProduct, setPersonalisingProduct] = useState<Product | null>(null);
  const [basketItems, setBasketItems] = useState<{ title: string; price: number }[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "min_spend" | "invalid">("idle");
  const [shipping, setShipping] = useState<"small" | "standard" | "flat">("standard");

  const scrollRef = useRef<ScrollView>(null);
  const [basketConfirm, setBasketConfirm] = useState<{ title: string } | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab)!;

  const basketSubtotal = basketItems.reduce((sum, i) => sum + i.price, 0);
  const giftWrapCost = giftWrap && basketItems.length > 0 ? 4.99 : 0;
  const promoDiscount = promoStatus === "valid" ? 10 : 0;
  const shippingCost = basketItems.length > 0
    ? shipping === "small" ? 4.50 : shipping === "standard" ? 6.99 : 9.50
    : 0;
  const basketTotal = basketSubtotal + giftWrapCost + shippingCost - promoDiscount;

  const handleDesign = (title: string, price: string, scent?: string) => {
    const numPrice = parsePrice(price);
    const itemTitle = scent ? `${title} — ${scent}` : title;
    setBasketItems((prev) => [...prev, { title: itemTitle, price: numPrice }]);
    setBasketConfirm({ title: itemTitle });
  };

  const handlePersonalisationConfirm = (data: PersonalisationData) => {
    if (!personalisingProduct) return;
    const { title, price } = personalisingProduct;
    const numPrice = parsePrice(price);
    setBasketItems((prev) => [...prev, { title, price: numPrice }]);
    setBasketConfirm({ title });
    setPersonalisingProduct(null);
  };

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    const rule = PROMO_CODES[code];
    if (!rule) {
      setPromoStatus("invalid");
      return;
    }
    if (basketSubtotal < rule.minSpend) {
      setPromoStatus("min_spend");
      return;
    }
    setPromoStatus("valid");
  };

  const clearPromo = () => {
    setPromoCode("");
    setPromoStatus("idle");
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Promo announcement banner */}
      <LinearGradient
        colors={["#1C1A14", "#2E2818"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.promoBanner}
      >
        <Ionicons name="sparkles" size={13} color="#F5D78E" />
        <Text style={s.promoBannerText}>
          ⚡ FLASH SALE: <Text style={s.promoBannerBold}>10% OFF</Text> all restored gifts · code:{" "}
          <Text style={s.promoBannerCode}>EXPERT10</Text>
        </Text>
      </LinearGradient>

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
        <TouchableOpacity
          style={s.headerRight}
          activeOpacity={0.7}
          onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <Ionicons name="gift" size={26} color="#FF6B6B" />
          {basketItems.length > 0 && (
            <View style={s.basketCountBadge}>
              <Text style={s.basketCountText}>
                {basketItems.length > 9 ? "9+" : basketItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category tab bar — horizontally scrollable for 4 tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBarScroll}
        contentContainerStyle={s.tabBar}
      >
        {CATEGORIES.filter((cat) => MENU_TABS.includes(cat.id)).map((cat) => {
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
        ref={scrollRef}
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
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.sectionTitle} numberOfLines={1}>{activeCategory.emoji}  {activeCategory.label}</Text>
              <Text style={s.sectionSubtitle} numberOfLines={2}>{activeCategory.subtitle}</Text>
            </View>
            <View style={s.fulfillmentBadge}>
              <Ionicons name="business-outline" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={s.fulfillmentText} numberOfLines={1}>{activeCategory.fulfillment}</Text>
            </View>
          </LinearGradient>

          {/* Heritage Jigsaws LTO banner */}
          {activeTab === "heritage_jigsaws" && (
            <View style={s.jigsawLtoBanner}>
              <LinearGradient
                colors={["#1B3A1B", "#2E7D32", "#1B3A1B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.jigsawLtoGradient}
              >
                <View style={s.jigsawLtoLeft}>
                  <View style={s.jigsawLtoBadge}>
                    <Text style={s.jigsawLtoBadgeText}>LIMITED TIME</Text>
                  </View>
                  <Text style={s.jigsawLtoHeadline}>30% OFF ALL JIGSAWS</Text>
                  <Text style={s.jigsawLtoSub}>
                    Price includes Cinema-Grade AI restoration · Luxury Presentation Tin included
                  </Text>
                </View>
                <Text style={s.jigsawLtoEmoji}>🧩</Text>
              </LinearGradient>
              <View style={s.jigsawTinRow}>
                <Ionicons name="gift-outline" size={14} color="#2E7D32" />
                <Text style={s.jigsawTinText}>
                  Every puzzle ships in a premium metal tin with your photo on the lid — ready to gift
                </Text>
              </View>
            </View>
          )}

          {/* Home & Heritage Rugs callout */}
          {activeTab === "home_rugs" && (
            <View style={s.rugsCallout}>
              <LinearGradient
                colors={["#5C3D1E", "#8B5E2A", "#5C3D1E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.rugsCalloutBar}
              />
              <View style={s.rugsCalloutInner}>
                <View style={s.rugsCalloutIconWrap}>
                  <Text style={{ fontSize: 24 }}>🏡</Text>
                </View>
                <View style={s.rugsCalloutText}>
                  <Text style={s.rugsCalloutTitle}>Marbled Velvet Rugs</Text>
                  <Text style={s.rugsCalloutSub}>
                    Handmade in London using luxurious Marbled Velvet with a non-slip latex base. Your restored photo is woven into the fabric — vivid, deep, and built to last.
                  </Text>
                  <View style={s.rugsCalloutBadgeRow}>
                    <View style={s.rugsCalloutBadge}>
                      <Text style={s.rugsCalloutBadgeFlag}>🇬🇧</Text>
                      <Text style={s.rugsCalloutBadgeText}>Handmade in London</Text>
                    </View>
                    <View style={[s.rugsCalloutBadge, s.rugsCalloutBadgeGold]}>
                      <Ionicons name="shield-checkmark-outline" size={10} color="#8B6200" />
                      <Text style={s.rugsCalloutBadgeText}>10-Year Print Guarantee</Text>
                    </View>
                    <View style={[s.rugsCalloutBadge, s.rugsCalloutBadgeShipping]}>
                      <Ionicons name="cube-outline" size={10} color="#6B3A00" />
                      <Text style={[s.rugsCalloutBadgeText, { color: "#6B3A00" }]}>Heavy Item · UK Tracked £9.50</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Living Room Comforts callout */}
          {activeTab === "living_comforts" && (
            <View style={s.livingComfortsCallout}>
              <LinearGradient
                colors={["#2D4A2D", "#3A5C3A", "#2D4A2D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.livingComfortsBar}
              />
              <View style={s.livingComfortsInner}>
                <View style={s.livingComfortsIconWrap}>
                  <Text style={{ fontSize: 24 }}>🛋️</Text>
                </View>
                <View style={s.livingComfortsText}>
                  <Text style={s.livingComfortsTitle}>Ultra-Soft Fleece Throws</Text>
                  <Text style={s.livingComfortsSub}>
                    Hand-finished by our London artisans using vibrant, permanent dye-sublimation printing. Your restored memory stays vivid wash after wash — and looks stunning on any sofa.
                  </Text>
                  <View style={s.livingComfortsBadgeRow}>
                    <View style={s.livingComfortsBadge}>
                      <Text style={s.livingComfortsBadgeFlag}>🇬🇧</Text>
                      <Text style={s.livingComfortsBadgeText}>Hand-finished in London</Text>
                    </View>
                    <View style={[s.livingComfortsBadge, s.livingComfortsBadgeGold]}>
                      <Ionicons name="water-outline" size={10} color="#15803D" />
                      <Text style={[s.livingComfortsBadgeText, { color: "#15803D" }]}>Machine Washable</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Little Treasures callout */}
          {activeTab === "little_treasures" && (
            <View style={s.littleTreasuresCallout}>
              <LinearGradient
                colors={["#C9960C", "#F5D78E", "#C9960C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.littleTreasuresBar}
              />
              <View style={s.littleTreasuresInner}>
                <View style={s.littleTreasuresBadgeCol}>
                  <View style={s.ltBadge}>
                    <Text style={s.ltBadgeFlag}>🇬🇧</Text>
                    <Text style={s.ltBadgeText}>Handmade in London</Text>
                  </View>
                  <View style={[s.ltBadge, s.ltBadgeFree]}>
                    <Ionicons name="ribbon" size={12} color="#8B6200" />
                    <Text style={s.ltBadgeText}>FREE: Expert Personalisation Included</Text>
                  </View>
                </View>
              </View>
              <View style={s.littleTreasuresDesc}>
                <Text style={s.littleTreasuresDescText}>
                  Every Little Treasures item is individually handmade by London artisans and shipped in premium gift packaging — ready to give, no wrapping needed.
                </Text>
              </View>
            </View>
          )}

          {/* Wearable Memories callout */}
          {activeTab === "wearable" && (
            <View style={s.wearableCallout}>
              <LinearGradient
                colors={["#4A0080", "#7B2FBE", "#4A0080"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.wearableGoldBar}
              />
              <View style={s.wearableInner}>
                <View style={s.wearableIconWrap}>
                  <Text style={s.wearableIconEmoji}>✂️</Text>
                </View>
                <View style={s.wearableText}>
                  <Text style={s.wearableTitle}>Cut & Sewn by Hand in London</Text>
                  <Text style={s.wearableDesc}>
                    Every garment is individually cut and sewn by our London artisans, then printed using fade-proof inks. Backed by our 10-year print guarantee — your memories stay vivid wash after wash.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Junior Champions & Sports callout */}
          {activeTab === "grand_presentation" && (
            <View style={s.giftCallout}>
              <LinearGradient
                colors={["#4A148C", "#7B1FA2", "#4A148C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.giftCalloutBar}
              />
              <View style={s.giftCalloutInner}>
                <View style={s.giftCalloutIconWrap}>
                  <Text style={{ fontSize: 28 }}>🎁</Text>
                </View>
                <View style={s.giftCalloutText}>
                  <Text style={s.giftCalloutTitle}>The Complete Gift Experience</Text>
                  <Text style={s.giftCalloutDesc}>
                    Create the ultimate gift with our matching wrapping paper, ribbon, and tags — all featuring your restored masterpiece.
                  </Text>
                  <View style={s.giftCalloutBadgeRow}>
                    <View style={s.giftBadge}>
                      <Text style={{ fontSize: 10 }}>🎀</Text>
                      <Text style={s.giftBadgeText}>Matching Ribbon</Text>
                    </View>
                    <View style={s.giftBadge}>
                      <Text style={{ fontSize: 10 }}>🏷️</Text>
                      <Text style={s.giftBadgeText}>Heritage Tags</Text>
                    </View>
                    <View style={s.giftBadge}>
                      <Ionicons name="cube-outline" size={11} color="#7B1FA2" />
                      <Text style={s.giftBadgeText}>Save on Shipping</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "junior_sports" && (
            <View style={s.sportsCallout}>
              <LinearGradient
                colors={["#1B5E20", "#388E3C", "#1B5E20"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.sportsCalloutBar}
              />
              <View style={s.sportsCalloutInner}>
                <View style={s.sportsCalloutIconWrap}>
                  <Text style={{ fontSize: 30 }}>⚽</Text>
                </View>
                <View style={s.sportsCalloutText}>
                  <Text style={s.sportsCalloutTitle}>Junior Champions & Sports</Text>
                  <Text style={s.sportsCalloutDesc}>
                    Send us your favourite team photo or stadium shot. Our master restorers will professionally enhance your team's colours to ensure they look sharp and vibrant on every item.
                  </Text>
                  <View style={s.sportsCalloutBadgeRow}>
                    <View style={s.sportsBadge}>
                      <Ionicons name="ribbon" size={11} color={GOLD} />
                      <Text style={s.sportsBadgeText}>Certified ONJJEM Quality Seal</Text>
                    </View>
                    <View style={s.sportsBadge}>
                      <Text style={s.sportsBadgeFlag}>🇬🇧</Text>
                      <Text style={s.sportsBadgeText}>Handcrafted in London</Text>
                    </View>
                    <View style={s.sportsBadge}>
                      <Ionicons name="cloud-upload-outline" size={11} color="#1B5E20" />
                      <Text style={s.sportsBadgeText}>Upload Your Team Photo</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Luxury Sleep callout */}
          {activeTab === "bedroom" && (
            <View style={s.luxurySleepCallout}>
              <LinearGradient
                colors={["#2D1B69", "#6B3FA0", "#2D1B69"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.luxurySleepBar}
              />
              <View style={s.luxurySleepInner}>
                <View style={s.luxurySleepIconWrap}>
                  <Text style={{ fontSize: 30 }}>🌙</Text>
                </View>
                <View style={s.luxurySleepText}>
                  <Text style={s.luxurySleepTitle}>The Luxury Sleep Collection</Text>
                  <Text style={s.luxurySleepDesc}>
                    Heirloom-quality quilts, pillowcases and rugs — each one hand-finished by our London textile artisans. Your restored photo is woven into every thread of your bedroom story.
                  </Text>
                  <View style={s.luxurySleepBadgeRow}>
                    <View style={s.luxurySealBadge}>
                      <Ionicons name="ribbon" size={11} color={GOLD} />
                      <Text style={s.luxurySealText}>Certified ONJJEM Quality Seal</Text>
                    </View>
                    <View style={s.luxurySealBadge}>
                      <Text style={s.luxurySealFlag}>🇬🇧</Text>
                      <Text style={s.luxurySealText}>Handcrafted in London</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Car keepsakes callout */}
          {activeTab === "car_keepsakes" && (
            <View style={s.carCallout}>
              <LinearGradient
                colors={["#1A237E", "#3949AB", "#1A237E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.carCalloutBar}
              />
              <View style={s.carCalloutInner}>
                <View style={s.carCalloutIconWrap}>
                  <Text style={{ fontSize: 28 }}>🚗</Text>
                </View>
                <View style={s.carCalloutText}>
                  <Text style={s.carCalloutTitle}>Your Memories on the Road</Text>
                  <Text style={s.carCalloutDesc}>
                    Every Car Keepsake is printed using UV-resistant, weatherproof inks — built to last in all British weather. Dispatched from the ONJJEM Master Print Lab.
                  </Text>
                  <View style={s.carSealRow}>
                    <View style={s.carSealBadge}>
                      <Ionicons name="ribbon" size={11} color={GOLD} />
                      <Text style={s.carSealText}>Certified ONJJEM Quality Seal</Text>
                    </View>
                    <View style={s.carSealBadge}>
                      <Ionicons name="flag" size={11} color="#C0390B" />
                      <Text style={s.carSealText}>UK Master Printers</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "large_format" && (
            <View style={s.largeFormatCallout}>
              <LinearGradient
                colors={["#C9960C", "#F5D78E", "#C9960C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.largeFormatGoldBar}
              />
              <View style={s.largeFormatInner}>
                <View style={s.largeFormatIconWrap}>
                  <Text style={s.largeFormatIconEmoji}>🏛️</Text>
                </View>
                <View style={s.largeFormatText}>
                  <Text style={s.largeFormatTitle}>Museum-Grade Production</Text>
                  <Text style={s.largeFormatDesc}>
                    All our large-format prints are created using UV-resistant inks on professional 180gsm satin paper. Every order is expertly restored and shipped in heavy-duty architectural tubes to ensure a flawless arrival.
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={s.productGrid}>
            {activeCategory.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={(scent) => {
                  if (product.freePersonalisation) {
                    setPersonalisingProduct(product);
                  } else {
                    handleDesign(product.title, product.price, scent);
                  }
                }}
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
                  Your item will be beautifully hand wrapped in premium paper with a personalised ribbon and a handwritten gift note.
                </Text>
              </View>
            ) : (
              <Text style={s.giftWrapHint}>
                Toggle on to add a beautiful hand-wrapped finish to your order.
              </Text>
            )}
          </View>
        </View>

        {/* Heritage Card upsell — shown only when basket has items */}
        {basketItems.length > 0 && (
          <View style={s.heritageCardUpsell}>
            <LinearGradient
              colors={["#2D1B4E", "#4A2C7A", "#2D1B4E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.heritageCardUpsellBar}
            />
            <View style={s.heritageCardUpsellInner}>
              <View style={s.heritageCardUpsellIconWrap}>
                <Text style={{ fontSize: 26 }}>💌</Text>
              </View>
              <View style={s.heritageCardUpsellBody}>
                <View style={s.heritageCardUpsellTitleRow}>
                  <Text style={s.heritageCardUpsellTitle}>ONJJEM Heritage Card</Text>
                  <Text style={s.heritageCardUpsellPrice}>£6.95</Text>
                </View>
                <Text style={s.heritageCardUpsellDesc}>
                  A premium 350gsm card featuring your restored masterpiece. Left blank inside for your own personal message. Includes a luxury handmade envelope.
                </Text>
                <TouchableOpacity
                  style={[
                    s.heritageCardUpsellBtn,
                    heritageCardAdded && s.heritageCardUpsellBtnDone,
                  ]}
                  onPress={() => {
                    if (!heritageCardAdded) {
                      setHeritageCardAdded(true);
                      setBasketItems((prev) => [...prev, { title: "ONJJEM Heritage Card", price: 6.95 }]);
                      setBasketConfirm({ title: "ONJJEM Heritage Card" });
                    }
                  }}
                  activeOpacity={0.85}
                >
                  {heritageCardAdded ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={s.heritageCardUpsellBtnText}>Added to Basket</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={s.heritageCardUpsellBtnText}>Add Heritage Card — £6.95</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Discount code section */}
        <View style={s.promoCard}>
          <LinearGradient
            colors={["#1C1A14", "#2E2818"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.promoHeader}
          >
            <Ionicons name="pricetag" size={15} color="#F5D78E" />
            <Text style={s.promoHeaderText}>Discount Code</Text>
            {basketItems.length > 0 && (
              <View style={s.basketBadge}>
                <Text style={s.basketBadgeText}>
                  Basket: £{basketSubtotal.toFixed(2)}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={s.promoBody}>
            {promoStatus === "valid" ? (
              <View style={s.promoSuccess}>
                <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                <View style={s.promoSuccessText}>
                  <Text style={s.promoSuccessTitle}>£10 discount applied!</Text>
                  <Text style={s.promoSuccessSub}>
                    Code EXPERT10 · saving £10.00 on your order
                  </Text>
                </View>
                <TouchableOpacity onPress={clearPromo} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={s.promoInputRow}>
                  <TextInput
                    style={s.promoInput}
                    value={promoCode}
                    onChangeText={(t) => { setPromoCode(t.toUpperCase()); setPromoStatus("idle"); }}
                    placeholder="Enter code e.g. EXPERT10"
                    placeholderTextColor="#B0A898"
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={applyPromo}
                  />
                  <TouchableOpacity
                    style={[s.promoApplyBtn, !promoCode.trim() && s.promoApplyBtnDisabled]}
                    onPress={applyPromo}
                    disabled={!promoCode.trim()}
                    activeOpacity={0.82}
                  >
                    <Text style={s.promoApplyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>

                {promoStatus === "min_spend" && (
                  <View style={s.promoMessage}>
                    <Ionicons name="information-circle" size={17} color="#FF9F0A" />
                    <Text style={s.promoMessageText}>
                      This offer is available on all orders over £20. Add a few more memories to your basket to claim your discount!
                    </Text>
                  </View>
                )}

                {promoStatus === "invalid" && (
                  <View style={[s.promoMessage, s.promoMessageError]}>
                    <Ionicons name="close-circle" size={17} color="#FF3B30" />
                    <Text style={[s.promoMessageText, { color: "#FF3B30" }]}>
                      That code doesn't look right. Please check and try again.
                    </Text>
                  </View>
                )}

                {promoStatus === "idle" && (
                  <Text style={s.promoHint}>
                    New customers get £10 off orders over £20 with code EXPERT10
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Shipping selector */}
        <View style={s.shippingCard}>
          <LinearGradient
            colors={["#0A2040", "#1A3A6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.shippingCardHeader}
          >
            <Ionicons name="airplane" size={15} color="#93C5FD" />
            <Text style={s.shippingCardHeaderText}>Delivery & Shipping</Text>
          </LinearGradient>

          <View style={s.shippingCardBody}>
            {/* Small Item Tracked */}
            <TouchableOpacity
              style={[s.shippingOption, shipping === "small" && s.shippingOptionActive]}
              onPress={() => setShipping("small")}
              activeOpacity={0.8}
            >
              <View style={[s.shippingRadio, shipping === "small" && s.shippingRadioActive]}>
                {shipping === "small" && <View style={s.shippingRadioDot} />}
              </View>
              <View style={s.shippingOptionBody}>
                <View style={s.shippingOptionRow}>
                  <Text style={s.shippingOptionFlag}>📦</Text>
                  <Text style={[s.shippingOptionLabel, shipping === "small" && s.shippingOptionLabelActive]}>
                    Small Item Tracked
                  </Text>
                  <Text style={[s.shippingOptionPrice, shipping === "small" && s.shippingOptionPriceActive]}>
                    £4.50
                  </Text>
                </View>
                <Text style={s.shippingOptionMeta}>Stickers & labels only · 3–5 working days</Text>
              </View>
            </TouchableOpacity>

            <View style={s.shippingDivider} />

            {/* Standard UK Tracked */}
            <TouchableOpacity
              style={[s.shippingOption, shipping === "standard" && s.shippingOptionActive]}
              onPress={() => setShipping("standard")}
              activeOpacity={0.8}
            >
              <View style={[s.shippingRadio, shipping === "standard" && s.shippingRadioActive]}>
                {shipping === "standard" && <View style={s.shippingRadioDot} />}
              </View>
              <View style={s.shippingOptionBody}>
                <View style={s.shippingOptionRow}>
                  <Text style={s.shippingOptionFlag}>🇬🇧</Text>
                  <Text style={[s.shippingOptionLabel, shipping === "standard" && s.shippingOptionLabelActive]}>
                    Standard UK Tracked
                  </Text>
                  <Text style={[s.shippingOptionPrice, shipping === "standard" && s.shippingOptionPriceActive]}>
                    £6.99
                  </Text>
                </View>
                <Text style={s.shippingOptionMeta}>Air fresheners, keyrings & mugs · 5–7 working days</Text>
              </View>
            </TouchableOpacity>

            <View style={s.shippingDivider} />

            {/* Master Lab Flat Rate */}
            <TouchableOpacity
              style={[s.shippingOption, shipping === "flat" && s.shippingOptionActive]}
              onPress={() => setShipping("flat")}
              activeOpacity={0.8}
            >
              <View style={[s.shippingRadio, shipping === "flat" && s.shippingRadioActive]}>
                {shipping === "flat" && <View style={s.shippingRadioDot} />}
              </View>
              <View style={s.shippingOptionBody}>
                <View style={s.shippingOptionRow}>
                  <Text style={s.shippingOptionFlag}>🇬🇧</Text>
                  <Text style={[s.shippingOptionLabel, shipping === "flat" && s.shippingOptionLabelActive]}>
                    Master Lab Flat Rate
                  </Text>
                  <Text style={[s.shippingOptionPrice, shipping === "flat" && s.shippingOptionPriceActive]}>
                    £9.50
                  </Text>
                </View>
                <View style={s.shippingFlatRow}>
                  <View style={s.shippingBestValueBadge}>
                    <Text style={s.shippingBestValueText}>BEST VALUE</Text>
                  </View>
                  <Text style={s.shippingOptionMeta}>Any number of items incl. Quilts & Rugs</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Packaging note */}
            <View style={s.shippingNote}>
              <Ionicons name="cube-outline" size={13} color="#3B82F6" />
              <Text style={s.shippingNoteText}>
                Every order is dispatched in premium protective packaging — safe, secure and beautifully presented.
              </Text>
            </View>
          </View>
        </View>

        {/* Restoration buffer note */}
        <View style={s.bufferNote}>
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.bufferNoteBar}
          />
          <View style={s.bufferNoteInner}>
            <View style={s.bufferNoteIconWrap}>
              <Ionicons name="color-wand" size={18} color={GOLD} />
            </View>
            <View style={s.bufferNoteText}>
              <Text style={s.bufferNoteTitle}>2-Day Master Restoration Period</Text>
              <Text style={s.bufferNoteDesc}>
                All orders include a complimentary 2-day restoration period where our expert artisans personally enhance your photo before it is sent to our London printers — ensuring a truly museum-quality result.
              </Text>
            </View>
          </View>
        </View>

        {/* Place Order button — only shown when basket has items */}
        {basketItems.length > 0 && (
          <TouchableOpacity
            style={s.placeOrderBtn}
            onPress={() => {
              const orderNumber = `OJ-${Math.floor(1000 + Math.random() * 9000)}`;
              router.push({
                pathname: "/success",
                params: {
                  orderNumber,
                  items: JSON.stringify(basketItems),
                  total: basketTotal.toFixed(2),
                },
              });
            }}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[GOLD, "#A67C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.placeOrderGradient}
            >
              <Ionicons name="bag-check-outline" size={22} color="#fff" />
              <View style={s.placeOrderTextWrap}>
                <Text style={s.placeOrderBtnText}>Place Order</Text>
                <Text style={s.placeOrderBtnSub}>
                  {basketItems.length} item{basketItems.length !== 1 ? "s" : ""} · £{basketTotal.toFixed(2)} total
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Contact our experts button */}
        <TouchableOpacity
          style={s.contactBtn}
          onPress={() => setContactVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={s.contactBtnText}>Contact Our Experts</Text>
        </TouchableOpacity>

        {/* Secure checkout badge */}
        <View style={s.secureBadgeWrapper}>
          <SecureCheckoutBadge />
        </View>

        <TrustFooter />
      </ScrollView>

      <ContactExpertsModal visible={contactVisible} onClose={() => setContactVisible(false)} />
      <PersonalisationModal
        visible={personalisingProduct !== null}
        productTitle={personalisingProduct?.title ?? ""}
        productPrice={personalisingProduct?.price ?? ""}
        onClose={() => setPersonalisingProduct(null)}
        onConfirm={handlePersonalisationConfirm}
      />

      {/* Basket confirmation modal */}
      <Modal
        visible={basketConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setBasketConfirm(null)}
      >
        <View style={s.confirmOverlay}>
          <View style={s.confirmBox}>
            <View style={s.confirmIconRing}>
              <Ionicons name="bag-check" size={28} color={GOLD} />
            </View>
            <Text style={s.confirmTitle}>Successfully Added to your{"\n"}ONJJEM Basket!</Text>
            {basketConfirm?.title ? (
              <Text style={s.confirmItem} numberOfLines={2}>{basketConfirm.title}</Text>
            ) : null}
            <View style={s.confirmBtns}>
              <TouchableOpacity
                style={s.confirmBtnPrimary}
                activeOpacity={0.85}
                onPress={() => {
                  setBasketConfirm(null);
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
              >
                <Ionicons name="bag-handle" size={15} color="#fff" />
                <Text style={s.confirmBtnPrimaryText}>View Basket</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtnSecondary}
                activeOpacity={0.8}
                onPress={() => setBasketConfirm(null)}
              >
                <Text style={s.confirmBtnSecondaryText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BadgeRow({ product }: { product: Product }) {
  if (!product.handmadeInLondon && !product.freePersonalisation && !product.heavyItem && !product.onjjemSeal && !product.ukMasterPrinters) return null;
  return (
    <View style={s.productGoldBadgeRow}>
      {product.handmadeInLondon && (
        <View style={s.productGoldBadge}>
          <Text style={s.productGoldBadgeFlag}>🇬🇧</Text>
          <Text style={s.productGoldBadgeText}>Handmade in London</Text>
        </View>
      )}
      {product.freePersonalisation && (
        <View style={[s.productGoldBadge, s.productGoldBadgeFree]}>
          <Ionicons name="ribbon-outline" size={10} color="#8B6200" />
          <Text style={s.productGoldBadgeText}>FREE: Expert Personalisation</Text>
        </View>
      )}
      {product.onjjemSeal && (
        <View style={s.onjjemSealBadge}>
          <Ionicons name="ribbon" size={10} color="#7A5A00" />
          <Text style={s.onjjemSealBadgeText}>Certified ONJJEM Quality Seal</Text>
        </View>
      )}
      {product.ukMasterPrinters && (
        <View style={s.ukMasterBadge}>
          <Text style={s.ukMasterBadgeFlag}>🇬🇧</Text>
          <Text style={s.ukMasterBadgeText}>Finished by UK Master Printers</Text>
        </View>
      )}
      {product.heavyItem && (
        <View style={s.productHeavyBadge}>
          <Ionicons name="cube-outline" size={10} color="#6B3A00" />
          <Text style={s.productHeavyBadgeText}>Heavy Item · UK Tracked £9.50</Text>
        </View>
      )}
    </View>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: (summary?: string) => void }) {
  const isWide = product.wide && !product.photo;

  const allOptions = [
    ...(product.options ?? []),
    ...(product.scents ? [{ label: "Scent", choices: product.scents, type: undefined as ("pills" | "dropdown" | undefined) }] : []),
  ];

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    Object.fromEntries(allOptions.map((opt) => [opt.label, opt.choices[0]]))
  );
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [teamPhotoUri, setTeamPhotoUri] = useState<string | null>(null);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [quoteWidth, setQuoteWidth] = useState("");
  const [quoteHeight, setQuoteHeight] = useState("");
  const [quotePhotoUri, setQuotePhotoUri] = useState<string | null>(null);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const optionSummary = allOptions.length > 0
    ? allOptions.map((opt) => `${opt.label}: ${selectedOptions[opt.label]}`).join(" · ")
    : undefined;

  const fullSummary = [
    optionSummary,
    teamPhotoUri ? "Team Photo: ✓ Uploaded" : null,
  ].filter(Boolean).join(" · ") || undefined;

  async function handleTeamPhotoUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setTeamPhotoUri(result.assets[0].uri);
    }
  }

  async function handleQuotePhotoUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setQuotePhotoUri(result.assets[0].uri);
    }
  }

  const uploadBtn = product.teamPhotoUpload ? (
    <TouchableOpacity
      style={[s.uploadTeamBtn, teamPhotoUri ? s.uploadTeamBtnDone : null]}
      activeOpacity={0.82}
      onPress={handleTeamPhotoUpload}
    >
      <Ionicons
        name={teamPhotoUri ? "checkmark-circle" : "cloud-upload-outline"}
        size={16}
        color={teamPhotoUri ? "#15803D" : "#1B5E20"}
        style={{ marginRight: 6 }}
      />
      <Text style={[s.uploadTeamBtnText, teamPhotoUri ? s.uploadTeamBtnTextDone : null]}>
        {teamPhotoUri ? "Team Photo Uploaded ✓" : "Upload Team Photo"}
      </Text>
    </TouchableOpacity>
  ) : null;

  const dimLabel = product.quoteType === "window" ? "Window" : "Wall";

  const quoteModal = product.getQuote ? (
    <Modal
      visible={quoteModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setQuoteModalVisible(false)}
    >
      <View style={s.quoteOverlay}>
        <View style={s.quoteCard}>
          {!quoteSubmitted ? (
            <>
              <View style={s.quoteCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.quoteCardTitle}>Get a Quote</Text>
                  <Text style={s.quoteCardSub} numberOfLines={2}>{product.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setQuoteModalVisible(false)} style={s.quoteCardClose}>
                  <Ionicons name="close" size={22} color="#7A6E57" />
                </TouchableOpacity>
              </View>
              <Text style={s.quoteNote}>
                Final price depends on your {dimLabel.toLowerCase()} dimensions. A master restorer will calculate your exact price and contact you within 24 hours.
              </Text>
              <Text style={s.quoteFormLabel}>{dimLabel} Width (cm)</Text>
              <TextInput
                style={s.quoteFormInput}
                value={quoteWidth}
                onChangeText={setQuoteWidth}
                placeholder="e.g. 240"
                keyboardType="numeric"
                placeholderTextColor="#B0A898"
              />
              <Text style={s.quoteFormLabel}>{dimLabel} Height (cm)</Text>
              <TextInput
                style={s.quoteFormInput}
                value={quoteHeight}
                onChangeText={setQuoteHeight}
                placeholder="e.g. 280"
                keyboardType="numeric"
                placeholderTextColor="#B0A898"
              />
              <Text style={s.quoteFormLabel}>Upload Your Photo</Text>
              <TouchableOpacity
                style={[s.uploadTeamBtn, quotePhotoUri ? s.uploadTeamBtnDone : null]}
                activeOpacity={0.82}
                onPress={handleQuotePhotoUpload}
              >
                <Ionicons
                  name={quotePhotoUri ? "checkmark-circle" : "cloud-upload-outline"}
                  size={16}
                  color={quotePhotoUri ? "#15803D" : "#1B5E20"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[s.uploadTeamBtnText, quotePhotoUri ? s.uploadTeamBtnTextDone : null]}>
                  {quotePhotoUri ? "Photo Uploaded ✓" : "Upload Your Photo"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quoteSubmitBtn, (!quoteWidth.trim() || !quoteHeight.trim()) && s.quoteSubmitBtnDisabled]}
                activeOpacity={0.82}
                disabled={!quoteWidth.trim() || !quoteHeight.trim()}
                onPress={() => setQuoteSubmitted(true)}
              >
                <Ionicons name="send-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.quoteSubmitBtnText}>Submit Quote Request</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.quoteSuccessWrap}>
              <Ionicons name="checkmark-circle" size={56} color={GOLD} />
              <Text style={s.quoteSuccessTitle}>Quote Request Sent!</Text>
              <Text style={s.quoteSuccessDesc}>
                A master restorer will review your {dimLabel.toLowerCase()} dimensions ({quoteWidth} × {quoteHeight} cm) and be in touch with your exact price within 24 hours.
              </Text>
              <TouchableOpacity
                style={s.quoteSubmitBtn}
                activeOpacity={0.82}
                onPress={() => { setQuoteModalVisible(false); setQuoteSubmitted(false); }}
              >
                <Text style={s.quoteSubmitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  ) : null;

  const footer = (
    <View style={s.productFooter}>
      <Text style={s.productPrice}>{product.price}</Text>
      {product.getQuote ? (
        <TouchableOpacity
          style={s.getQuoteBtn}
          activeOpacity={0.82}
          onPress={() => {
            setQuoteSubmitted(false);
            setQuoteWidth("");
            setQuoteHeight("");
            setQuotePhotoUri(null);
            setQuoteModalVisible(true);
          }}
        >
          <Ionicons name="calculator-outline" size={15} color="#fff" style={{ marginRight: 5 }} />
          <Text style={s.getQuoteBtnText}>Get a Quote</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={s.designBtn}
          activeOpacity={0.82}
          onPress={() => onPress(fullSummary)}
        >
          <Ionicons name="bag-add-outline" size={15} color="#fff" style={{ marginRight: 5 }} />
          <Text style={s.designBtnText}>Add to Basket</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const optionPickers = allOptions.length > 0 ? (
    <View style={s.scentPickerWrap}>
      {allOptions.map((opt) => {
        const isDropdown = opt.type === "dropdown";
        const selected = selectedOptions[opt.label];
        if (isDropdown) {
          return (
            <View key={opt.label}>
              <Text style={s.scentPickerLabel}>{opt.label}:</Text>
              <TouchableOpacity
                style={s.dropdownBtn}
                activeOpacity={0.8}
                onPress={() => setDropdownOpen(opt.label)}
              >
                <Text style={s.dropdownBtnText}>{selected}</Text>
                <Ionicons name="chevron-down" size={14} color="#7A6E57" />
              </TouchableOpacity>
              <Modal
                visible={dropdownOpen === opt.label}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownOpen(null)}
              >
                <TouchableOpacity
                  style={s.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setDropdownOpen(null)}
                >
                  <View style={s.dropdownMenu}>
                    <Text style={s.dropdownMenuTitle}>{opt.label}</Text>
                    {opt.choices.map((choice, idx) => (
                      <TouchableOpacity
                        key={choice}
                        style={[
                          s.dropdownItem,
                          idx < opt.choices.length - 1 && s.dropdownItemBorder,
                          selected === choice && s.dropdownItemActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedOptions((prev) => ({ ...prev, [opt.label]: choice }));
                          setDropdownOpen(null);
                        }}
                      >
                        <Text style={[s.dropdownItemText, selected === choice && s.dropdownItemTextActive]}>
                          {choice}
                        </Text>
                        {selected === choice && (
                          <Ionicons name="checkmark" size={15} color={GOLD} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          );
        }
        return (
          <View key={opt.label}>
            <Text style={s.scentPickerLabel}>{opt.label}:</Text>
            <View style={s.scentRow}>
              {opt.choices.map((choice) => (
                <TouchableOpacity
                  key={choice}
                  style={[s.scentPill, selectedOptions[opt.label] === choice && s.scentPillActive]}
                  onPress={() => setSelectedOptions((prev) => ({ ...prev, [opt.label]: choice }))}
                  activeOpacity={0.75}
                >
                  <Text style={[s.scentPillText, selectedOptions[opt.label] === choice && s.scentPillTextActive]}>
                    {choice}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  ) : null;

  return (
    <>
    <View style={[s.productCard, isWide && s.productCardWide]}>
      {product.bestSeller && (
        <View style={s.bestSellerBadge}>
          <Text style={s.bestSellerStar}>★</Text>
          <Text style={s.bestSellerText}>Best Seller</Text>
        </View>
      )}
      {product.quickBuy && (
        <View style={s.quickBuyBadge}>
          <Text style={s.quickBuyBadgeIcon}>⚡</Text>
          <Text style={s.quickBuyBadgeText}>Quick Buy</Text>
        </View>
      )}
      {product.madeToMeasure && (
        <View style={s.madeToMeasureBadge}>
          <Text style={s.madeToMeasureBadgeStar}>📐</Text>
          <Text style={s.madeToMeasureBadgeText}>Made to Measure</Text>
        </View>
      )}
      {product.premiumBadge && (
        <View style={s.premiumBadge}>
          <Text style={s.premiumBadgeStar}>♦</Text>
          <Text style={s.premiumBadgeText}>Premium Quality</Text>
        </View>
      )}

      {product.photo ? (
        <>
          <Image source={product.photo} style={s.productPhotoFull} resizeMode="contain" />
          <View style={s.productBody}>
            <Text style={s.productTitle} numberOfLines={2}>{product.title}</Text>
            <Text style={s.productDesc}>{product.desc}</Text>
            {optionPickers}
            {uploadBtn}
            {footer}
          </View>
        </>
      ) : isWide ? (
        <>
          <BadgeRow product={product} />
          <View style={s.productWideRow}>
            <View style={[s.productIconWrap, { backgroundColor: product.iconBg }, s.productIconWrapWide]}>
              <Text style={[s.productEmoji, s.productEmojiWide]}>{product.emoji}</Text>
              {product.size && (
                <View style={s.sizePill}>
                  <Text style={s.sizePillText}>{product.size}</Text>
                </View>
              )}
            </View>
            <View style={[s.productBody, s.productBodyWide]}>
              <Text style={s.productTitle} numberOfLines={2}>{product.title}</Text>
              <Text style={s.productDesc}>{product.desc}</Text>
              {optionPickers}
              {uploadBtn}
              {footer}
            </View>
          </View>
        </>
      ) : (
        <>
          <BadgeRow product={product} />
          <View style={[s.productIconWrap, { backgroundColor: product.iconBg }]}>
            <Text style={s.productEmoji}>{product.emoji}</Text>
            {product.size && (
              <View style={s.sizePill}>
                <Text style={s.sizePillText}>{product.size}</Text>
              </View>
            )}
          </View>
          <View style={s.productBody}>
            <Text style={s.productTitle} numberOfLines={2}>{product.title}</Text>
            <Text style={s.productDesc}>{product.desc}</Text>
            {optionPickers}
            {uploadBtn}
            {footer}
          </View>
        </>
      )}
    </View>
    {quoteModal}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  rainbowBar: { height: 4, width: "100%" },

  /* Promo announcement banner */
  promoBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  promoBannerText: {
    fontSize: 12,
    color: "rgba(245,215,142,0.85)",
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    flexShrink: 1,
    lineHeight: 17,
  },
  promoBannerBold: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: "#F5D78E",
  },
  promoBannerCode: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: "#FFE88A",
    letterSpacing: 1.2,
  },

  /* Discount code card */
  heritageCardUpsell: {
    backgroundColor: "#F5F0FF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#9C6FD6",
  },
  heritageCardUpsellBar: { height: 4 },
  heritageCardUpsellInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  heritageCardUpsellIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E9D8FD",
    alignItems: "center",
    justifyContent: "center",
  },
  heritageCardUpsellBody: { flex: 1, gap: 6 },
  heritageCardUpsellTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heritageCardUpsellTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#2D1B4E",
    letterSpacing: 0.2,
    flex: 1,
  },
  heritageCardUpsellPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.3,
  },
  heritageCardUpsellDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5B4280",
    lineHeight: 17,
  },
  heritageCardUpsellBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4A2C7A",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  heritageCardUpsellBtnDone: {
    backgroundColor: "#2E7D32",
  },
  heritageCardUpsellBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },

  promoCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    shadowColor: "#C9960C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  promoHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  promoHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5D78E",
    letterSpacing: 0.5,
  },
  basketBadge: {
    backgroundColor: "rgba(245,215,142,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,215,142,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  basketBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5D78E",
  },

  /* Basket count badge on gift icon */
  basketCountBadge: {
    position: "absolute" as const,
    top: -6,
    right: -6,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FAF7F2",
  },
  basketCountText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 12,
  },

  /* Basket confirmation modal */
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 28,
  },
  confirmBox: {
    width: "100%" as const,
    backgroundColor: "#FFFDF4",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E8D48B",
    padding: 26,
    alignItems: "center" as const,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  confirmIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FDF6DC",
    borderWidth: 2,
    borderColor: "#E8D48B",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1C1A14",
    textAlign: "center" as const,
    lineHeight: 22,
  },
  confirmItem: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#7A6E57",
    textAlign: "center" as const,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  confirmBtns: {
    width: "100%" as const,
    gap: 10,
    marginTop: 4,
  },
  confirmBtnPrimary: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "#1C1A14",
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#F5D78E",
  },
  confirmBtnSecondary: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E8D48B",
    backgroundColor: "#FAF7F2",
  },
  confirmBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#7A5A00",
  },

  /* Dropdown picker */
  dropdownBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 2,
  },
  dropdownBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#1C1A14",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 6,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownMenuTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#7A6E57",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE5",
  },
  dropdownItemActive: {
    backgroundColor: "#FDF6DC",
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1C1A14",
  },
  dropdownItemTextActive: {
    fontFamily: "Inter_700Bold",
    color: "#7A5A00",
  },

  /* Scent picker */
  scentPickerWrap: {
    gap: 8,
    marginBottom: 4,
  },
  scentPickerLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#7A6E57",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  scentRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  scentPill: {
    borderWidth: 1,
    borderColor: "#D1C9BE",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FAF7F2",
  },
  scentPillActive: {
    borderColor: GOLD,
    backgroundColor: "#FDF6DC",
  },
  scentPillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7A6E57",
  },
  scentPillTextActive: {
    color: "#7A5A00",
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },

  /* Get a Quote button */
  getQuoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  getQuoteBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },

  /* Quote modal */
  quoteOverlay: {
    flex: 1,
    backgroundColor: "rgba(28,26,20,0.6)",
    justifyContent: "flex-end",
  },
  quoteCard: {
    backgroundColor: "#FAF7F2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  quoteCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  quoteCardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1C1A14",
    letterSpacing: 0.2,
  },
  quoteCardSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#7A6E57",
    marginTop: 2,
  },
  quoteCardClose: {
    padding: 4,
    marginTop: 2,
  },
  quoteNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#5A4F3C",
    lineHeight: 19,
    backgroundColor: "#FDF6DC",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  quoteFormLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1C1A14",
    marginBottom: -8,
  },
  quoteFormInput: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#D9CFC0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#1C1A14",
  },
  quoteSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  quoteSubmitBtnDisabled: {
    backgroundColor: "#D9CFC0",
  },
  quoteSubmitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.4,
  },
  quoteSuccessWrap: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  quoteSuccessTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#1C1A14",
    textAlign: "center",
  },
  quoteSuccessDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#5A4F3C",
    textAlign: "center",
    lineHeight: 21,
  },

  /* Upload Team Photo button */
  uploadTeamBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    borderStyle: "dashed" as const,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 2,
  },
  uploadTeamBtnDone: {
    backgroundColor: "#F0FFF4",
    borderStyle: "solid" as const,
    borderColor: "#15803D",
  },
  uploadTeamBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1B5E20",
    letterSpacing: 0.2,
  },
  uploadTeamBtnTextDone: {
    color: "#15803D",
  },

  /* Junior Champions & Sports callout */
  giftCallout: {
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CE93D8",
  },
  giftCalloutBar: { height: 4 },
  giftCalloutInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  giftCalloutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E1BEE7",
    alignItems: "center",
    justifyContent: "center",
  },
  giftCalloutText: { flex: 1, gap: 6 },
  giftCalloutTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#4A148C",
    letterSpacing: 0.2,
  },
  giftCalloutDesc: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#6A1B9A",
    lineHeight: 18,
  },
  giftCalloutBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  giftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E1BEE7",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  giftBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#4A148C",
  },

  sportsCallout: {
    backgroundColor: "#F1FDF2",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  sportsCalloutBar: { height: 4 },
  sportsCalloutInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  sportsCalloutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#C8E6C9",
    alignItems: "center",
    justifyContent: "center",
  },
  sportsCalloutText: { flex: 1, gap: 6 },
  sportsCalloutTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1B5E20",
    letterSpacing: 0.2,
  },
  sportsCalloutDesc: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#2E7D32",
    lineHeight: 18,
  },
  sportsCalloutBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  sportsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#C8E6C9",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sportsBadgeText: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    color: "#1B5E20",
  },
  sportsBadgeFlag: { fontSize: 11 },

  /* Luxury Sleep callout */
  luxurySleepCallout: {
    backgroundColor: "#FAF7FF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8C8F0",
  },
  luxurySleepBar: { height: 4 },
  luxurySleepInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  luxurySleepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EDE0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  luxurySleepText: { flex: 1, gap: 6 },
  luxurySleepTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#2D1B69",
    letterSpacing: 0.2,
  },
  luxurySleepDesc: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#5A4080",
    lineHeight: 18,
  },
  luxurySleepBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  luxurySealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EDE0FF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  luxurySealText: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    color: "#4A1080",
  },
  luxurySealFlag: { fontSize: 11 },

  /* Car Keepsakes callout */
  carCallout: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 12,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#C5CAE9",
  },
  carCalloutBar: { height: 4 },
  carCalloutInner: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    padding: 14,
    gap: 12,
  },
  carCalloutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8EAF6",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  carCalloutText: { flex: 1, gap: 6 },
  carCalloutTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1A237E",
  },
  carCalloutDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A4A5A",
    lineHeight: 17,
  },
  carSealRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginTop: 2,
  },
  carSealBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#FDF6DC",
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  carSealText: {
    fontSize: 10,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#7A5A00",
  },
  promoBody: {
    backgroundColor: "#FFFDF7",
    padding: 14,
    gap: 10,
  },
  promoInputRow: {
    flexDirection: "row" as const,
    gap: 10,
    alignItems: "center" as const,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E8D48B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    color: "#1C1A14",
    backgroundColor: "#fff",
    letterSpacing: 1,
  },
  promoApplyBtn: {
    backgroundColor: "#C9960C",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
  },
  promoApplyBtnDisabled: {
    opacity: 0.45,
  },
  promoApplyBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  promoHint: {
    fontSize: 11,
    color: "#7A6E57",
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  promoMessage: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 8,
    backgroundColor: "#FFFBF0",
    borderWidth: 1,
    borderColor: "#FFE0A0",
    borderRadius: 10,
    padding: 12,
  },
  promoMessageError: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFCDD2",
  },
  promoMessageText: {
    flex: 1,
    fontSize: 13,
    color: "#FF9F0A",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  promoSuccess: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 14,
  },
  promoSuccessText: { flex: 1, gap: 2 },
  promoSuccessTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#15803D",
  },
  promoSuccessSub: {
    fontSize: 12,
    color: "#16A34A",
    fontFamily: "Inter_400Regular",
  },

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
    minHeight: 70,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    flexShrink: 1, maxWidth: "45%",
  },
  fulfillmentText: { fontSize: 9, color: "rgba(255,255,255,0.9)", fontFamily: "Inter_600SemiBold", flexShrink: 1 },

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
  },
  productWideRow: {
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

  quickBuyBadge: {
    position: "absolute", top: 8, left: 8, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#1A4D2E",
    borderWidth: 1, borderColor: "#4CAF50",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  quickBuyBadgeIcon: { fontSize: 9 },
  quickBuyBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#81C784", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },

  madeToMeasureBadge: {
    position: "absolute", top: 8, left: 8, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#1C1A14",
    borderWidth: 1, borderColor: "#C9960C",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  madeToMeasureBadgeStar: { fontSize: 9 },
  madeToMeasureBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#C9960C", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },

  premiumBadge: {
    position: "absolute", top: 8, right: 8, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FBF5E0",
    borderWidth: 1, borderColor: "#C9960C",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumBadgeStar: { fontSize: 9, color: "#9A6F00" },
  premiumBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#9A6F00", fontFamily: "Inter_700Bold", letterSpacing: 0.2 },

  /* Gold inline badges — Handmade in London & FREE Personalisation */
  productGoldBadgeRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  productGoldBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productGoldBadgeFree: {
    backgroundColor: "#FFFBF0",
    borderColor: GOLD,
  },
  productHeavyBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFCC80",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productHeavyBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#6B3A00",
    letterSpacing: 0.3,
  },

  /* ONJJEM Seal badge */
  onjjemSealBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#FDF6DC",
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  onjjemSealBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#7A5A00",
    letterSpacing: 0.3,
  },

  /* UK Master Printers badge */
  ukMasterBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ukMasterBadgeFlag: {
    fontSize: 9,
  },
  ukMasterBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#C0390B",
    letterSpacing: 0.3,
  },

  /* Rugs callout */
  rugsCallout: {
    backgroundColor: "#FDF8F2",
    borderRadius: 14,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#DEB887",
    shadowColor: "#5C3D1E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  rugsCalloutBar: { height: 3 },
  rugsCalloutInner: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 14,
    padding: 14,
  },
  rugsCalloutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5E6D3",
    borderWidth: 1,
    borderColor: "#DEB887",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  rugsCalloutText: { flex: 1, gap: 6 },
  rugsCalloutTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#3B2A1A",
  },
  rugsCalloutSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5C3D1E",
    lineHeight: 18,
  },
  rugsCalloutBadgeRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  rugsCalloutBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rugsCalloutBadgeGold: {
    backgroundColor: "#FFFBF0",
    borderColor: GOLD,
  },
  rugsCalloutBadgeShipping: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FFCC80",
  },
  rugsCalloutBadgeFlag: { fontSize: 11 },
  rugsCalloutBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8B6200",
    letterSpacing: 0.3,
  },

  productGoldBadgeFlag: { fontSize: 10 },
  productGoldBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8B6200",
    letterSpacing: 0.3,
  },

  /* Little Treasures callout */
  littleTreasuresCallout: {
    backgroundColor: "#FFFDF7",
    borderRadius: 14,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#E8D48B",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  littleTreasuresBar: { height: 3 },
  littleTreasuresInner: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  littleTreasuresBadgeCol: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  ltBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ltBadgeFree: {
    backgroundColor: "#FFFBF0",
    borderColor: GOLD,
  },
  ltBadgeFlag: { fontSize: 13 },
  ltBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8B6200",
    letterSpacing: 0.3,
  },
  littleTreasuresDesc: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0E8D5",
    marginTop: 8,
  },
  littleTreasuresDescText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7A5C00",
    lineHeight: 18,
    fontStyle: "italic" as const,
  },

  productPhoto: { backgroundColor: "#F0EBE5" },
  productPhotoSquare: { width: "100%", height: 110 },
  productPhotoWide: { width: 110, alignSelf: "stretch" as const, flexShrink: 0 },
  productPhotoFull: {
    width: "100%",
    height: 220,
    backgroundColor: "#F5EDE0",
  },
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

  /* Heritage Jigsaws LTO banner */
  jigsawLtoBanner: {
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
    overflow: "hidden" as const,
  },
  jigsawLtoGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  jigsawLtoLeft: {
    flex: 1,
    gap: 4,
  },
  jigsawLtoBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: "#C9960C",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  jigsawLtoBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  jigsawLtoHeadline: {
    fontSize: 20,
    fontFamily: "BebasNeue_400Regular",
    color: "#fff",
    letterSpacing: 2,
  },
  jigsawLtoSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
  jigsawLtoEmoji: {
    fontSize: 42,
  },
  jigsawTinRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  jigsawTinText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#1B5E20",
    lineHeight: 16,
  },

  /* Metal tin callout (legacy — kept for reference) */
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

  /* Wearable Memories callout */
  wearableCallout: {
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#D8B4FE",
    overflow: "hidden",
  },
  wearableGoldBar: {
    height: 2,
  },
  wearableInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  wearableIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#D8B4FE",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  wearableIconEmoji: { fontSize: 22 },
  wearableText: { flex: 1, gap: 4 },
  wearableTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#2D0050",
  },
  wearableDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#6B21A8",
    lineHeight: 17,
  },

  /* Large format callout */
  largeFormatCallout: {
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#E8D48B",
    overflow: "hidden",
  },
  largeFormatGoldBar: {
    height: 2,
  },
  largeFormatInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  largeFormatIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FDF6DC",
    borderWidth: 1,
    borderColor: "#E8D48B",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  largeFormatIconEmoji: { fontSize: 22 },
  largeFormatText: { flex: 1, gap: 4 },
  largeFormatTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1C1A14",
  },
  largeFormatDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7A6E57",
    lineHeight: 17,
  },

  /* Place Order button */
  placeOrderBtn: {
    borderRadius: 16,
    overflow: "hidden" as const,
    marginBottom: 14,
    shadowColor: "#C9960C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  placeOrderGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  placeOrderTextWrap: {
    flex: 1,
    gap: 2,
  },
  placeOrderBtnText: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  placeOrderBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },

  /* Contact experts button */
  contactBtn: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    marginBottom: 14,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  contactBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },

  /* Secure checkout badge */
  secureBadgeWrapper: {
    marginHorizontal: 4,
    marginBottom: 18,
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

  /* About Our Quality note card */
  qualityNote: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8D48B",
    backgroundColor: "#FFFDF4",
    padding: 16,
    shadowColor: "#C9960C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  qualityNoteHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 7,
    marginBottom: 10,
  },
  qualityNoteHeading: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#7A5A00",
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  },
  qualityNoteDivider: {
    height: 1,
    backgroundColor: "#E8D48B",
    marginBottom: 12,
    opacity: 0.6,
  },
  qualityNoteBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#4A3A1A",
    lineHeight: 20,
    marginBottom: 14,
  },
  qualityNoteSealRow: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  qualityNoteSeal: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "#FDF6DC",
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qualityNoteSealText: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#7A5A00",
  },

  /* Shipping callout */
  /* Shipping selector card */
  shippingCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shippingCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  shippingCardHeaderText: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#93C5FD",
    letterSpacing: 0.5,
  },
  shippingCardBody: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 4,
  },
  shippingOption: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2D9CF",
    padding: 12,
    backgroundColor: "#FAFAF9",
  },
  shippingOptionActive: {
    borderColor: BLUE,
    backgroundColor: "#EFF6FF",
  },
  shippingRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C4BAB0",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
    marginTop: 1,
  },
  shippingRadioActive: { borderColor: BLUE },
  shippingRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: BLUE,
  },
  shippingOptionBody: { flex: 1, gap: 3 },
  shippingOptionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  shippingOptionFlag: { fontSize: 15 },
  shippingOptionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: "#1C1A14",
  },
  shippingOptionLabelActive: { color: "#1D4ED8" },
  shippingOptionPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#7A6E57",
  },
  shippingOptionPriceActive: { color: "#1D4ED8" },
  shippingOptionMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7A6E57",
  },
  shippingDivider: {
    height: 1,
    backgroundColor: "#F0EBE5",
    marginVertical: 4,
  },
  shippingFlatRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    flexWrap: "wrap" as const,
  },
  shippingBestValueBadge: {
    backgroundColor: "#C9960C",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  shippingBestValueText: {
    fontSize: 8,
    fontWeight: "800" as const,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },

  shippingNote: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 7,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  shippingNoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3B82F6",
    lineHeight: 16,
  },

  /* Restoration buffer note */
  bufferNote: {
    borderRadius: 14,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#E8D48B",
    backgroundColor: GOLD_BG,
  },
  bufferNoteBar: { height: 3 },
  bufferNoteInner: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    padding: 14,
  },
  bufferNoteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FDF6DC",
    borderWidth: 1,
    borderColor: "#E8D48B",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  bufferNoteText: { flex: 1, gap: 4 },
  bufferNoteTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#7A5C00",
  },
  bufferNoteDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8B6200",
    lineHeight: 18,
  },

  /* Living Room Comforts callout */
  livingComfortsCallout: {
    backgroundColor: "#F4FAF4",
    borderRadius: 14,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "#B6D9B6",
    shadowColor: "#2D4A2D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  livingComfortsBar: { height: 3 },
  livingComfortsInner: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 14,
    padding: 14,
  },
  livingComfortsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCF0DC",
    borderWidth: 1,
    borderColor: "#B6D9B6",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  livingComfortsText: { flex: 1, gap: 6 },
  livingComfortsTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1B3020",
  },
  livingComfortsSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2D4A2D",
    lineHeight: 18,
  },
  livingComfortsBadgeRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  livingComfortsBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: "#E8D48B",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  livingComfortsBadgeGold: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  livingComfortsBadgeFlag: { fontSize: 11 },
  livingComfortsBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#8B6200",
    letterSpacing: 0.3,
  },

  /* Legacy alias kept so nothing breaks during transition */
  shippingCallout: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 16,
  },
  shippingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#DBEAFE",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  shippingTextWrap: { flex: 1, gap: 4 },
  shippingTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#1D4ED8",
  },
  shippingDesc: {
    fontSize: 12,
    color: "#3B82F6",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
