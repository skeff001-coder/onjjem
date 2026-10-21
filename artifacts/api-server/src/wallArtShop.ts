// ── Wall art upgrade + UK baby/kids clothing (added 21 Oct 2026) ─────────────
// Costs from Prodigi price lists (GB and US, Oct 2026), Budget shipping.
// UK prices include VAT on Prodigi's cost; US has no VAT.
import type { ProdigiProduct } from "./fulfilment/prodigi";

export const WALL_SKU_PRICES: Record<string, { name: string; pricePence: number }> = {};
export const WALL_US_PRICES: Record<string, { name: string; priceCents: number }> = {};
export const WALL_PRODIGI_PRODUCTS: Record<string, ProdigiProduct> = {};

const FRAMES: [string, string, string][] = [["BLACK", "black", "Black"], ["WHITE", "white", "White"], ["NATURAL", "natural", "Natural wood"]];

// ── Stretched canvas (mirror-wrapped edges so faces are never cut off) ───────
// UK: 12x12 £19+£6.75 · A3 £20+£10.75 · A2 £30+£10.75 · A1 £46+£13.45 · 24x36 £48+£13.45 (+VAT)
const UK_CANVAS: [string, string, string, number][] = [
  ["canvas-12x12", "GLOBAL-CAN-12X12", "Photo Canvas 12x12\" (30x30cm)", 3999],
  ["canvas-a3", "GLOBAL-CAN-A3", "Photo Canvas A3 (30x42cm)", 4499],
  ["canvas-a2", "GLOBAL-CAN-A2", "Photo Canvas A2 (42x59cm)", 5999],
  ["canvas-a1", "GLOBAL-CAN-A1", "Large Photo Canvas A1 (59x84cm)", 8499],
  ["canvas-24x36", "GLOBAL-CAN-24X36", "Extra Large Photo Canvas 24x36\" (61x91cm)", 8999],
];
// US: 12x12 $24+$24.80 · 16x20 $35+$25.90 · 20x30 $50+$32.35 · 24x36 $60+$34.55
const US_CANVAS: [string, string, string, number][] = [
  ["US-CAN-12X12", "GLOBAL-CAN-12X12", "Photo Canvas 12x12\"", 6499],
  ["US-CAN-16X20", "GLOBAL-CAN-16X20", "Photo Canvas 16x20\"", 7499],
  ["US-CAN-20X30", "GLOBAL-CAN-20X30", "Large Photo Canvas 20x30\"", 9999],
  ["US-CAN-24X36", "GLOBAL-CAN-24X36", "Extra Large Photo Canvas 24x36\"", 11499],
];
for (const [code, sku, name, price] of UK_CANVAS) {
  WALL_SKU_PRICES[code] = { name, pricePence: price };
  WALL_PRODIGI_PRODUCTS[code] = { sku, sizing: "fillPrintArea", attributes: { wrap: "MirrorWrap" }, shipping: "Budget" };
}
for (const [code, sku, name, price] of US_CANVAS) {
  WALL_US_PRICES[code] = { name, priceCents: price };
  WALL_PRODIGI_PRODUCTS[code] = { sku, sizing: "fillPrintArea", attributes: { wrap: "MirrorWrap" }, shipping: "Budget" };
}

// ── Poster hangers (wooden rails top and bottom, with hanging cord) ──────────
// UK: A4 £8 · 12x12 £10 · A3 £11 · A2 £14, all + £5.35 Budget (+VAT)
const UK_HANGERS: [string, string, string, number][] = [
  ["hanger-a4", "POSTER-HANGER-20-A4-PORT", "Photo Poster Hanger A4", 2499],
  ["hanger-12x12", "POSTER-HANGER-30-12X12-SQUARE", "Photo Poster Hanger 12x12\"", 2799],
  ["hanger-a3", "POSTER-HANGER-30-A3-PORT", "Photo Poster Hanger A3", 2999],
  ["hanger-a2", "POSTER-HANGER-40-A2-PORT", "Photo Poster Hanger A2", 3999],
];
// US: 8x10 $10 · 12x12 $11 · 11x14 $12 · 16x20 $16 · 18x24 $19, all + $15.10
const US_HANGERS: [string, string, string, number][] = [
  ["US-HANG-8X10", "POSTER-HANGER-20-8X10-PORT", "Photo Poster Hanger 8x10\"", 3999],
  ["US-HANG-12X12", "POSTER-HANGER-30-12X12-SQUARE", "Photo Poster Hanger 12x12\"", 3999],
  ["US-HANG-11X14", "POSTER-HANGER-30-11X14-PORT", "Photo Poster Hanger 11x14\"", 4499],
  ["US-HANG-16X20", "POSTER-HANGER-40-16X20-PORT", "Photo Poster Hanger 16x20\"", 5499],
  ["US-HANG-18X24", "POSTER-HANGER-50-18X24-PORT", "Photo Poster Hanger 18x24\"", 5999],
];
for (const [code, sku, name, price] of UK_HANGERS) for (const [c, colour, label] of FRAMES) {
  WALL_SKU_PRICES[`${code}-${c}`] = { name: `${name} (${label} hanger)`, pricePence: price };
  WALL_PRODIGI_PRODUCTS[`${code}-${c}`] = { sku, sizing: "fillPrintArea", attributes: { color: colour }, shipping: "Budget" };
}
for (const [code, sku, name, price] of US_HANGERS) for (const [c, colour, label] of FRAMES) {
  WALL_US_PRICES[`${code}-${c}`] = { name: `${name} (${label} hanger)`, priceCents: price };
  WALL_PRODIGI_PRODUCTS[`${code}-${c}`] = { sku, sizing: "fillPrintArea", attributes: { color: colour }, shipping: "Budget" };
}

// ── UK baby T-shirt (Rabbit Skins 3322) £8–9 + £2.25 · kids hoodie (AWDis JH001B) £16 + £2.25 ──
const UK_GARMENTS = [
  { code: "BTEE-UK", prodigiSku: "GLOBAL-TEE-RS-3322", name: "Baby Photo T-Shirt", price: 1799,
    sizes: [["NB", "newborn"], ["6M", "6-12 months"], ["12M", "12-18 months"], ["18M", "18-24 months"]],
    colours: [["WHITE", "white"], ["PINK", "pink"], ["LTBLUE", "light blue"], ["HEATHER", "heather"], ["BUTTER", "butter"], ["NAVY", "navy blue"]] },
  { code: "KHOOD-UK", prodigiSku: "HOOD-AWD-JH001B", name: "Kids' Photo Hoodie", price: 2799,
    sizes: [["3Y", "3-4 years"], ["5Y", "5-6 years"], ["7Y", "7-8 years"], ["9Y", "9-11 years"], ["12Y", "12-13 years"]],
    colours: [["WHITE", "arctic white"], ["GREY", "heather grey"], ["NAVY", "oxford navy"], ["BLACK", "black"], ["RED", "fire red"], ["ROYAL", "royal blue"], ["SKY", "sky blue"]] },
];
for (const g of UK_GARMENTS) for (const [sz, prodigiSize] of g.sizes) for (const [col, prodigiColour] of g.colours) {
  const code = `${g.code}-${sz}-${col}`;
  WALL_SKU_PRICES[code] = { name: `${g.name} (${prodigiSize}, ${prodigiColour})`, pricePence: g.price };
  WALL_PRODIGI_PRODUCTS[code] = { sku: g.prodigiSku, sizing: "fitPrintArea", attributes: { color: prodigiColour, size: prodigiSize }, shipping: "Budget" };
}
