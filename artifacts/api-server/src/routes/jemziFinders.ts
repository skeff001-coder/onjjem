// ── "Find Jemzi!" draw (Christmas 2026 → Jan 2027) ───────────────────────────
// Free entry, UK only, no purchase necessary: anyone can enter by finding Jemzi
// in the picture on onjjem.com/find-jemzi (Santa sack owners can also tick the
// presents he hid on). A grown-up (18+) enters on the child's behalf.
// Prize: a personalised cartoon blanket. Closes Sun 31 Jan 2027 8pm UK, drawn Mon 1 Feb.
import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendRawEmail } from "../email/mailer";
import { logger } from "../lib/logger";

const router = Router();
const CLOSES = new Date("2027-01-31T20:00:00Z");
const normKey = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();
const okKey = (k: unknown) => { const w = normKey(process.env.GIVEAWAY_KEY); return !!w && normKey(k) === w; };
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const ipHits = new Map<string, { day: string; n: number }>();

async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS jemzi_finders (
    email TEXT PRIMARY KEY, name TEXT NOT NULL, child TEXT, marketing BOOLEAN NOT NULL DEFAULT FALSE,
    ip TEXT, entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

router.post("/jemzi-entry", async (req: Request, res: Response) => {
  if (new Date() >= CLOSES) { res.status(410).json({ error: "Sorry, the Find Jemzi draw has closed." }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website) { res.json({ ok: true }); return; }
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const email = clean(b.email, 200).toLowerCase();
  const name = clean(b.name, 60);
  const child = clean(b.child, 40);
  const marketing = b.marketing === true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) { res.status(400).json({ error: "Please fill in your name and a valid email." }); return; }
  if (b.adult !== true || b.uk !== true) { res.status(400).json({ error: "A grown-up (18+) living in the UK needs to enter." }); return; }
  if (b.found !== true) { res.status(400).json({ error: "Find Jemzi first!" }); return; }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const hit = ipHits.get(ip); const n = hit && hit.day === day ? hit.n + 1 : 1; ipHits.set(ip, { day, n });
  if (n > 5) { res.status(429).json({ error: "Too many entries from this device today." }); return; }
  try {
    await ensureTable();
    const ins = await db.execute(sql`INSERT INTO jemzi_finders (email, name, child, marketing, ip)
      VALUES (${email}, ${name}, ${child || null}, ${marketing}, ${ip}) ON CONFLICT (email) DO NOTHING RETURNING email`);
    if (ins.rows.length === 0) { res.json({ ok: true, already: true }); return; }
    if (marketing) {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS email_subscribers (email TEXT PRIMARY KEY, subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await db.execute(sql`INSERT INTO email_subscribers (email) VALUES (${email}) ON CONFLICT DO NOTHING`);
    }
    const who = child ? esc(child) : "your Jemzi finder";
    sendRawEmail(email, "🦔 You're in Jemzi's draw! Good luck", `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#222;line-height:1.6">
      <h2>Well done, ${who}! 🎉</h2>
      <p>You found Jemzi, so you're in the <b>Find Jemzi draw</b> to win a personalised cartoon blanket. The winner is picked at random on <b>Mon 1 February 2027</b> and we'll email them that day.</p>
      <p>🎁 As a thank-you, here's <b>15% off</b> your next ONJJEM gift with code <b>THANKYOU15</b>.</p>
      <p><a href="https://onjjem.com" style="display:inline-block;background:#c0392b;color:#fff;font-weight:800;padding:12px 22px;border-radius:30px;text-decoration:none">Visit ONJJEM</a></p></div>`)
      .catch((err) => logger.warn({ err }, "jemzi confirmation failed"));
    const admin = process.env.EMAIL_ADMIN;
    if (admin) sendRawEmail(admin, `🦔 Find Jemzi entry: ${name}`, `<p>${esc(name)} (${esc(email)})${child ? " for " + esc(child) : ""}${marketing ? " · offers ✅" : ""}</p>`).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "jemzi entry failed");
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
});

// Owner: list entries and draw the winner after it closes.
router.get("/jemzi-entries", async (req: Request, res: Response) => {
  if (!okKey(req.query.key)) { res.status(403).send("Forbidden"); return; }
  await ensureTable();
  const r = await db.execute(sql`SELECT name, email, child, marketing, entered_at FROM jemzi_finders ORDER BY entered_at DESC`);
  const rows = r.rows as any[];
  const k = encodeURIComponent(String(req.query.key));
  res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:14px;max-width:680px;margin:auto">
    <h2>🦔 Find Jemzi draw: ${rows.length} entries</h2>
    <p><a href="/api/jemzi-draw?key=${k}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#c0392b;color:#fff;font-weight:700;text-decoration:none">🎲 Draw the winner (after 31 Jan)</a></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map((e) => `<tr style="border-bottom:1px solid #eee"><td>${esc(e.name)}</td><td>${esc(e.child ?? "")}</td><td>${esc(e.email)}</td><td>${e.marketing ? "✅" : ""}</td></tr>`).join("")}</table></body>`);
});

router.get("/jemzi-draw", async (req: Request, res: Response) => {
  if (!okKey(req.query.key)) { res.status(403).send("Forbidden"); return; }
  if (new Date() < CLOSES) { res.type("html").send("<p style='font:18px system-ui;padding:20px'>The draw hasn't closed yet (Sun 31 Jan 2027, 8pm UK).</p>"); return; }
  await ensureTable();
  const r = await db.execute(sql`SELECT name, email, child FROM jemzi_finders ORDER BY entered_at`);
  const rows = r.rows as any[];
  if (!rows.length) { res.send("No entries"); return; }
  const w = rows[crypto.randomInt(rows.length)];
  res.type("html").send(`<body style="font:18px system-ui;padding:20px;max-width:560px;margin:auto"><h2>🎉 Winner (picked at random from ${rows.length})</h2><p><b>${esc(w.name)}</b>${w.child ? " for " + esc(w.child) : ""}<br>${esc(w.email)}</p><p style="color:#666">Screenshot this page as your record. Refreshing picks again, so only draw once.</p></body>`);
});

export default router;
