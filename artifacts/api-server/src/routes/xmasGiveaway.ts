// ── Christmas giveaway (Nov 2026) ─────────────────────────────────────────────
// Free entry. Prize: a personalised cartoon blanket. Everyone who adds a photo
// gets their own Christmas cartoon emailed straight away (the sales hook).
// Opens 1 Nov, closes Sun 22 Nov 2026 8pm UK, random draw Mon 23 Nov.
import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendRawEmail, sendEmailWithAttachment } from "../email/mailer";
import { generateCartoon, addCornerBadge } from "./cartoonify";
import { logger } from "../lib/logger";

const router = Router();
const CLOSES = new Date("2026-11-22T20:00:00Z");
const normKey = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();
const okKey = (k: unknown) => { const w = normKey(process.env.GIVEAWAY_KEY); return !!w && normKey(k) === w; };
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const first = (n: string) => esc((n || "there").trim().split(/\s+/)[0].toLowerCase().replace(/(^|[-'])\p{L}/gu, (c) => c.toUpperCase()));
const ipHits = new Map<string, { day: string; n: number }>();

async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS xmas_entries (
    email TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL, marketing BOOLEAN NOT NULL DEFAULT FALSE,
    ip TEXT, photo TEXT, cartoon_sent_at TIMESTAMPTZ, entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

const wrap = (inner: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#222;line-height:1.6">
  <div style="background:#0f3d24;color:#fff;text-align:center;padding:18px;border-radius:12px 12px 0 0"><div style="font-size:11px;letter-spacing:.2em;color:#F3D078">UK FAMILY BUSINESS</div><div style="font-size:28px;font-weight:800;letter-spacing:.12em">ONJJEM</div></div>
  <div style="border:1px solid #eee;border-top:0;padding:22px;border-radius:0 0 12px 12px">${inner}</div></div>`;

const btn = (href: string, label: string) => `<p style="text-align:center;margin:18px 0"><a href="${href}" style="display:inline-block;background:#c0392b;color:#fff;font-weight:800;padding:14px 26px;border-radius:30px;text-decoration:none">${label}</a></p>`;

async function sendCartoon(e: { name: string; email: string; country: string; photo: string }) {
  const m = /^data:(image\/[a-z+]+);base64,(.*)$/s.exec(e.photo || "");
  if (!m) return;
  const raw = await generateCartoon(m[2], m[1], "christmas");
  let out = raw;
  try { out = await addCornerBadge(raw.base64Image); } catch { /* plain cartoon is fine */ }
  const us = e.country === "US";
  const shop = us ? "https://onjjem.com/us/christmas" : "https://onjjem.com/christmas";
  const html = wrap(`<h2 style="margin:0 0 10px">🎄 Here's your Christmas cartoon, ${first(e.name)}!</h2>
    <p>Thanks for entering our Christmas giveaway. As promised, here's your photo as a Christmas cartoon. It's attached to this email to keep, share or use as your profile picture.</p>
    <p><b>Love it?</b> We can print it on a Christmas sweatshirt, mug, bauble, blanket or card. Upload this cartoon on any gift page and it'll be on its way to you before Christmas.</p>
    ${btn(shop, "Put my cartoon on a gift 🎁")}
    <p style="font-size:13px;color:#666">${us ? "Order by December 10 for Christmas delivery." : "Order by 12 December for Christmas delivery."} The winner of the giveaway is drawn on Mon 23 November. Good luck! 🍀</p>`);
  const ext = out.mimeType.includes("png") ? "png" : "jpg";
  await sendEmailWithAttachment(e.email, "🎄 Your free Christmas cartoon is here!", html, `my-christmas-cartoon.${ext}`, out.base64Image);
  await db.execute(sql`UPDATE xmas_entries SET cartoon_sent_at = NOW(), photo = NULL WHERE email = ${e.email}`);
}

router.post("/xmas-entry", async (req: Request, res: Response) => {
  if (Date.now() < Date.parse("2026-10-31T00:00:00Z")) { res.status(400).json({ error: "The Christmas giveaway opens on 1 November." }); return; }
  if (new Date() >= CLOSES) { res.status(410).json({ error: "Sorry, this giveaway has closed." }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website) { res.json({ ok: true }); return; }
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const email = clean(b.email, 200).toLowerCase();
  const name = clean(b.name, 60);
  const country = clean(b.country, 2).toUpperCase();
  const marketing = b.marketing === true;
  let photo: string | null = null;
  if (typeof b.photo === "string" && b.photo) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo) || b.photo.length > 4_500_000) { res.status(400).json({ error: "That photo couldn't be used. Please try another one (or enter without a photo)." }); return; }
    photo = b.photo;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) { res.status(400).json({ error: "Please fill in your name and a valid email." }); return; }
  if (country !== "GB" && country !== "US") { res.status(400).json({ error: "The giveaway is open to the UK and the US only." }); return; }
  if (b.adult !== true) { res.status(400).json({ error: "You must be 18 or over to enter." }); return; }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const hit = ipHits.get(ip); const n = hit && hit.day === day ? hit.n + 1 : 1; ipHits.set(ip, { day, n });
  if (n > 5) { res.status(429).json({ error: "Too many entries from this device today." }); return; }
  try {
    await ensureTable();
    const ins = await db.execute(sql`INSERT INTO xmas_entries (email, name, country, marketing, ip, photo)
      VALUES (${email}, ${name}, ${country}, ${marketing}, ${ip}, ${photo}) ON CONFLICT (email) DO NOTHING RETURNING email`);
    if (ins.rows.length === 0) { res.json({ ok: true, already: true }); return; }
    if (marketing) {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS email_subscribers (email TEXT PRIMARY KEY, subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await db.execute(sql`INSERT INTO email_subscribers (email) VALUES (${email}) ON CONFLICT DO NOTHING`);
    }
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM xmas_entries`);
    const total = Number((cnt.rows[0] as { n: number }).n);
    const us = country === "US";
    sendRawEmail(email, "🎄 You're in the ONJJEM Christmas giveaway! Good luck", wrap(`<h2 style="margin:0 0 10px">You're in, ${first(name)}! 🍀</h2>
      <p>Thanks for entering our Christmas giveaway to win <b>a personalised cartoon blanket</b> of your family or pet. The winner is drawn at random on <b>Mon 23 November</b> and we'll email them that day, in time for Christmas delivery.</p>
      ${photo ? "<p>🎄 Your free Christmas cartoon is being drawn now and will arrive in a separate email in a few minutes.</p>" : ""}
      ${marketing ? `<p>Thanks for signing up for offers. As a welcome, here's <b>10% off</b> any gift with code <b>WELCOME10</b>.</p>` : ""}
      ${btn(us ? "https://onjjem.com/us/" : "https://onjjem.com", "See our Christmas gifts 🎁")}`)).catch((err) => logger.warn({ err }, "xmas confirmation failed"));
    const admin = process.env.EMAIL_ADMIN;
    if (admin) sendRawEmail(admin, `🎄 Christmas giveaway entry #${total}: ${name}`, `<p>${esc(name)} (${esc(email)}) · ${country}${marketing ? " · offers ✅" : ""}${photo ? " · photo 📷" : ""}</p><p>Total entries: ${total}</p>`).catch(() => {});
    if (photo) sendCartoon({ name, email, country, photo }).catch((err) => logger.warn({ err, email }, "xmas cartoon failed"));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "xmas entry failed");
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
});

let countCache = { at: 0, n: 0 };
router.get("/xmas-count", async (_req: Request, res: Response) => {
  try {
    if (Date.now() - countCache.at > 30_000) {
      await ensureTable();
      const c = await db.execute(sql`SELECT COUNT(*)::int AS n FROM xmas_entries`);
      countCache = { at: Date.now(), n: Number((c.rows[0] as { n: number }).n) };
    }
    res.set("Cache-Control", "public, max-age=30").json({ count: countCache.n });
  } catch { res.json({ count: 0 }); }
});

// Owner: list entries (+ resend any cartoons that failed).
router.get("/xmas-entries", async (req: Request, res: Response) => {
  if (!okKey(req.query.key)) { res.status(403).send("Forbidden"); return; }
  await ensureTable();
  if (req.query.retry === "1") {
    const r = await db.execute(sql`SELECT name, email, country, photo FROM xmas_entries WHERE photo IS NOT NULL AND cartoon_sent_at IS NULL`);
    (async () => { for (const e of r.rows as any[]) { try { await sendCartoon(e); } catch (err) { logger.warn({ err }, "xmas cartoon retry failed"); } } })();
  }
  const r = await db.execute(sql`SELECT name, email, country, marketing, (photo IS NOT NULL OR cartoon_sent_at IS NOT NULL) AS has_photo, cartoon_sent_at, entered_at FROM xmas_entries ORDER BY entered_at DESC`);
  const rows = r.rows as any[];
  const waiting = rows.filter((e) => e.has_photo && !e.cartoon_sent_at).length;
  const k = encodeURIComponent(String(req.query.key));
  res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:14px;max-width:680px;margin:auto">
    <h2>🎄 Christmas giveaway: ${rows.length} entries</h2>
    <p>UK ${rows.filter((e) => e.country !== "US").length} · US ${rows.filter((e) => e.country === "US").length} · offers ✅ ${rows.filter((e) => e.marketing).length} · cartoons sent ${rows.filter((e) => e.cartoon_sent_at).length}${waiting ? ` · <b>${waiting} cartoons waiting</b> <a href="/api/xmas-entries?key=${k}&retry=1">send them</a>` : ""}</p>
    <p><a href="/api/xmas-draw?key=${k}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#c0392b;color:#fff;font-weight:700;text-decoration:none">🎲 Draw the winner (after it closes)</a></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map((e) => `<tr style="border-bottom:1px solid #eee"><td>${esc(e.name)}</td><td>${esc(e.email)}</td><td>${e.country}</td><td>${e.marketing ? "✅" : ""}</td><td>${e.cartoon_sent_at ? "🎨" : ""}</td></tr>`).join("")}</table></body>`);
});

router.get("/xmas-draw", async (req: Request, res: Response) => {
  if (!okKey(req.query.key)) { res.status(403).send("Forbidden"); return; }
  if (new Date() < CLOSES) { res.type("html").send("<p style='font:18px system-ui;padding:20px'>The giveaway hasn't closed yet (Sun 22 Nov, 8pm UK).</p>"); return; }
  await ensureTable();
  const r = await db.execute(sql`SELECT name, email, country FROM xmas_entries ORDER BY entered_at`);
  const rows = r.rows as any[];
  if (!rows.length) { res.send("No entries"); return; }
  const w = rows[crypto.randomInt(rows.length)];
  res.type("html").send(`<body style="font:18px system-ui;padding:20px;max-width:560px;margin:auto"><h2>🎉 Winner (picked at random from ${rows.length})</h2><p><b>${esc(w.name)}</b><br>${esc(w.email)} · ${w.country}</p><p style="color:#666">Take a screenshot of this page as your record. Refreshing picks again, so only draw once.</p></body>`);
});

export default router;
