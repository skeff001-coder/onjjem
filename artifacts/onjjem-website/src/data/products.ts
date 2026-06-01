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
  {
    id: "stretched-canvas",
    name: "Stretched Canvas",
    description: "Gallery-quality canvas wrapped around a sturdy wooden frame. Ready to hang.",
    image: "/onjjem-website/products/stretched-canvas.webp",
    category: "wall-art",
    variants: [
      { sku: "canvas-stretched-8x10", label: '8"×10"', pricePence: 2999 },
      { sku: "canvas-stretched-12x16", label: '12"×16"', pricePence: 3999 },
      { sku: "canvas-stretched-16x20", label: '16"×20"', pricePence: 5499 },
      { sku: "canvas-stretched-20x24", label: '20"×24"', pricePence: 7499 },
    ]
  },
  {
    id: "framed-canvas",
    name: "Framed Canvas",
    description: "A beautiful stretched canvas suspended in a modern floating black frame.",
    image: "/onjjem-website/products/framed-canvas.webp",
    category: "wall-art",
    variants: [
      { sku: "canvas-framed-8x8-black", label: '8"×8" Black', pricePence: 4499 },
      { sku: "canvas-framed-10x8-black", label: '10"×8" Black', pricePence: 4999 },
      { sku: "canvas-framed-12x10-black", label: '12"×10" Black', pricePence: 5999 },
      { sku: "canvas-framed-16x12-black", label: '16"×12" Black', pricePence: 7499 },
    ]
  },
  {
    id: "eco-canvas",
    name: "Eco Canvas",
    description: "Environmentally friendly canvas prints made from recycled materials.",
    image: "/onjjem-website/products/eco-canvas.webp",
    category: "wall-art",
    variants: [
      { sku: "eco-canvas-8x8", label: '8"×8"', pricePence: 1499 },
      { sku: "eco-canvas-8x12", label: '8"×12"', pricePence: 1899 },
      { sku: "eco-canvas-12x12", label: '12"×12"', pricePence: 2299 },
      { sku: "eco-canvas-12x18", label: '12"×18"', pricePence: 2799 },
      { sku: "eco-canvas-16x16", label: '16"×16"', pricePence: 3299 },
    ]
  },
  {
    id: "eco-rolled-canvas",
    name: "Eco Rolled Canvas",
    description: "Unstretched eco-friendly canvas prints, perfect for custom framing.",
    image: "/onjjem-website/products/eco-rolled-canvas.jpg",
    category: "prints",
    variants: [
      { sku: "eco-rolled-10x10", label: '10"×10"', pricePence: 1499 },
      { sku: "eco-rolled-12x12", label: '12"×12"', pricePence: 1799 },
      { sku: "eco-rolled-12x18", label: '12"×18"', pricePence: 2199 },
      { sku: "eco-rolled-16x20", label: '16"×20"', pricePence: 2699 },
    ]
  },
  {
    id: "rolled-canvas",
    name: "Rolled Canvas",
    description: "Premium artist-grade rolled canvas prints.",
    image: "/onjjem-website/products/rolled-canvas.webp",
    category: "prints",
    variants: [
      { sku: "rolled-canvas-30x45", label: '30×45cm', pricePence: 2499 },
      { sku: "rolled-canvas-40x60", label: '40×60cm', pricePence: 3299 },
      { sku: "rolled-canvas-50x70", label: '50×70cm', pricePence: 4499 },
      { sku: "rolled-canvas-60x90", label: '60×90cm', pricePence: 5999 },
    ]
  },
  {
    id: "slim-canvas",
    name: "Slim Canvas",
    description: "A thinner profile canvas wrap for a subtle, contemporary look.",
    image: "/onjjem-website/products/slim-canvas.webp",
    category: "wall-art",
    variants: [
      { sku: "slim-canvas-8x16", label: '8"×16"', pricePence: 3499 },
      { sku: "slim-canvas-24x40", label: '24"×40"', pricePence: 6999 },
      { sku: "slim-canvas-28x36", label: '28"×36"', pricePence: 7499 },
    ]
  },
  {
    id: "box-frames",
    name: "Box Frames",
    description: "Deep, beautiful box frames that give your photos a dimensional presence.",
    image: "/onjjem-website/products/box-frames.jpg",
    category: "frames",
    variants: [
      { sku: "box-frame-5x7", label: '5"×7"', pricePence: 2499 },
      { sku: "box-frame-6x8", label: '6"×8"', pricePence: 2799 },
      { sku: "box-frame-11x14", label: '11"×14"', pricePence: 3999 },
      { sku: "box-frame-12x16", label: '12"×16"', pricePence: 4499 },
      { sku: "box-frame-16x20", label: '16"×20"', pricePence: 5499 },
    ]
  },
  {
    id: "framed-photo-tiles",
    name: "Framed Photo Tiles",
    description: "Create your own gallery wall with these easy-to-hang framed tiles.",
    image: "/onjjem-website/products/framed-photo-tiles.jpg",
    category: "frames",
    variants: [
      { sku: "photo-tile-5x7", label: '5"×7"', pricePence: 1299 },
      { sku: "photo-tile-8x8", label: '8"×8"', pricePence: 1499 },
      { sku: "photo-tile-8x10", label: '8"×10"', pricePence: 1699 },
    ]
  },
  {
    id: "jigsaw-puzzles",
    name: "Jigsaw Puzzles",
    description: "Turn your memories into an interactive experience.",
    image: "/onjjem-website/products/jigsaw-puzzles.webp",
    category: "gifts",
    variants: [
      { sku: "jigsaw-110", label: '110 pieces', pricePence: 1699 },
      { sku: "jigsaw-252", label: '252 pieces', pricePence: 1999 },
      { sku: "jigsaw-500", label: '500 pieces', pricePence: 2499 },
      { sku: "jigsaw-1000", label: '1000 pieces', pricePence: 3299 },
    ]
  },
  {
    id: "playing-cards",
    name: "Playing Cards",
    description: "A standard deck of playing cards, personalized with your photo on the back.",
    image: "/onjjem-website/products/playing-cards.webp",
    category: "gifts",
    variants: [
      { sku: "playing-cards", label: 'Standard deck', pricePence: 1999 },
    ]
  },
  {
    id: "temporary-tattoos",
    name: "Temporary Tattoos",
    description: "Fun, skin-safe temporary tattoos featuring your custom image.",
    image: "/onjjem-website/products/temporary-tattoos.webp",
    category: "fun",
    variants: [
      { sku: "tattoo-small", label: 'Small (4×2.5cm)', pricePence: 799 },
      { sku: "tattoo-medium", label: 'Medium (9×5cm)', pricePence: 1199 },
      { sku: "tattoo-large", label: 'Large (15×8cm)', pricePence: 1699 },
      { sku: "tattoo-xl", label: 'XL (20×10cm)', pricePence: 2199 },
    ]
  }
];
