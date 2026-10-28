// Read-only health check of our Prodigi product mapping.
// Open /api/prodigi-check?region=us (or gb). The first visit starts the check
// in the background; the page refreshes itself every few seconds until done.
//
// Prodigi allows 30 API calls per 30 seconds and real orders share that limit,
// so this asks once per Prodigi product (GET /v4.0/products/{sku}, ~1 call a
// second) and checks every one of our colour/size combinations against the
// variants Prodigi returns, including that the variant ships to the country.
// Nothing is ordered or charged. Add &json=1 for raw results, &fresh=1 to rerun.
import { Router, type IRouter } from "express";
import { PRODIGI_PRODUCTS, areasFor } from "../fulfilment/prodigi";
import { US_PRODIGI_PRODUCTS } from "../usShop";

const router: IRouter = Router();

type Result = { ourSku: string; prodigiSku: string; attributes: Record<string, string> | null; ok: boolean; error?: string };
type Job = { region: "us" | "gb"; totalProducts: number; productsDone: number; results: Result[]; done: boolean; startedAt: number };
const jobs: Partial<Record<"us" | "gb", Job>> = {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function baseUrl(): string {
  return (process.env.PRODIGI_ENV || "sandbox").toLowerCase() === "live"
    ? "https://api.prodigi.com"
    : "https://api.sandbox.prodigi.com";
}

async function getProduct(apiKey: string, sku: string): Promise<{ status: number; body: any; raw: string }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${baseUrl()}/v4.0/products/${encodeURIComponent(sku)}`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(20_000),
    });
    const raw = await r.text().catch(() => "");
    if (r.status === 429) { await sleep(10_000); continue; }
    let body: any = {};
    try { body = JSON.parse(raw); } catch {}
    return { status: r.status, body, raw };
  }
  return { status: 429, body: {}, raw: "Still rate-limited after retries" };
}

function startJob(region: "us" | "gb", apiKey: string): Job {
  const country = region === "us" ? "US" : "GB";
  const entries = Object.entries(region === "us" ? US_PRODIGI_PRODUCTS : PRODIGI_PRODUCTS)
    .filter(([k]) => (region === "us" ? true : !k.startsWith("US-")));
  const byProduct = new Map<string, [string, (typeof entries)[number][1]][]>();
  for (const [ourSku, p] of entries) {
    const list = byProduct.get(p.sku) ?? [];
    list.push([ourSku, p]);
    byProduct.set(p.sku, list);
  }
  const job: Job = { region, totalProducts: byProduct.size, productsDone: 0, results: [], done: false, startedAt: Date.now() };
  jobs[region] = job;

  (async () => {
    for (const [prodigiSku, list] of byProduct) {
      let res: Awaited<ReturnType<typeof getProduct>>;
      try {
        res = await getProduct(apiKey, prodigiSku);
      } catch (err) {
        res = { status: 0, body: {}, raw: String(err) };
      }
      const product = res.body?.product;
      const variants: any[] = product?.variants ?? [];
      const attrOptions: Record<string, string[]> = product?.attributes ?? {};
      for (const [ourSku, p] of list) {
        const ours = p.attributes ?? {};
        let error: string | undefined;
        if (!product) {
          error = `Prodigi doesn't know this product (HTTP ${res.status}: ${res.raw.slice(0, 200)})`;
        } else {
          // Attributes with a choice must be sent; ones we send must be valid.
          const missing = Object.entries(attrOptions)
            .filter(([k, v]) => Array.isArray(v) && v.length > 1 && !(k in ours))
            .map(([k, v]) => `${k} (choose from: ${v.join(", ")})`);
          const unknown = Object.keys(ours).filter((k) => !(k in attrOptions));
          const badValue = Object.entries(ours)
            .filter(([k, v]) => Array.isArray(attrOptions[k]) && !attrOptions[k].map(norm).includes(norm(v)))
            .map(([k, v]) => `${k}="${v}" (valid: ${attrOptions[k].join(", ")})`);
          const match = variants.filter((vr) =>
            Object.entries(ours).every(([k, v]) => vr?.attributes?.[k] === undefined || norm(vr.attributes[k]) === norm(v)),
          );
          const shipsHere = match.some((vr) => (vr?.shipsTo ?? []).map((c: string) => c.toUpperCase()).includes(country));
          if (missing.length) error = `Missing option: ${missing.join("; ")}`;
          else if (unknown.length) error = `Prodigi has no option called: ${unknown.join(", ")} (it has: ${Object.keys(attrOptions).join(", ") || "none"})`;
          else if (badValue.length) error = `Not a valid choice: ${badValue.join("; ")}`;
          else if (!match.length) error = "No Prodigi variant matches these options";
          else if (!shipsHere) error = `This variant doesn't ship to ${country}`;
        }
        job.results.push({ ourSku, prodigiSku, attributes: p.attributes ?? null, ok: !error, error });
      }
      job.productsDone++;
      await sleep(1500); // stay well under 30 calls per 30s, leaving room for real orders
    }
    job.done = true;
  })().catch(() => { job.done = true; });
  return job;
}

