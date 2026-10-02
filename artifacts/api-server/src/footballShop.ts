// ── UK kids' town football T-shirts ─────────────────────────────────────────
// Town names in team colours, with the child's name and number. No club names,
// crests, nicknames or official fonts (see onjjem_football_spec).
// Gildan 64000B kids tee, UK lab: £8–9 + £2.25 Budget, +VAT = max £13.50.
// Cost £8-9 +20% VAT +£2.25 Budget ship ≈ £12.30-13.50. £15.99 ≈ £2 profit, so bundle-exempt.
import type { ProdigiProduct } from "./fulfilment/prodigi";

export const FOOTBALL_TOWNS: [code: string, town: string, shirt: string][] = [
  ["PRE", "Preston", "white"],
  ["LIV", "Liverpool", "red"],
  ["MANR", "Manchester (red)", "red"],
  ["MANB", "Manchester (sky blue)", "light blue"],
  ["NEW", "Newcastle", "white"],
  ["BIR", "Birmingham", "royal blue"],
  ["LEE", "Leeds", "white"],
  ["SHE", "Sheffield", "white"],
  ["LEI", "Leicester", "royal blue"],
  ["NOT", "Nottingham", "red"],
];
const SIZES: [string, string][] = [["3Y", "3-4 years"], ["5Y", "5-6 years"], ["7Y", "7-8 years"], ["9Y", "9-11 years"], ["12Y", "12-13 years"]];

export const FOOTBALL_SKU_PRICES: Record<string, { name: string; pricePence: number }> = {};
export const FOOTBALL_PRODIGI_PRODUCTS: Record<string, ProdigiProduct> = {};
for (const [code, town, shirt] of FOOTBALL_TOWNS) {
  for (const [sz, prodigiSize] of SIZES) {
    const sku = `FTEE-${code}-${sz}`;
    FOOTBALL_SKU_PRICES[sku] = { name: `Kids' ${town} Football T-Shirt (${prodigiSize}, ${shirt})`, pricePence: 1599 };
    FOOTBALL_PRODIGI_PRODUCTS[sku] = {
      sku: "GLOBAL-TEE-GIL-64000B",
      sizing: "fitPrintArea",
      attributes: { color: shirt, size: prodigiSize },
      shipping: "Budget",
    };
  }
}
