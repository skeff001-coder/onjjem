import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";

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

    // Backfill runs in the background — don't block startup
    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((err: unknown) => logger.error({ err }, "Stripe backfill error"));
  } catch (err) {
    logger.error({ err }, "Stripe init failed — continuing without Stripe");
  }
}

await initStripe();

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
