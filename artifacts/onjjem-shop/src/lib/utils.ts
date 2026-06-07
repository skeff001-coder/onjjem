import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amountInMinorUnits: number, currency: string = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInMinorUnits / 100);
}

/** Map product names to unique local mockup images */
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "Photo Mug": "assets/photo-mug.png",
  "Wooden Coasters": "assets/coasters.png",
  "Classic Framed Print": "assets/framed-print-real.jpeg",
  "Stretched Canvas": "assets/stretched-canvas-real.jpeg",
  "Eco Canvas": "assets/eco-canvas-real.jpeg",
  "Canvas Cushion": "assets/cushion.png",
  "Jigsaw Puzzle — 30 pieces": "assets/jigsaw-30.png",
  "Jigsaw Puzzle — 110 pieces": "assets/jigsaw-110.png",
  "Jigsaw Puzzle — 252 pieces": "assets/jigsaw-252.png",
  "Jigsaw Puzzle — 500 pieces": "assets/jigsaw-500.png",
  "Jigsaw Puzzle — 1000 pieces": "assets/jigsaw-1000.png",
  "Tough Phone Case": "assets/phone-case.png",
  "Custom Temporary Tattoo": "assets/tattoo.png",
  "Custom Playing Cards": "assets/playing-cards.png",
};

export function getProductImageUrl(productName: string): string | undefined {
  const filename = PRODUCT_IMAGE_MAP[productName];
  if (!filename) return undefined;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${filename}`;
}
