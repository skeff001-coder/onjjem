import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendGiveawayConfirmation, sendGiveawayAdminEntry, giveawayPromoEmail, sendRawEmail } from "../email/mailer";
import crypto from "node:crypto";
import { logger } from "../lib/logger";

// Ignore spaces/case so a stray space in the Railway value still works
const normKey = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();

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
  await db.execute(sql`ALTER TABLE giveaway_entries ADD COLUMN IF NOT EXISTS promo1_sent_at TIMESTAMPTZ`);
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
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    await ensureTable();
    const cnt = await db.execute(sql`SELECT COUNT(*)::int AS n FROM giveaway_entries`);
    const win = await db.execute(sql`SELECT name, email, pet_name, country, entered_at, (photo IS NOT NULL) AS has_photo FROM giveaway_entries ORDER BY random() LIMIT 1`);
    res.json({ totalEntries: (cnt.rows[0] as { n: number }).n, randomWinner: win.rows[0] ?? null, closed: new Date() >= CLOSES });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "error" });
  }
});

// Owner-only: list every web-form entry. /api/giveaway-entries?key=YOURKEY
router.get("/giveaway-entries", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).send("Forbidden: add ?key= with your GIVEAWAY_KEY"); return; }
  try {
    await ensureTable();
    const r = await db.execute(sql`SELECT name, email, pet_name, country, marketing, entered_at, (photo IS NOT NULL) AS has_photo FROM giveaway_entries ORDER BY entered_at`);
    const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const k = encodeURIComponent(String(req.query.key));
    const all = r.rows as any[];
    const rows = all.map((e, i) => `<tr><td>${i + 1}</td><td><b>${esc(e.name)}</b><br><small>${esc(e.email)}</small></td><td>${esc(e.country)}</td><td>${new Date(e.entered_at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${e.marketing ? "✅" : "–"}</td><td>${e.has_photo ? `<a href="/api/giveaway-photo?key=${k}&email=${encodeURIComponent(e.email)}">📸 view</a>` : "–"}</td></tr>`).reverse().join("");
    const optIn = all.filter((e) => e.marketing).map((e) => String(e.email));
    const photos = all.filter((e) => e.has_photo).length;
    const today = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });
    const todayN = all.filter((e) => new Date(e.entered_at).toLocaleDateString("en-GB", { timeZone: "Europe/London" }) === today).length;
    const us = all.filter((e) => e.country === "US").length;
    const box = (n: number | string, l: string) => `<div style="flex:1 1 30%;background:#f6f0fa;border-radius:12px;padding:10px;text-align:center"><div style="font-size:26px;font-weight:800">${n}</div><div style="font-size:13px;color:#555">${l}</div></div>`;
    const stats = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">${box(all.length, "Total")}${box(todayN, "Today")}${box(optIn.length, "✅ Said yes to offers")}${box(photos, "📸 Uploaded a photo")}${box(all.length - us, "🇬🇧 UK")}${box(us, "🇺🇸 US")}</div>`;
    const list = `<details style="margin:0 0 14px"><summary style="font-weight:700;cursor:pointer">📧 Emails that said yes to offers (${optIn.length})</summary><textarea id=ol readonly style="width:100%;height:110px;margin-top:8px;font:13px monospace">${esc(optIn.join(", "))}</textarea><button onclick="navigator.clipboard.writeText(document.getElementById('ol').value);this.textContent='Copied ✓'" style="padding:10px 16px;border-radius:10px;border:0;background:#8E2DE2;color:#fff;font-weight:700">Copy all</button></details>`;
    res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Giveaway entries</title><body style="font:15px system-ui;padding:14px;max-width:760px;margin:auto"><h2>🎁 Giveaway entries: ${r.rows.length}</h2><p style="color:#666">Website form only. Add comment entrants from TikTok, Instagram and Facebook by hand. Newest at the top.</p>${stats}${list}<table style="border-collapse:collapse;width:100%" cellpadding=7 border=1><tr style="background:#f3f3f3"><th>#</th><th>Name</th><th>Country</th><th>Entered</th><th>Offers</th><th>Photo</th></tr>${rows}</table>`);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : "error");
  }
});

// Owner-only: view an entrant's pet photo. /api/giveaway-photo?key=YOURKEY&email=them@example.com
router.get("/giveaway-photo", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).json({ error: "Forbidden" }); return; }
  const email = String(req.query.email ?? "").trim().toLowerCase();
  const r = await db.execute(sql`SELECT photo FROM giveaway_entries WHERE email = ${email}`);
  const photo = (r.rows[0] as { photo?: string } | undefined)?.photo;
  if (!photo) { res.status(404).send("No photo"); return; }
  const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(photo);
  if (!m) { res.status(404).send("No photo"); return; }
  res.type(m[1]).send(Buffer.from(m[2], "base64"));
});

export default router;


