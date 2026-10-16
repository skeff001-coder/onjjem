import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendGiveawayConfirmation, sendGiveawayAdminEntry } from "../email/mailer";
import { logger } from "../lib/logger";

// Giveaway, Oct 2026: free entry by web form (alongside comments on social posts).
// Closes Sun 1 Nov 2026, 8pm UK (20:00 UTC).
const router = Router();
const CLOSES = new Date("2026-11-01T20:00:00Z");
const ipHits = new Map<string, { day: string; n: number }>();

async function ensureTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS giveaway_entries (
      email      TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      pet_name   TEXT NOT NULL,
      country    TEXT NOT NULL,
      marketing  BOOLEAN NOT NULL DEFAULT FALSE,
      ip         TEXT,
      entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await db.execute(sql`ALTER TABLE giveaway_entries ADD COLUMN IF NOT EXISTS photo TEXT`);
}

router.post("/giveaway-entry", async (req: Request, res: Response) => {
  if (new Date() >= CLOSES) { res.status(410).json({ error: "Sorry, this giveaway has closed." }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website) { res.json({ ok: true }); return; } // honeypot
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const email = clean(b.email, 200).toLowerCase();
  const name = clean(b.name, 60);
  const petName = clean(b.petName, 60);
  const country = clean(b.country, 2).toUpperCase();
  const marketing = b.marketing === true;
  const adult = b.adult === true;
  // Optional pet photo: a JPEG data URL already shrunk in the browser (max ~4.5MB).
  let photo: string | null = null;
  if (typeof b.photo === "string" && b.photo) {
    const m = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.exec(b.photo);
    if (!m || b.photo.length > 4_500_000) { res.status(400).json({ error: "That photo couldn't be used. Please try a different one (or enter without a photo)." }); return; }
    photo = b.photo;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !petName) { res.status(400).json({ error: "Please fill in your name, who's in your photo and a valid email." }); return; }
  if (country !== "GB" && country !== "US") { res.status(400).json({ error: "The giveaway is open to the UK and the US only." }); return; }
  if (!adult) { res.status(400).json({ error: "You must be 18 or over to enter." }); return; }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const hit = ipHits.get(ip);
  const n = hit && hit.day === day ? hit.n + 1 : 1;
  ipHits.set(ip, { day, n });
  if (n > 5) { res.status(429).json({ error: "Too many entries from this device today." }); return; }

  try {
    await ensureTable();
    const ins = await db.execute(sql`
      INSERT INTO giveaway_entries (email, name, pet_name, country, marketing, ip, photo)
      VALUES (${email}, ${name}, ${petName}, ${country}, ${marketing}, ${ip}, ${photo})
      ON CONFLICT (email) DO NOTHING RETURNING email`);
    if (ins.rows.length === 0) { res.json({ ok: true, already: true }); return; }
    if (marketing) {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS email_subscribers (email TEXT PRIMARY KEY, subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await db.execute(sql`INSERT INTO email_subscribers (email) VALUES (${email}) ON CONFLICT DO NOTHING`);
    }
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
    const total = Number((cnt.rows[0] as { n: number }).n);
    sendGiveawayConfirmation({ email, name, petName, marketing, country }).catch((err) => logger.warn({ err }, "giveaway confirmation failed"));
    sendGiveawayAdminEntry({ email, name, petName, country, marketing, total, photo }).catch((err) => logger.warn({ err }, "giveaway admin email failed"));
    logger.info({ total, country }, "Giveaway entry");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Giveaway entry failed");
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
});

// Public: number of web-form entries (for the counter on the giveaway page).
let countCache = { at: 0, n: 0 };
router.get("/giveaway-count", async (_req: Request, res: Response) => {
  try {
    if (Date.now() - countCache.at > 30_000) {
      await ensureTable();
      const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
      countCache = { at: Date.now(), n: Number((cnt.rows[0] as { n: number }).n) };
    }
    res.set("Cache-Control", "public, max-age=30").json({ count: countCache.n });
  } catch { res.json({ count: 0 }); }
});

// Owner-only: count entries and pick a random winner.
// Needs Railway variable GIVEAWAY_KEY; visit /api/giveaway-draw?key=YOURKEY
router.get("/giveaway-draw", async (req: Request, res: Response) => {
  const key = process.env.GIVEAWAY_KEY;
  if (!key || req.query.key !== key) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    await ensureTable();
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
    const win = await db.execute(sql`SELECT name, email, pet_name, country, entered_at, (photo IS NOT NULL) AS has_photo FROM giveaway_entries ORDER BY random() LIMIT 1`);
    res.json({ totalEntries: (cnt.rows[0] as { n: number }).n, randomWinner: win.rows[0] ?? null, closed: new Date() >= CLOSES });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "error" });
  }
});

// Owner-only: view an entrant's pet photo. /api/giveaway-photo?key=YOURKEY&email=them@example.com
router.get("/giveaway-photo", async (req: Request, res: Response) => {
  const key = process.env.GIVEAWAY_KEY;
  if (!key || req.query.key !== key) { res.status(403).json({ error: "Forbidden" }); return; }
  const email = String(req.query.email ?? "").trim().toLowerCase();
  const r = await db.execute(sql`SELECT photo FROM giveaway_entries WHERE email = ${email}`);
  const photo = (r.rows[0] as { photo?: string } | undefined)?.photo;
  if (!photo) { res.status(404).send("No photo"); return; }
  const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(photo);
  if (!m) { res.status(404).send("No photo"); return; }
  res.type(m[1]).send(Buffer.from(m[2], "base64"));
});

export default router;
