import { Router } from "express";
import type { Request, Response } from "express";
import {
  getUncachableStripeClient,
  getPublishableKey,
} from "../stripeClient";
import { applyEnhancements } from "./process";
import type { EnhancementMode } from "./process";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// ── Config (publishable key for frontend Stripe.js) ──────────────────────────

router.get("/stripe/config", async (_req: Request, res: Response) => {
  try {
    const publishableKey = await getPublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// ── Create payment intent for photo restoration (£1.99) ───────────────────────

router.post("/stripe/create-intent", async (req: Request, res: Response) => {
  try {
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: 199,
      currency: "gbp",
      description: "ONJJEM Photo Restoration — HD result",
      metadata: { product: "photo_restoration" },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// ── Verify payment + process HD photo ─────────────────────────────────────────

router.post("/stripe/verify-process", async (req: Request, res: Response) => {
  const body = req.body as {
    paymentIntentId?: string;
    imageBase64?: string;
    modes?: EnhancementMode[];
  };

  const { paymentIntentId, imageBase64, modes } = body;

  if (!paymentIntentId || !imageBase64 || !modes?.length) {
    res
      .status(400)
      .json({ error: "paymentIntentId, imageBase64, and modes are required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      res
        .status(402)
        .json({ error: "Payment not completed", status: intent.status });
      return;
    }

    const inputBuffer = Buffer.from(imageBase64, "base64");
    const outputBuffer = await applyEnhancements(inputBuffer, modes);
    const resultBase64 = outputBuffer.toString("base64");

    res.json({ resultBase64 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ msg }, "stripe/verify-process error");
    res.status(500).json({ error: msg });
  }
});

// ── Create Stripe checkout for physical products ───────────────────────────────
// Accepts `sku` (product metadata.sku value) — looks up the real Stripe price ID.

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  const body = req.body as { sku?: string };

  if (!body.sku) {
    res.status(400).json({ error: "sku is required" });
    return;
  }

  try {
    // Look up active price for this SKU from the synced stripe schema
    const rows = await db.execute(sql`
      SELECT pr.id AS price_id
      FROM stripe.prices pr
      JOIN stripe.products p ON pr.product = p.id
      WHERE p.metadata->>'sku' = ${body.sku}
        AND pr.active = true
        AND p.active = true
      LIMIT 1
    `);

    const priceId = rows.rows[0]?.price_id as string | undefined;

    if (!priceId) {
      res.status(404).json({ error: "Product not found. Please contact orders@onjjem.co.uk." });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/#order-success`,
      cancel_url: `${origin}/#shop`,
      shipping_address_collection: { allowed_countries: ["GB"] },
      custom_text: {
        submit: {
          message:
            "After paying, reply to your confirmation email with your restored photo to begin production.",
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ msg }, "stripe/checkout error");
    res.status(500).json({ error: msg });
  }
});

// ── List active products with prices ─────────────────────────────────────────

router.get("/stripe/products", async (_req: Request, res: Response) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.metadata AS product_metadata,
        pr.id AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.metadata AS price_metadata
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY p.name, pr.unit_amount
    `);

    const map = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      metadata: Record<string, string>;
      prices: { id: string; unit_amount: number; currency: string; recurring: unknown }[];
    }>();

    for (const row of rows.rows) {
      const pid = row.product_id as string;
      if (!map.has(pid)) {
        map.set(pid, {
          id: pid,
          name: row.product_name as string,
          description: row.product_description as string | null,
          metadata: (row.product_metadata as Record<string, string>) ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(pid)!.prices.push({
          id: row.price_id as string,
          unit_amount: row.unit_amount as number,
          currency: row.currency as string,
          recurring: row.recurring,
        });
      }
    }

    res.json({ data: Array.from(map.values()) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
