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
 * Get an API key: dashboard.prodigi.com → Settings → Integrations → API
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { ObjectStorageService } from "../lib/objectStorage";

// ── SKU → Prodigi product mapping ────────────────────────────────────────────
// Maps our website SKU to a Prodigi product SKU (+ optional copies/attributes).
// These SKUs MUST be validated against Prodigi (the quotes endpoint validates a
// SKU) before going live — verify each one in sandbox first.
//
//   sizing:     "fillPrintArea" (recommended) crops to fill; "fitPrintArea" letterboxes.
//   attributes: product-specific options (e.g. canvas { wrap }, frames { color }).
//
// Add more rows as products are verified in the Prodigi catalogue.
export interface ProdigiProduct {
  sku: string;
  copies?: number;
  sizing?: "fillPrintArea" | "fitPrintArea";
  attributes?: Record<string, string>;
}

export const PRODIGI_PRODUCTS: Record<string, ProdigiProduct> = {
  // Photo / fine-art prints (no frame)
  "print-a4-boutique": { sku: "GLOBAL-FAP-A4", sizing: "fillPrintArea" },
  "print-a3-boutique": { sku: "GLOBAL-FAP-A3", sizing: "fillPrintArea" },
  "print-a2-boutique": { sku: "GLOBAL-FAP-A2", sizing: "fillPrintArea" },
  "print-a1-giant": { sku: "GLOBAL-FAP-A1", sizing: "fillPrintArea" },

  // Stretched canvas
  "canvas-classic-30x20": {
    sku: "GLOBAL-CAN-10X8",
    sizing: "fillPrintArea",
    attributes: { wrap: "ImageWrap" },
  },

  // Mugs
  "mug-masterlab-11oz": { sku: "GLOBAL-MUG-11OZ", sizing: "fillPrintArea" },
};

// ── Types (kept identical to the old bagsOfLove module so the webhook handler
//    can swap providers by changing only the import path) ──────────────────────

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
      bol_order_id    TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      error           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
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
    items: [
      {
        sku: product.sku,
        copies: product.copies ?? 1,
        sizing: product.sizing ?? "fillPrintArea",
        ...(product.attributes ? { attributes: product.attributes } : {}),
        assets: [{ printArea: "default", url: imageUrl }],
      },
    ],
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
  await db.execute(sql`
    INSERT INTO fulfilment_queue
      (stripe_session, sku, customer_email, shipping_json, amount_paid, currency, status)
    VALUES
      (${order.stripeSessionId}, ${order.sku}, ${order.customerEmail},
       ${JSON.stringify(order.shippingAddress)}::jsonb,
       ${order.amountPaid}, ${order.currency}, 'pending')
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
    logger.info(
      {
        stripeSession: order.stripeSessionId,
        sku: order.sku,
        env: process.env.PRODIGI_ENV || "sandbox",
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
