// ── ONJJEM US shop ───────────────────────────────────────────────────────────
// Everything sold on onjjem.com/us. Prices are in US cents and charged in USD.
// Every SKU here is made in Prodigi's US labs and shipped inside the US, so
// there are no customs charges for the customer.
//
// Costs below are from Prodigi price lists with Destination = United States
// (checked 2026-10-01). Profit rule: still in profit after the 12% bundle
// discount and Stripe's international card fee (~4.5% + 20p).

import type { ProdigiProduct } from "./fulfilment/prodigi";

export const US_SKU_PRICES: Record<string, { name: string; priceCents: number }> = {
  // Fleece blankets — cost $20/$35/$50 + $12.95 shipping
  "US-BLANKET-S": { name: "Photo Fleece Blanket, Small 30x40\"", priceCents: 4999 },
  "US-BLANKET-M": { name: "Photo Fleece Blanket, Medium 50x60\"", priceCents: 6999 },
  "US-BLANKET-L": { name: "Photo Fleece Blanket, Large 60x80\"", priceCents: 8999 },

  // Photo candles — cost $28 + $6.45 shipping
  "US-CANDLE-OCEAN": { name: "Photo Candle, Ocean Mist & Moss (11oz)", priceCents: 4499 },
  "US-CANDLE-FIG": { name: "Photo Candle, White Tea & Fig (11oz)", priceCents: 4499 },

  // Wall clock — cost $22 + $6.45 shipping
  "US-CLOCK-BLACK": { name: "Photo Wall Clock 10\", Black Frame", priceCents: 4499 },
  "US-CLOCK-WHITE": { name: "Photo Wall Clock 10\", White Frame", priceCents: 4499 },
  "US-CLOCK-NATURAL": { name: "Photo Wall Clock 10\", Natural Wood Frame", priceCents: 4499 },

  // Photo prints (archival Pro paper) and matte posters
  "US-PRINT-8X10": { name: "Photo Print 8x10\"", priceCents: 1999 },     // $4 + $6.70
  "US-PRINT-12X16": { name: "Photo Print 12x16\"", priceCents: 2999 },   // $10 + $6.70
  "US-PRINT-16X20": { name: "Photo Print 16x20\"", priceCents: 3499 },   // $12 + $9.20
  "US-POSTER-18X24": { name: "Matte Poster 18x24\"", priceCents: 3999 }, // $17 + $7.10
  "US-POSTER-24X36": { name: "Matte Poster 24x36\"", priceCents: 5499 }, // $22 + $14.65

  // White ceramic photo mugs — 11oz $10 / 15oz $11 + $6.45 shipping
  "US-MUG-11": { name: "Photo Mug, 11oz White Ceramic", priceCents: 2499 },
  "US-MUG-15": { name: "Photo Mug, 15oz White Ceramic", priceCents: 2799 },

  // Pickleball paddles — cost $20 / $40 + $14 shipping
  "US-PADDLE-1": { name: "Photo Pickleball Paddle", priceCents: 4999 },
  "US-PADDLE-2": { name: "Photo Pickleball Paddle Set (2 paddles)", priceCents: 7999 },
};

export const US_PRODIGI_PRODUCTS: Record<string, ProdigiProduct> = {
  "US-BLANKET-S": { sku: "GLOBAL-BLANKET-PREMIUM-FLEECE-30X40", sizing: "fillPrintArea" },
  "US-BLANKET-M": { sku: "GLOBAL-BLANKET-PREMIUM-FLEECE-50X60", sizing: "fillPrintArea" },
  "US-BLANKET-L": { sku: "GLOBAL-BLANKET-PREMIUM-FLEECE-60X80", sizing: "fillPrintArea" },

  "US-CANDLE-OCEAN": { sku: "CANDLE-OCE-MIS-MOS", sizing: "fillPrintArea" },
  "US-CANDLE-FIG": { sku: "CANDLE-WHI-TEA-FIG", sizing: "fillPrintArea" },

  // ⚠️ Colour attribute values copied from the US price list; confirm with a test order.
  "US-CLOCK-BLACK": { sku: "WALL-CLOCK-10X10", sizing: "fillPrintArea", attributes: { color: "black" } },
  "US-CLOCK-WHITE": { sku: "WALL-CLOCK-10X10", sizing: "fillPrintArea", attributes: { color: "white" } },
  "US-CLOCK-NATURAL": { sku: "WALL-CLOCK-10X10", sizing: "fillPrintArea", attributes: { color: "natural" } },

  "US-PRINT-8X10": { sku: "GLOBAL-PHO-8X10-PRO", sizing: "fillPrintArea", attributes: { finish: "Lustre" }, shipping: "Budget" },
  "US-PRINT-12X16": { sku: "GLOBAL-PHO-12X16-PRO", sizing: "fillPrintArea", attributes: { finish: "Lustre" }, shipping: "Budget" },
  "US-PRINT-16X20": { sku: "GLOBAL-PHO-16X20-PRO", sizing: "fillPrintArea", attributes: { finish: "Lustre" }, shipping: "Budget" },
  "US-POSTER-18X24": { sku: "GLOBAL-FAP-18X24", sizing: "fillPrintArea", shipping: "Budget" },
  "US-POSTER-24X36": { sku: "GLOBAL-FAP-24X36", sizing: "fillPrintArea", shipping: "Budget" },

  "US-MUG-11": { sku: "GLOBAL-MUG-W", sizing: "fillPrintArea" },
  "US-MUG-15": { sku: "H-MUG-CERAMIC-150Z", sizing: "fillPrintArea" },

  "US-PADDLE-1": { sku: "PICKLE-SGL", sizing: "fillPrintArea" },
  "US-PADDLE-2": { sku: "PICKLE-SET", sizing: "fillPrintArea" },
};

