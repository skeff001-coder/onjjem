// Read-only health check of our Prodigi product mapping.
// GET /api/prodigi-check?region=us  (or gb)
// For every website SKU it asks Prodigi for a price quote to that country with
// the exact SKU + attributes we would order with. Nothing is ordered or charged.
// A failed quote means a real order for that item would be rejected.
import { Router, type IRouter } from "express";
import { PRODIGI_PRODUCTS } from "../fulfilment/prodigi";
import { US_PRODIGI_PRODUCTS } from "../usShop";

const router: IRouter = Router();
let cache: { at: number; region: string; body: unknown } | null = null;

function baseUrl(): string {
  return (process.env.PRODIGI_ENV || "sandbox").toLowerCase() === "live"
    ? "https://api.prodigi.com"
    : "https://api.sandbox.prodigi.com";
}

router.get("/prodigi-check", async (req, res) => {
  const region = String(req.query.region || "us").toLowerCase() === "gb" ? "gb" : "us";
  if (req.query.fresh) cache = null;
  if (cache && cache.region === region && Date.now() - cache.at < 10 * 60_000 && req.query.view !== "html") {
    res.json(cache.body);
    return;
  }
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "PRODIGI_API_KEY not set" });
    return;
  }
  const country = region === "us" ? "US" : "GB";
  const entries = Object.entries(region === "us" ? US_PRODIGI_PRODUCTS : PRODIGI_PRODUCTS)
    .filter(([k]) => (region === "us" ? true : !k.startsWith("US-")))
    .slice(0, req.query.quick ? 6 : undefined);

  const results: Record<string, unknown>[] = [];
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
          headers: { "X-API-Key": apiKey!, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        });
        const raw = await r.text().catch(() => "");
        let j: any = {};
        try { j = JSON.parse(raw); } catch { j = {}; }
        const q = j?.quotes?.[0];
        // "Quote does not include sales tax" is only a note, not a problem.
        const realIssues = (j?.issues ?? []).filter((i: any) => !/sales tax/i.test(String(i?.description ?? i?.errorCode ?? "")));
        results.push({
          ourSku,
          prodigiSku: p.sku,
          attributes: p.attributes ?? null,
          ok: r.ok && !!q && (j?.outcome === "Created" || (j?.outcome === "CreatedWithIssues" && realIssues.length === 0)),
          issues: realIssues.length ? realIssues : undefined,
          outcome: j?.outcome ?? r.status,
          failures: j?.failures,
          shipsFrom: q?.shipments?.map((s: any) => s?.fulfillmentLocation?.countryCode) ?? null,
          itemCost: q?.costSummary?.items ?? null,
          shippingCost: q?.costSummary?.shipping ?? null,
          status: r.status,
          error: r.ok && q && realIssues.length === 0 ? undefined : `HTTP ${r.status}: ${raw.slice(0, 250)}`,
        });
      } catch (err) {
        results.push({ ourSku, prodigiSku: p.sku, ok: false, error: String(err) });
      }
    }
  }
  await Promise.all(Array.from({ length: 2 }, worker));
  results.sort((a, b) => Number(a.ok) - Number(b.ok) || String(a.ourSku).localeCompare(String(b.ourSku)));
  const out = {
    env: (process.env.PRODIGI_ENV || "sandbox").toLowerCase(),
    region,
    checked: results.length,
    failed: results.filter((r) => !r.ok).length,
    notShippedFromDestination: results.filter((r) => r.ok && Array.isArray(r.shipsFrom) && (r.shipsFrom as string[]).some((c) => c !== country)).map((r) => r.ourSku),
    results,
  };
  cache = { at: Date.now(), region, body: out };
  if (req.query.view === "html") {
    const bad = results.filter((r) => !r.ok);
    const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    res.type("html").send(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:16px">
<h2>Prodigi check (${esc(region.toUpperCase())}, ${esc(out.env)})</h2>
<p style="font-size:22px">${bad.length === 0 ? "✅" : "❌"} ${results.length - bad.length} of ${results.length} items OK</p>
<p>Not made in ${esc(country)}: ${esc(out.notShippedFromDestination.join(", ") || "none")}</p>
${bad.map((r) => `<p><b>${esc(r.ourSku)}</b> (${esc(r.prodigiSku)} ${esc(JSON.stringify(r.attributes))})<br><small>${esc(r.error)} ${esc(r.failures ? JSON.stringify(r.failures) : "")}</small></p>`).join("")}`);
    return;
  }
  res.json(out);
});

export default router;
