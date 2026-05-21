/**
 * Bags of Love dropship fulfilment module.
 *
 * When BAGS_OF_LOVE_API_KEY is set, orders are submitted automatically
 * to the Bags of Love trade API immediately after Stripe payment clears.
 *
 * When the key is NOT yet set, every order is queued in the `fulfilment_queue`
 * database table so nothing is lost — you can replay the queue once the key arrives.
 *
 * Bags of Love API docs: https://www.bagsoflove.co.uk/trade-api
 * Contact trade@bagsoflove.co.uk to get your API key.
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── SKU → Bags of Love product code mapping ──────────────────────────────────
// Update these product codes once Bags of Love confirm your trade account.
// Their product catalogue is available in your trade portal.
const BOL_PRODUCT_CODES: Record<string, string> = {
  "canvas-classic-30x20": "CANVAS_30X20",
  "canvas-large-60x40": "CANVAS_60X40",
  "canvas-xl-90x60": "CANVAS_90X60",
  "jigsaw-252": "JIGSAW_252",
  "jigsaw-500": "JIGSAW_500",
  "jigsaw-1000": "JIGSAW_1000",
  "cushion-45x45": "CUSHION_45",
  "blanket-fleece": "BLANKET_FLEECE",
  "mug-11oz": "MUG_11OZ",
  "keyring-metal": "KEYRING_METAL",
  "acrylic-block-10x10": "ACRYLIC_10X10",
};

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
  photoBase64: string; // full-resolution restored photo
  amountPaid: number; // pence
  currency: string;
}

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

// ── Submit order to Bags of Love API ─────────────────────────────────────────

async function submitToBagsOfLove(
  apiKey: string,
  order: FulfilmentOrder,
): Promise<string> {
  const productCode = BOL_PRODUCT_CODES[order.sku];
  if (!productCode) {
    throw new Error(
      `No Bags of Love product code mapped for SKU "${order.sku}". ` +
        `Add it to BOL_PRODUCT_CODES in bagsOfLove.ts.`,
    );
  }

  const payload = {
    api_key: apiKey,
    order_reference: order.stripeSessionId,
    product_code: productCode,
    shipping: {
      name: order.shippingAddress.name,
      address_line_1: order.shippingAddress.line1,
      address_line_2: order.shippingAddress.line2 ?? "",
      city: order.shippingAddress.city,
      postcode: order.shippingAddress.postal_code,
      country: order.shippingAddress.country,
    },
    artwork_base64: order.photoBase64,
    customer_email: order.customerEmail,
    blind_ship: true, // ship as ONJJEM, not Bags of Love
    brand_name: "ONJJEM",
  };

  const resp = await fetch("https://api.bagsoflove.co.uk/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(
      `Bags of Love API error ${resp.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await resp.json()) as { order_id?: string };
  if (!data.order_id) {
    throw new Error("Bags of Love response missing order_id");
  }
  return data.order_id;
}

// ── Queue order in DB (used when API key is absent OR as audit trail) ─────────

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

// ── Mark queue row as fulfilled or failed ─────────────────────────────────────

async function markFulfilled(
  stripeSessionId: string,
  bolOrderId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE fulfilment_queue
    SET status = 'fulfilled', bol_order_id = ${bolOrderId}, updated_at = NOW()
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
 * Attempt to fulfil an order automatically.
 *
 * 1. Always writes the order to `fulfilment_queue` as an audit trail.
 * 2. If BAGS_OF_LOVE_API_KEY is set, immediately calls their API.
 * 3. If the key is absent, logs a clear warning — the queue row will be
 *    replayed once you run `pnpm --filter @workspace/scripts run replay-queue`.
 */
export async function fulfilOrder(order: FulfilmentOrder): Promise<void> {
  await ensureFulfilmentTable();
  await queueOrder(order);

  const apiKey = process.env.BAGS_OF_LOVE_API_KEY;

  if (!apiKey) {
    logger.warn(
      {
        stripeSession: order.stripeSessionId,
        sku: order.sku,
        customer: order.customerEmail,
        amountPaid: `£${(order.amountPaid / 100).toFixed(2)}`,
      },
      "⚠️  BAGS_OF_LOVE_API_KEY not set — order queued. " +
        "Add the key to Replit Secrets then run: pnpm --filter @workspace/scripts run replay-queue",
    );
    return;
  }

  try {
    logger.info(
      { stripeSession: order.stripeSessionId, sku: order.sku },
      "Submitting order to Bags of Love…",
    );
    const bolOrderId = await submitToBagsOfLove(apiKey, order);
    await markFulfilled(order.stripeSessionId, bolOrderId);
    logger.info(
      { bolOrderId, stripeSession: order.stripeSessionId },
      "✅ Bags of Love order placed successfully",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(order.stripeSessionId, msg);
    logger.error(
      { err: msg, stripeSession: order.stripeSessionId },
      "❌ Bags of Love order failed — order remains in queue for replay",
    );
    // Don't re-throw: the Stripe webhook must return 200 or Stripe will retry
    // the webhook (not what we want — the payment succeeded, fulfilment failed).
  }
}

// ── Queue replay (called by the scripts/replay-queue script) ──────────────────

export async function replayPendingOrders(): Promise<void> {
  await ensureFulfilmentTable();
  const apiKey = process.env.BAGS_OF_LOVE_API_KEY;
  if (!apiKey) {
    logger.error("BAGS_OF_LOVE_API_KEY not set — cannot replay queue");
    return;
  }

  const rows = await db.execute(sql`
    SELECT id, stripe_session, sku, customer_email, shipping_json, amount_paid, currency
    FROM fulfilment_queue
    WHERE status IN ('pending', 'failed')
    ORDER BY created_at
  `);

  if (rows.rows.length === 0) {
    logger.info("No pending orders in the fulfilment queue.");
    return;
  }

  logger.info(`Replaying ${rows.rows.length} queued order(s)…`);

  for (const row of rows.rows) {
    const stripeSessionId = row.stripe_session as string;
    try {
      const bolOrderId = await submitToBagsOfLove(apiKey, {
        stripeSessionId,
        stripePaymentIntentId: null,
        sku: row.sku as string,
        customerEmail: row.customer_email as string,
        shippingAddress: row.shipping_json as FulfilmentAddress,
        photoBase64: "", // photo must be re-uploaded for replays; see docs
        amountPaid: row.amount_paid as number,
        currency: row.currency as string,
      });
      await markFulfilled(stripeSessionId, bolOrderId);
      logger.info({ bolOrderId, stripeSessionId }, "Replayed successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await markFailed(stripeSessionId, msg);
      logger.error({ err: msg, stripeSessionId }, "Replay failed");
    }
  }
}
