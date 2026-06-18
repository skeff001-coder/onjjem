import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function directStripeSyncToDb(): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();

    // Resolve account ID from the Stripe account itself
    const account = await stripe.accounts.retrieve();
    const accountId = account.id;

    // Fetch all active products and prices from Stripe API
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);

    for (const p of products.data) {
      await db.execute(sql`
        INSERT INTO stripe.products (_account_id, _raw_data)
        VALUES (${accountId}, ${JSON.stringify(p)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          _raw_data = EXCLUDED._raw_data,
          _updated_at = now()
      `);
    }

    for (const pr of prices.data) {
      await db.execute(sql`
        INSERT INTO stripe.prices (_account_id, _raw_data)
        VALUES (${accountId}, ${JSON.stringify(pr)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          _raw_data = EXCLUDED._raw_data,
          _updated_at = now()
      `);
    }

    logger.info(
      { products: products.data.length, prices: prices.data.length },
      "Stripe direct sync complete"
    );
  } catch (err) {
    logger.error({ err }, "Stripe direct sync failed");
  }
}

async function initStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe initialisation");
    return;
  }
  try {
    logger.info("Initialising Stripe schema…");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBase = `https://${(process.env.REPLIT_DOMAINS ?? "").split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    // Direct sync from Stripe API — runs in background
    directStripeSyncToDb()
      .then(() => {})
      .catch(() => {});
  } catch (err) {
    logger.error({ err }, "Stripe init failed — continuing without Stripe");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start listening immediately so healthchecks pass while Stripe initialises in the background.
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Stripe init runs after the server is already accepting connections.
  // A slow/failing webhook registration no longer blocks startup.
  initStripe().catch((err) => {
    logger.error({ err }, "Stripe background init failed");
  });
});
