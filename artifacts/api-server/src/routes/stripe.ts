import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import {
  getUncachableStripeClient,
  getPublishableKey,
} from "../stripeClient";
import { applyEnhancements } from "./process";
import type { EnhancementMode } from "./process";
import { storePhoto } from "../webhookHandlers";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { SHOP_SKU_PRICES } from "../shopPrices";
import { US_SKU_PRICES, NO_BUNDLE_DISCOUNT } from "../usShop";
import { PRODIGI_PRODUCTS } from "../fulfilment/prodigi";
import { GoogleGenAI } from "@google/genai";

async function regenerateCartoonForOrder(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini AI integration not configured");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      { inlineData: { mimeType, data: base64Image } },
      {
        text:
          "Completely redraw this photo from scratch as a professional 3D " +
          "animated character illustration, in the polished style of a " +
          "modern Pixar or DreamWorks film. This must NOT look like the " +
          "original photo with a filter or minor edits applied — it must " +
          "look like a genuine, hand-crafted animated character. " +
          "Specifically: smooth and simplify the skin/fur texture into " +
          "clean animated shading with soft gradients (no visible pores, " +
          "wrinkles, or photographic texture), simplify and stylise the " +
          "hair into clumped, sculpted animated strands, gently enlarge " +
          "and stylise the eyes with glossy animated highlights, soften " +
          "and round the nose and other facial features into a friendly " +
          "animated proportion, and apply rich, warm, saturated cartoon " +
          "colour grading throughout the whole image, not just the face. " +
          "Keep the subject's pose, clothing colours, and general " +
          "identity recognisable, but the final result must clearly and " +
          "unmistakably read as an animated character on first glance, " +
          "not a photo with eyes edited. Use a simple, softly blurred " +
          "background that doesn't distract from the character. Output " +
          "only the image, no text.",
      },
    ],
    config: { responseModalities: ["IMAGE"] },
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData) throw new Error("Cartoon regeneration failed");
  return imagePart.inlineData.data as string;
}

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
      amount: 149,
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
// Accepts `sku` only. Price is always looked up from the server-side catalog
// (SHOP_SKU_PRICES) — client-supplied amounts are intentionally ignored to
// prevent price-tampering attacks.

// ── Express delivery ─────────────────────────────────────────────────────────
// Offered only where Prodigi's Express (tracked, next working day once made)
// costs us less than the £6.99 we charge. Checked against Prodigi GB price
// lists 2026-10-01: colour-changing mug H-MUG-11OZ-CC, towel H-TOW-PTM.
export const EXPRESS_PENCE = 699;
const EXPRESS_OK = new Set(["magic-mug", "baby-reveal-mug", "towel-70", "mousemat"]);
const FREE_UK_RATE = "shr_1U88e4LkpMwsJmFN2uGD9IvH";
function ukShippingOptions(skus: string[]) {
  const opts: any[] = [{ shipping_rate: FREE_UK_RATE }];
  if (skus.length && skus.every((s) => EXPRESS_OK.has(s))) {
    opts.push({
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: "Express: tracked, next working day once made",
        fixed_amount: { amount: EXPRESS_PENCE, currency: "gbp" },
        metadata: { onjjem_express: "true" },
      },
    });
  }
  return opts;
}

