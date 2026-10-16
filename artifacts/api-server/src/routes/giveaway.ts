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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !petName) { res.status(400).json({ error: "Please fill in your name, your pet's name and a valid email." }); return; }
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
      INSERT INTO giveaway_entries (email, name, pet_name, country, marketing, ip)
      VALUES (${email}, ${name}, ${petName}, ${country}, ${marketing}, ${ip})
      ON CONFLICT (email) DO NOTHING RETURNING email`);
    if (ins.rows.length === 0) { res.json({ ok: true, already: true }); return; }
    if (marketing) {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS email_subscribers (email TEXT PRIMARY KEY, subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await db.execute(sql`INSERT INTO email_subscribers (email) VALUES (${email}) ON CONFLICT DO NOTHING`);
    }
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
    const total = Number((cnt.rows[0] as { n: number }).n);
    sendGiveawayConfirmation({ email, name, petName, marketing, country }).catch((err) => logger.warn({ err }, "giveaway confirmation failed"));
    sendGiveawayAdminEntry({ email, name, petName, country, marketing, total }).catch((err) => logger.warn({ err }, "giveaway admin email failed"));
    logger.info({ total, country }, "Giveaway entry");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Giveaway entry failed");
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
});

// Owner-only: count entries and pick a random winner.
// Needs Railway variable GIVEAWAY_KEY; visit /api/giveaway-draw?key=YOURKEY
router.get("/giveaway-draw", async (req: Request, res: Response) => {
  const key = process.env.GIVEAWAY_KEY;
  if (!key || req.query.key !== key) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    await ensureTable();
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
    const win = await db.execute(sql`SELECT name, email, pet_name, country, entered_at FROM giveaway_entries ORDER BY random() LIMIT 1`);
    res.json({ totalEntries: (cnt.rows[0] as { n: number }).n, randomWinner: win.rows[0] ?? null, closed: new Date() >= CLOSES });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "error" });
  }
});

export default router;
