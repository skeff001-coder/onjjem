/**
 * ONJJEM product catalogue.
 *
 * All prices are in GBP pence and include free UK delivery.
 * Retail prices are set with MINIMUM MARGINS (~20% above cost)
 * to attract initial customers. Prices can be raised gradually
 * once sales momentum builds.
 *
 * Prices verified against Prodigi live API: 2026-06-01.
 *
 * Each variant's `sku` must exactly match a key in the PRODIGI_PRODUCTS map
 * in artifacts/api-server/src/fulfilment/prodigi.ts.
 */

export interface ProductVariant {
  sku: string;
  label: string;
  pricePence: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  variants: ProductVariant[];
}

export const products: Product[] = [
  // ── Wall Art ────────────────────────────────────────────────────────

  {
    id: "stretched-canvas",
    name: "Stretched Canvas",
    description:
      "Gallery-quality canvas wrapped around a sturdy wooden frame. Ready to hang straight out of the box.",
    image: "/products/stretched-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £14.00 + £6.75 ship = £20.75
      { sku: "canvas-stretched-8x10",  label: '8"×10"',  pricePence: 2499 },
      // cost £16.00 + £6.75 ship = £22.75
      { sku: "canvas-stretched-10x12", label: '10"×12"', pricePence: 2799 },
      // cost £20.00 + £6.75 ship = £26.75
      { sku: "canvas-stretched-12x16", label: '12"×16"', pricePence: 3299 },
      // cost £27.00 + £10.75 ship = £37.75
      { sku: "canvas-stretched-16x20", label: '16"×20"', pricePence: 4499 },
      // cost £34.00 + £10.75 ship = £44.75
      { sku: "canvas-stretched-20x24", label: '20"×24"', pricePence: 5299 },
    ],
  },

  {
    id: "eco-canvas",
    name: "Eco Canvas",
    description:
      "Environmentally friendly canvas prints on recycled materials. Beautiful colour reproduction, lighter on the planet.",
    image: "/products/eco-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £7.00 + £6.75 ship = £13.75
      { sku: "eco-canvas-8x8",   label: '8"×8"',   pricePence: 1699 },
      // cost £8.00 + £6.75 ship = £14.75
      { sku: "eco-canvas-8x12",  label: '8"×12"',  pricePence: 1799 },
      // cost £10.00 + £6.75 ship = £16.75
      { sku: "eco-canvas-12x12", label: '12"×12"', pricePence: 1999 },
      // cost £12.00 + £10.75 ship = £22.75
      { sku: "eco-canvas-12x18", label: '12"×18"', pricePence: 2799 },
      // cost £14.00 + £6.75 ship = £20.75
      { sku: "eco-canvas-16x16", label: '16"×16"', pricePence: 2499 },
      // cost £19.00 + £10.75 ship = £29.75
      { sku: "eco-canvas-16x24", label: '16"×24"', pricePence: 3599 },
    ],
  },

  {
    id: "slim-canvas",
    name: "Slim Canvas",
    description:
      "A thinner-profile canvas wrap for a sleek, contemporary look. Perfect for panoramic and portrait shots.",
    image: "/products/slim-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £15.00 + £6.85 ship = £21.85
      { sku: "slim-canvas-8x16",  label: '8"×16"',  pricePence: 2699 },
      // cost £54.00 + £13.45 ship = £67.45
      { sku: "slim-canvas-28x36", label: '28"×36"', pricePence: 7999 },
      // cost £54.00 + £17.80 ship = £71.80
      { sku: "slim-canvas-24x40", label: '24"×40"', pricePence: 8499 },
      // cost £75.00 + £26.45 ship = £101.45
      { sku: "slim-canvas-40x48", label: '40"×48"', pricePence: 11999 },
    ],
  },

  // ── Frames ──────────────────────────────────────────────────────────

  {
    id: "box-frames",
    name: "Box Frames",
    description:
      "Deep, beautiful black box frames that give your photos a striking three-dimensional presence on the wall.",
    image: "/products/box-frames.jpg",
    category: "frames",
    variants: [
      // cost £19.00 + £6.75 ship = £25.75
      { sku: "box-frame-5x7",   label: '5"×7"',   pricePence: 3199 },
      // cost £21.00 + £6.75 ship = £27.75
      { sku: "box-frame-6x8",   label: '6"×8"',   pricePence: 3399 },
      // cost £28.00 + £6.75 ship = £34.75
      { sku: "box-frame-12x12", label: '12"×12"', pricePence: 4199 },
      // cost £30.00 + £6.75 ship = £36.75
      { sku: "box-frame-11x14", label: '11"×14"', pricePence: 4499 },
      // cost £32.00 + £6.75 ship = £38.75
      { sku: "box-frame-12x16", label: '12"×16"', pricePence: 4699 },
      // cost £40.00 + £10.75 ship = £50.75
      { sku: "box-frame-16x20", label: '16"×20"', pricePence: 5999 },
    ],
  },

  {
    id: "framed-photo-tiles",
    name: "Framed Photo Tiles",
    description:
      "Create a stunning gallery wall with these easy-to-hang black-framed tiles. Lightweight and ready to display.",
    image: "/products/framed-photo-tiles-02.webp",
    category: "frames",
    variants: [
      // cost £6.06 + £7.96 ship = £14.02
      { sku: "photo-tile-5x7",  label: '5"×7"',  pricePence: 1799 },
      // cost £7.79 + £7.96 ship = £15.75
      { sku: "photo-tile-8x8",  label: '8"×8"',  pricePence: 1999 },
      // cost £8.65 + £7.96 ship = £16.61
      { sku: "photo-tile-8x10", label: '8"×10"', pricePence: 1999 },
    ],
  },

  // ── Prints ─────────────────────────────────────────────────────────

  {
    id: "eco-rolled-canvas",
    name: "Eco Rolled Canvas",
    description:
      "Unstretched eco-friendly canvas prints, ideal for custom framing or rolling and posting as a gift.",
    image: "/products/eco-rolled-canvas.jpg",
    category: "prints",
    variants: [
      // cost £5.00 + £3.45 ship = £8.45
      { sku: "eco-rolled-10x10", label: '10"×10"', pricePence: 1099 },
      // cost £6.00 + £3.45 ship = £9.45
      { sku: "eco-rolled-12x12", label: '12"×12"', pricePence: 1199 },
      // cost £6.00 + £4.50 ship = £10.50
      { sku: "eco-rolled-12x18", label: '12"×18"', pricePence: 1299 },
      // cost £9.00 + £4.50 ship = £13.50
      { sku: "eco-rolled-16x20", label: '16"×20"', pricePence: 1699 },
      // cost £9.00 + £4.50 ship = £13.50
      { sku: "eco-rolled-18x24", label: '18"×24"', pricePence: 1699 },
    ],
  },

  // ── Gifts ──────────────────────────────────────────────────────────

  {
    id: "jigsaw-puzzles",
    name: "Jigsaw Puzzles",
    description:
      "Your photo printed on a premium jigsaw puzzle and supplied in a beautiful metal presentation tin. The lid also features your photo.",
    image: "/products/jigsaw-puzzles.webp",
    category: "gifts",
    variants: [
      // cost £10.00 + £3.20 ship = £13.20
      { sku: "jigsaw-252", label: "252 pieces (375×285mm)", pricePence: 1699 },
      // cost £12.00 + £3.20 ship = £15.20
      { sku: "jigsaw-500", label: "500 pieces (530×390mm)", pricePence: 1899 },
      // cost £17.00 + £3.20 ship = £20.20
      { sku: "jigsaw-1000", label: "1000 pieces (765×525mm)", pricePence: 2499 },
    ],
  },

  {
    id: "playing-cards",
    name: "Playing Cards",
    description:
      "A full standard deck of playing cards with your photo printed on the back of every card.",
    image: "/products/playing-cards.webp",
    category: "gifts",
    variants: [
      // cost £8.00 + £3.20 ship = £11.20
      { sku: "playing-cards", label: "Standard deck (54 cards)", pricePence: 1499 },
    ],
  },

  // ── Temporary Tattoos ──────────────────────────────────────────────

  {
    id: "temporary-tattoos",
    name: "Temporary Tattoos",
    description:
      "Custom temporary tattoos printed on skin-safe waterslide film. Quick and easy application — lasts up to one week, removes easily with no residue. Personalise with any photo for parties, events, or just for fun.",
    image: "/products/tattoo-arm.webp",
    category: "tattoos",
    variants: [
      // cost £2.95 + £3.20 = £6.15
      { sku: "tattoo-s",   label: "2x3 in (5×7.5cm)",   pricePence: 799 },
      // cost £3.95 + £3.20 = £7.15
      { sku: "tattoo-m",   label: "3x4 in (7.5×10cm)", pricePence: 899 },
      // cost £5.95 + £3.20 = £9.15
      { sku: "tattoo-l",   label: "4x6 in (10×15cm)", pricePence: 1199 },
      // cost £11.95 + £3.20 = £15.15
      { sku: "tattoo-xl",  label: "8x8 in (20×20cm)", pricePence: 1899 },
      // cost £19.95 + £3.20 = £23.15
      { sku: "tattoo-xxl", label: "12x12 in (30×30cm)", pricePence: 2799 },
    ],
  },

  // ── iPad Cases ─────────────────────────────────────────────────────

  {
    id: "ipad-cases",
    name: "iPad Cases",
    description:
      "Vibrant snap-on iPad cases with edge-to-edge photo printing. Hard polycarbonate shell with water-based polyurethane coating for a lasting finish. Protects your device while keeping your memories close.",
    image: "/products/ipad-case.png",
    category: "gifts",
    variants: [
      // cost £15.00 + £3.20 ship = £18.20
      { sku: "ipad-air",    label: "iPad Air (10.9)",       pricePence: 2299 },
      // cost £15.00 + £3.20 ship = £18.20
      { sku: "ipad-2-3-4",  label: "iPad 2 / 3 / 4 (9.7)",  pricePence: 2299 },
    ],
  },

  // ── Pets ───────────────────────────────────────────────────────────

  {
    id: "pet-tags",
    name: "Pet Tags",
    description:
      "Personalised aluminium pet tags with your photo or design, dye-sublimated for rich, long-lasting colour. Suitable for dogs and cats — attaches to any collar.",
    image: "/products/metal-pet-tags.jpg",
    category: "pets",
    variants: [
      // cost £5.00 + £2.25 ship = £7.25
      { sku: "pet-tag-round", label: "Round (3.2×3.9cm)",      pricePence: 999 },
      // cost £5.00 + £2.25 ship = £7.25
      { sku: "pet-tag-bone",  label: "Bone shape (2.8×3.8cm)", pricePence: 999 },
    ],
  },

  // ── Kitchen & Drinkware ────────────────────────────────────────────

  {
    id: "tea-towels",
    name: "Tea Towels",
    description:
      "Custom all-over printed tea towels made from 100% cotton with hemmed edges and a corner hanging tab. Machine washable and fade-resistant.",
    image: "/products/tea-towels.png",
    category: "kitchen",
    variants: [
      // cost £12.00 + £3.00 ship = £15.00
      { sku: "tea-towel", label: "Tea Towel (18.5×27.5\")", pricePence: 1899 },
    ],
  },

  {
    id: "wooden-coasters",
    name: "Wooden Coasters",
    description:
      "Custom photo coasters made from 4mm MDF with a high-gloss finish and protective cork underside. Order individually or as a set.",
    image: "/products/wooden-coasters.png",
    category: "kitchen",
    variants: [
      // cost £4.00 + £2.25 ship = £6.25
      { sku: "coaster-1pk", label: "Single coaster", pricePence: 799 },
      // cost £5.50 + £2.25 ship = £7.75
      { sku: "coaster-2pk", label: "Set of 2",       pricePence: 999 },
      // cost £10.00 + £2.25 ship = £12.25
      { sku: "coaster-4pk", label: "Set of 4",       pricePence: 1499 },
      // cost £15.00 + £2.25 ship = £17.25
      { sku: "coaster-6pk", label: "Set of 6",       pricePence: 2199 },
    ],
  },

  {
    id: "photo-mugs",
    name: "Photo Mugs",
    description:
      "Your favourite photo printed on a dishwasher-safe ceramic mug. A thoughtful, everyday gift.",
    image: "/products/photo-mugs.png",
    category: "kitchen",
    variants: [
      // cost £4.25 + £3.30 ship = £7.55
      { sku: "mug-11oz", label: "11oz Mug",       pricePence: 999 },
      // cost £8.00 + £2.25 ship = £10.25
      { sku: "mug-15oz", label: "15oz Large Mug", pricePence: 1299 },
    ],
  },

  // ── Magnets ────────────────────────────────────────────────────────

  {
    id: "photo-magnets",
    name: "Photo Magnets",
    description:
      "Turn your favourite photo into a fridge magnet. Bright, crisp printing on durable magnetic stock — perfect for the kitchen or as a gift.",
    image: "/products/photo-magnets.webp",
    category: "magnets",
    variants: [
      // cost £2.00 + £1.35 ship = £3.35
      { sku: "magnet-fridge-3x2",  label: '3"×2" Fridge Magnet',   pricePence:  499 },
      // cost £3.00 + £1.35 ship = £4.35
      { sku: "magnet-fridge-6x4",  label: '6"×4" Fridge Magnet',   pricePence:  599 },
      // cost £4.50 + £1.35 ship = £5.85
      { sku: "magnet-acrylic-2x3", label: '2"×3" Acrylic Magnet',  pricePence: 799 },
      // cost £4.00 + £2.30 ship = £6.30
      { sku: "magnet-square-4x4",  label: '4"×4" Square Magnet',   pricePence: 899 },
      // cost £6.00 + £2.30 ship = £8.30
      { sku: "magnet-square-6x6",  label: '6"×6" Square Magnet',   pricePence: 1099 },
    ],
  },

  // ── Phone Cases ────────────────────────────────────────────────────

  {
    id: "folio-wallet",
    name: "Folio Wallet Cases",
    description:
      "Premium faux-leather folio wallet cases with custom photo printing. Features card slots, stand function, and a magnetic closure. Your photo on the cover, your cards inside.",
    image: "/products/folio-wallet.png",
    category: "phone-cases",
    variants: [
      // cost £10.00 + £3.20 ship = £13.20
      { sku: "folio-iphone11",      label: "iPhone 11",       pricePence: 1699 },
      { sku: "folio-iphone11pro",   label: "iPhone 11 Pro",   pricePence: 1699 },
      { sku: "folio-iphone11promax", label: "iPhone 11 Pro Max", pricePence: 1699 },
      { sku: "folio-iphone12",      label: "iPhone 12",       pricePence: 1699 },
      { sku: "folio-iphone12mini",  label: "iPhone 12 mini",  pricePence: 1699 },
      { sku: "folio-iphone12pro",   label: "iPhone 12 Pro",   pricePence: 1699 },
      { sku: "folio-iphone12promax", label: "iPhone 12 Pro Max", pricePence: 1699 },
      { sku: "folio-iphone13",      label: "iPhone 13",       pricePence: 1699 },
    ],
  },

  {
    id: "tough-phone-case",
    name: "Tough Phone Cases",
    description:
      "Dual-layer tough phone cases with custom photo printing. A hard polycarbonate outer shell and soft TPU inner bumper provide serious drop protection while showing off your favourite photo.",
    image: "/products/tough-case.png",
    category: "phone-cases",
    variants: [
      // cost £8.00 + £3.20 ship = £11.20
      { sku: "tough-iphone11",      label: "iPhone 11",       pricePence: 1499 },
      { sku: "tough-iphone11pro",   label: "iPhone 11 Pro",   pricePence: 1499 },
      { sku: "tough-iphone11promax", label: "iPhone 11 Pro Max", pricePence: 1499 },
      { sku: "tough-iphone12",      label: "iPhone 12",       pricePence: 1499 },
      { sku: "tough-iphone12mini",  label: "iPhone 12 mini",  pricePence: 1499 },
      { sku: "tough-iphone12pro",   label: "iPhone 12 Pro",   pricePence: 1499 },
      { sku: "tough-iphone12promax", label: "iPhone 12 Pro Max", pricePence: 1499 },
      { sku: "tough-iphone13",      label: "iPhone 13",       pricePence: 1499 },
      { sku: "tough-iphone13mini",  label: "iPhone 13 mini",  pricePence: 1499 },
      { sku: "tough-iphone13pro",   label: "iPhone 13 Pro",   pricePence: 1499 },
      { sku: "tough-iphone13promax", label: "iPhone 13 Pro Max", pricePence: 1499 },
    ],
  },

  // ── Glow Posters ───────────────────────────────────────────────────

  {
    id: "glow-poster",
    name: "Glow in the Dark Posters",
    description:
      "Turn your favourite photo into a glow-in-the-dark poster. Charges under natural or artificial light, then glows softly for hours. Perfect for bedrooms, nurseries, and creative spaces.",
    image: "/products/glow-poster.png",
    category: "glow-posters",
    variants: [
      // cost £4.00 + £3.20 ship = £7.20
      { sku: "glow-4x6",   label: '4"×6"',   pricePence: 899 },
      // cost £5.00 + £3.20 ship = £8.20
      { sku: "glow-5x7",   label: '5"×7"',   pricePence: 999 },
      // cost £6.00 + £3.20 ship = £9.20
      { sku: "glow-8x10",  label: '8"×10"',  pricePence: 1199 },
      // cost £8.00 + £3.20 ship = £11.20
      { sku: "glow-12x16", label: '12"×16"', pricePence: 1399 },
      // cost £10.00 + £3.20 ship = £13.20
      { sku: "glow-16x20", label: '16"×20"', pricePence: 1699 },
      // cost £14.00 + £3.20 ship = £17.20
      { sku: "glow-20x24", label: '20"×24"', pricePence: 2199 },
      // cost £20.00 + £3.20 ship = £23.20
      { sku: "glow-24x32", label: '24"×32"', pricePence: 2799 },
    ],
  },
];
