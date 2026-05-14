import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { pendingAnimations, videoSubscriptions } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

const REPLICATE_API = "https://api.replicate.com/v1";

const ANIMATION_PROMPT =
  "A portrait photograph gently coming to life. " +
  "Subtle, natural eye blinks. Soft hair movement in a light breeze. " +
  "A gentle rise and fall of the chest as the person breathes. " +
  "Warm, realistic lighting. Cinematic quality. No exaggerated motion.";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function runAnimation(imageBase64: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Animation service not yet configured");

  const createRes = await fetch(
    `${REPLICATE_API}/models/minimax/video-01-live/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=30",
      },
      body: JSON.stringify({
        input: {
          prompt: ANIMATION_PROMPT,
          first_frame_image: `data:image/jpeg;base64,${imageBase64}`,
          prompt_optimizer: true,
        },
      }),
    },
  );

  const prediction = await createRes.json() as {
    id: string;
    status: string;
    output?: string | string[] | null;
    error?: string;
  };

  if (!createRes.ok) {
    const detail = (prediction as unknown as { detail?: string }).detail ?? prediction.error ?? "Failed";
    throw new Error(detail);
  }

  if (prediction.status === "succeeded") {
    const out = prediction.output;
    return Array.isArray(out) ? (out[0] ?? "") : (out ?? "");
  }
  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(prediction.error ?? "Animation failed");
  }

  // Poll
  const deadline = Date.now() + 360_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8_000));
    const pollRes = await fetch(`${REPLICATE_API}/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await pollRes.json() as typeof prediction;
    if (data.status === "succeeded") {
      const out = data.output;
      return Array.isArray(out) ? (out[0] ?? "") : (out ?? "");
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error ?? "Animation generation failed");
    }
  }
  throw new Error("Timed out waiting for animation — please try again");
}

