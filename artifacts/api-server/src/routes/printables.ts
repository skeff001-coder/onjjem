// ── Instant digital Halloween printables (colouring page + digital cartoon) ──
// Flow: upload photo -> watermarked preview (free) -> Stripe checkout -> instant
// download on the success page + emailed copy. No Prodigi, no shipping.
import { Router } from "express";
import type { Request, Response } from "express";
import sharp from "sharp";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { generateCartoon, generateColoringPage, addWatermark } from "./cartoonify";
import { logger } from "../lib/logger";

const router = Router();

export const PRINTABLES: Record<string, { name: string; gbp: number; usd: number; file: string }> = {
  coloring: { name: "Halloween colouring page of your photo (instant download)", gbp: 199, usd: 299, file: "halloween-colouring-page.png" },
  cartoon: { name: "Halloween cartoon of your photo (instant digital download)", gbp: 149, usd: 199, file: "halloween-cartoon.jpg" },
};

async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS printables (
    id TEXT PRIMARY KEY, product TEXT NOT NULL, mime TEXT NOT NULL, image_b64 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.execute(sql`DELETE FROM printables WHERE created_at < NOW() - INTERVAL '60 days'`);
}

export async function getPrintable(id: string) {
  await ensureTable();
  const r = await db.execute(sql`SELECT product, mime, image_b64 FROM printables WHERE id = ${id}`);
  return (r.rows[0] as { product: string; mime: string; image_b64: string } | undefined) ?? null;
}

// Each preview costs a few pence of AI credit, so cap per IP per day.
const hits = new Map<string, { day: string; n: number }>();
const LIMIT = 6;

router.post("/printable-preview", async (req: Request, res: Response) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const h = hits.get(ip);
  const n = h && h.day === day ? h.n : 0;
  if (n >= LIMIT) { res.status(429).json({ error: "You've made lots of previews today! Please come back tomorrow, or email hello@onjjem.com." }); return; }
  const { photo, product } = req.body as { photo?: string; product?: string };
  if (!product || !PRINTABLES[product]) { res.status(400).json({ error: "Unknown product" }); return; }
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(photo || "");
  if (!m || m[2].length > 8_000_000) { res.status(400).json({ error: "Please choose a photo (JPG or PNG)." }); return; }
  hits.set(ip, { day, n: n + 1 });
  try {
    let out: { base64Image: string; mimeType: string };
    if (product === "coloring") out = await generateColoringPage(m[2], m[1]);
    else {
      const c = await generateCartoon(m[2], m[1], "halloween");
      const jpg = await sharp(Buffer.from(c.base64Image, "base64")).jpeg({ quality: 92 }).toBuffer();
      out = { base64Image: jpg.toString("base64"), mimeType: "image/jpeg" };
    }
    const id = crypto.randomBytes(12).toString("hex");
    await ensureTable();
    await db.execute(sql`INSERT INTO printables (id, product, mime, image_b64) VALUES (${id}, ${product}, ${out.mimeType}, ${out.base64Image})`);
    // Small watermarked preview for the screen.
    const small = await sharp(Buffer.from(out.base64Image, "base64")).resize(900, 900, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
    const wm = await addWatermark(small.toString("base64"), "image/jpeg");
    res.json({ id, preview: `data:image/png;base64,${wm}` });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "printable preview failed");
    res.status(500).json({ error: "We couldn't make that one. Try a brighter photo with clear faces." });
  }
});

router.post("/printable-checkout", async (req: Request, res: Response) => {
  try {
    const { id, region, page } = req.body as { id?: string; region?: string; page?: string };
    if (!id || !/^[a-f0-9]{24}$/.test(id)) { res.status(400).json({ error: "Missing preview" }); return; }
    const p = await getPrintable(id);
    if (!p) { res.status(404).json({ error: "That preview has expired. Please make it again." }); return; }
    const prod = PRINTABLES[p.product];
    const us = region === "us";
    const base = page && /^\/[a-z0-9/_-]*$/i.test(page) ? page : (us ? "/us/printables" : "/printables");
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ quantity: 1, price_data: { currency: us ? "usd" : "gbp", unit_amount: us ? prod.usd : prod.gbp, product_data: { name: us ? prod.name.replace("colouring", "coloring") : prod.name } } }],
      metadata: { sku: `printable-${p.product}`, printable_id: id },
      custom_text: { submit: { message: "Instant download: your file appears straight after paying, and we email you a copy." } },
      success_url: `https://onjjem.com${base}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://onjjem.com${base}?back=${id}`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "printable checkout failed");
    res.status(500).json({ error: "Checkout didn't start. Please try again." });
  }
});

// Paid? Give them the file. ?dl=1 makes the browser save it.
router.get("/printable-download", async (req: Request, res: Response) => {
  try {
    const sid = String(req.query.session_id || "");
    if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) { res.status(400).send("Bad link"); return; }
    const stripe = await getUncachableStripeClient();
    const s = await stripe.checkout.sessions.retrieve(sid);
    if (s.payment_status !== "paid") { res.status(402).send("Payment not finished yet"); return; }
    const id = s.metadata?.printable_id;
    const p = id ? await getPrintable(id) : null;
    if (!p) { res.status(404).send("File not found. Email hello@onjjem.com and we'll send it."); return; }
    res.set("Content-Type", p.mime).set("Cache-Control", "private, max-age=86400");
    if (req.query.dl) res.set("Content-Disposition", `attachment; filename="${PRINTABLES[p.product]?.file || "onjjem.png"}"`);
    res.send(Buffer.from(p.image_b64, "base64"));
  } catch (err) {
    res.status(500).send("Something went wrong. Email hello@onjjem.com and we'll send your file.");
  }
});

export default router;