// ── US clothing (Prodigi US labs, Destination = United States, 2026-10-01) ──
// SKU format: <code>-<size>-<colour>, e.g. US-KTEE-M-ORANGE.
// Colour/size values are copied exactly from Prodigi's US price lists.
type Garment = {
  code: string;
  prodigiSku: string;
  name: string;
  priceCents: number;
  sizes: [string, string][];   // [our code, Prodigi value]
  colours: [string, string][]; // [our code, Prodigi value]
};

export const US_GARMENTS: Garment[] = [
  { // Gildan 64000B kids tee — $11 + $6.75
    code: "US-KTEE", prodigiSku: "GLOBAL-TEE-GIL-64000B", name: "Kids' Cartoon T-Shirt", priceCents: 2499,
    sizes: [["XS", "xs"], ["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"]],
    colours: [["BLACK", "black"], ["ORANGE", "orange"], ["PURPLE", "purple"], ["WHITE", "white"], ["GREY", "sport grey"], ["NAVY", "navy blue"], ["RED", "red"]],
  },
  { // Rabbit Skins 3321 toddler tee — $10–11 + $6.75
    code: "US-TTEE", prodigiSku: "GLOBAL-TEE-RS-3321", name: "Toddler Cartoon T-Shirt", priceCents: 2499,
    sizes: [["2T", "2-3 years"], ["3T", "3-4 years"], ["4T", "4-5 years"], ["5T", "5-6 years"]],
    colours: [["BLACK", "black"], ["ORANGE", "orange"], ["PURPLE", "purple"], ["WHITE", "white"], ["PINK", "pink"], ["ROYAL", "royal blue"]],
  },
  { // Rabbit Skins 3322 baby tee — $11 + $6.75
    code: "US-BTEE", prodigiSku: "GLOBAL-TEE-RS-3322", name: "Baby Cartoon T-Shirt", priceCents: 2499,
    sizes: [["6M", "6-12 months"], ["12M", "12-18 months"]],
    colours: [["WHITE", "white"], ["BLACK", "black"], ["PINK", "pink"], ["LTBLUE", "light blue"]],
  },
  { // District DT6000 adult tee — $11–13 + $10.75
    code: "US-ATEE", prodigiSku: "TEE-DC-DT6000", name: "Adult Cartoon T-Shirt", priceCents: 2999,
    sizes: [["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"], ["2XL", "2xl"], ["3XL", "3xl"]],
    colours: [["BLACK", "black"], ["WHITE", "white"], ["PURPLE", "purple"], ["RED", "classic red"], ["GREEN", "forest green"], ["NAVY", "navy blue"], ["GREY", "light grey heather"]],
  },
  { // Gildan 18500 adult hoodie — $19–26 + $6.75
    code: "US-AHOOD", prodigiSku: "HOOD-GIL-18500", name: "Adult Cartoon Hoodie", priceCents: 4499,
    sizes: [["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"], ["2XL", "2xl"], ["3XL", "3xl"]],
    colours: [["RED", "fire red"], ["GREEN", "kelly green"], ["NAVY", "oxford navy"], ["BLACK", "black"], ["WHITE", "arctic white"], ["ORANGE", "orange"], ["GREY", "heather grey"]],
  },
  { // Gildan 18500B kids hoodie — $21 + $6.75
    code: "US-KHOOD", prodigiSku: "GLOBAL-HOOD-GIL-18500B", name: "Kids' Cartoon Hoodie", priceCents: 3999,
    sizes: [["XS", "xs"], ["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"]],
    colours: [["RED", "red"], ["NAVY", "navy blue"], ["WHITE", "arctic white"], ["ORANGE", "orange"], ["PURPLE", "purple"], ["GREY", "dark heather grey"]],
  },
];

for (const g of US_GARMENTS) {
  for (const [sz, prodigiSize] of g.sizes) {
    for (const [col, prodigiColour] of g.colours) {
      const sku = `${g.code}-${sz}-${col}`;
      US_SKU_PRICES[sku] = { name: `${g.name} (${sz}, ${prodigiColour})`, priceCents: g.priceCents };
      US_PRODIGI_PRODUCTS[sku] = {
        sku: g.prodigiSku,
        sizing: "fitPrintArea",
        attributes: { color: prodigiColour, size: prodigiSize },
      };
    }
  }
}