router.get("/prodigi-check", (req, res) => {
  const region = String(req.query.region || "us").toLowerCase() === "gb" ? "gb" : "us";
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) {
    res.status(500).send("PRODIGI_API_KEY not set");
    return;
  }
  let job = jobs[region];
  const stale = job && job.done && Date.now() - job.startedAt > 30 * 60_000;
  if (!job || stale || (req.query.fresh && job.done)) job = startJob(region, apiKey);

  const results = job.results.slice().sort((a, b) => Number(a.ok) - Number(b.ok) || a.ourSku.localeCompare(b.ourSku));
  const bad = results.filter((r) => !r.ok);

  if (req.query.json) {
    res.json({ env: (process.env.PRODIGI_ENV || "sandbox").toLowerCase(), region, done: job.done, productsChecked: job.productsDone, totalProducts: job.totalProducts, items: results.length, failed: bad.length, results });
    return;
  }
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const head = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">${job.done ? "" : `<meta http-equiv="refresh" content="5;url=?region=${region}">`}<title>Prodigi check</title><body style="font:16px system-ui;padding:16px;max-width:640px;margin:auto">`;
  if (!job.done) {
    res.type("html").send(`${head}<h2>Prodigi check (${region.toUpperCase()})</h2><p style="font-size:22px">⏳ Checked ${job.productsDone} of ${job.totalProducts} products…</p><p>This page refreshes by itself. It takes about a minute.</p>`);
    return;
  }
  res.type("html").send(`${head}
<h2>Prodigi check (${region.toUpperCase()}, ${esc((process.env.PRODIGI_ENV || "sandbox").toLowerCase())})</h2>
<p style="font-size:22px">${bad.length === 0 ? "✅" : "❌"} ${results.length - bad.length} of ${results.length} items OK</p>
<p>${job.totalProducts} Prodigi products checked, including that each one ships to ${region === "us" ? "the US" : "the UK"}.</p>
${(() => {
  const g = new Map<string, { n: number; err: string; ex: string[] }>();
  for (const r of bad) {
    const e = /EntityNotFound|doesn't know/.test(r.error || "") ? "Prodigi doesn't have this product (404)" : String(r.error).slice(0, 400);
    const x = g.get(r.prodigiSku) ?? { n: 0, err: e, ex: [] };
    x.n++; if (x.ex.length < 2) x.ex.push(r.ourSku);
    g.set(r.prodigiSku, x);
  }
  return [...g].map(([k, v]) => `<p style="margin:.6em 0"><b>${esc(k)}</b> ×${v.n}<br><small>${esc(v.err)}<br>e.g. ${esc(v.ex.join(", "))}</small></p>`).join("");
})()}
`);
});


