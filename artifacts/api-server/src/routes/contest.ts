// ── Halloween colouring competition (judged, not a draw) ──────────────────────
// Every colouring page order includes one entry: send a photo of the finished,
// coloured-in page. The best colouring (judged by ONJJEM on creativity, colour
// and effort) wins their artwork printed on a mug. A skill-based judged
// competition, not a lottery, so including entry with a purchase is allowed.
import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";
import { generateCartoon } from "./cartoonify";

const router = Router();
const CLOSES = new Date("2026-11-02T20:00:00Z"); // Mon 2 Nov, 8pm UK
const normKey = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();

async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS contest_entries (
    id TEXT PRIMARY KEY, session_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
    child TEXT, country TEXT, photo TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

router.post("/contest-entry", async (req: Request, res: Response) => {
  try {
    if (new Date() >= CLOSES) { res.status(400).json({ error: "Sorry, the competition has closed." }); return; }
    const { session_id, name, child, photo, adult } = req.body as Record<string, any>;
    if (!/^cs_[A-Za-z0-9_]+$/.test(String(session_id || ""))) { res.status(400).json({ error: "Please use the link from your colouring page order." }); return; }
    if (!String(name || "").trim()) { res.status(400).json({ error: "Please add your first name." }); return; }
    if (!adult) { res.status(400).json({ error: "Please confirm you're 18+ (a parent or carer) and agree to the rules." }); return; }
    if (!/^data:image\/[a-z+]+;base64,.+$/s.test(String(photo || "")) || String(photo).length > 8_000_000) { res.status(400).json({ error: "Please add a photo of the coloured-in page." }); return; }
    const stripe = await getUncachableStripeClient();
    const s = await stripe.checkout.sessions.retrieve(session_id);
    if (s.payment_status !== "paid" || !String(s.metadata?.sku || "").startsWith("printable-")) { res.status(400).json({ error: "We couldn't find a colouring page order for this link." }); return; }
    await ensureTable();
    const email = (s.customer_details?.email || "").toLowerCase();
    const country = String(s.currency || "").toLowerCase() === "usd" ? "US" : "GB";
    const r = await db.execute(sql`INSERT INTO contest_entries (id, session_id, name, email, child, country, photo)
      VALUES (${crypto.randomBytes(8).toString("hex")}, ${session_id}, ${String(name).trim().slice(0, 60)}, ${email}, ${String(child || "").trim().slice(0, 40)}, ${country}, ${photo})
      ON CONFLICT (session_id) DO NOTHING RETURNING id`);
    res.json({ ok: true, already: r.rows.length === 0 });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "contest entry failed");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Owner-only list of entries with photos, for judging.
router.get("/contest-entries", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).send("Forbidden"); return; }
  await ensureTable();
  const r = await db.execute(sql`SELECT id, name, email, child, country, created_at FROM contest_entries ORDER BY created_at DESC`);
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const k = encodeURIComponent(String(req.query.key));
  const cards = (r.rows as any[]).map((e) => `<div style="border:1px solid #ddd;border-radius:12px;padding:10px;margin:0 0 12px"><a href="/api/contest-photo?key=${k}&id=${e.id}"><img src="/api/contest-photo?key=${k}&id=${e.id}" style="width:100%;border-radius:8px" loading="lazy"></a><p style="margin:6px 0 0"><a href="/api/contest-xmas?key=${k}&id=${e.id}" style="display:inline-block;margin:0 0 6px;padding:8px 12px;border-radius:10px;background:#1a7a3a;color:#fff;font-weight:700;text-decoration:none">🎄 Make their Christmas cartoon (takes ~30s)</a><br><b>${esc(e.child || "-")}</b> · entered by ${esc(e.name)} (${esc(e.email)}) · ${esc(e.country)} · ${new Date(e.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>`).join("");
  res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Colouring entries</title><body style="font:15px system-ui;padding:14px;max-width:640px;margin:auto"><h2>🖍️ Colouring competition: ${r.rows.length} entries</h2><p style="color:#666">Closes Mon 2 Nov, 8pm UK. Pick the best colouring. Newest first.</p>${cards || "<p>No entries yet.</p>"}</body>`);
});

router.get("/contest-photo", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).end(); return; }
  await ensureTable();
  const r = await db.execute(sql`SELECT photo FROM contest_entries WHERE id = ${String(req.query.id || "")}`);
  const p = (r.rows[0] as { photo?: string } | undefined)?.photo;
  const m = p ? /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(p) : null;
  if (!m) { res.status(404).end(); return; }
  res.set("Content-Type", m[1]).send(Buffer.from(m[2], "base64"));
});

// Owner-only: turn the winner's ORIGINAL photo (the one used for their colouring page) into a Christmas cartoon for the mug.
router.get("/contest-xmas", async (req: Request, res: Response) => {
  const key = normKey(process.env.GIVEAWAY_KEY);
  if (!key || normKey(req.query.key) !== key) { res.status(403).send("Forbidden"); return; }
  try {
    await ensureTable();
    const r = await db.execute(sql`SELECT session_id FROM contest_entries WHERE id = ${String(req.query.id || "")}`);
    const sid = (r.rows[0] as { session_id?: string } | undefined)?.session_id;
    if (!sid) { res.status(404).send("Entry not found"); return; }
    const stripe = await getUncachableStripeClient();
    const s = await stripe.checkout.sessions.retrieve(sid);
    const pid = s.metadata?.printable_id;
    const pr = pid ? await db.execute(sql`SELECT photo_b64 FROM printables WHERE id = ${pid}`) : null;
    const photo = (pr?.rows[0] as { photo_b64?: string } | undefined)?.photo_b64;
    const m = photo ? /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(photo) : null;
    if (!m) { res.status(404).send("Original photo not found (photos are kept for 60 days)."); return; }
    const out = await generateCartoon(m[2], m[1], "christmas");
    res.set("Content-Type", out.mimeType).set("Content-Disposition", `inline; filename="christmas-cartoon.png"`).send(Buffer.from(out.base64Image, "base64"));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "contest xmas failed");
    res.status(500).send("Couldn't make the cartoon. Refresh to try again.");
  }
});

export default router;