// ---- Follow-up offer email to entrants who opted in to offers ----
const unsubToken = (email: string) => crypto.createHmac("sha256", "onjjem-unsub:" + normKey(process.env.GIVEAWAY_KEY)).update(email.toLowerCase()).digest("hex").slice(0, 24);
const promoFor = (e: { name: string; email: string; country: string }) => {
  const em = encodeURIComponent(e.email);
  return giveawayPromoEmail({
    name: e.name, country: e.country,
    claimUrl: `https://onjjem.com/claim.html?e=${em}${e.country === "US" ? "&us=1" : ""}`,
    unsubUrl: `https://onjjem.com/api/unsubscribe?e=${em}&t=${unsubToken(e.email)}`,
  });
};
let promoRunning = false;

// Owner-only. ?mode=preview (default) shows the email + who gets it; mode=test sends one to EMAIL_ADMIN; mode=send emails everyone not yet sent.
router.get("/giveaway-promo", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).send("Forbidden"); return; }
  try {
    await ensureTable();
    const r = await db.execute(sql`SELECT name, email, country FROM giveaway_entries WHERE marketing = TRUE AND promo1_sent_at IS NULL ORDER BY entered_at`);
    const todo = r.rows as { name: string; email: string; country: string }[];
    const mode = String(req.query.mode || "preview");
    const k = encodeURIComponent(String(req.query.key));
    if (mode === "test") {
      const admin = process.env.EMAIL_ADMIN || "";
      const sample = todo.find((e) => e.country !== "US") || { name: "Owen", email: admin, country: "GB" };
      const m = promoFor({ ...sample, email: admin });
      await sendRawEmail(admin, "[TEST] " + m.subject, m.html);
      res.type("html").send(`<body style="font:17px system-ui;padding:20px">✅ Test email sent to <b>${admin}</b>. Check your inbox (and Spam).<br><br><a href="/api/giveaway-promo?key=${k}">← Back</a></body>`);
      return;
    }
    if (mode === "send") {
      if (promoRunning) { res.type("html").send(`<body style="font:17px system-ui;padding:20px">Already sending, please wait a minute and refresh.</body>`); return; }
      promoRunning = true;
      (async () => {
        let ok = 0;
        for (const e of todo) {
          try { const m = promoFor(e); await sendRawEmail(e.email, m.subject, m.html); await db.execute(sql`UPDATE giveaway_entries SET promo1_sent_at = NOW() WHERE email = ${e.email}`); ok++; }
          catch (err) { logger.warn({ err, email: e.email }, "promo email failed"); }
          await new Promise((r) => setTimeout(r, 700));
        }
        logger.info({ ok, total: todo.length }, "Giveaway promo sent");
        promoRunning = false;
      })();
      res.type("html").send(`<body style="font:17px system-ui;padding:20px">🚀 Sending to <b>${todo.length}</b> people now. It takes about ${Math.ceil(todo.length * 0.8)} seconds.<br><br>Refresh <a href="/api/giveaway-promo?key=${k}">this page</a> in a minute: "Still to send" should be 0. Anyone already sent is never emailed twice.</body>`);
      return;
    }
    const sample = promoFor(todo[0] || { name: "Owen", email: "you@example.com", country: "GB" });
    res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:14px;max-width:640px;margin:auto">
      <h2>📧 Giveaway offer email</h2><p><b>Still to send: ${todo.length}</b> people who ticked "send me offers" (UK ${todo.filter((e) => e.country !== "US").length}, US ${todo.filter((e) => e.country === "US").length}).</p>
      <p><a href="/api/giveaway-promo?key=${k}&mode=test" style="display:block;text-align:center;padding:14px;border-radius:12px;background:#eee;color:#111;font-weight:700;text-decoration:none">1️⃣ Send a test to myself</a></p>
      <p><a href="/api/giveaway-promo?key=${k}&mode=send" onclick="return confirm('Send to ${todo.length} people now?')" style="display:block;text-align:center;padding:14px;border-radius:12px;background:#8E2DE2;color:#fff;font-weight:700;text-decoration:none">2️⃣ Send to all ${todo.length} now</a></p>
      <p style="color:#666">Subject: <b>${sample.subject}</b></p><iframe srcdoc="${sample.html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" style="width:100%;height:900px;border:1px solid #ddd;border-radius:12px"></iframe></body>`);
  } catch (err) {
    promoRunning = false;
    res.status(500).send(err instanceof Error ? err.message : "error");
  }
});

// One-click unsubscribe from offer emails.
router.get("/unsubscribe", async (req: Request, res: Response) => {
  const email = String(req.query.e || "").toLowerCase().trim();
  if (!email || String(req.query.t || "") !== unsubToken(email)) { res.status(400).send("This unsubscribe link isn't valid. Email hello@onjjem.com and we'll remove you."); return; }
  try {
    await ensureTable();
    await db.execute(sql`UPDATE giveaway_entries SET marketing = FALSE WHERE LOWER(email) = ${email}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_subscribers (email TEXT PRIMARY KEY, subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await db.execute(sql`DELETE FROM email_subscribers WHERE LOWER(email) = ${email}`);
    res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:17px system-ui;padding:30px;text-align:center"><h2>You're unsubscribed</h2><p>We won't send you any more offers. You're still in the giveaway draw.</p><p><a href="https://onjjem.com">onjjem.com</a></p></body>`);
  } catch (err) {
    res.status(500).send("Something went wrong. Email hello@onjjem.com and we'll remove you.");
  }
});