// Owner-only: see a Prodigi order's status and cancel it. /api/prodigi-order?key=...&id=ord_...
const okKey = (k: unknown) => { const want = String(process.env.GIVEAWAY_KEY ?? "").replace(/\s+/g, "").toLowerCase(); return !!want && String(k ?? "").replace(/\s+/g, "").toLowerCase() === want; };
router.get("/prodigi-order", async (req, res) => {
  if (!okKey(req.query.key)) { res.status(403).send("Forbidden"); return; }
  const apiKey = process.env.PRODIGI_API_KEY;
  const id = String(req.query.id || "");
  if (!apiKey || !/^ord_[0-9]+$/.test(id)) { res.status(400).send("Bad order id"); return; }
  const k = encodeURIComponent(String(req.query.key));
  try {
    let note = "";
    if (req.query.cancel === "1") {
      const c = await fetch(`${baseUrl()}/v4.0/orders/${id}/actions/cancel`, { method: "POST", headers: { "X-API-Key": apiKey }, signal: AbortSignal.timeout(20_000) });
      const cj: any = await c.json().catch(() => ({}));
      note = c.ok && cj.outcome !== "Failed" ? "✅ Cancel request sent: " + (cj.outcome || "ok") : "❌ Could not cancel: " + (cj.outcome || cj.traceParent || c.status) + " (it may already be in production)";
    }
    const r = await fetch(`${baseUrl()}/v4.0/orders/${id}`, { headers: { "X-API-Key": apiKey }, signal: AbortSignal.timeout(20_000) });
    const j: any = await r.json().catch(() => ({}));
    const o = j.order || {};
    const st = o.status || {};
    const items = (o.items || []).map((i: any) => `${i.sku} × ${i.copies}`).join(", ");
    const canCancel = st.details && st.details.cancellation ? st.details.cancellation : "?";
    res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:17px system-ui;padding:16px;max-width:560px;margin:auto">
      <h2>Prodigi order ${id}</h2>${note ? `<p style="font-weight:700">${note}</p>` : ""}
      <p><b>Stage:</b> ${st.stage || "?"}<br><b>Items:</b> ${items || "?"}<br><b>Created:</b> ${o.created || "?"}<br><b>Cancellation:</b> ${canCancel}<br><b>Ship to:</b> ${(o.recipient && o.recipient.name) || "?"}</p>
      ${st.stage === "Cancelled" ? "<p>This order is cancelled. Nothing will be printed.</p>" : `<p><a href="/api/prodigi-order?key=${k}&id=${id}&cancel=1" onclick="return confirm('Cancel this order?')" style="display:block;text-align:center;padding:14px;border-radius:12px;background:#c0392b;color:#fff;font-weight:700;text-decoration:none">Cancel this order</a></p>`}
      </body>`);
  } catch (err) { res.status(500).send(String(err)); }
});

export default router;

// Read-only: the exact print areas and sizes Prodigi expects for one product.
// Open /api/prodigi-spec?sku=GLOBAL-GRE-MOH-7X5-BLA  (nothing is ordered).
router.get("/prodigi-spec", async (req, res) => {
  const apiKey = process.env.PRODIGI_API_KEY;
  const sku = String(req.query.sku || "").trim();
  if (!apiKey) { res.status(500).send("No Prodigi key set"); return; }
  if (!/^[A-Z0-9-]{3,60}$/i.test(sku)) { res.status(400).send("Add ?sku=PRODIGI-SKU"); return; }
  const r = await getProduct(apiKey, sku);
  const p = r.body?.product ?? {};
  const v = (p.variants ?? [])[0] ?? {};
  const summary = {
    sku, status: r.status, description: p.description,
    printAreas: v.printAreaSizes ?? p.printAreas ?? null,
    attributes: p.attributes ?? null,
    variantAttributes: v.attributes ?? null,
  };
  res.type("text/plain").send(JSON.stringify(summary, null, 2) + "\n\n--- full ---\n" + r.raw.slice(0, 6000));
});

// Read-only: ask Prodigi to price one of OUR products exactly as we'd order it
// (same SKU, attributes and print areas). Nothing is ordered or charged.
// Open /api/prodigi-quote?sku=calendar-a4&country=GB (several: sku=a,b,c)
router.get("/prodigi-quote", async (req, res) => {
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) { res.status(500).send("No Prodigi key set"); return; }
  const country = String(req.query.country || "GB").toUpperCase().slice(0, 2);
  const skus = String(req.query.sku || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);
  const out: string[] = [];
  for (const ourSku of skus) {
    const p = PRODIGI_PRODUCTS[ourSku];
    if (!p) { out.push(`=== ${ourSku}: unknown product`); continue; }
    const areas = p.pageAreas ?? areasFor(p);
    const body = {
      shippingMethod: p.shipping ?? "Standard",
      destinationCountryCode: country,
      currencyCode: country === "US" ? "USD" : "GBP",
      items: [p, ...(p.bundle ?? []).map((b) => PRODIGI_PRODUCTS[b]).filter(Boolean)].map((x, i) => ({ sku: x.sku, copies: 1, ...(x.attributes ? { attributes: x.attributes } : {}), assets: (i === 0 ? areas : areasFor(x)).map((a) => ({ printArea: a })) })),
    };
    try {
      const r = await fetch(`${baseUrl()}/v4.0/quotes`, {
        method: "POST",
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      const raw = await r.text();
      let summary = raw.slice(0, 1500);
      try {
        const j = JSON.parse(raw);
        const q = j.quotes?.[0];
        if (r.ok && q) summary = `OK  item ${q.costSummary?.items?.amount} + shipping ${q.costSummary?.shipping?.amount} ${q.costSummary?.items?.currency ?? ""}`;
      } catch {}
      out.push(`=== ${ourSku} (${p.sku}) → HTTP ${r.status}\n${r.ok ? "✅ " : "❌ "}${summary}`);
    } catch (err) {
      out.push(`=== ${ourSku}: ${String(err)}`);
    }
    await new Promise((res2) => setTimeout(res2, 1100));
  }
  res.type("text/plain; charset=utf-8").send(out.join("\n\n"));
});
