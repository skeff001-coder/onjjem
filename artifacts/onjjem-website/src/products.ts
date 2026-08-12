/**
 * ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
 *
 * This file belonged to the old React frontend (home.tsx / product.tsx)
 * for onjjem-website, which has been replaced by the static vanilla-JS
 * shop at onjjem-website/index.html. Cloudflare's _worker.js routes all
 * traffic straight to that static index.html, so this React app and the
 * prices below are NEVER served to customers and are safe to ignore.
 *
 * PRICES HERE ARE STALE AND DO NOT MATCH THE LIVE SITE. Do not use this
 * file as a pricing reference.
 *
 * Sources of truth:
 *   - Live catalogue + prices shown to customers:
 *       onjjem-website/index.html (CATEGORIES constant)
 *   - Checkout / what Stripe actually charges:
 *       artifacts/api-server/src/shopPrices.ts
 *
 * This file (and the rest of the unused React app under
 * onjjem-website/src/) can be safely deleted whenever it's convenient.
 * Left in place for now purely to avoid an unnecessary large diff.
 *
 * ── Original header, kept for reference only ──────────────────────────
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
    image: "/products/stretched-canvas.webp",
    category: "wall-art",
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
    description:
      "Environmentally friendly canvas prints on recycled materials. Beautiful colour reproduction, lighter on the planet.",
    image: "/products/eco-canvas.webp",
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
    image: "/products/slim-canvas.webp",
    category: "wall-art",
    variants: [
      // Small
      // recommended price £31.99, clean profit £6.66 per unit
      { sku: "canvas-slim-8x8", label: '8"×8"', pricePence: 3199 },
      // recommended price £31.99, clean profit £6.66 per unit
      { sku: "canvas-slim-8x14", label: '8"×14"', pricePence: 3199 },
      // Medium
      // recommended price £41.99, clean profit £8.99 per unit
      { sku: "canvas-slim-8x22", label: '8"×22"', pricePence: 4199 },
      // recommended price £42.99, clean profit £8.83 per unit
      { sku: "canvas-slim-10x20", label: '10"×20"', pricePence: 4299 },
      // Large
      // recommended price £52.99, clean profit £11.16 per unit
      { sku: "canvas-slim-8x34", label: '8"×34"', pricePence: 5299 },
      // recommended price £56.99, clean profit £11.49 per unit
      { sku: "canvas-slim-8x40", label: '8"×40"', pricePence: 5699 },
    ],
  },

  // ── Frames ──────────────────────────────────────────────────────────────────


  {
    id: "framed-photo-tiles",
    name: "Framed Photo Tiles",
    description:
      "Create a stunning gallery wall with these easy-to-hang black-framed tiles. Lightweight and ready to display.",
    image: "/products/framed-photo-tiles-02.webp",
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
    image: "/products/eco-rolled-canvas.jpg",
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

  // ── Gifts ────────────────────────────────────────────────────────────────────

  {
    id: "jigsaw-puzzles",
    name: "Jigsaw Puzzles",
    description:
      "Your restored photo printed on a premium jigsaw puzzle and supplied in a beautiful metal presentation tin. The lid also features your photo.",
    image: "/products/jigsaw-puzzles.webp",
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
    image: "/products/playing-cards.webp",
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
    image: "/products/tattoo-arm.webp",
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

  // ── iPad Cases ──────────────────────────────────────────────────────────────────────────────
  // GLOBAL-TECH-IPAD-* SKUs mapped in prodigi.ts. Snap cases, edge-to-edge print.
  // iPad mini (GLOBAL-TECH-IPADMIN1-CS) not available in Prodigi API.
  {
    id: "ipad-cases",
    name: "iPad Cases",
    description:
      "Vibrant snap-on iPad cases with edge-to-edge photo printing. Hard polycarbonate shell with water-based polyurethane coating for a lasting finish. Protects your device while keeping your memories close.",
    image: "/products/ipad-case.png",
    category: "gifts",
    variants: [
      // cost £15.00 + £3.20 ship = £18.20 → 50% margin = £27.30
      { sku: "ipad-air",    label: "iPad Air (10.9)",       pricePence: 2799 },
      // cost £15.00 + £3.20 ship = £18.20 → 50% margin = £27.30
      { sku: "ipad-2-3-4",  label: "iPad 2 / 3 / 4 (9.7)",  pricePence: 2799 },
    ],
  },

  // ── Pets ─────────────────────────────────────────────────────────────────────

  {
    id: "pet-tags",
    name: "Pet Tags",
    description:
      "Personalised aluminium pet tags with your photo or design, dye-sublimated for rich, long-lasting colour. Suitable for dogs and cats — attaches to any collar.",
    image: "/products/metal-pet-tags.jpg",
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
    image: "/products/tea-towels.png",
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
    image: "/products/wooden-coasters.png",
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
    image: "/products/photo-mugs.png",
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
    image: "/products/photo-magnets.webp",
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

  // ── Phone Cases ──────────────────────────────────────────────────────────────

  {
    id: "folio-wallet",
    name: "Folio Wallet Cases",
    description:
      "Premium faux-leather folio wallet cases with custom photo printing. Features card slots, stand function, and a magnetic closure. Your photo on the cover, your cards inside.",
    image: "/products/folio-wallet.png",
    category: "phone-cases",
    variants: [
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone11",      label: "iPhone 11",       pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone11pro",   label: "iPhone 11 Pro",   pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone11promax", label: "iPhone 11 Pro Max", pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone12",      label: "iPhone 12",       pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone12mini",  label: "iPhone 12 mini",  pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone12pro",   label: "iPhone 12 Pro",   pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone12promax", label: "iPhone 12 Pro Max", pricePence: 1999 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "folio-iphone13",      label: "iPhone 13",       pricePence: 1999 },
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
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone11",      label: "iPhone 11",       pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone11pro",   label: "iPhone 11 Pro",   pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone11promax", label: "iPhone 11 Pro Max", pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone12",      label: "iPhone 12",       pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone12mini",  label: "iPhone 12 mini",  pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone12pro",   label: "iPhone 12 Pro",   pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone12promax", label: "iPhone 12 Pro Max", pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone13",      label: "iPhone 13",       pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone13mini",  label: "iPhone 13 mini",  pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone13pro",   label: "iPhone 13 Pro",   pricePence: 1699 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "tough-iphone13promax", label: "iPhone 13 Pro Max", pricePence: 1699 },
    ],
  },

  // ── Glow Posters ───────────────────────────────────────────────────────────────

  {
    id: "glow-poster",
    name: "Glow in the Dark Posters",
    description:
      "Turn your favourite photo into a glow-in-the-dark poster. Charges under natural or artificial light, then glows softly for hours. Perfect for bedrooms, nurseries, and creative spaces.",
    image: "/products/glow-poster.png",
    category: "glow-posters",
    variants: [
      // cost £4.00 + £3.20 ship = £7.20 → 50% margin = £10.80
      { sku: "glow-4x6",   label: '4"×6"',   pricePence: 1099 },
      // cost £5.00 + £3.20 ship = £8.20 → 50% margin = £12.30
      { sku: "glow-5x7",   label: '5"×7"',   pricePence: 1299 },
      // cost £6.00 + £3.20 ship = £9.20 → 50% margin = £13.80
      { sku: "glow-8x10",  label: '8"×10"',  pricePence: 1399 },
      // cost £8.00 + £3.20 ship = £11.20 → 50% margin = £16.80
      { sku: "glow-12x16", label: '12"×16"', pricePence: 1699 },
      // cost £10.00 + £3.20 ship = £13.20 → 50% margin = £19.80
      { sku: "glow-16x20", label: '16"×20"', pricePence: 1999 },
      // cost £14.00 + £3.20 ship = £17.20 → 50% margin = £25.80
      { sku: "glow-20x24", label: '20"×24"', pricePence: 2599 },
      // cost £20.00 + £3.20 ship = £23.20 → 50% margin = £34.80
      { sku: "glow-24x32", label: '24"×32"', pricePence: 3499 },
    ],
  },

  {
    id: "fine-art-print",
    name: "Museum-Grade Fine Art Print",
    description:
      "Professional Giclée fine art printing on heavyweight 240gsm matte paper with archival, pigment-based inks — razor-sharp detail and rich colour that resists fading over time.",
    image: "/products/fine-art-print.jpg",
    category: "prints",
    variants: [
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "art-print-5x7", label: '5"×7"', pricePence: 1499 },
      // cost £5.00 (delivery + tax already folded in) = £17.99
      { sku: "art-print-8x10", label: '8"×10"', pricePence: 1799 },
      // cost £6.00 (delivery + tax already folded in) = £19.99
      { sku: "art-print-11x14", label: '11"×14"', pricePence: 1999 },
      // cost £7.00 (delivery + tax already folded in) = £21.99
      { sku: "art-print-12x16", label: '12"×16"', pricePence: 2199 },
      // cost £15.00 (delivery + tax already folded in) = £35.99
      { sku: "art-print-24x32", label: '24"×32"', pricePence: 3599 },
      // cost £28.00 (delivery + tax already folded in) = £59.99
      { sku: "art-print-36x48", label: '36"×48"', pricePence: 5999 },
    ],
  },

  {
    id: "budget-poster",
    name: "Everyday Budget Poster",
    description:
      "Affordable everyday poster print on bright white 170gsm silk paper — crisp lines and vibrant colour, printed with eco-conscious water-based inks.",
    image: "/products/budget-poster.jpg",
    category: "prints",
    variants: [
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "budget-poster-a5", label: "A5", pricePence: 1499 },
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "budget-poster-a4", label: "A4", pricePence: 1499 },
      // cost £4.00 (delivery + tax already folded in) = £16.99
      { sku: "budget-poster-a3", label: "A3", pricePence: 1699 },
      // cost £6.00 (delivery + tax already folded in) = £19.99
      { sku: "budget-poster-a2", label: "A2", pricePence: 1999 },
      // cost £9.00 (delivery + tax already folded in) = £25.99
      { sku: "budget-poster-a1", label: "A1", pricePence: 2599 },
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "budget-poster-4x6", label: '4"×6"', pricePence: 1499 },
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "budget-poster-6x6", label: '6"×6"', pricePence: 1499 },
    ],
  },

  {
    id: "metallic-foil-print",
    name: "Premium Metallic Foil Art Print",
    description:
      "Ultra-heavyweight 350gsm specialist print with true metallic Gold or Silver foil accents — direct UV digital printing lets you control exactly which lettering or highlights shine.",
    image: "/products/metallic-foil-print.jpg",
    category: "prints",
    variants: [
      // cost £5.00 (delivery + tax already folded in) = £17.99
      { sku: "art-foil-a4-gold", label: 'A4 / Gold', pricePence: 1799 },
      // cost £5.00 (delivery + tax already folded in) = £17.99
      { sku: "art-foil-a4-silver", label: 'A4 / Silver', pricePence: 1799 },
      // cost £8.00 (delivery + tax already folded in) = £23.99
      { sku: "art-foil-a3-gold", label: 'A3 / Gold', pricePence: 2399 },
      // cost £8.00 (delivery + tax already folded in) = £23.99
      { sku: "art-foil-a3-silver", label: 'A3 / Silver', pricePence: 2399 },
      // cost £14.00 (delivery + tax already folded in) = £34.99
      { sku: "art-foil-a2-gold", label: 'A2 / Gold', pricePence: 3499 },
      // cost £14.00 (delivery + tax already folded in) = £34.99
      { sku: "art-foil-a2-silver", label: 'A2 / Silver', pricePence: 3499 },
      // cost £24.00 (delivery + tax already folded in) = £52.99
      { sku: "art-foil-a1-gold", label: 'A1 / Gold', pricePence: 5299 },
      // cost £24.00 (delivery + tax already folded in) = £52.99
      { sku: "art-foil-a1-silver", label: 'A1 / Silver', pricePence: 5299 },
      // cost £18.00 (delivery + tax already folded in) = £41.99
      { sku: "art-foil-20x28-gold", label: '20"×28" / Gold', pricePence: 4199 },
      // cost £18.00 (delivery + tax already folded in) = £41.99
      { sku: "art-foil-20x28-silver", label: '20"×28" / Silver', pricePence: 4199 },
      // cost £19.00 (delivery + tax already folded in) = £43.99
      { sku: "art-foil-20x30-gold", label: '20"×30" / Gold', pricePence: 4399 },
      // cost £19.00 (delivery + tax already folded in) = £43.99
      { sku: "art-foil-20x30-silver", label: '20"×30" / Silver', pricePence: 4399 },
      // cost £25.00 (delivery + tax already folded in) = £53.99
      { sku: "art-foil-20x40-gold", label: '20"×40" / Gold', pricePence: 5399 },
      // cost £25.00 (delivery + tax already folded in) = £53.99
      { sku: "art-foil-20x40-silver", label: '20"×40" / Silver', pricePence: 5399 },
      // cost £19.00 (delivery + tax already folded in) = £43.99
      { sku: "art-foil-24x24-gold", label: '24"×24" / Gold', pricePence: 4399 },
      // NOTE: silver price for 24x24 not provided — inferred to match gold, same as every other size. Please confirm.
      { sku: "art-foil-24x24-silver", label: '24"×24" / Silver', pricePence: 4399 },
    ],
  },

  {
    id: "glow-poster-premium",
    name: "Premium Glow in the Dark Poster",
    description:
      "Imagine their favourite photo of your dog glowing softly on the wall long after the lights go out. Charge this poster under any bright light for around 30 minutes, then watch it come alive with a captivating luminous glow that lasts for hours in the dark — the longer it charges, the brighter and longer it glows. Printed on ultra-heavyweight 350gsm gallery-style paper for a genuinely premium feel and finish, this isn't a novelty gimmick — it's a beautifully made keepsake that turns your dog's photo into the centrepiece of a bedroom, nursery, or playroom. A magical addition to bedtime, and a gift that keeps surprising long after it's unwrapped.",
    image: "/products/glow-poster-premium.jpg",
    category: "glow-posters",
    variants: [
      // Very small
      // cost £3.00 (delivery + tax already folded in) = £14.99
      { sku: "art-gitd-premium-4x6", label: '4"×6"', pricePence: 1499 },
      // cost £4.00 (delivery + tax already folded in) = £16.99
      { sku: "art-gitd-premium-6x6", label: '6"×6"', pricePence: 1699 },
      // Small
      // cost £5.00 (delivery + tax already folded in) = £17.99
      { sku: "art-gitd-premium-a4", label: 'A4', pricePence: 1799 },
      // cost £8.00 (delivery + tax already folded in) = £23.99
      { sku: "art-gitd-premium-a3", label: 'A3', pricePence: 2399 },
      // Medium
      // cost £14.00 (delivery + tax already folded in) = £34.99
      { sku: "art-gitd-premium-a2", label: 'A2', pricePence: 3499 },
      // cost £16.00 (delivery + tax already folded in) = £37.99
      { sku: "art-gitd-premium-20x24", label: '20"×24"', pricePence: 3799 },
      // Very large
      // cost £51.00 (delivery + tax already folded in) = £100.99
      { sku: "art-gitd-premium-36x48", label: '36"×48"', pricePence: 10099 },
      // cost £70.00 (delivery + tax already folded in) = £134.99
      { sku: "art-gitd-premium-40x60", label: '40"×60"', pricePence: 13499 },
    ],
  },

  {
    id: "budget-framed-poster",
    name: "Budget Framed Poster",
    description:
      "Their favourite photo, ready to hang in minutes. This self-assembly framed poster arrives as one simple package — print and frame together, no separate ordering, no guesswork on sizing. Choose from Black, White, or Natural wood-effect frames to match any room, with shatterproof glazing built in for safe, everyday hanging. An easy, affordable way to get a photo properly up on the wall rather than sitting forgotten on a phone.",
    image: "/products/budget-framed-poster.jpg",
    category: "wall-art",
    variants: [
      // cost £10.00 (delivery + tax already folded in) = £26.99
      { sku: "bfp-5x7", label: '5"×7"', pricePence: 2699 },
      // cost £10.00 (delivery + tax already folded in) = £26.99
      { sku: "bfp-6x8", label: '6"×8"', pricePence: 2699 },
      // cost £15.00 (delivery + tax already folded in) = £35.99
      { sku: "bfp-11x14", label: '11"×14"', pricePence: 3599 },
      // cost £15.00 (delivery + tax already folded in) = £35.99
      { sku: "bfp-12x12", label: '12"×12"', pricePence: 3599 },
      // cost £14.13 (delivery + tax already folded in) = £34.99
      { sku: "bfp-12x16", label: '12"×16"', pricePence: 3499 },
      // cost £18.00 (delivery + tax already folded in) = £41.99
      { sku: "bfp-16x16", label: '16"×16"', pricePence: 4199 },
      // cost £22.00 (delivery + tax already folded in) = £48.99
      { sku: "bfp-16x20", label: '16"×20"', pricePence: 4899 },
      // cost £26.00 (delivery + tax already folded in) = £55.99
      { sku: "bfp-18x24", label: '18"×24"', pricePence: 5599 },
      // cost £25.00 (delivery + tax already folded in) = £53.99
      { sku: "bfp-20x20", label: '20"×20"', pricePence: 5399 },
      // cost £28.00 (delivery + tax already folded in) = £59.99
      { sku: "bfp-20x28", label: '20"×28"', pricePence: 5999 },
      // cost £32.00 (delivery + tax already folded in) = £66.99
      { sku: "bfp-24x32", label: '24"×31"', pricePence: 6699 },
    ],
  },

  {
    id: "exoboard",
    name: "Rigid Display Board",
    description:
      "A tough, lightweight, fully waterproof display board — perfect for a dog's photo that can live indoors or out, from a playroom wall to a garden fence. Rigid enough to stand freely or hang, with sharp, edge-to-edge colour that won't fade.",
    image: "/products/exoboard.jpg",
    category: "wall-art",
    variants: [
      // cost £15.00 (delivery + tax already folded in) = £35.99
      { sku: "exoboard-200x300", label: '8"×12"', pricePence: 3599 },
      // cost £20.00 (delivery + tax already folded in) = £44.99
      { sku: "exoboard-297x420", label: '12"×17"', pricePence: 4499 },
      // cost £30.00 (delivery + tax already folded in) = £62.99
      { sku: "exoboard-400x500", label: '16"×20"', pricePence: 6299 },
      // cost £38.00 (delivery + tax already folded in) = £76.99
      { sku: "exoboard-450x600", label: '18"×24"', pricePence: 7699 },
      // cost £50.00 (delivery + tax already folded in) = £98.99
      { sku: "exoboard-594x841", label: '23"×33"', pricePence: 9899 },
      // cost £55.00 (delivery + tax already folded in) = £107.99
      { sku: "exoboard-600x800", label: '24"×31"', pricePence: 10799 },
      // cost £75.00 (delivery + tax already folded in) = £143.99
      { sku: "exoboard-700x1000", label: '28"×39"', pricePence: 14399 },
      // cost £95.00 (delivery + tax already folded in) = £179.99
      { sku: "exoboard-841x1189", label: '33"×47"', pricePence: 17999 },
    ],
  },
];