async function findPriceIdForPlan(plan: string): Promise<string> {
  const stripe = await getUncachableStripeClient();
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  const match = prices.data.find((p) => p.metadata?.plan === plan);
  if (!match) throw new Error(`No Stripe price found for plan "${plan}". Run the seed-products script first.`);
  return match.id;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/stripe/living-memory-checkout
// Creates a Stripe checkout session and stores the image for post-payment animation
router.post("/stripe/living-memory-checkout", async (req: Request, res: Response) => {
  try {
    const { email, plan, imageBase64 } = req.body as {
      email: string;
      plan: "single" | "monthly" | "annual";
      imageBase64: string;
    };

    if (!email || !plan || !imageBase64) {
      res.status(400).json({ error: "email, plan, and imageBase64 are required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Find or create Stripe customer
    let customerId: string;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { app: "onjjem" },
      });
      customerId = customer.id;
    }

    // Get price for this plan
    const priceId = await findPriceIdForPlan(plan);

    // Generate a unique ref
    const ref = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: plan === "single" ? "payment" : "subscription",
      success_url: `${baseUrl}/api/stripe/payment-success?ref=${ref}`,
      cancel_url:  `${baseUrl}/api/stripe/payment-cancel?ref=${ref}`,
      metadata: { ref, plan, email },
    });

    // Store pending animation in DB (image held for up to 2 hours)
    await db.insert(pendingAnimations).values({
      ref,
      email,
      plan,
      stripeSessionId: session.id,
      imageB64: imageBase64,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    req.log.info({ ref, plan, email }, "Stripe checkout session created");
    res.json({ checkoutUrl: session.url, ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout creation failed";
    req.log.error({ message }, "Stripe checkout error");
    res.status(500).json({ error: message });
  }
});

// GET /api/stripe/payment-status?ref=xxx
// Polls Stripe to check if the checkout session has been paid
router.get("/stripe/payment-status", async (req: Request, res: Response) => {
  try {
    const { ref } = req.query as { ref: string };
    if (!ref) { res.status(400).json({ error: "ref is required" }); return; }

    const [row] = await db.select().from(pendingAnimations).where(eq(pendingAnimations.ref, ref));
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    if (row.animated) { res.json({ paid: true, animated: true }); return; }

    // Ask Stripe directly
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(row.stripeSessionId!);
    const paid = session.payment_status === "paid";

    if (paid && !row.paid) {
      await db.update(pendingAnimations).set({ paid: true }).where(eq(pendingAnimations.ref, ref));

      // For subscriptions, record access
      if (row.plan !== "single" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const accessUntil = new Date((sub.current_period_end) * 1000);
        await db.insert(videoSubscriptions).values({
          email: row.email,
          plan: row.plan,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          accessUntil,
        });
      }
    }

    res.json({ paid, animated: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    req.log.error({ message }, "Payment status error");
    res.status(500).json({ error: message });
  }
});

// POST /api/stripe/animate-after-payment
// Verifies payment + runs animation with the stored image
router.post("/stripe/animate-after-payment", async (req: Request, res: Response) => {
  try {
    const { ref } = req.body as { ref: string };
    if (!ref) { res.status(400).json({ error: "ref is required" }); return; }

    const [row] = await db.select().from(pendingAnimations).where(eq(pendingAnimations.ref, ref));
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    if (row.animated) { res.status(400).json({ error: "This video has already been generated" }); return; }
    if (new Date() > row.expiresAt) { res.status(400).json({ error: "Session expired — please start again" }); return; }

    // Verify payment with Stripe
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(row.stripeSessionId!);
    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not yet confirmed — please complete checkout first" });
      return;
    }

    if (!row.imageB64) { res.status(400).json({ error: "Image data missing — please start again" }); return; }

    req.log.info({ ref, plan: row.plan }, "Animating after payment");

    const videoUrl = await runAnimation(row.imageB64);

    // Clear image, mark animated
    await db.update(pendingAnimations)
      .set({ animated: true, paid: true, imageB64: null })
      .where(eq(pendingAnimations.ref, ref));

    req.log.info({ ref }, "Post-payment animation succeeded");
    res.json({ videoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Animation failed";
    req.log.error({ message }, "Animate-after-payment error");
    res.status(500).json({ error: message });
  }
});

// GET /api/stripe/payment-success  — success redirect page from Stripe
router.get("/stripe/payment-success", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Confirmed — ONJJEM</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#1C1A14;color:#FAF7F2;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:32px 20px}
    .card{max-width:440px;width:100%}
    .tick{font-size:56px;margin-bottom:20px}
    h1{color:#C9960C;font-size:1.5rem;margin-bottom:12px}
    p{color:#D4C9B0;line-height:1.7;margin-bottom:18px}
    .cta{display:inline-block;background:#C9960C;color:#1C1A14;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:.9rem;margin-top:8px}
    .note{font-size:.82rem;color:#888;margin-top:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="tick">✅</div>
    <h1>Payment Confirmed</h1>
    <p>Your payment has been received. Return to the ONJJEM app and tap <strong>"Start My Animation"</strong> to create your Living Memory.</p>
    <a href="javascript:window.close()" class="cta">Close &amp; Return to App</a>
    <p class="note">You can close this tab and go back to the ONJJEM app.</p>
  </div>
</body>
</html>`);
});

// GET /api/stripe/payment-cancel
router.get("/stripe/payment-cancel", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Cancelled — ONJJEM</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#1C1A14;color:#FAF7F2;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:32px 20px}
    .card{max-width:440px;width:100%}
    .icon{font-size:56px;margin-bottom:20px}
    h1{color:#FAF7F2;font-size:1.5rem;margin-bottom:12px}
    p{color:#D4C9B0;line-height:1.7;margin-bottom:18px}
    .note{font-size:.82rem;color:#888;margin-top:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">↩</div>
    <h1>Payment Cancelled</h1>
    <p>No charge has been made. Return to the ONJJEM app whenever you're ready to try again.</p>
    <p class="note">You can close this tab.</p>
  </div>
</body>
</html>`);
});

export default router;
