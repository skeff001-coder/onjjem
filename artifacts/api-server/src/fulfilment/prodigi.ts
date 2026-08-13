/**
 * Prodigi print-on-demand fulfilment module.
 *
 * Prodigi auto-prints and ships each customer's uploaded photo with ZERO manual
 * work — exactly the hands-off flow we want. After a Stripe payment clears, the
 * webhook calls fulfilOrder() which:
 *   1. Uploads the customer's restored photo to object storage and gets a
 *      publicly-downloadable signed URL (Prodigi downloads the image from it).
 *   2. Submits the order to the Prodigi Print API.
 *   3. Records the order in `fulfilment_queue` as an audit trail.
 *
 * When PRODIGI_API_KEY is NOT set, every order is queued so nothing is lost —
 * the order is recorded and an admin email is sent.
 *
 * Sandbox base:  https://api.sandbox.prodigi.com   (no charge, not produced)
 * Live base:     https://api.prodigi.com           (real, produced & shipped)
 * Docs:          https://www.prodigi.com/print-api/docs/reference/
 *
 * All SKUs validated against the LIVE Prodigi API on 2026-06-01.
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { ObjectStorageService } from "../lib/objectStorage";

// ── SKU → Prodigi product mapping ────────────────────────────────────────────
// Maps our website SKU to a Prodigi product SKU (+ optional copies/attributes).
//
//   sizing:      "fillPrintArea" (recommended) crops to fill; "fitPrintArea" letterboxes.
//   attributes:  product-specific options (e.g. wrap, color) — required by Prodigi.
//   printAreas:  list of print area names to render. Defaults to ["default"].
//                Jigsaws require ["jigsaw", "lid"] — customer photo is printed on both.
//
export interface ProdigiProduct {
  sku: string;
  copies?: number;
  sizing?: "fillPrintArea" | "fitPrintArea";
  attributes?: Record<string, string>;
  printAreas?: string[]; // defaults to ["default"]; jigsaws need ["jigsaw","lid"]
}

export const PRODIGI_PRODUCTS: Record<string, ProdigiProduct> = {
  // ── Stretched Canvas ────────────────────────────────────────────────────────
  // SKU format: GLOBAL-CAN-{Ax} (A0–A5 standard sizes). wrap attribute required.
  // ⚠️ UNVALIDATED against live Prodigi API — pulled from Prodigi's product
  // page listing on 2026-08-02, not confirmed via Quotes API yet. Test one
  // real order per size before trusting this for customer checkout.
  "canvas-stretched-a5": { sku: "GLOBAL-CAN-A5", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "canvas-stretched-a4": { sku: "GLOBAL-CAN-A4", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "canvas-stretched-a3": { sku: "GLOBAL-CAN-A3", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "canvas-stretched-a2": { sku: "GLOBAL-CAN-A2", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "canvas-stretched-a1": { sku: "GLOBAL-CAN-A1", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "canvas-stretched-a0": { sku: "GLOBAL-CAN-A0", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },

  // ── Eco Canvas ──────────────────────────────────────────────────────────────
  // ECO-CAN-* requires wrap attribute (same as stretched canvas).
  "eco-canvas-8x12":  { sku: "ECO-CAN-8X12",  sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "eco-canvas-12x12": { sku: "ECO-CAN-12X12", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "eco-canvas-12x18": { sku: "ECO-CAN-12X18", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "eco-canvas-16x16": { sku: "ECO-CAN-16X16", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "eco-canvas-16x24": { sku: "ECO-CAN-16X24", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  // ⚠️ UNVALIDATED — follows the established ECO-CAN-{size} naming pattern
  // but not individually confirmed against the live API.
  "eco-canvas-20x20": { sku: "ECO-CAN-20X20", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "eco-canvas-20x30": { sku: "ECO-CAN-20X30", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },

  // ── Eco Rolled Canvas ───────────────────────────────────────────────────────
  // ECO-ROL-* unframed rolled prints, no attribute required.
  // 10x10, 12x12, 12x18 SKUs pre-existing/validated. The rest follow the
  // ── Eco Rolled Canvas ───────────────────────────────────────────────────────
  // ECO-ROL-* unframed rolled prints, no attribute required.
  // All 8 sizes CONFIRMED against Prodigi's own size/price listing.
  "eco-rolled-10x10": { sku: "ECO-ROL-10X10", sizing: "fillPrintArea" },
  "eco-rolled-10x12": { sku: "ECO-ROL-10X12", sizing: "fillPrintArea" },
  "eco-rolled-11x14": { sku: "ECO-ROL-11X14", sizing: "fillPrintArea" },
  "eco-rolled-12x12": { sku: "ECO-ROL-12X12", sizing: "fillPrintArea" },
  "eco-rolled-12x16": { sku: "ECO-ROL-12X16", sizing: "fillPrintArea" },
  "eco-rolled-12x18": { sku: "ECO-ROL-12X18", sizing: "fillPrintArea" },
  "eco-rolled-10x20": { sku: "ECO-ROL-10X20", sizing: "fillPrintArea" },
  "eco-rolled-12x24": { sku: "ECO-ROL-12X24", sizing: "fillPrintArea" },

  // These two are CONFIRMED (not guessed) - real SKUs from Prodigi's own
  // size/price listing. Note the actual dimensions are 17x23.4" and
  // 23x33.1", not an even 17x24"/23x34" - the display label reflects this.

  // ── Framed Photo Tiles ──────────────────────────────────────────────────────
  // PHOTIL-FRA-* requires color attribute: "white" | "black".
  "photo-tile-5x7":  { sku: "PHOTIL-FRA-0507", sizing: "fillPrintArea", attributes: { color: "black" } },
  "photo-tile-8x8":  { sku: "PHOTIL-FRA-0808", sizing: "fillPrintArea", attributes: { color: "black" } },
  "photo-tile-8x10": { sku: "PHOTIL-FRA-0810", sizing: "fillPrintArea", attributes: { color: "black" } },

  // ── Playing Cards ───────────────────────────────────────────────────────────
  "playing-cards": { sku: "PLAY-CARD", sizing: "fillPrintArea" },

  // ── Photo Mugs ──────────────────────────────────────────────────────────────
  // Validated against Prodigi live API on 2026-06-01.
  // GLOBAL-MUG-W: 11oz, multi-region (UK/US/DE), best for international orders.
  // H-MUG-15OZ-W: 15oz large ceramic, UK lab.
  "mug-11oz": { sku: "GLOBAL-MUG-W",  sizing: "fillPrintArea" },
  "mug-15oz": { sku: "H-MUG-15OZ-W", sizing: "fillPrintArea" },

  // ── Magic Photo Mug (heat-reveal colour-changing) ──────────────────────────
  // H-MUG-11OZ-CC: 11oz heat-activated gloss mug, confirmed via live Prodigi
  // order screenshot 2026-07. Was previously MISSING from this mapping
  // entirely, meaning every order for this product failed at fulfilment and
  // sat in fulfilment_queue as 'failed' rather than being sent to Prodigi —
  // check the queue for any past orders needing manual resubmission.
  "magic-mug": { sku: "H-MUG-11OZ-CC", sizing: "fillPrintArea" },

  // ── Pet Tags ─────────────────────────────────────────────────────────────────
  // Aluminium, dye-sublimated, UK lab. Both validated live on 2026-06-01.
  // PET-MET-ROUND: 3.2x3.9cm round tag, £5.00. PET-MET-BONE: 2.8x3.8cm bone, £5.00.
  "pet-tag-round": { sku: "PET-MET-ROUND", sizing: "fillPrintArea" },
  "pet-tag-bone":  { sku: "PET-MET-BONE",  sizing: "fillPrintArea" },

  // ── Tea Towels ───────────────────────────────────────────────────────────────
  // SKU prefix confirmed via Prodigi products API (/v4.0/products/H-TEATOWEL).
  // UK lab: 18.5x27.5" (50x70cm) cotton, £12.00 base. Sandbox returns
  // NotAvailable (sandbox limitation) but product is valid on live API.
  "tea-towel-poly":   { sku: "H-TEATOWEL-POLY-19_5X31_5",   sizing: "fillPrintArea" },
  "tea-towel-cotton": { sku: "H-TEATOWEL-COTTON-19_5X31_5", sizing: "fillPrintArea" },

  // ── Wooden Coasters ─────────────────────────────────────────────────────────
  // UK lab (H-COAST-*). All 4x4" square with cork underside.
  // Validated against Prodigi live API on 2026-06-01.
  "coaster-1pk": { sku: "H-COAST-1PK", sizing: "fillPrintArea" },
  "coaster-2pk": { sku: "H-COAST-2PK", sizing: "fillPrintArea" },
  "coaster-4pk": { sku: "H-COAST-4PK", sizing: "fillPrintArea" },
  "coaster-6pk": { sku: "H-COAST-6PK", sizing: "fillPrintArea" },

  // ── Magnets ─────────────────────────────────────────────────────────────────
  // All five SKUs validated against Prodigi live API on 2026-06-01.
  // ACR = acrylic fridge magnet, FRI = standard fridge magnet, MAG-1 = square.
  "magnet-acrylic-2x3":  { sku: "M-MAG-ACR-4X6",  sizing: "fillPrintArea" }, // 2"×3" acrylic
  "magnet-fridge-3x2":   { sku: "M-MAG-FRI-3X2",  sizing: "fillPrintArea" }, // 3"×2"
  "magnet-fridge-6x4":   { sku: "M-MAG-FRI-4X6",  sizing: "fillPrintArea" }, // 6"×4"
  "magnet-square-4x4":   { sku: "MAG-1-10X10",     sizing: "fillPrintArea" }, // 4"×4" (10×10cm)
  "magnet-square-6x6":   { sku: "MAG-1-15X15",     sizing: "fillPrintArea" }, // 6"×6" (15×15cm)

  // ── Jigsaw Puzzles ───────────────────────────────────────────────────────────
  // JIGSAW-PUZZLE-* SKUs validated against Prodigi live API on 2026-06-02.
  // All require printAreas: ["jigsaw", "lid"] — customer photo prints on both.
  "jigsaw-30":   { sku: "JIGSAW-PUZZLE-30",   sizing: "fillPrintArea", printAreas: ["jigsaw", "lid"] }, // 30pc, 250×200mm
  "jigsaw-110":  { sku: "JIGSAW-PUZZLE-110",  sizing: "fillPrintArea", printAreas: ["jigsaw", "lid"] }, // 110pc, 250×200mm
  "jigsaw-252":  { sku: "JIGSAW-PUZZLE-252",  sizing: "fillPrintArea", printAreas: ["jigsaw", "lid"] }, // 252pc, 375×285mm
  "jigsaw-500":  { sku: "JIGSAW-PUZZLE-500",  sizing: "fillPrintArea", printAreas: ["jigsaw", "lid"] }, // 500pc, 530×390mm
  "jigsaw-1000": { sku: "JIGSAW-PUZZLE-1000", sizing: "fillPrintArea", printAreas: ["jigsaw", "lid"] }, // 1000pc, 765×525mm

  // ── Temporary Tattoos ───────────────────────────────────────────────────────
  // GLOBAL-TATT-* SKUs validated against Prodigi live API on 2026-06-02.
  // Skin-safe waterslide film, lasts up to one week, easy to apply and remove.
  "tattoo-s":   { sku: "GLOBAL-TATT-S",   sizing: "fillPrintArea" }, // 2×3" (5×7.5cm)
  "tattoo-m":   { sku: "GLOBAL-TATT-M",   sizing: "fillPrintArea" }, // 3×4" (7.5×10cm)
  "tattoo-l":   { sku: "GLOBAL-TATT-L",   sizing: "fillPrintArea" }, // 4×6" (10×15cm)
  "tattoo-xl":  { sku: "GLOBAL-TATT-XL",  sizing: "fillPrintArea" }, // 8×8" (20×20cm)
  "tattoo-xxl": { sku: "GLOBAL-TATT-XXL", sizing: "fillPrintArea" }, // 12×12" (30×30cm)

  // ── Glow in the Dark Posters ───────────────────────────────────────
  // GLOBAL-GLOW-* SKUs from Prodigi catalog (2026-06-02).
  // Glow-in-the-dark photo posters that charge under light and glow at night.
  // All 5 sizes CONFIRMED against Prodigi's own listing - real prefix is
  // ART-GITD-*, not GLOBAL-GLOW-* as originally guessed (good thing this
  // got checked). Note 12x12 uses a metric SKU (305x305mm) and 28x39
  // actually ships as 28x40 - both are Prodigi's real naming, not a typo.
  // ── Museum-Grade Fine Art Print ──────────────────────────────────────────────
  // ART-FAP-SAP-* SKUs from Prodigi spec sheet (2026-08). Flat fine art print,
  // no attributes required.
  "art-print-5x7":   { sku: "ART-FAP-SAP-5X7",   sizing: "fillPrintArea" },
  "art-print-8x10":  { sku: "ART-FAP-SAP-8X10",  sizing: "fillPrintArea" },
  "art-print-11x14": { sku: "ART-FAP-SAP-11X14", sizing: "fillPrintArea" },
  "art-print-12x16": { sku: "ART-FAP-SAP-12X16", sizing: "fillPrintArea" },
  "art-print-24x32": { sku: "ART-FAP-SAP-24X32", sizing: "fillPrintArea" },
  "art-print-36x48": { sku: "ART-FAP-SAP-36X48", sizing: "fillPrintArea" },

  // ── Premium Metallic Foil Art Print ───────────────────────────────────────────
  // ART-FOIL-GOL-*/ART-FOIL-SIL-* SKUs from Prodigi spec sheet (2026-08). Colour
  // (Gold/Silver) is baked directly into the SKU itself, not a separate
  // attribute — each colour+size combination is its own distinct SKU.
  // ⚠️ Silver 24x24 SKU wasn't confirmed on the spec sheet — using the Gold
  // 24x24 SKU as the best guess. Verify with Prodigi before relying on this
  // one specifically for a real order.
  "art-foil-a4-gold":        { sku: "ART-FOIL-GOL-A4",     sizing: "fillPrintArea" },
  "art-foil-a4-silver":      { sku: "ART-FOIL-SIL-A4",     sizing: "fillPrintArea" },
  "art-foil-a3-gold":        { sku: "ART-FOIL-GOL-A3",     sizing: "fillPrintArea" },
  "art-foil-a3-silver":      { sku: "ART-FOIL-SIL-A3",     sizing: "fillPrintArea" },
  "art-foil-a2-gold":        { sku: "ART-FOIL-GOL-A2",     sizing: "fillPrintArea" },
  "art-foil-a2-silver":      { sku: "ART-FOIL-SIL-A2",     sizing: "fillPrintArea" },
  "art-foil-a1-gold":        { sku: "ART-FOIL-GOL-A1",     sizing: "fillPrintArea" },
  "art-foil-a1-silver":      { sku: "ART-FOIL-SIL-A1",     sizing: "fillPrintArea" },

  // ── Premium Glow in the Dark Poster (Specialist Range) ────────────────────────
  // ART-GITD-* SKUs from Prodigi spec sheet (2026-08). Same family prefix as
  // the standard glow poster above, but these are distinct, non-overlapping
  // size SKUs — confirmed no collision with the existing glow-* entries.
  "art-gitd-premium-a4":     { sku: "ART-GITD-A4",    sizing: "fillPrintArea" },
  "art-gitd-premium-a3":     { sku: "ART-GITD-A3",    sizing: "fillPrintArea" },
  "art-gitd-premium-a2":     { sku: "ART-GITD-A2",    sizing: "fillPrintArea" },

  // ── Rigid Display Board (Exoboard/Foamex) ─────────────────────────────────────
  // GLOBAL-EXOBOARD-* SKUs from Prodigi spec sheet (2026-08). Rigid PVC/foam
  // board, no attributes required for a standard rectangular print.
  "exoboard-200x300":  { sku: "GLOBAL-EXOBOARD-200X300",  sizing: "fillPrintArea" },
  "exoboard-297x420":  { sku: "GLOBAL-EXOBOARD-297X420",  sizing: "fillPrintArea" },
  "exoboard-400x500":  { sku: "GLOBAL-EXOBOARD-400X500",  sizing: "fillPrintArea" },
  "exoboard-450x600":  { sku: "GLOBAL-EXOBOARD-450X600",  sizing: "fillPrintArea" },
  "exoboard-594x841":  { sku: "GLOBAL-EXOBOARD-594X841",  sizing: "fillPrintArea" },
  "exoboard-600x800":  { sku: "GLOBAL-EXOBOARD-600X800",  sizing: "fillPrintArea" },
  "exoboard-700x1000": { sku: "GLOBAL-EXOBOARD-700X1000", sizing: "fillPrintArea" },
  "exoboard-841x1189": { sku: "GLOBAL-EXOBOARD-841X1189", sizing: "fillPrintArea" },
  "exoboard-210x297":  { sku: "GLOBAL-EXOBOARD-210X297",  sizing: "fillPrintArea" },
  "exoboard-300x400":  { sku: "GLOBAL-EXOBOARD-300X400",  sizing: "fillPrintArea" },

  // ── New products added this session (2026-08-13) ──────────────────────────────

  // Glow in the Dark Poster — A1 added, CONFIRMED (ART-GITD-A1, same family as A2-A4 above)
  "art-gitd-premium-a1": { sku: "ART-GITD-A1", sizing: "fillPrintArea" },

  // Budget Art Paper — SKUs CONFIRMED from real Prodigi basket screenshots
  "budget-art-paper-8x8": { sku: "ART-FAP-BAP-8X8", sizing: "fillPrintArea" },
  "budget-art-paper-12x16": { sku: "ART-FAP-BAP-12X16", sizing: "fillPrintArea" },
  "budget-art-paper-18x24": { sku: "ART-FAP-BAP-18X24", sizing: "fillPrintArea" },
  "budget-art-paper-40x40": { sku: "ART-FAP-BAP-40X40", sizing: "fillPrintArea" },

  // Budget Poster — consolidated product, replaces old budget-poster-a0..a5.
  // ⚠️ UNVALIDATED orientation attribute — same base SKU per size, distinguished
  // by an "orientation" attribute. Key/value names are a best guess following
  // the pattern used elsewhere in this file, not individually confirmed
  // against the live API. Test one order of each orientation before relying
  // on this for real customers.
  "budget-poster-a5-portrait":  { sku: "GLOBAL-BLP-A5", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a5-landscape": { sku: "GLOBAL-BLP-A5", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },
  "budget-poster-a4-portrait":  { sku: "GLOBAL-BLP-A4", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a4-landscape": { sku: "GLOBAL-BLP-A4", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },
  "budget-poster-a3-portrait":  { sku: "GLOBAL-BLP-A3", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a3-landscape": { sku: "GLOBAL-BLP-A3", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },
  "budget-poster-a2-portrait":  { sku: "GLOBAL-BLP-A2", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a2-landscape": { sku: "GLOBAL-BLP-A2", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },
  "budget-poster-a1-portrait":  { sku: "GLOBAL-BLP-A1", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a1-landscape": { sku: "GLOBAL-BLP-A1", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },
  "budget-poster-a0-portrait":  { sku: "GLOBAL-BLP-A0", sizing: "fillPrintArea", attributes: { orientation: "Portrait" } },
  "budget-poster-a0-landscape": { sku: "GLOBAL-BLP-A0", sizing: "fillPrintArea", attributes: { orientation: "Landscape" } },

  // Eco Rolled Canvas — 4 new larger sizes. 24x47/28x40 CONFIRMED from your
  // Prodigi screenshots (ECO-ROL-24X47, ECO-ROL-28X40). 16x20/20x20 follow
  // the same established ECO-ROL-{size} naming pattern but weren't
  // individually visible in your screenshots — check before a real order.
  "eco-rolled-16x20": { sku: "ECO-ROL-16X20", sizing: "fillPrintArea" },
  "eco-rolled-20x20": { sku: "ECO-ROL-20X20", sizing: "fillPrintArea" },
  "eco-rolled-24x47": { sku: "ECO-ROL-24X47", sizing: "fillPrintArea" },
  "eco-rolled-28x40": { sku: "ECO-ROL-28X40", sizing: "fillPrintArea" },

  // Photo Print — SKU CONFIRMED from real Prodigi test-checkout (GLOBAL-PHO-5X5, Gloss)
  "photo-print-5x5": { sku: "GLOBAL-PHO-5X5", sizing: "fillPrintArea", attributes: { finish: "Gloss" } },

  // Printed Shower Towel — SKU CONFIRMED from real Prodigi basket screenshot (H-TOW-SHWR)
  "printed-towel-shower": { sku: "H-TOW-SHWR", sizing: "fillPrintArea" },

  // Slim Canvas — replaces old sizes entirely. All 4 SKUs CONFIRMED from
  // your real Prodigi test-basket screenshots.
  "slim-canvas-6x6":   { sku: "GLOBAL-SLIMCAN-6X6",   sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "slim-canvas-12x12": { sku: "GLOBAL-SLIMCAN-12X12", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "slim-canvas-30x30": { sku: "GLOBAL-SLIMCAN-30X30", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },
  "slim-canvas-43x87": { sku: "GLOBAL-SLIMCAN-43X87", sizing: "fillPrintArea", attributes: { wrap: "ImageWrap" } },

  // Personalised Insulated Water Bottle — ⚠️ UNVALIDATED colour attribute.
  // Base SKU (650ML-WATER-BOTTLE) and the fact that colour is a dropdown
  // field were confirmed via your test checkout, but the exact attribute
  // key/values Prodigi's API expects are a best guess. Black/White
  // intentionally omitted — Prodigi lists them out of stock until Jan 2026.
  // Test one real order before relying on this for real customers.
  "water-bottle-copper-grey": { sku: "650ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "Grey" } },
  "water-bottle-copper-navy": { sku: "650ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "Navy" } },
  "water-bottle-copper-red":  { sku: "650ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "Red" } },
  "water-bottle-copper-lime": { sku: "650ML-WATER-BOTTLE", sizing: "fillPrintArea", attributes: { color: "Lime" } },
};


// ── Types ─────────────────────────────────────────────────────────────────────

export interface FulfilmentAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  postal_code: string;
  country: string;
}

export interface FulfilmentOrder {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  sku: string;
  customerEmail: string;
  shippingAddress: FulfilmentAddress;
  photoBase64: string; // full-resolution restored photo (raw base64 or data URL)
  amountPaid: number; // pence
  currency: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

function prodigiBaseUrl(): string {
  const env = (process.env.PRODIGI_ENV || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api.prodigi.com"
    : "https://api.sandbox.prodigi.com";
}

const SHIPPING_METHOD = process.env.PRODIGI_SHIPPING_METHOD || "Standard";

// ── Ensure queue table exists ─────────────────────────────────────────────────

export async function ensureFulfilmentTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fulfilment_queue (
      id              SERIAL PRIMARY KEY,
      stripe_session  TEXT NOT NULL UNIQUE,
      sku             TEXT NOT NULL,
      customer_email  TEXT NOT NULL,
      shipping_json   JSONB NOT NULL,
      amount_paid     INTEGER NOT NULL,
      currency        TEXT NOT NULL DEFAULT 'gbp',
      photo_stored    BOOLEAN NOT NULL DEFAULT false,
      bonus_card      BOOLEAN NOT NULL DEFAULT false,
      bol_order_id    TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      error           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Add bonus_card column for older deployments (idempotent)
  await db.execute(sql`
    ALTER TABLE fulfilment_queue ADD COLUMN IF NOT EXISTS bonus_card BOOLEAN NOT NULL DEFAULT false
  `);
}

// ── Convert the stored photo (raw base64 or data URL) to a public image URL ────

async function photoToPublicUrl(photoBase64: string): Promise<string> {
  let data = photoBase64.trim();
  let contentType = "image/jpeg";

  const dataUrlMatch = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1];
    data = dataUrlMatch[2];
  }

  const buffer = Buffer.from(data, "base64");
  if (buffer.length === 0) {
    throw new Error("Customer photo is empty — cannot create Prodigi order");
  }

  const storage = new ObjectStorageService();
  return storage.uploadBufferAndGetSignedUrl(buffer, { contentType });
}

// ── Submit order to Prodigi Print API ─────────────────────────────────────────

async function submitToProdigi(
  apiKey: string,
  order: FulfilmentOrder,
): Promise<string> {
  const product = PRODIGI_PRODUCTS[order.sku];
  if (!product) {
    throw new Error(
      `No Prodigi product mapped for SKU "${order.sku}". ` +
        `Add it to PRODIGI_PRODUCTS in prodigi.ts.`,
    );
  }

  const imageUrl = await photoToPublicUrl(order.photoBase64);

  // Build assets array — most products use a single "default" print area;
  // jigsaws (and any future multi-area products) need one entry per area.
  const printAreas = product.printAreas ?? ["default"];
  const assets = printAreas.map((area) => ({ printArea: area, url: imageUrl }));

  const items: {
    sku: string;
    copies: number;
    sizing: string;
    attributes?: Record<string, string>;
    assets: { printArea: string; url: string }[];
  }[] = [
    {
      sku: product.sku,
      copies: product.copies ?? 1,
      sizing: product.sizing ?? "fillPrintArea",
      ...(product.attributes ? { attributes: product.attributes } : {}),
      assets,
    },
  ];

  // ── Bonus: free playing cards on orders ≥ £50 ───────────────────────────
  const bonusCard = order.amountPaid >= 5000;
  if (bonusCard) {
    const cardProduct = PRODIGI_PRODUCTS["playing-cards"];
    if (cardProduct) {
      items.push({
        sku: cardProduct.sku,
        copies: 1,
        sizing: cardProduct.sizing ?? "fillPrintArea",
        assets,
      });
    }
  }

  const payload = {
    merchantReference: order.stripeSessionId,
    shippingMethod: SHIPPING_METHOD,
    recipient: {
      name: order.shippingAddress.name,
      email: order.customerEmail || undefined,
      address: {
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2 || undefined,
        townOrCity: order.shippingAddress.city,
        postalOrZipCode: order.shippingAddress.postal_code,
        countryCode: order.shippingAddress.country,
      },
    },
    items,
  };

  const resp = await fetch(`${prodigiBaseUrl()}/v4.0/orders`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Prodigi API error ${resp.status}: ${body.slice(0, 400)}`);
  }

  const data = (await resp.json()) as { order?: { id?: string } };
  const prodigiOrderId = data.order?.id;
  if (!prodigiOrderId) {
    throw new Error("Prodigi response missing order id");
  }
  return prodigiOrderId;
}

// ── Queue + status helpers ────────────────────────────────────────────────────

async function queueOrder(order: FulfilmentOrder): Promise<void> {
  const bonusCard = order.amountPaid >= 5000; // free playing cards on orders ≥ £50
  await db.execute(sql`
    INSERT INTO fulfilment_queue
      (stripe_session, sku, customer_email, shipping_json, amount_paid, currency, bonus_card, status)
    VALUES
      (${order.stripeSessionId}, ${order.sku}, ${order.customerEmail},
       ${JSON.stringify(order.shippingAddress)}::jsonb,
       ${order.amountPaid}, ${order.currency}, ${bonusCard}, 'pending')
    ON CONFLICT (stripe_session) DO NOTHING
  `);
}

async function markFulfilled(
  stripeSessionId: string,
  prodigiOrderId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE fulfilment_queue
    SET status = 'fulfilled', bol_order_id = ${prodigiOrderId}, updated_at = NOW()
    WHERE stripe_session = ${stripeSessionId}
  `);
}

async function markFailed(
  stripeSessionId: string,
  error: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE fulfilment_queue
    SET status = 'failed', error = ${error}, updated_at = NOW()
    WHERE stripe_session = ${stripeSessionId}
  `);
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Fulfil an order automatically via Prodigi.
 *
 * 1. Always writes the order to `fulfilment_queue` as an audit trail.
 * 2. If PRODIGI_API_KEY is set, immediately submits to Prodigi.
 * 3. If the key is absent, queues the order and logs a clear warning.
 */
export async function fulfilOrder(order: FulfilmentOrder): Promise<void> {
  await ensureFulfilmentTable();
  await queueOrder(order);

  const apiKey = process.env.PRODIGI_API_KEY;

  if (!apiKey) {
    logger.warn(
      {
        stripeSession: order.stripeSessionId,
        sku: order.sku,
        customer: order.customerEmail,
        amountPaid: `£${(order.amountPaid / 100).toFixed(2)}`,
      },
      "⚠️  PRODIGI_API_KEY not set — order queued. " +
        "Add the key to Replit Secrets to enable automatic fulfilment.",
    );
    return;
  }

  try {
    const bonusCard = order.amountPaid >= 5000;
    logger.info(
      {
        stripeSession: order.stripeSessionId,
        sku: order.sku,
        env: process.env.PRODIGI_ENV || "sandbox",
        bonusCard,
      },
      "Submitting order to Prodigi…",
    );
    const prodigiOrderId = await submitToProdigi(apiKey, order);
    await markFulfilled(order.stripeSessionId, prodigiOrderId);
    logger.info(
      { prodigiOrderId, stripeSession: order.stripeSessionId },
      "✅ Prodigi order placed successfully",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(order.stripeSessionId, msg);
    logger.error(
      { err: msg, stripeSession: order.stripeSessionId },
      "❌ Prodigi order failed — order remains in queue for retry",
    );
    // Don't re-throw: the Stripe webhook must return 200 or Stripe will retry.
  }
}
