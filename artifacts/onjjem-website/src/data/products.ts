/**
 * ONJJEM product catalogue.
 *
 * All prices are in GBP pence and include free UK delivery.
 * Retail prices are set at exactly 50% profit margin (sell = cost × 2),
 * rounded up to the nearest £0.99.
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
  // ── Wall Art ────────────────────────────────────────────────────────────────

  {
    id: "stretched-canvas",
    name: "Stretched Canvas",
    description:
      "Gallery-quality canvas wrapped around a sturdy wooden frame. Ready to hang straight out of the box.",
    image: "/onjjem-website/products/stretched-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £14.00 + £6.75 ship = £20.75 → 50% margin = £41.50
      { sku: "canvas-stretched-8x10",  label: '8"×10"',  pricePence: 4199 },
      // cost £16.00 + £6.75 ship = £22.75 → 50% margin = £45.50
      { sku: "canvas-stretched-10x12", label: '10"×12"', pricePence: 4599 },
      // cost £20.00 + £6.75 ship = £26.75 → 50% margin = £53.50
      { sku: "canvas-stretched-12x16", label: '12"×16"', pricePence: 5399 },
      // cost £27.00 + £10.75 ship = £37.75 → 50% margin = £75.50
      { sku: "canvas-stretched-16x20", label: '16"×20"', pricePence: 7599 },
      // cost £34.00 + £10.75 ship = £44.75 → 50% margin = £89.50
      { sku: "canvas-stretched-20x24", label: '20"×24"', pricePence: 8999 },
    ],
  },

  {
    id: "eco-canvas",
    name: "Eco Canvas",
    description:
      "Environmentally friendly canvas prints on recycled materials. Beautiful colour reproduction, lighter on the planet.",
    image: "/onjjem-website/products/eco-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £7.00 + £6.75 ship = £13.75 → 50% margin = £27.50
      { sku: "eco-canvas-8x8",   label: '8"×8"',   pricePence: 2799 },
      // cost £8.00 + £6.75 ship = £14.75 → 50% margin = £29.50
      { sku: "eco-canvas-8x12",  label: '8"×12"',  pricePence: 2999 },
      // cost £10.00 + £6.75 ship = £16.75 → 50% margin = £33.50
      { sku: "eco-canvas-12x12", label: '12"×12"', pricePence: 3399 },
      // cost £12.00 + £10.75 ship = £22.75 → 50% margin = £45.50
      { sku: "eco-canvas-12x18", label: '12"×18"', pricePence: 4599 },
      // cost £14.00 + £6.75 ship = £20.75 → 50% margin = £41.50
      { sku: "eco-canvas-16x16", label: '16"×16"', pricePence: 4199 },
      // cost £19.00 + £10.75 ship = £29.75 → 50% margin = £59.50
      { sku: "eco-canvas-16x24", label: '16"×24"', pricePence: 5999 },
    ],
  },

  {
    id: "slim-canvas",
    name: "Slim Canvas",
    description:
      "A thinner-profile canvas wrap for a sleek, contemporary look. Perfect for panoramic and portrait shots.",
    image: "/onjjem-website/products/slim-canvas.webp",
    category: "wall-art",
    variants: [
      // cost £15.00 + £6.85 ship = £21.85 → 50% margin = £43.70
      { sku: "slim-canvas-8x16",  label: '8"×16"',  pricePence: 4399 },
      // cost £54.00 + £13.45 ship = £67.45 → 50% margin = £134.90
      { sku: "slim-canvas-28x36", label: '28"×36"', pricePence: 13499 },
      // cost £54.00 + £17.80 ship = £71.80 → 50% margin = £143.60
      { sku: "slim-canvas-24x40", label: '24"×40"', pricePence: 14399 },
      // cost £75.00 + £26.45 ship = £101.45 → 50% margin = £202.90
      { sku: "slim-canvas-40x48", label: '40"×48"', pricePence: 20299 },
    ],
  },

  // ── Frames ──────────────────────────────────────────────────────────────────

  {
    id: "box-frames",
    name: "Box Frames",
    description:
      "Deep, beautiful black box frames that give your photos a striking three-dimensional presence on the wall.",
    image: "/onjjem-website/products/box-frames.jpg",
    category: "frames",
    variants: [
      // cost £19.00 + £6.75 ship = £25.75 → 50% margin = £51.50
      { sku: "box-frame-5x7",   label: '5"×7"',   pricePence: 5199 },
      // cost £21.00 + £6.75 ship = £27.75 → 50% margin = £55.50
      { sku: "box-frame-6x8",   label: '6"×8"',   pricePence: 5599 },
      // cost £28.00 + £6.75 ship = £34.75 → 50% margin = £69.50
      { sku: "box-frame-12x12", label: '12"×12"', pricePence: 6999 },
      // cost £30.00 + £6.75 ship = £36.75 → 50% margin = £73.50
      { sku: "box-frame-11x14", label: '11"×14"', pricePence: 7399 },
      // cost £32.00 + £6.75 ship = £38.75 → 50% margin = £77.50
      { sku: "box-frame-12x16", label: '12"×16"', pricePence: 7799 },
      // cost £40.00 + £10.75 ship = £50.75 → 50% margin = £101.50
      { sku: "box-frame-16x20", label: '16"×20"', pricePence: 10199 },
    ],
  },

  {
    id: "framed-photo-tiles",
    name: "Framed Photo Tiles",
    description:
      "Create a stunning gallery wall with these easy-to-hang black-framed tiles. Lightweight and ready to display.",
    image: "/onjjem-website/products/framed-photo-tiles-02.webp",
    category: "frames",
    variants: [
      // cost £6.06 + £7.96 ship = £14.02 → 50% margin = £28.04
      { sku: "photo-tile-5x7",  label: '5"×7"',  pricePence: 2799 },
      // cost £7.79 + £7.96 ship = £15.75 → 50% margin = £31.50
      { sku: "photo-tile-8x8",  label: '8"×8"',  pricePence: 3199 },
      // cost £8.65 + £7.96 ship = £16.61 → 50% margin = £33.22
      { sku: "photo-tile-8x10", label: '8"×10"', pricePence: 3399 },
    ],
  },

  // ── Prints ───────────────────────────────────────────────────────────────────

  {
    id: "eco-rolled-canvas",
    name: "Eco Rolled Canvas",
    description:
      "Unstretched eco-friendly canvas prints, ideal for custom framing or rolling and posting as a gift.",
    image: "/onjjem-website/products/eco-rolled-canvas.jpg",
    category: "prints",
    variants: [
      // cost £5.00 + £3.45 ship = £8.45 → 50% margin = £16.90
      { sku: "eco-rolled-10x10", label: '10"×10"', pricePence: 1699 },
      // cost £6.00 + £3.45 ship = £9.45 → 50% margin = £18.90
      { sku: "eco-rolled-12x12", label: '12"×12"', pricePence: 1899 },
      // cost £6.00 + £4.50 ship = £10.50 → 50% margin = £21.00
      { sku: "eco-rolled-12x18", label: '12"×18"', pricePence: 2099 },
      // cost £9.00 + £4.50 ship = £13.50 → 50% margin = £27.00
      { sku: "eco-rolled-16x20", label: '16"×20"', pricePence: 2699 },
      // cost £9.00 + £4.50 ship = £13.50 → 50% margin = £27.00
      { sku: "eco-rolled-18x24", label: '18"×24"', pricePence: 2699 },
    ],
  },

  {
    id: "rolled-canvas",
    name: "Rolled Canvas",
    description:
      "Premium artist-grade rolled canvas. Produced on museum-quality giclée canvas and posted in a protective tube.",
    image: "/onjjem-website/products/rolled-canvas.webp",
    category: "prints",
    variants: [
      // cost £5.00 + £3.45 ship = £8.45 → 50% margin = £16.90
      { sku: "rolled-canvas-10x10", label: '10"×10"', pricePence: 1699 },
      // cost £6.00 + £4.50 ship = £10.50 → 50% margin = £21.00
      { sku: "rolled-canvas-12x16", label: '12"×16"', pricePence: 2099 },
      // cost £10.00 + £4.50 ship = £14.50 → 50% margin = £29.00
      { sku: "rolled-canvas-16x20", label: '16"×20"', pricePence: 2899 },
      // cost £11.00 + £4.50 ship = £15.50 → 50% margin = £31.00
      { sku: "rolled-canvas-18x24", label: '18"×24"', pricePence: 3099 },
      // cost £14.00 + £4.85 ship = £18.85 → 50% margin = £37.70
      { sku: "rolled-canvas-20x28", label: '20"×28"', pricePence: 3799 },
    ],
  },

  // ── Gifts ────────────────────────────────────────────────────────────────────

  {
    id: "jigsaw-puzzles",
    name: "Jigsaw Puzzles",
    description:
      "Your restored photo printed on a premium jigsaw puzzle and supplied in a beautiful metal presentation tin. The lid also features your photo.",
    image: "/onjjem-website/products/jigsaw-puzzles.webp",
    category: "gifts",
    variants: [
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £26.40
      { sku: "jigsaw-252", label: "252 pieces (375×285mm)", pricePence: 2699 },
      // cost £12.00 + £3.20 ship = £15.20 → 50% margin = £30.40
      { sku: "jigsaw-500", label: "500 pieces (530×390mm)", pricePence: 3099 },
      // cost £17.00 + £3.20 ship = £20.20 → 50% margin = £40.40
      { sku: "jigsaw-1000", label: "1000 pieces (765×525mm)", pricePence: 4099 },
    ],
  },

  {
    id: "playing-cards",
    name: "Playing Cards",
    description:
      "A full standard deck of playing cards with your photo printed on the back of every card.",
    image: "/onjjem-website/products/playing-cards.webp",
    category: "gifts",
    variants: [
      // cost £8.00 + £3.20 ship = £11.20 → price at £19.95
      { sku: "playing-cards", label: "Standard deck (54 cards)", pricePence: 1995 },
    ],
  },

  // ── Temporary Tattoos ──────────────────────────────────────────────────────
  // GLOBAL-TATT-* SKUs mapped in prodigi.ts. Skin-safe waterslide film, lasts up to
  // one week. Cost is Prodigi wholesale + £3.20 shipping, then 50% margin.
  {
    id: "temporary-tattoos",
    name: "Temporary Tattoos",
    description:
      "Custom temporary tattoos printed on skin-safe waterslide film. Quick and easy application — lasts up to one week, removes easily with no residue. Personalise with any photo for parties, events, or just for fun.",
    image: "/onjjem-website/products/tattoo-arm.webp",
    category: "tattoos",
    variants: [
      // cost £2.95 + £3.20 = £6.15 → 50% margin = £9.22
      { sku: "tattoo-s",   label: "2x3 in (5x7.5cm)",   pricePence: 999 },
      // cost £3.95 + £3.20 = £7.15 → 50% margin = £10.72
      { sku: "tattoo-m",   label: "3x4 in (7.5x10cm)", pricePence: 1099 },
      // cost £5.95 + £3.20 = £9.15 → 50% margin = £13.72
      { sku: "tattoo-l",   label: "4x6 in (10x15cm)", pricePence: 1399 },
      // cost £11.95 + £3.20 = £15.15 → 50% margin = £22.72
      { sku: "tattoo-xl",  label: "8x8 in (20x20cm)", pricePence: 2299 },
      // cost £19.95 + £3.20 = £23.15 → 50% margin = £34.72
      { sku: "tattoo-xxl", label: "12x12 in (30x30cm)", pricePence: 3499 },
    ],
  },

  // ── Pets ─────────────────────────────────────────────────────────────────────

  {
    id: "pet-tags",
    name: "Pet Tags",
    description:
      "Personalised aluminium pet tags with your photo or design, dye-sublimated for rich, long-lasting colour. Suitable for dogs and cats — attaches to any collar.",
    image: "/onjjem-website/products/metal-pet-tags.jpg",
    category: "pets",
    variants: [
      // cost £5.00 + £2.25 ship = £7.25 → 50% margin = £14.50
      { sku: "pet-tag-round", label: "Round (3.2×3.9cm)",      pricePence: 1499 },
      // cost £5.00 + £2.25 ship = £7.25 → 50% margin = £14.50
      { sku: "pet-tag-bone",  label: "Bone shape (2.8×3.8cm)", pricePence: 1499 },
    ],
  },

  // ── Kitchen & Drinkware ──────────────────────────────────────────────────────

  {
    id: "tea-towels",
    name: "Tea Towels",
    description:
      "Custom all-over printed tea towels made from 100% cotton with hemmed edges and a corner hanging tab. Machine washable and fade-resistant.",
    image: "/onjjem-website/products/tea-towels.png",
    category: "kitchen",
    variants: [
      // cost £12.00 + £3.00 ship = £15.00 → 50% margin = £30.00
      { sku: "tea-towel", label: "Tea Towel (18.5×27.5\")", pricePence: 2999 },
    ],
  },

  {
    id: "wooden-coasters",
    name: "Wooden Coasters",
    description:
      "Custom photo coasters made from 4mm MDF with a high-gloss finish and protective cork underside. Order individually or as a set.",
    image: "/onjjem-website/products/wooden-coasters.png",
    category: "kitchen",
    variants: [
      // cost £4.00 + £2.25 ship = £6.25 → 50% margin = £12.50
      { sku: "coaster-1pk", label: "Single coaster", pricePence: 1299 },
      // cost £5.50 + £2.25 ship = £7.75 → 50% margin = £15.50
      { sku: "coaster-2pk", label: "Set of 2",       pricePence: 1599 },
      // cost £10.00 + £2.25 ship = £12.25 → 50% margin = £24.50
      { sku: "coaster-4pk", label: "Set of 4",       pricePence: 2499 },
      // cost £15.00 + £2.25 ship = £17.25 → 50% margin = £34.50
      { sku: "coaster-6pk", label: "Set of 6",       pricePence: 3499 },
    ],
  },

  {
    id: "photo-mugs",
    name: "Photo Mugs",
    description:
      "Your favourite photo printed on a dishwasher-safe ceramic mug. A thoughtful, everyday gift.",
    image: "/onjjem-website/products/photo-mugs.png",
    category: "kitchen",
    variants: [
      // cost £4.25 + £3.30 ship = £7.55 → 50% margin = £15.10
      { sku: "mug-11oz", label: "11oz Mug",       pricePence: 1599 },
      // cost £8.00 + £2.25 ship = £10.25 → 50% margin = £20.50
      { sku: "mug-15oz", label: "15oz Large Mug", pricePence: 2099 },
    ],
  },

  // ── Magnets ──────────────────────────────────────────────────────────────────

  {
    id: "photo-magnets",
    name: "Photo Magnets",
    description:
      "Turn your favourite photo into a fridge magnet. Bright, crisp printing on durable magnetic stock — perfect for the kitchen or as a gift.",
    image: "/onjjem-website/products/photo-magnets.webp",
    category: "magnets",
    variants: [
      // cost £2.00 + £1.35 ship = £3.35 → 50% margin = £6.70
      { sku: "magnet-fridge-3x2",  label: '3"×2" Fridge Magnet',   pricePence:  699 },
      // cost £3.00 + £1.35 ship = £4.35 → 50% margin = £8.70
      { sku: "magnet-fridge-6x4",  label: '6"×4" Fridge Magnet',   pricePence:  899 },
      // cost £4.50 + £1.35 ship = £5.85 → 50% margin = £11.70
      { sku: "magnet-acrylic-2x3", label: '2"×3" Acrylic Magnet',  pricePence: 1199 },
      // cost £4.00 + £2.30 ship = £6.30 → 50% margin = £12.60
      { sku: "magnet-square-4x4",  label: '4"×4" Square Magnet',   pricePence: 1299 },
      // cost £6.00 + £2.30 ship = £8.30 → 50% margin = £16.60
      { sku: "magnet-square-6x6",  label: '6"×6" Square Magnet',   pricePence: 1699 },
    ],
  },
];
