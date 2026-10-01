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

  "US-PADDLE-1": { sku: "PICKLE-SGL", sizing: "fillPrintArea" },
  "US-PADDLE-2": { sku: "PICKLE-SET", sizing: "fillPrintArea" },
};
