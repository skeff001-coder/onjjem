// ── Instant digital Halloween colouring page ──────────────────────────────────
// Flow: upload photo -> Stripe checkout -> AFTER payment we draw the colouring
// page (about 30s) -> download on the success page + emailed copy.
// Nothing is drawn before payment, so there's nothing to screenshot.
import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { generateColoringPage } from "./cartoonify";
import { logger } from "../lib/logger";

const router = Router();

export const PRINTABLES: Record<string, { name: string; gbp: number; usd: number; file: string }> = {
  coloring: { name: "Halloween colouring page of your photo (instant download)", gbp: 199, usd: 299, file: "halloween-colouring-page.png" },
};

async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS printables (
    id TEXT PRIMARY KEY, product TEXT NOT NULL, mime TEXT NOT NULL, image_b64 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.execute(sql`ALTER TABLE printables ADD COLUMN IF NOT EXISTS photo_b64 TEXT`);
  await db.execute(sql`ALTER TABLE printables ADD COLUMN IF NOT EXISTS xmas_b64 TEXT`);
  await db.execute(sql`DELETE FROM printables WHERE created_at < NOW() - INTERVAL '120 days'`);
}

type Row = { product: string; mime: string; image_b64: string; photo_b64: string | null; xmas_b64: string | null };
async function getRow(id: string): Promise<Row | null> {
  await ensureTable();
  const r = await db.execute(sql`SELECT product, mime, image_b64, photo_b64, xmas_b64 FROM printables WHERE id = ${id}`);
  return (r.rows[0] as Row | undefined) ?? null;
}

// Draw once per order, even if the success page and the webhook both ask at the same time.
const inFlight = new Map<string, Promise<Row | null>>();
export async function ensurePrintable(id: string): Promise<Row | null> {
  const row = await getRow(id);
  if (!row) return null;
  if (row.image_b64) return row;
  if (inFlight.has(id)) return inFlight.get(id)!;
  const job = (async () => {
    const m = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(row.photo_b64 || "");
    if (!m) throw new Error("photo missing");
    const draw = async (theme: "halloween" | "christmas") => {
      try { return await generateColoringPage(m[2], m[1], theme); }
      catch { return await generateColoringPage(m[2], m[1], theme); } // one retry
    };
    // Halloween page (the main one) and the free Christmas bonus page, drawn together.
    const [out, xmas] = await Promise.all([draw("halloween"), draw("christmas").catch(() => null)]);
    await db.execute(sql`UPDATE printables SET image_b64 = ${out.base64Image}, mime = ${out.mimeType}, xmas_b64 = ${xmas ? xmas.base64Image : null} WHERE id = ${id}`);
    return { ...row, image_b64: out.base64Image, mime: out.mimeType, xmas_b64: xmas ? xmas.base64Image : null };
  })();
  inFlight.set(id, job);
  try { return await job; } finally { inFlight.delete(id); }
}
export const getPrintable = ensurePrintable;

router.post("/printable-checkout", async (req: Request, res: Response) => {
  try {
    const { photo, region, page } = req.body as { photo?: string; region?: string; page?: string };
    if (!/^data:image\/[a-z+]+;base64,.+$/s.test(photo || "") || (photo || "").length > 8_000_000) {
      res.status(400).json({ error: "Please choose a photo (JPG or PNG)." }); return;
    }
    const id = crypto.randomBytes(12).toString("hex");
    await ensureTable();
    await db.execute(sql`INSERT INTO printables (id, product, mime, image_b64, photo_b64) VALUES (${id}, 'coloring', 'image/png', '', ${photo})`);
    const prod = PRINTABLES.coloring;
    const us = region === "us";
    const base = page && /^\/[a-z0-9/._-]*$/i.test(page) ? page : (us ? "/us/printables" : "/printables");
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ quantity: 1, price_data: { currency: us ? "usd" : "gbp", unit_amount: us ? prod.usd : prod.gbp, product_data: { name: us ? "Halloween coloring page of your photo + FREE Christmas page (instant download)" : "Halloween colouring page of your photo + FREE Christmas page (instant download)" } } }],
      metadata: { sku: "printable-coloring", printable_id: id },
      custom_text: { submit: { message: "Instant download: we draw your Halloween page plus a FREE Christmas page straight after you pay (about 30 seconds) and email you both." } },
      success_url: `https://onjjem.com${base}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://onjjem.com${base}?back=1`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "printable checkout failed");
    res.status(500).json({ error: "Checkout didn't start. Please try again." });
  }
});

// Paid? Draw (first time) and give them the file. ?dl=1 makes the browser save it.
router.get("/printable-download", async (req: Request, res: Response) => {
  try {
    const sid = String(req.query.session_id || "");
    if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) { res.status(400).send("Bad link"); return; }
    const stripe = await getUncachableStripeClient();
    const s = await stripe.checkout.sessions.retrieve(sid);
    if (s.payment_status !== "paid") { res.status(402).send("Payment not finished yet"); return; }
    const id = s.metadata?.printable_id;
    const p = id ? await ensurePrintable(id) : null;
    if (!p || !p.image_b64) { res.status(404).send("File not found. Email hello@onjjem.com and we'll send it."); return; }
    const xmas = req.query.which === "xmas";
    const data = xmas ? p.xmas_b64 : p.image_b64;
    if (!data) { res.status(404).send("Not ready. Email hello@onjjem.com and we'll send it."); return; }
    res.set("Content-Type", "image/png").set("Cache-Control", "private, max-age=86400");
    if (req.query.dl) res.set("Content-Disposition", `attachment; filename="${xmas ? "christmas-colouring-page.png" : (PRINTABLES[p.product]?.file || "onjjem.png")}"`);
    res.send(Buffer.from(data, "base64"));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "printable download failed");
    res.status(500).send("Something went wrong drawing your page. Email hello@onjjem.com and we'll send it.");
  }
});

export default router;
