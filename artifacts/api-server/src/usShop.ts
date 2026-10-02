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

  // Photo candles — cost $28 + $6.45 shipping (+ US sales tax Prodigi may add). Priced near cost, so no bundle discount on these.
  "US-CANDLE-OCEAN": { name: "Photo Candle, Ocean Mist & Moss (11oz)", priceCents: 4199 },
  "US-CANDLE-FIG": { name: "Photo Candle, White Tea & Fig (11oz)", priceCents: 4199 },

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

  // Trick-or-treat pillowcase, standard 30x22" — cost $18 + $12.95 shipping
  "US-PILLOWCASE": { name: "Photo Pillowcase (Standard 30x22\")", priceCents: 3999 },

  // Mouse mat 8x10" — cost $8 + $6.45 tracked shipping
  "US-MOUSEMAT": { name: "Photo Mouse Mat (8x10\")", priceCents: 2299 },

  // Tumblers & bottles — cost: 20oz straw tumbler $16, 22oz tumbler $22, 32oz bottle $14, + $6.45 tracked
  "US-TUMB20-WHITE": { name: "Photo Tumbler with Straw 20oz (white)", priceCents: 3499 },
  "US-TUMB20-BLACK": { name: "Photo Tumbler with Straw 20oz (black)", priceCents: 3499 },
  "US-TUMB22-WHITE": { name: "Insulated Photo Tumbler 22oz (white)", priceCents: 3999 },
  "US-TUMB22-BLACK": { name: "Insulated Photo Tumbler 22oz (black)", priceCents: 3999 },
  "US-TUMB22-RED": { name: "Insulated Photo Tumbler 22oz (red)", priceCents: 3999 },
  "US-TUMB22-NAVY": { name: "Insulated Photo Tumbler 22oz (navy)", priceCents: 3999 },
  "US-TUMB22-GREY": { name: "Insulated Photo Tumbler 22oz (grey)", priceCents: 3999 },
  "US-BOTTLE32-WHITE": { name: "Insulated Photo Water Bottle 32oz (white)", priceCents: 3299 },
  "US-BOTTLE32-BLACK": { name: "Insulated Photo Water Bottle 32oz (black)", priceCents: 3299 },
  "US-BOTTLE32-NAVY": { name: "Insulated Photo Water Bottle 32oz (navy)", priceCents: 3299 },
  "US-BOTTLE32-BLUE": { name: "Insulated Photo Water Bottle 32oz (blue)", priceCents: 3299 },

  // Quilted photo bedspreads — cost Twin $58+$17.25, Full $65+$12.95, Queen $73+$17.25, King $85+$17.25
  "US-SPREAD-TWIN": { name: "Photo Quilted Bedspread, Twin 68x88\"", priceCents: 11999 },
  "US-SPREAD-FULL": { name: "Photo Quilted Bedspread, Full 79x79\"", priceCents: 12999 },
  "US-SPREAD-QUEEN": { name: "Photo Quilted Bedspread, Queen 88x88\"", priceCents: 14999 },
  "US-SPREAD-KING": { name: "Photo Quilted Bedspread, King 104x88\"", priceCents: 16999 },

  // Shower curtains 71x74" — no liner $45 / with PVC liner $54, + $12.95 tracked
  "US-CURTAIN": { name: "Photo Shower Curtain 71x74\"", priceCents: 7999 },
  "US-CURTAIN-LINER": { name: "Photo Shower Curtain 71x74\" with Liner", priceCents: 8999 },

  // Woven tote 17x18" — cost $28 + $12.95 shipping. Near cost, so no bundle discount.
  "US-TOTE": { name: "Woven Photo Tote Bag 17x18\"", priceCents: 4599 },

  // Printed wall tapestries (microfiber, hemmed) — cost XS $16+$12.95, S $25+$12.95, M $35+$12.95, L $53+$17.25
  "US-TAP-XS": { name: "Photo Wall Tapestry, Extra Small 26x36\"", priceCents: 4499 },
  "US-TAP-S": { name: "Photo Wall Tapestry, Small 51x60\"", priceCents: 5499 },
  "US-TAP-M": { name: "Photo Wall Tapestry, Medium 68x80\"", priceCents: 6999 },
  "US-TAP-L": { name: "Photo Wall Tapestry, Large 88x104\"", priceCents: 9999 },

  // Golf balls, 6-pack — cost $40 + $14 shipping (+ US sales tax Prodigi may add). Priced near cost to win customers,
  // so they are excluded from the bundle discount (see NO_BUNDLE_DISCOUNT).
  "US-GOLF-6": { name: "Photo Golf Balls (6-pack)", priceCents: 6299 },

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

  "US-MOUSEMAT": { sku: "H-MOUSEMAT", sizing: "fillPrintArea" },
  "US-PILLOWCASE": { sku: "GLOBAL-PLWCASE-TAUPE-30X22-STD", sizing: "fillPrintArea" },

  "US-TUMB20-WHITE": { sku: "H-TUMBLER-20OZ", sizing: "fillPrintArea", attributes: { color: "white" } },
  "US-TUMB20-BLACK": { sku: "H-TUMBLER-20OZ", sizing: "fillPrintArea", attributes: { color: "black" } },
  "US-TUMB22-WHITE": { sku: "H-TUMBLER-22OZ", sizing: "fillPrintArea", attributes: { color: "white" } },
  "US-TUMB22-BLACK": { sku: "H-TUMBLER-22OZ", sizing: "fillPrintArea", attributes: { color: "black" } },
  "US-TUMB22-RED": { sku: "H-TUMBLER-22OZ", sizing: "fillPrintArea", attributes: { color: "red" } },
  "US-TUMB22-NAVY": { sku: "H-TUMBLER-22OZ", sizing: "fillPrintArea", attributes: { color: "navy" } },
  "US-TUMB22-GREY": { sku: "H-TUMBLER-22OZ", sizing: "fillPrintArea", attributes: { color: "grey" } },
  "US-BOTTLE32-WHITE": { sku: "950ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "white" } },
  "US-BOTTLE32-BLACK": { sku: "950ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "black" } },
  "US-BOTTLE32-NAVY": { sku: "950ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "navy" } },
  "US-BOTTLE32-BLUE": { sku: "950ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "blue" } },

  "US-SPREAD-TWIN": { sku: "GLOBAL-SPREAD-GREY-68X88", sizing: "fillPrintArea" },
  "US-SPREAD-FULL": { sku: "GLOBAL-SPREAD-GREY-79X79", sizing: "fillPrintArea" },
  "US-SPREAD-QUEEN": { sku: "GLOBAL-SPREAD-GREY-88X88", sizing: "fillPrintArea" },
  "US-SPREAD-KING": { sku: "GLOBAL-SPREAD-GREY-104X88", sizing: "fillPrintArea" },

  "US-CURTAIN": { sku: "GLOBAL-SHOWER-NOLINER-71X74", sizing: "fillPrintArea" },
  "US-CURTAIN-LINER": { sku: "H-SHOWER-LINER-71X74", sizing: "fillPrintArea" },

  "US-TAP-XS": { sku: "GLOBAL-TAP-XS", sizing: "fillPrintArea" },
  "US-TAP-S": { sku: "GLOBAL-TAP-S", sizing: "fillPrintArea" },
  "US-TAP-M": { sku: "GLOBAL-TAP-M", sizing: "fillPrintArea" },
  "US-TAP-L": { sku: "GLOBAL-TAP-L", sizing: "fillPrintArea" },

  "US-GOLF-6": { sku: "GOLF-BALLS-6", sizing: "fillPrintArea" },
  "US-TOTE": { sku: "GLOBAL-TOTE-17X18", sizing: "fillPrintArea" },

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
    code: "US-KTEE", prodigiSku: "GLOBAL-TEE-GIL-64000B", name: "Kids' Photo T-Shirt", priceCents: 2499,
    sizes: [["XS", "xs"], ["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"]],
    colours: [["BLACK", "black"], ["ORANGE", "orange"], ["PURPLE", "purple"], ["WHITE", "white"], ["GREY", "sport grey"], ["NAVY", "navy blue"], ["RED", "red"]],
  },
  { // Rabbit Skins 3321 toddler tee — $10–11 + $6.75
    code: "US-TTEE", prodigiSku: "GLOBAL-TEE-RS-3321", name: "Toddler Photo T-Shirt", priceCents: 2499,
    sizes: [["2T", "2-3 years"], ["3T", "3-4 years"], ["4T", "4-5 years"], ["5T", "5-6 years"]],
    colours: [["BLACK", "black"], ["ORANGE", "orange"], ["PURPLE", "purple"], ["WHITE", "white"], ["PINK", "pink"], ["ROYAL", "royal blue"]],
  },
  { // Rabbit Skins 3322 baby tee — $11 + $6.75
    code: "US-BTEE", prodigiSku: "GLOBAL-TEE-RS-3322", name: "Baby Photo T-Shirt", priceCents: 2499,
    sizes: [["6M", "6-12 months"], ["12M", "12-18 months"]],
    colours: [["WHITE", "white"], ["BLACK", "black"], ["PINK", "pink"], ["LTBLUE", "light blue"]],
  },
  { // District DT6000 adult tee — $11–13 + $10.75
    code: "US-ATEE", prodigiSku: "TEE-DC-DT6000", name: "Adult Photo T-Shirt", priceCents: 2999,
    sizes: [["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"], ["2XL", "2xl"], ["3XL", "3xl"]],
    colours: [["BLACK", "black"], ["WHITE", "white"], ["PURPLE", "purple"], ["RED", "classic red"], ["GREEN", "forest green"], ["NAVY", "navy blue"], ["GREY", "light grey heather"]],
  },
  { // Gildan 18500 adult hoodie — $19–26 + $6.75
    code: "US-AHOOD", prodigiSku: "HOOD-GIL-18500", name: "Adult Photo Hoodie", priceCents: 4499,
    sizes: [["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"], ["2XL", "2xl"], ["3XL", "3xl"]],
    colours: [["RED", "fire red"], ["GREEN", "kelly green"], ["NAVY", "oxford navy"], ["BLACK", "black"], ["WHITE", "arctic white"], ["ORANGE", "orange"], ["GREY", "heather grey"]],
  },
  { // Gildan 18000B kids crew sweatshirt — $15–16 + $6.75
    code: "US-KSWEAT", prodigiSku: "GLOBAL-SWEAT-GIL-18000B", name: "Kids' Christmas Sweatshirt", priceCents: 3299,
    sizes: [["XS", "xs"], ["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"]],
    colours: [["RED", "red"], ["NAVY", "navy blue"], ["WHITE", "white"], ["BLACK", "black"], ["GREY", "heather grey"]],
  },
  { // Gildan 18500B kids hoodie — $21 + $6.75
    code: "US-KHOOD", prodigiSku: "GLOBAL-HOOD-GIL-18500B", name: "Kids' Photo Hoodie", priceCents: 3999,
    // No XS: Prodigi US only makes XS in light pink.
    sizes: [["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"]],
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

// Low-margin products: they count towards the bundle deal, but the discount
// is only taken off the other gifts in the basket.
export const NO_BUNDLE_DISCOUNT = (sku: string) => sku.startsWith("US-GOLF") || sku.startsWith("US-CANDLE") || sku === "US-TOTE" || sku === "xmas-sack" || sku === "trick-bag" || sku.startsWith("FTEE-");
