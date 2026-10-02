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
import { PRODIGI_PRODUCTS } from "../fulfilment/prodigi";
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
    const e = /EntityNotFound|doesn't know/.test(r.error || "") ? "Prodigi doesn't have this product (404)" : String(r.error).slice(0, 90);
    const x = g.get(r.prodigiSku) ?? { n: 0, err: e, ex: [] };
    x.n++; if (x.ex.length < 2) x.ex.push(r.ourSku);
    g.set(r.prodigiSku, x);
  }
  return [...g].map(([k, v]) => `<p style="margin:.6em 0"><b>${esc(k)}</b> ×${v.n}<br><small>${esc(v.err)}<br>e.g. ${esc(v.ex.join(", "))}</small></p>`).join("");
})()}
`);
});

export default router;