// ── US shop (onjjem.com/us) ─────────────────────────────────────────────────
// Charged in USD, US addresses only, free US shipping, cartoon always free.
function usShippingOptions() {
  return [{
    shipping_rate_data: {
      type: "fixed_amount" as const,
      display_name: "Free US shipping",
      fixed_amount: { amount: 0, currency: "usd" },
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 4 },
        maximum: { unit: "business_day" as const, value: 10 },
      },
    },
  }];
}
// ── "Finish your order" emails ──────────────────────────────────────────────
// Checkout links expire after 2 hours. Stripe then gives us a recovery link,
// and webhookHandlers emails it once (see checkout.session.expired).
const CART_RECOVERY = {
  consent_collection: { promotions: "auto" as const },
  after_expiration: { recovery: { enabled: true } },
  get expires_at() { return Math.floor(Date.now() / 1000) + 2 * 60 * 60; },
};
const US_CHECKOUT_NOTE = "Made to order in the USA in 1–3 business days, then shipped free. Most orders arrive within 4–10 business days.";

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  const body = req.body as {
    sku?: string;
    photoBase64?: string;
    successUrl?: string;
    cancelUrl?: string;
    addCartoon?: boolean;
    cartoonEmail?: string;
    confirmedCartoonBase64?: string;
    international?: boolean;
    region?: string;
    recipient?: {
      name?: string;
      line1?: string;
      line2?: string;
      city?: string;
      postcode?: string;
      message?: string;
    };
  };

  if (!body.sku) {
    res.status(400).json({ error: "sku is required" });
    return;
  }
  const isUS = body.region === "us";
  if (isUS && (!US_SKU_PRICES[body.sku] || !PRODIGI_PRODUCTS[body.sku])) {
    res.status(400).json({ error: `Sorry, "${body.sku}" isn't available in the US shop.` });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    // ── Resolve price from server-side catalog (trusted) ────────────────────
    // Fall back to a Stripe product/price lookup only when the SKU is not yet
    // in the local catalog (e.g. a newly-added product not yet deployed).
    let lineItem: {
      price?: string;
      price_data?: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; metadata: { sku: string } };
      };
      quantity: number;
    };

    const catalogEntry = isUS ? undefined : SHOP_SKU_PRICES[body.sku];

    if (isUS) {
      const us = US_SKU_PRICES[body.sku];
      lineItem = {
        price_data: {
          currency: "usd",
          unit_amount: us.priceCents,
          product_data: { name: us.name, metadata: { sku: body.sku } },
        },
        quantity: 1,
      };
    } else if (catalogEntry) {
      lineItem = {
        price_data: {
          currency: "gbp",
          unit_amount: catalogEntry.pricePence,
          product_data: {
            name: catalogEntry.name,
            metadata: { sku: body.sku },
          },
        },
        quantity: 1,
      };
    } else {
      // SKU not in local catalog — try the Stripe product index as a fallback.
      // Try the search index first (fast). Newly-created products may not be
      // indexed yet, so fall back to a full paginated list scan if needed.
      let product:
        | Awaited<ReturnType<typeof stripe.products.list>>["data"][number]
        | undefined;

      const searchResults = await stripe.products.search({
        query: `active:"true" AND metadata["sku"]:"${body.sku}"`,
        limit: 1,
      });
      product = searchResults.data[0];

      if (!product) {
        for await (const p of stripe.products.list({ active: true, limit: 100 })) {
          if (p.metadata?.sku === body.sku) {
            product = p;
            break;
          }
        }
      }

      if (!product) {
        res.status(404).json({ error: "Product not found. Please contact orders@onjjem.co.uk." });
        return;
      }

      const priceList = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });

      if (!priceList.data[0]) {
        res.status(404).json({ error: "Price not found. Please contact orders@onjjem.co.uk." });
        return;
      }

      lineItem = { price: priceList.data[0].id, quantity: 1 };
    }

    // ── Handle cartoon addon (if applicable) ─────────────────────────────────
    let cartoonBase64: string | undefined;
    if (body.addCartoon && body.confirmedCartoonBase64) {
      // Customer already saw and approved this exact result during the free
      // preview step — use it directly rather than generating a fresh,
      // potentially different-looking version now.
      cartoonBase64 = body.confirmedCartoonBase64;
    } else if (body.addCartoon && body.photoBase64) {
      try {
        const rawBase64 = body.photoBase64.includes(",")
          ? body.photoBase64.split(",")[1]
          : body.photoBase64;
        cartoonBase64 = await regenerateCartoonForOrder(
          rawBase64,
          "image/jpeg"
        );
      } catch (err) {
        req.log.error(
          { err },
          "cartoon regeneration failed but proceeding without it"
        );
      }
    }

    // ── Store photo(s) + generate token ──────────────────────────────────────
    let photoToken: string | undefined;
    if (body.photoBase64) {
      photoToken = crypto.randomBytes(16).toString("hex");
      await storePhoto(photoToken, body.photoBase64, cartoonBase64);
    }

    // ── Build line items (always include product; add cartoon if paid) ───────
    const lineItems: Parameters<typeof stripe.checkout.sessions.create>[0]["line_items"] = [
      lineItem as any,
    ];

    // Christmas sweatshirts include the cartoon for free.
    if (body.addCartoon && !isUS && !body.sku.startsWith("XSWEAT-")) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          unit_amount: 199, // £1.99
          product_data: {
            name: "Custom Cartoon Print Upgrade (+£1.99)",
            metadata: { sku: "cartoon_addon" },
          },
        },
        quantity: 1,
      });
    }

    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      ...CART_RECOVERY,
      shipping_address_collection: {
        allowed_countries: isUS ? ["US"] : body.international
          ? ["US", "CA", "AU", "DE", "FR", "IE", "NL", "SE", "NO", "DK", "ID", "ET", "RO", "SG", "ES", "IT", "PT", "BE", "AT", "CH", "PL", "FI", "NZ", "JP", "AE", "SA", "IN", "MY", "PH", "TH", "ZA", "MX", "BR"]
          : ["GB"],
      },
      shipping_options: isUS ? usShippingOptions() : body.international
        ? [{
            shipping_rate: body.sku === "CLASSIC-POST-GLOS-6X4"
              ? "shr_1UEtVZLkpMwsJmFNIQcFuntm" // International Postcard Delivery — £4.99
              : "shr_1UEeO9LkpMwsJmFNVCYOdr52", // International delivery — £14.99
          }]
        : ukShippingOptions([body.sku]), // Free UK, plus Express where available
      success_url: body.successUrl || `${origin}/?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${origin}/#shop`,
      metadata: {
        sku: body.sku,
        ...(photoToken ? { photo_token: photoToken } : {}),
        ...(body.addCartoon ? { cartoon_addon: "true" } : {}),
        ...(body.recipient ? { recipient_json: JSON.stringify(body.recipient).slice(0, 490) } : {}),
        ...(isUS ? { region: "us" } : {}),
      },
      custom_text: {
        submit: {
          message: isUS ? US_CHECKOUT_NOTE : "Made to order in 1–3 working days, then 1–3 days in the post. Most orders arrive within a week.",
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

// ── Basket checkout: several gifts, each with its own picture, one order ─────
// Prices come only from SHOP_SKU_PRICES. Every item must also be mapped for
// Prodigi, so nothing can be paid for that we can't print. Baskets of 2+
// gifts get an automatic bundle discount (10% for 2, 12% for 3+) instead of
// promo codes, so the two can never stack.
const BUNDLE_COUPONS: Record<number, string> = { 10: "ONJJEM-BUNDLE-10", 12: "ONJJEM-BUNDLE-12" };

router.post("/stripe/cart-checkout", async (req: Request, res: Response) => {
  const body = req.body as {
    items?: { sku?: string; photoBase64?: string; cartoon?: boolean }[];
    successUrl?: string;
    cancelUrl?: string;
    region?: string;
  };
  const isUS = body.region === "us";
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    res.status(400).json({ error: "Your basket is empty." });
    return;
  }
  if (items.length > 8) {
    res.status(400).json({ error: "Please keep it to 8 gifts per order." });
    return;
  }
  for (const it of items) {
    const sku = it.sku || "";
    const priced = isUS ? !!US_SKU_PRICES[sku] : !!SHOP_SKU_PRICES[sku as keyof typeof SHOP_SKU_PRICES];
    if (!priced || !PRODIGI_PRODUCTS[sku]) {
      res.status(400).json({ error: `Sorry, "${sku}" can't be ordered in a basket right now.` });
      return;
    }
    if (!it.photoBase64) {
      res.status(400).json({ error: "One of your gifts is missing its picture." });
      return;
    }
  }

  try {
    const stripe = await getUncachableStripeClient();

    const lineItems: any[] = [];
    const metadata: Record<string, string> = {};
    let firstToken = "";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const entry = isUS
        ? { name: US_SKU_PRICES[it.sku!].name, pricePence: US_SKU_PRICES[it.sku!].priceCents }
        : (SHOP_SKU_PRICES as Record<string, { name: string; pricePence: number }>)[it.sku!];
      const token = crypto.randomBytes(12).toString("hex");
      await storePhoto(token, it.photoBase64!);
      if (i === 0) firstToken = token;
      else metadata[`item_${i}`] = `${it.sku}|${token}`;
      lineItems.push({
        price_data: {
          currency: isUS ? "usd" : "gbp",
          unit_amount: entry.pricePence,
          product_data: { name: entry.name, metadata: { sku: it.sku! } },
        },
        quantity: 1,
      });
      if (it.cartoon && !isUS && !(it.sku || "").startsWith("XSWEAT-")) {
        lineItems.push({
          price_data: {
            currency: "gbp",
            unit_amount: 199,
            product_data: { name: "Custom Cartoon Upgrade", metadata: { sku: "cartoon_addon" } },
          },
          quantity: 1,
        });
      }
    }

    metadata.sku = items[0].sku!;
    metadata.photo_token = firstToken;
    metadata.cart_count = String(items.length);
    if (isUS) metadata.region = "us";

    // Automatic bundle discount
    const percent = items.length >= 3 ? 12 : items.length === 2 ? 10 : 0;
    let discounts: { coupon: string }[] | undefined;
    const hasExcluded = items.some((it) => NO_BUNDLE_DISCOUNT(it.sku || ""));
    if (percent && hasExcluded) {
      // Take the bundle % off the eligible gifts only (one-off amount coupon).
      const eligible = lineItems.reduce((sum: number, li: any, idx: number) => {
        const sku = li?.price_data?.product_data?.metadata?.sku as string | undefined;
        return sku && !NO_BUNDLE_DISCOUNT(sku) ? sum + (li.price_data.unit_amount as number) * (li.quantity || 1) : sum;
      }, 0);
      const amountOff = Math.round((eligible * percent) / 100);
      if (amountOff > 0) {
        const c = await stripe.coupons.create({
          amount_off: amountOff,
          currency: isUS ? "usd" : "gbp",
          duration: "once",
          max_redemptions: 1,
          name: `Bundle discount (${percent}% off)`,
        });
        discounts = [{ coupon: c.id }];
      }
    } else if (percent) {
      const couponId = BUNDLE_COUPONS[percent];
      try {
        await stripe.coupons.retrieve(couponId);
      } catch {
        await stripe.coupons.create({
          id: couponId,
          percent_off: percent,
          duration: "forever",
          name: `Bundle discount (${percent}% off)`,
        });
      }
      discounts = [{ coupon: couponId }];
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      ...CART_RECOVERY,
      shipping_address_collection: { allowed_countries: isUS ? ["US"] : ["GB"] },
      shipping_options: isUS ? usShippingOptions() : ukShippingOptions(items.map((it) => it.sku || "")), // Free UK, plus Express where available
      success_url: body.successUrl || `${origin}/?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${origin}/`,
      metadata,
      custom_text: {
        submit: {
          message: isUS ? US_CHECKOUT_NOTE : `Your ${items.length > 1 ? items.length + " gifts are" : "gift is"} made to order in the UK and posted together. Most orders arrive within a week.`,
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ msg }, "stripe/cart-checkout error");
    res.status(500).json({ error: msg });
  }
});

// ── Create Stripe checkout for web subscriptions (monthly / annual) ───────────

router.post("/stripe/subscribe", async (req: Request, res: Response) => {
  const body = req.body as { plan?: "monthly" | "annual" };

  if (!body.plan || !["monthly", "annual"].includes(body.plan)) {
    res.status(400).json({ error: "plan must be 'monthly' or 'annual'" });
    return;
  }

  const interval = body.plan === "monthly" ? "month" : "year";

  try {
    const stripe = await getUncachableStripeClient();

    // Look up the subscription price directly via the Stripe API.
    // This avoids any dependency on the stripe-sync database schema.
    const priceList = await stripe.prices.list({
      active: true,
      type: "recurring",
      limit: 100,
    });

    const price = priceList.data.find(
      (p) => p.recurring?.interval === interval,
    );

    if (!price) {
      res.status(404).json({ error: `No active ${body.plan} subscription price found.` });
      return;
    }

    const priceId = price.id;
    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/?subscribed=success`,
      cancel_url: `${origin}/#pricing`,
      custom_text: {
        submit: {
          message: "Your subscription starts immediately. Cancel anytime from your account.",
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ msg }, "stripe/subscribe error");
    res.status(500).json({ error: msg });
  }
});

// ── Redeem free postcard gift ────────────────────────────────────────────────

router.post("/stripe/redeem-gift", async (req: Request, res: Response) => {
  const body = req.body as {
    giftSku?: string;
    photoBase64?: string;
    dogName?: string;
    successUrl?: string;
    cancelUrl?: string;
    couponCode?: string;
    international?: boolean;
  };

  if (!body.giftSku) {
    res.status(400).json({ error: "giftSku is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    // ── Resolve gift price from server catalog ───────────────────────────────
    const catalogEntry = SHOP_SKU_PRICES[body.giftSku];
    let finalPrice: number;

    if (catalogEntry) {
      finalPrice = catalogEntry.pricePence;
    } else {
      // Fallback to Stripe product lookup
      const searchResults = await stripe.products.search({
        query: `active:"true" AND metadata["sku"]:"${body.giftSku}"`,
        limit: 1,
      });
      const product = searchResults.data[0];

      if (!product) {
        res.status(404).json({ error: "Gift product not found." });
        return;
      }

      const priceList = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });

      if (!priceList.data[0]) {
        res.status(404).json({ error: "Gift price not found." });
        return;
      }

      finalPrice = priceList.data[0].unit_amount || 0;
    }

    // ── Handle photo storage + coupons ───────────────────────────────────────
    let photoToken: string | undefined;
    if (body.photoBase64) {
      photoToken = crypto.randomBytes(16).toString("hex");
      await storePhoto(photoToken, body.photoBase64);
    }

    const sessionDiscounts: { coupon: string }[] = [];
    if (body.couponCode) {
      const coupon = await stripe.coupons.retrieve(body.couponCode);
      if (coupon && coupon.valid) {
        sessionDiscounts.push({ coupon: body.couponCode });
      }
    }

    // ── Fetch gift details for product_data ──────────────────────────────────
    const gift = Object.values(SHOP_SKU_PRICES).find(
      (p) => p.sku === body.giftSku,
    );

    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: finalPrice,
            product_data: {
              name: gift?.name || "Free Gift Postcard",
              metadata: { sku: body.giftSku },
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ...(sessionDiscounts.length > 0 ? { discounts: sessionDiscounts } : {}),
      shipping_address_collection: {
        allowed_countries: body.international
          ? ["US", "CA", "AU", "DE", "FR", "IE", "NL", "SE", "NO", "DK", "ID", "ET", "RO", "SG", "ES", "IT", "PT", "BE", "AT", "CH", "PL", "FI", "NZ", "JP", "AE", "SA", "IN", "MY", "PH", "TH", "ZA", "MX", "BR"]
          : ["GB"],
      },
      shipping_options: [
        { shipping_rate: body.international ? "shr_1UEeO9LkpMwsJmFNVCYOdr52" : "shr_1U88e4LkpMwsJmFN2uGD9IvH" },
      ],
      success_url: body.successUrl || `${origin}/?gift=claimed`,
      cancel_url: body.cancelUrl || `${origin}/`,
      metadata: {
        sku: body.giftSku,
        photo_token: photoToken,
        gift_redemption: "true",
        ...(body.dogName ? { dog_name: body.dogName } : {}),
      },
      custom_text: {
        submit: {
          message: `Your free ${body.dogName ? body.dogName + "'s" : "dog's"} postcard will be printed and dispatched within 3–5 working days.`,
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ msg }, "stripe/redeem-gift error");
    res.status(500).json({ error: msg });
  }
});

// ── Fetch Stripe session details for GA4 purchase tracking ───────────────────
// Called by the frontend after successful checkout to log item-level data
router.get("/stripe/session/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ error: "session_id required" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });
    res.status(200).json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      line_items: {
        data: session.line_items?.data?.map((item: any) => ({
          quantity: item.quantity,
          price: {
            unit_amount: item.price?.unit_amount,
            product: {
              id: item.price?.product?.id,
              name: item.price?.product?.name,
            },
          },
        })) || [],
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not retrieve session";
    res.status(500).json({ error: msg });
  }
});

export default router;
