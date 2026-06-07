import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { placeProdigiOrder } from "./lib/prodigi";
import { logger } from "./lib/logger";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    let event: any;
    try {
      event = JSON.parse(payload.toString("utf8"));
    } catch {
      return;
    }

    if (event.type === "checkout.session.completed") {
      await WebhookHandlers.handleCheckoutCompleted(event.data.object);
    }
  }

  private static async handleCheckoutCompleted(session: any): Promise<void> {
    const { id: sessionId, metadata, customer_details, shipping_details } = session;

    if (!metadata?.productId || !metadata?.photoObjectPath) {
      logger.warn({ sessionId }, "checkout.session.completed missing shop metadata — skipping order creation");
      return;
    }

    const { productId, photoObjectPath, customerEmail } = metadata;
    const priceId = session.line_items?.data?.[0]?.price?.id ?? metadata.priceId ?? "";

    const shipping = shipping_details ?? customer_details ?? {};
    const addr = shipping.address ?? {};
    const nameParts = (shipping.name ?? "").trim().split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    try {
      const [existing] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.stripeSessionId, sessionId));

      if (existing) {
        logger.info({ sessionId, orderId: existing.id }, "Order already exists for session, skipping");
        return;
      }

      const [order] = await db
        .insert(ordersTable)
        .values({
          stripeSessionId: sessionId,
          productId,
          priceId,
          photoObjectPath,
          customerEmail: customerEmail ?? customer_details?.email ?? "",
          shippingAddress: shipping,
          status: "paid",
        })
        .returning();

      logger.info({ sessionId, orderId: order.id }, "Order created");

      const prodigiSku = metadata.prodigiSku ?? "";
      const prodigiProductType = metadata.prodigiProductType ?? "";
      const phoneModel = metadata.phoneModel ?? "";
      const prodigiCallback =
        process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/prodigi/callback`
        : undefined;

      if (prodigiProductType) {
        try {
          const objectPathForUrl = photoObjectPath.startsWith("/objects/")
            ? photoObjectPath
            : `/objects/${photoObjectPath}`;
          const host = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
          const photoUrl = `${host}/api/storage${objectPathForUrl}`;

          const result = await placeProdigiOrder({
            referenceId: `order-${order.id}`,
            customerEmail: order.customerEmail,
            shippingAddress: {
              name: `${firstName} ${lastName}`.trim(),
              line1: addr.line1 ?? "",
              line2: addr.line2 ?? undefined,
              townOrCity: addr.city ?? "",
              stateOrCounty: addr.state ?? "",
              postalOrZipCode: addr.postal_code ?? "",
              countryCode: addr.country ?? "GB",
            },
            items: [
              {
                sku: prodigiSku,
                copies: 1,
                photoUrl,
                productType: prodigiProductType,
                phoneModel: phoneModel || undefined,
              },
            ],
            callbackUrl: prodigiCallback,
          });

          await db
            .update(ordersTable)
            .set({
              prodigiOrderId: result.orderId,
              status: "fulfillment_submitted",
              updatedAt: new Date(),
            })
            .where(eq(ordersTable.id, order.id));

          logger.info(
            { orderId: order.id, prodigiOrderId: result.orderId },
            "Prodigi order placed"
          );
        } catch (err) {
          logger.error({ err, orderId: order.id }, "Failed to place Prodigi order");
          await db
            .update(ordersTable)
            .set({ status: "fulfillment_failed", updatedAt: new Date() })
            .where(eq(ordersTable.id, order.id));
        }
      } else {
        logger.warn(
          { orderId: order.id, productId },
          "No prodigiSku in product metadata — skipping Prodigi fulfillment. " +
            "Add prodigiSku to Stripe product metadata once Prodigi SKU mapping is obtained."
        );
        await db
          .update(ordersTable)
          .set({ status: "awaiting_fulfillment_config", updatedAt: new Date() })
          .where(eq(ordersTable.id, order.id));
      }
    } catch (err) {
      logger.error({ err, sessionId }, "Error handling checkout.session.completed");
    }
  }
}
