// Read-only health check of our Prodigi product mapping.
// Open /api/prodigi-check?region=us (or gb). The first visit starts the check
// in the background; the page refreshes itself every few seconds until done.
// For every website SKU it asks Prodigi for a price quote to that country with
// the exact SKU + attributes we would order with. Nothing is ordered or charged.
// A failed quote means a real order for that item would be rejected.
// Add &json=1 for raw results, &fresh=1 to run it again.
import { Router, type IRouter } from "express";
import { PRODIGI_PRODUCTS } from "../fulfilment/prodigi";
import { US_PRODIGI_PRODUCTS } from "../usShop";

const router: IRouter = Router();

type Result = Record<string, unknown> & { ourSku: string; ok: boolean };
type Job = { region: "us" | "gb"; total: number; results: Result[]; done: boolean; startedAt: number };
const jobs: Partial<Record<"us" | "gb", Job>> = {};

function baseUrl(): string {
  return (process.env.PRODIGI_ENV || "sandbox").toLowerCase() === "live"
    ? "https://api.prodigi.com"
    : "https://api.sandbox.prodigi.com";
}

function startJob(region: "us" | "gb", apiKey: string): Job {
  const country = region === "us" ? "US" : "GB";
  const entries = Object.entries(region === "us" ? US_PRODIGI_PRODUCTS : PRODIGI_PRODUCTS)
    .filter(([k]) => (region === "us" ? true : !k.startsWith("US-")));
  const job: Job = { region, total: entries.length, results: [], done: false, startedAt: Date.now() };
  jobs[region] = job;

  const work = entries.slice();
  async function worker() {
    for (let e = work.shift(); e; e = work.shift()) {
      const [ourSku, p] = e;
      const body = {
        shippingMethod: "Standard",
        destinationCountryCode: country,
        currencyCode: region === "us" ? "USD" : "GBP",
        items: [{
          sku: p.sku,
          copies: p.copies ?? 1,
          ...(p.attributes ? { attributes: p.attributes } : {}),
          assets: (p.printAreas ?? ["default"]).map((printArea) => ({ printArea })),
        }],
      };
      try {
        const r = await fetch(`${baseUrl()}/v4.0/quotes`, {
          method: "POST",
          headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        });
        const raw = await r.text().catch(() => "");
        let j: any = {};
        try { j = JSON.parse(raw); } catch { j = {}; }
        const q = j?.quotes?.[0];
        // "Quote does not include sales tax" is only a note, not a problem.
        const realIssues = (j?.issues ?? []).filter((i: any) => !/sales tax/i.test(String(i?.description ?? i?.errorCode ?? "")));
        const ok = r.ok && !!q && realIssues.length === 0 && (j?.outcome === "Created" || j?.outcome === "CreatedWithIssues");
        job.results.push({
          ourSku,
          prodigiSku: p.sku,
          attributes: p.attributes ?? null,
          ok,
          shipsFrom: q?.shipments?.map((s: any) => s?.fulfillmentLocation?.countryCode) ?? null,
          itemCost: q?.costSummary?.items ?? null,
          shippingCost: q?.costSummary?.shipping ?? null,
          error: ok ? undefined : `HTTP ${r.status}: ${raw.slice(0, 300)}`,
        });
      } catch (err) {
        job.results.push({ ourSku, prodigiSku: p.sku, ok: false, error: String(err) });
      }
    }
  }
  Promise.all(Array.from({ length: 4 }, worker)).finally(() => { job.done = true; });
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

  const country = region === "us" ? "US" : "GB";
  const results = job.results.slice().sort((a, b) => Number(a.ok) - Number(b.ok) || a.ourSku.localeCompare(b.ourSku));
  const bad = results.filter((r) => !r.ok);
  const notLocal = results.filter((r) => r.ok && Array.isArray(r.shipsFrom) && (r.shipsFrom as string[]).some((c) => c !== country)).map((r) => r.ourSku);

  if (req.query.json) {
    res.json({ env: (process.env.PRODIGI_ENV || "sandbox").toLowerCase(), region, done: job.done, total: job.total, checked: results.length, failed: bad.length, notMadeLocally: notLocal, results });
    return;
  }

  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const head = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">${job.done ? "" : '<meta http-equiv="refresh" content="4">'}<title>Prodigi check</title><body style="font:16px system-ui;padding:16px;max-width:640px;margin:auto">`;
  if (!job.done) {
    res.type("html").send(`${head}<h2>Prodigi check (${region.toUpperCase()})</h2><p style="font-size:22px">⏳ Checking ${results.length} of ${job.total} items…</p><p>This page refreshes by itself. It takes about a minute.</p>`);
    return;
  }
  res.type("html").send(`${head}
<h2>Prodigi check (${region.toUpperCase()}, ${esc((process.env.PRODIGI_ENV || "sandbox").toLowerCase())})</h2>
<p style="font-size:22px">${bad.length === 0 ? "✅" : "❌"} ${results.length - bad.length} of ${results.length} items OK</p>
<p>Not made in ${country}: ${esc(notLocal.join(", ") || "none")}</p>
${bad.map((r) => `<p><b>${esc(r.ourSku)}</b> (${esc(r.prodigiSku)} ${esc(JSON.stringify(r.attributes))})<br><small>${esc(r.error)}</small></p>`).join("")}`);
});

export default router;
