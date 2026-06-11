import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";
import { CreateShopCheckoutBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shop/products", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        p.id, p.name, p.description, p.images, p.metadata,
        pr.id AS price_id, pr.unit_amount, pr.currency
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY p.name, pr.unit_amount
    `);

    const map = new Map<string, any>();
    for (const row of result.rows as any[]) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          images: row.images ?? [],
          metadata: row.metadata ?? {},
          price: row.price_id
            ? { id: row.price_id, unitAmount: row.unit_amount, currency: row.currency }
            : null,
        });
      }
    }

    res.json(Array.from(map.values()).filter((p) => p.price));
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/shop/products/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await db.execute(sql`
      SELECT
        p.id, p.name, p.description, p.images, p.metadata,
        pr.id AS price_id, pr.unit_amount, pr.currency
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.id = ${productId} AND p.active = true
      ORDER BY pr.unit_amount
      LIMIT 1
    `);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    const row = result.rows[0] as any;
    return res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      images: row.images ?? [],
      metadata: row.metadata ?? {},
      price: row.price_id
        ? { id: row.price_id, unitAmount: row.unit_amount, currency: row.currency }
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    return res.status(500).json({ error: "Failed to get product" });
  }
});

router.post("/shop/checkout", async (req, res) => {
  const parsed = CreateShopCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
  }
  const { priceId, productId, photoObjectPath, customerEmail, shippingDetails, phoneModel } = parsed.data;

  try {
    const stripe = await getUncachableStripeClient();
    const host = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    let prodigiSku = "";
    let prodigiProductType = "";
    try {
      const stripeProduct = await stripe.products.retrieve(productId);
      prodigiSku = stripeProduct.metadata?.prodigi_sku ?? "";
      prodigiProductType = stripeProduct.metadata?.prodigi_product_type ?? "";
    } catch {
      // product may not be found; values stay empty
    }

    const metadata: Record<string, string> = {
      productId,
      photoObjectPath,
      customerEmail,
      shippingDetails: JSON.stringify(shippingDetails ?? {}),
      prodigiSku,
      prodigiProductType,
    };

    if (phoneModel) {
      metadata.phoneModel = phoneModel;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: [
          "GB", "US", "AU", "CA", "IE", "NZ", "DE", "FR", "IT", "ES", "NL", "SE", "JP",
        ],
      

    return metadata,
      success_url: `${process.env.SITE_URL || host}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || host}/cancel`,
    });

    return res.json({ url: session.url, sessionId: session.id })res.json({ url: session.url, sessionId: session.id });
      
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/shop/orders/by-session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, sessionId));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to get order by session");
    return res.status(500).json({ error: "Failed to get order by session" });
  }
});

router.get("/shop/orders/:orderId", async (req, res) => {
  const id = parseInt(req.params.orderId, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid order ID" });
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    return res.status(500).json({ error: "Failed to get order" });
  }
});

export default router;
