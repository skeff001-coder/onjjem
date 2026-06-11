import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';
import { logger } from './lib/logger';

/**
 * Returns true when STRIPE_MODE=test is set.
 * In test mode, STRIPE_TEST_SECRET_KEY is used directly instead of the Replit connector.
 */
function isTestMode(): boolean {
  return process.env.STRIPE_MODE === 'test';
}

/**
 * Fetches Stripe credentials from the Replit connection API (live mode).
 * Not cached -- tokens can rotate, so fetch fresh each time.
 */
async function getStripeCredentialsFromConnector(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const hasReplIdentity = !!process.env.REPL_IDENTITY;
  const hasWebReplRenewal = !!process.env.WEB_REPL_RENEWAL;

  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  logger.info(
    { hostname: hostname ?? '(missing)', hasReplIdentity, hasWebReplRenewal, hasToken: !!xReplitToken },
    'Fetching Stripe credentials'
  );

  if (!hostname || !xReplitToken) {
    throw new Error(
      'Missing Replit environment variables. ' +
      `REPLIT_CONNECTORS_HOSTNAME=${hostname ?? 'undefined'}, REPL_IDENTITY=${hasReplIdentity}, WEB_REPL_RENEWAL=${hasWebReplRenewal}. ` +
      'Ensure the Stripe integration is connected via the Integrations tab.'
    );
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`;
  logger.info({ url }, 'Calling Replit connector API');

  const resp = await fetch(url, {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });

  logger.info({ status: resp.status, ok: resp.ok }, 'Connector API response');

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText} — ${body}`);
  }

  const data: any = await resp.json();
  const itemCount = data.items?.length ?? 0;
  const settings = data.items?.[0]?.settings;

  const secretKey = settings?.secret_key ?? settings?.secret;
  const webhookSecret = settings?.webhook_secret;

  logger.info({ itemCount, hasSettings: !!settings, hasSecretKey: !!secretKey }, 'Connector API data');

  if (!secretKey) {
    throw new Error(
      'Stripe integration not connected or missing secret key. ' +
      'Connect Stripe via the Integrations tab first.'
    );
  }

  return { secretKey, webhookSecret };
}

/**
 * Returns Stripe credentials — uses test key directly when STRIPE_MODE=test,
 * otherwise falls back to the Replit connector (live key).
 */
async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  if (isTestMode()) {
    const testKey = process.env.STRIPE_TEST_SECRET_KEY;
    if (!testKey) {
      throw new Error('STRIPE_MODE=test but STRIPE_TEST_SECRET_KEY is not set. Add it to secrets.');
    }
    logger.info('Using Stripe TEST mode (STRIPE_TEST_SECRET_KEY)');
    return { secretKey: testKey };
  }
  const directKey = process.env.STRIPE_SECRET_KEY;
  if (directKey) {
    logger.info('Using Stripe LIVE key from STRIPE_SECRET_KEY env var');
    return { secretKey: directKey, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET };
  }
  return getStripeCredentialsFromConnector();
}

/**
 * Returns a fresh authenticated Stripe client.
 * Not cached -- fetches credentials on every call so rotated keys are picked up.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  });
}
