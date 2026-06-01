/**
 * ONJJEM product catalogue.
 *
 * All prices are in GBP pence and include free UK delivery.
 * Retail prices are calculated from confirmed Prodigi live-API wholesale quotes
 * (item cost + shipping) × ~2× markup, rounded to the nearest £0.99.
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
      // Prodigi cost: £14 item + £6.75 ship = £20.75
      { sku: "canvas-stretched-8x10",  label: '8"×10"',  pricePence: 3999 },
      // Prodigi cost: £16 + £6.75 = £22.75
      { sku: "canvas-stretched-10x12", label: '10"×12"', pricePence: 4499 },
      // Prodigi cost: £20 + £6.75 = £26.75
      { sku: "canvas-stretched-12x16", label: '12"×16"', pricePence: 5499 },
      // Prodigi cost: £27 + £10.75 = £37.75
      { sku: "canvas-stretched-16x20", label: '16"×20"', pricePence: 7499 },
      // Prodigi cost: £34 + £10.75 = £44.75
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
      // Prodigi cost: £7 + £6.75 = £13.75
      { sku: "eco-canvas-8x8",   label: '8"×8"',   pricePence: 2799 },
      // Prodigi cost: £8 + £6.75 = £14.75
      { sku: "eco-canvas-8x12",  label: '8"×12"',  pricePence: 2999 },
      // Prodigi cost: £10 + £6.75 = £16.75
      { sku: "eco-canvas-12x12", label: '12"×12"', pricePence: 3499 },
      // Prodigi cost: £12 + £10.75 = £22.75
      { sku: "eco-canvas-12x18", label: '12"×18"', pricePence: 4499 },
      // Prodigi cost: £14 + £6.75 = £20.75
      { sku: "eco-canvas-16x16", label: '16"×16"', pricePence: 3999 },
      // Prodigi cost: £19 + £10.75 = £29.75
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
      // Prodigi cost: £15 + £6.85 = £21.85
      { sku: "slim-canvas-8x16",  label: '8"×16"',  pricePence: 4499 },
      // Prodigi cost: £54 + £13.45 = £67.45
      { sku: "slim-canvas-28x36", label: '28"×36"', pricePence: 13499 },
      // Prodigi cost: £54 + £17.80 = £71.80
      { sku: "slim-canvas-24x40", label: '24"×40"', pricePence: 14499 },
      // Prodigi cost: £75 + £26.45 = £101.45
      { sku: "slim-canvas-40x48", label: '40"×48"', pricePence: 20499 },
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
      // Prodigi cost: £19 + £6.75 = £25.75
      { sku: "box-frame-5x7",   label: '5"×7"',   pricePence: 5499 },
      // Prodigi cost: £21 + £6.75 = £27.75
      { sku: "box-frame-6x8",   label: '6"×8"',   pricePence: 5499 },
      // Prodigi cost: £28 + £6.75 = £34.75
      { sku: "box-frame-12x12", label: '12"×12"', pricePence: 6999 },
      // Prodigi cost: £30 + £6.75 = £36.75
      { sku: "box-frame-11x14", label: '11"×14"', pricePence: 7499 },
      // Prodigi cost: £32 + £6.75 = £38.75
      { sku: "box-frame-12x16", label: '12"×16"', pricePence: 7999 },
      // Prodigi cost: £40 + £10.75 = £50.75
      { sku: "box-frame-16x20", label: '16"×20"', pricePence: 10499 },
    ],
  },

  {
    id: "framed-photo-tiles",
    name: "Framed Photo Tiles",
    description:
      "Create a stunning gallery wall with these easy-to-hang black-framed tiles. Lightweight and ready to display.",
    image: "/onjjem-website/products/framed-photo-tiles.jpg",
    category: "frames",
    variants: [
      // Prodigi cost: £6.06 + £7.96 = £14.02
      { sku: "photo-tile-5x7",  label: '5"×7"',  pricePence: 2999 },
      // Prodigi cost: £7.79 + £7.96 = £15.75
      { sku: "photo-tile-8x8",  label: '8"×8"',  pricePence: 3499 },
      // Prodigi cost: £8.65 + £7.96 = £16.61
      { sku: "photo-tile-8x10", label: '8"×10"', pricePence: 3499 },
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
      // Prodigi cost: £5 + £3.45 = £8.45
      { sku: "eco-rolled-10x10", label: '10"×10"', pricePence: 1999 },
      // Prodigi cost: £6 + £3.45 = £9.45
      { sku: "eco-rolled-12x12", label: '12"×12"', pricePence: 1999 },
      // Prodigi cost: £6 + £4.50 = £10.50
      { sku: "eco-rolled-12x18", label: '12"×18"', pricePence: 2499 },
      // Prodigi cost: £9 + £4.50 = £13.50
      { sku: "eco-rolled-16x20", label: '16"×20"', pricePence: 2999 },
      // Prodigi cost: £9 + £4.50 = £13.50
      { sku: "eco-rolled-18x24", label: '18"×24"', pricePence: 2999 },
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
      // Prodigi cost: £5 + £3.45 = £8.45
      { sku: "rolled-canvas-10x10", label: '10"×10"', pricePence: 1999 },
      // Prodigi cost: £6 + £4.50 = £10.50
      { sku: "rolled-canvas-12x16", label: '12"×16"', pricePence: 2499 },
      // Prodigi cost: £10 + £4.50 = £14.50
      { sku: "rolled-canvas-16x20", label: '16"×20"', pricePence: 2999 },
      // Prodigi cost: £11 + £4.50 = £15.50
      { sku: "rolled-canvas-18x24", label: '18"×24"', pricePence: 3499 },
      // Prodigi cost: £14 + £4.85 = £18.85
      { sku: "rolled-canvas-20x28", label: '20"×28"', pricePence: 3999 },
    ],
  },

  // ── Gifts ────────────────────────────────────────────────────────────────────

  {
    id: "playing-cards",
    name: "Playing Cards",
    description:
      "A full standard deck of playing cards with your photo printed on the back of every card.",
    image: "/onjjem-website/products/playing-cards.webp",
    category: "gifts",
    variants: [
      // Prodigi cost: £8 + £3.20 = £11.20
      { sku: "playing-cards", label: "Standard deck (54 cards)", pricePence: 2499 },
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
      // Prodigi cost: £2.00 + £1.35 = £3.35
      { sku: "magnet-fridge-3x2",  label: '3"×2" Fridge Magnet',   pricePence:  799 },
      // Prodigi cost: £3.00 + £1.35 = £4.35
      { sku: "magnet-fridge-6x4",  label: '6"×4" Fridge Magnet',   pricePence:  999 },
      // Prodigi cost: £4.50 + £1.35 = £5.85
      { sku: "magnet-acrylic-2x3", label: '2"×3" Acrylic Magnet',  pricePence: 1299 },
      // Prodigi cost: £4.00 + £2.30 = £6.30
      { sku: "magnet-square-4x4",  label: '4"×4" Square Magnet',   pricePence: 1299 },
      // Prodigi cost: £6.00 + £2.30 = £8.30
      { sku: "magnet-square-6x6",  label: '6"×6" Square Magnet',   pricePence: 1699 },
    ],
  },
];
