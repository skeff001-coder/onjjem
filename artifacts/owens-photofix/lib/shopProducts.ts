export interface ShopVariant {
  sku: string;
  label: string;
  pricePence: number;
}

export interface ShopProduct {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  category: string;
  description: string;
  variants: ShopVariant[];
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "stretched-canvas",
    name: "Stretched Canvas",
    tagline: "Ready to hang",
    emoji: "🖼️",
    category: "Wall Art",
    description:
      "Gallery-quality canvas wrapped around a sturdy wooden frame. Ready to hang straight out of the box with a sawtooth hanger on the back.",
        variants: [
      { sku: "canvas-stretched-a5", label: "A5", pricePence: 2700 },
      { sku: "canvas-stretched-a4", label: "A4", pricePence: 2900 },
      { sku: "canvas-stretched-a3", label: "A3", pricePence: 3600 },
      { sku: "canvas-stretched-a2", label: "A2", pricePence: 5100 },
      { sku: "canvas-stretched-a1", label: "A1", pricePence: 7200 },
      { sku: "canvas-stretched-a0", label: "A0", pricePence: 9600 },
    ],

  },
  {
    id: "eco-canvas",
    name: "Eco Canvas",
    tagline: "Eco-friendly & vibrant",
    emoji: "🌿",
    category: "Wall Art",
    description:
      "Environmentally friendly canvas on recycled materials. Beautiful colour reproduction, lighter on the planet — arrived stretched on a wooden frame.",
    variants: [
      { sku: "eco-canvas-8x8",   label: '8"×8"',   pricePence: 2799 },
      { sku: "eco-canvas-8x12",  label: '8"×12"',  pricePence: 2999 },
      { sku: "eco-canvas-12x12", label: '12"×12"', pricePence: 3399 },
      { sku: "eco-canvas-12x18", label: '12"×18"', pricePence: 4599 },
      { sku: "eco-canvas-16x16", label: '16"×16"', pricePence: 4199 },
      { sku: "eco-canvas-16x24", label: '16"×24"', pricePence: 5999 },
    ],
  },
  {
    id: "box-frame",
    name: "Box Frame",
    tagline: "Deep-set shadow box",
    emoji: "🖼",
    category: "Wall Art",
    description:
      "Elegant black deep-set shadow box frame. Your photo is printed and mounted behind glass, ready to hang — a timeless presentation for any room.",
    variants: [
      { sku: "box-frame-5x7",   label: '5"×7"',   pricePence: 2999 },
      { sku: "box-frame-6x8",   label: '6"×8"',   pricePence: 3399 },
      { sku: "box-frame-11x14", label: '11"×14"', pricePence: 5399 },
      { sku: "box-frame-12x16", label: '12"×16"', pricePence: 5999 },
      { sku: "box-frame-16x20", label: '16"×20"', pricePence: 7999 },
    ],
  },
  {
    id: "photo-tile",
    name: "Framed Photo Tile",
    tagline: "Wall-mounted framed print",
    emoji: "📸",
    category: "Wall Art",
    description:
      "A beautiful framed photo tile in matte black. Lightweight and designed for wall mounting — a stylish way to display your restored memories.",
    variants: [
      { sku: "photo-tile-5x7",  label: '5"×7"',  pricePence: 2099 },
      { sku: "photo-tile-8x8",  label: '8"×8"',  pricePence: 2699 },
      { sku: "photo-tile-8x10", label: '8"×10"', pricePence: 3399 },
    ],
  },
  {
    id: "photo-mug",
    name: "Photo Mug",
    tagline: "Dishwasher-safe ceramic",
    emoji: "☕",
    category: "Kitchen",
    description:
      "Your favourite photo printed on a high-quality dishwasher-safe ceramic mug. A thoughtful, everyday gift that brings a smile every morning.",
    variants: [
      { sku: "mug-11oz", label: "11oz Mug",       pricePence: 1599 },
      { sku: "mug-15oz", label: "15oz Large Mug", pricePence: 2099 },
    ],
  },
  {
    id: "jigsaw-puzzles",
    name: "Jigsaw Puzzle",
    tagline: "Your photo in a metal tin",
    emoji: "🧩",
    category: "Gifts",
    description:
      "Your restored photo printed across every piece of a premium jigsaw puzzle. Comes in a beautiful metal presentation tin with the photo on the lid.",
    variants: [
      { sku: "jigsaw-252",  label: "252 pieces (375×285mm)", pricePence: 2699 },
      { sku: "jigsaw-500",  label: "500 pieces (530×390mm)", pricePence: 3099 },
      { sku: "jigsaw-1000", label: "1000 pieces (765×525mm)", pricePence: 4099 },
    ],
  },
  {
    id: "playing-cards",
    name: "Playing Cards",
    tagline: "Your photo on every card",
    emoji: "🃏",
    category: "Gifts",
    description:
      "A full standard deck of 54 playing cards with your restored photo printed on the back of every single card. A unique conversation piece.",
    variants: [
      { sku: "playing-cards", label: "Full deck (54 cards)", pricePence: 1995 },
    ],
  },
  {
    id: "wooden-coasters",
    name: "Photo Coasters",
    tagline: "High-gloss MDF with cork base",
    emoji: "🍵",
    category: "Kitchen",
    description:
      "Custom photo coasters made from 4mm MDF with a high-gloss finish and protective cork underside. Order as a set — a brilliant personalised housewarming gift.",
    variants: [
      { sku: "coaster-1pk", label: "Single coaster", pricePence: 1299 },
      { sku: "coaster-2pk", label: "Set of 2",       pricePence: 1599 },
      { sku: "coaster-4pk", label: "Set of 4",       pricePence: 2499 },
      { sku: "coaster-6pk", label: "Set of 6",       pricePence: 3499 },
    ],
  },
  {
    id: "photo-magnets",
    name: "Photo Magnets",
    tagline: "Bright fridge magnets",
    emoji: "🧲",
    category: "Magnets",
    description:
      "Turn your restored photo into a fridge magnet. Bright, crisp printing on durable magnetic stock — perfect for the kitchen or as a little gift.",
    variants: [
      { sku: "magnet-fridge-3x2",  label: '3"×2" Fridge Magnet',  pricePence:  699 },
      { sku: "magnet-fridge-6x4",  label: '6"×4" Fridge Magnet',  pricePence:  899 },
      { sku: "magnet-square-4x4",  label: '4"×4" Square Magnet',  pricePence: 1299 },
      { sku: "magnet-square-6x6",  label: '6"×6" Square Magnet',  pricePence: 1699 },
    ],
  },
  {
    id: "glow-poster",
    name: "Glow-in-the-Dark Poster",
    tagline: "Charges in light, glows at night",
    emoji: "✨",
    category: "Special",
    description:
      "Your photo printed on a glow-in-the-dark poster that charges under light and glows softly for hours. A magical keepsake for bedrooms and nurseries.",
    variants: [
      { sku: "glow-8x10",  label: '8"×10"',  pricePence: 1399 },
      { sku: "glow-12x16", label: '12"×16"', pricePence: 1699 },
      { sku: "glow-16x20", label: '16"×20"', pricePence: 1999 },
      { sku: "glow-20x24", label: '20"×24"', pricePence: 2599 },
      { sku: "glow-24x32", label: '24"×32"', pricePence: 3499 },
    ],
  },
  {
    id: "tea-towel",
    name: "Tea Towel",
    tagline: "100% cotton, machine washable",
    emoji: "🏠",
    category: "Kitchen",
    description:
      "Custom all-over printed tea towel made from 100% cotton with hemmed edges and a corner hanging tab. Machine washable and fade-resistant.",
    variants: [
      { sku: "tea-towel", label: '18.5"×27.5" Tea Towel', pricePence: 2999 },
    ],
  },
  {
    id: "pet-tags",
    name: "Pet Tags",
    tagline: "Personalised aluminium tag",
    emoji: "🐾",
    category: "Pets",
    description:
      "Personalised aluminium pet tags with your photo or design, dye-sublimated for rich, long-lasting colour. Suitable for dogs and cats — attaches to any collar.",
    variants: [
      { sku: "pet-tag-round", label: "Round (3.2×3.9cm)",      pricePence: 1499 },
      { sku: "pet-tag-bone",  label: "Bone shape (2.8×3.8cm)", pricePence: 1499 },
    ],
  },
];

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function minPrice(product: ShopProduct): number {
  return Math.min(...product.variants.map((v) => v.pricePence));
}

