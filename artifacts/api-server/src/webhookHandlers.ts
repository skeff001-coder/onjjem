import { getUncachableStripeClient } from "./stripeClient";
import { fulfilOrder, ensureFulfilmentTable } from "./fulfilment/prodigi";
import { sendOrderConfirmation, sendAdminNotification, sendCartoonImage, sendGiftCardEmail } from "./email/mailer";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import Stripe from "stripe";

// ── Photo store ───────────────────────────────────────────────────────────────

async function ensurePhotoStore(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pending_photos (
      token       TEXT PRIMARY KEY,
      photo_b64   TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    DELETE FROM pending_photos WHERE created_at < NOW() - INTERVAL '2 hours'
  `);
}

export async function storePhoto(
  token: string,
  photoBase64: string,
  cartoonBase64?: string,
): Promise<void> {
  await ensurePhotoStore();
  // If a cartoon version was successfully generated, that's what gets
  // printed on the physical order — not the original uploaded photo.
  const finalPhoto = cartoonBase64 || photoBase64;
  await db.execute(sql`
    INSERT INTO pending_photos (token, photo_b64)
    VALUES (${token}, ${finalPhoto})
    ON CONFLICT (token) DO UPDATE SET photo_b64 = EXCLUDED.photo_b64, created_at = NOW()
  `);
}

async function retrieveAndDeletePhoto(token: string): Promise<string | null> {
  await ensurePhotoStore();
  const rows = await db.execute(sql`
    DELETE FROM pending_photos WHERE token = ${token} RETURNING photo_b64
  `);
  return (rows.rows[0]?.photo_b64 as string) ?? null;
}

// ── Checkout completed → fulfilment ───────────────────────────────────────────

async function handleGiftCardPurchase(sessionId: string, sku: string, email: string): Promise<void> {
  if (!email) {
    logger.warn({ sessionId }, "Gift card purchase has no email — cannot deliver code");
    return;
  }

  const amountBySku: Record<string, number> = {
    "giftcard-20": 2000,
    "giftcard-30": 3000,
    "giftcard-50": 5000,
  };
  const amountPence = amountBySku[sku];
  if (!amountPence) {
    logger.error({ sessionId, sku }, "Unknown gift card SKU");
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    // Genuine, real Stripe coupon worth the exact gift card amount, off a
    // single order, usable once — this is what actually gets redeemed.
    const coupon = await stripe.coupons.create({
      amount_off: amountPence,
      currency: "gbp",
      duration: "once",
      max_redemptions: 1,
      name: `ONJJEM Gift Card (£${(amountPence / 100).toFixed(2)})`,
    });

    const code = "GIFT" + Math.random().toString(36).slice(2, 8).toUpperCase();
    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
    });

    await sendGiftCardEmail({
      email,
      code,
      amount: (amountPence / 100).toFixed(2),
    });

    logger.info({ sessionId, email, code }, "Gift card code generated and sent");
  } catch (err) {
    logger.error({ err, sessionId }, "Gift card generation failed");
  }
}

async function handleCheckoutCompleted(sessionId: string): Promise<void> {
  const stripe = await getUncachableStripeClient();

  const session = (await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "line_items.data.price.product"],
  })) as unknown as Record<string, unknown>;

  const details = session["customer_details"] as Record<string, unknown> | undefined;
  const email =
    (details?.["email"] as string | undefined) ??
    (session["customer_email"] as string | undefined) ??
    "";

  const meta = session["metadata"] as Record<string, string> | undefined;
  const earlySku = meta?.["sku"] ?? "";

  // Gift cards are digital — no photo, no shipping address, no Prodigi order.
  // Handle them completely separately before any of the physical-order logic
  // below (which would otherwise skip the order entirely for lacking an address).
  if (earlySku.startsWith("giftcard-")) {
    await handleGiftCardPurchase(sessionId, earlySku, email);
    return;
  }

  const collectedInfo = session["collected_information"] as Record<string, unknown> | undefined;
  const shippingDetails = (session["shipping_details"] ??
    collectedInfo?.["shipping_details"]) as Record<string, unknown> | undefined;

  const addr = shippingDetails?.["address"] as Record<string, unknown> | undefined;

  if (!addr) {
    logger.warn({ sessionId }, "Checkout session has no shipping address — skipping fulfilment");
    return;
  }

  const photoToken = meta?.["photo_token"] ?? null;

  let photoBase64 = "";
  if (photoToken) {
    photoBase64 = (await retrieveAndDeletePhoto(photoToken)) ?? "";
    // Many phone cameras store photos with the pixels in one orientation and
    // an EXIF "Orientation" tag telling viewers to rotate for display — the
    // photo looks correct on the customer's phone, but printing the raw
    // pixels without applying that rotation can result in a sideways or
    // incorrectly-cropped print. sharp's .rotate() with no arguments reads
    // the EXIF tag and physically applies the correct rotation.
    if (photoBase64) {
      try {
        const sharp = (await import("sharp")).default;
        const commaIdx = photoBase64.indexOf(",");
        const prefix = commaIdx >= 0 ? photoBase64.slice(0, commaIdx + 1) : "data:image/jpeg;base64,";
        const rawBase64 = commaIdx >= 0 ? photoBase64.slice(commaIdx + 1) : photoBase64;
        const inputBuffer = Buffer.from(rawBase64, "base64");
        const correctedBuffer = await sharp(inputBuffer).rotate().toBuffer();
        photoBase64 = prefix + correctedBuffer.toString("base64");
      } catch (err) {
        logger.warn({ err }, "EXIF auto-rotation failed — using photo as uploaded");
      }
    }
  }

  let sku = meta?.["sku"] ?? "";
  if (!sku) {
    const lineItems = session["line_items"] as { data?: unknown[] } | undefined;
    const lineItem = lineItems?.data?.[0] as Record<string, unknown> | undefined;
    const price = lineItem?.["price"] as Record<string, unknown> | undefined;
    const product = price?.["product"] as Record<string, unknown> | undefined;
    const productMeta = product?.["metadata"] as Record<string, string> | undefined;
    sku = productMeta?.["sku"] ?? "";
  }

  if (!sku) {
    logger.warn({ sessionId }, "Could not determine SKU — skipping fulfilment");
    return;
  }

  await ensureFulfilmentTable();

  const paymentIntent = session["payment_intent"];
  const amountPaid = (session["amount_total"] as number | undefined) ?? 0;
  const currency = (session["currency"] as string | undefined) ?? "gbp";
  const bonusCard = amountPaid >= 5000;

  const customerName =
    (shippingDetails?.["name"] as string | undefined) ??
    (details?.["name"] as string | undefined) ??
    "Customer";

  // If the customer chose to send this directly to someone else, their
  // typed recipient details take priority over whatever address Stripe
  // collected from the payer — the payer's own address is just for billing
  // in that case, not where the item should actually be delivered.
  let recipientMessage: string | undefined;
  let shippingAddress = {
    name: customerName,
    line1: (addr["line1"] as string | undefined) ?? "",
    line2: addr["line2"] as string | undefined,
    city: (addr["city"] as string | undefined) ?? "",
    postal_code: (addr["postal_code"] as string | undefined) ?? "",
    country: (addr["country"] as string | undefined) ?? "GB",
  };

  const recipientJson = meta?.["recipient_json"];
  if (recipientJson) {
    try {
      const recipient = JSON.parse(recipientJson) as {
        name?: string;
        line1?: string;
        line2?: string;
        city?: string;
        postcode?: string;
        message?: string;
      };
      if (recipient.line1 && recipient.city && recipient.postcode) {
        shippingAddress = {
          name: recipient.name || "Recipient",
          line1: recipient.line1,
          line2: recipient.line2,
          city: recipient.city,
          postal_code: recipient.postcode,
          country: shippingAddress.country, // recipient form is UK-only for now
        };
        recipientMessage = recipient.message;
      }
    } catch (err) {
      logger.warn({ err }, "Could not parse recipient_json — falling back to payer's address");
    }
  }

  let productName = sku;
  try {
    const lineItems2 = session["line_items"] as { data?: unknown[] } | undefined;
    const li = lineItems2?.data?.[0] as Record<string, unknown> | undefined;
    const desc = li?.["description"] as string | undefined;
    if (desc) productName = desc;
  } catch {}

  await fulfilOrder({
    stripeSessionId: sessionId,
    stripePaymentIntentId: typeof paymentIntent === "string" ? paymentIntent : null,
    sku,
    customerEmail: email,
    shippingAddress,
    photoBase64,
    amountPaid,
    currency,
  });

  const bolOrderId = await getBolOrderId(sessionId);
  const fulfilmentStatus = bolOrderId ? "auto" : "queued";

  await Promise.allSettled([
    sendOrderConfirmation({
      customerName,
      customerEmail: email,
      productName,
      amountPaid,
      currency,
      shippingAddress,
      stripeSessionId: sessionId,
      bonusCard,
    }),
    sendAdminNotification({
      customerName,
      customerEmail: email,
      productName,
      amountPaid,
      currency,
      sku,
      shippingAddress,
      stripeSessionId: sessionId,
      bolOrderId,
      fulfilmentStatus,
      bonusCard,
      recipientMessage,
    }),
    ...(meta?.["cartoon_addon"] === "true" && photoBase64
      ? [
          sendCartoonImage({
            customerName,
            customerEmail: email,
            productName,
            cartoonBase64: photoBase64,
            cartoonMimeType: "image/png",
          }),
        ]
      : []),
  ]);
}

async function getBolOrderId(stripeSessionId: string): Promise<string | null> {
  try {
    const rows = await db.execute(sql`
      SELECT bol_order_id FROM fulfilment_queue
      WHERE stripe_session = ${stripeSessionId} AND bol_order_id IS NOT NULL
      LIMIT 1
    `);
    return (rows.rows[0]?.bol_order_id as string) ?? null;
  } catch {
    return null;
  }
}

// ── Stripe webhook processor (FINAL, FIXED VERSION) ───────────────────────────

export class WebhookHandlers {
  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error("Payload must be a Buffer");
    }

    const stripe = new Stripe(process.env.STRIPE_KEY_TEMP);

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new Error("Invalid Stripe signature: " + (err as Error).message);
    }

    logger.info(
      { type: event.type, objectId: event.data?.object?.id },
      `Received webhook ${event.type}`,
    );

    if (event.type === "checkout.session.completed") {
      const sessionId = event.data.object.id;
      try {
        await handleCheckoutCompleted(sessionId);
      } catch (err) {
        logger.error(
          { err: err instanceof Error ? err.message : String(err), sessionId },
          "Fulfilment error after checkout.session.completed",
        );
      }
    }
  }
}