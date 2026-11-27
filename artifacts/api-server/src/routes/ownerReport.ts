import { Router, Request, Response } from "express";
import { getUncachableStripeClient } from "../stripeClient";

// Owner only: /api/owner-report?key=YOUR_GIVEAWAY_KEY
// One page with every sale since launch: Stripe takings, refunds, Stripe fees,
// Prodigi print costs and the profit left over.
const router = Router();
const norm = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();
const gbp = (p: number) => "£" + (p / 100).toFixed(2);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

async function prodigiCosts(): Promise<{ orders: number; costPence: number; note: string }> {
  const key = process.env.PRODIGI_API_KEY;
  if (!key) return { orders: 0, costPence: 0, note: "Prodigi key not set" };
  const base = (process.env.PRODIGI_ENV || "sandbox").toLowerCase() === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";
  let orders = 0, cost = 0, skip = 0;
  try {
    for (let page = 0; page < 20; page++) {
      const r = await fetch(`${base}/v4.0/orders?top=100&skip=${skip}`, { headers: { "X-API-Key": key } });
      if (!r.ok) return { orders, costPence: cost, note: `Prodigi said ${r.status}` };
      const j: any = await r.json();
      const list: any[] = j.orders ?? [];
      for (const o of list) {
        if (String(o?.status?.stage ?? "").toLowerCase() === "cancelled") continue;
        orders++;
        for (const c of o.charges ?? []) {
          const amt = Number(c?.totalCost?.amount ?? 0);
          if (!isNaN(amt)) cost += Math.round(amt * 100);
        }
      }
      if (!j.hasMore || list.length === 0) break;
      skip += list.length;
    }
    return { orders, costPence: cost, note: base.includes("sandbox") ? "SANDBOX account (test orders only)" : "" };
  } catch (e: any) {
    return { orders, costPence: cost, note: "Prodigi error: " + (e?.message ?? "") };
  }
}

router.get("/owner-report", async (req: Request, res: Response) => {
  const want = norm(process.env.GIVEAWAY_KEY);
  if (!want || norm(req.query.key) !== want) { res.status(403).send("Wrong key"); return; }
  try {
    const stripe = await getUncachableStripeClient();

    let orders = 0, gross = 0, shipping = 0;
    const byMonth: Record<string, { n: number; p: number }> = {};
    const byProduct: Record<string, { n: number; p: number }> = {};
    for await (const s of stripe.checkout.sessions.list({ limit: 100, expand: ["data.line_items"] })) {
      if (s.payment_status !== "paid") continue;
      orders++;
      gross += s.amount_total ?? 0;
      shipping += s.total_details?.amount_shipping ?? 0;
      const m = new Date(s.created * 1000).toISOString().slice(0, 7);
      byMonth[m] = byMonth[m] ?? { n: 0, p: 0 };
      byMonth[m].n++; byMonth[m].p += s.amount_total ?? 0;
      for (const li of (s as any).line_items?.data ?? []) {
        const name = String(li.description ?? "Item");
        byProduct[name] = byProduct[name] ?? { n: 0, p: 0 };
        byProduct[name].n += li.quantity ?? 1; byProduct[name].p += li.amount_total ?? 0;
      }
    }

    let fees = 0, refunds = 0;
    for await (const t of stripe.balanceTransactions.list({ limit: 100 })) {
      fees += t.fee ?? 0;
      if (t.type === "refund" || t.type === "payment_refund") refunds += -(t.amount ?? 0);
    }

    const pr = await prodigiCosts();
    const profit = gross - refunds - fees - pr.costPence;
    const aov = orders ? Math.round(gross / orders) : 0;
    const margin = gross ? Math.round((profit / gross) * 100) : 0;

    const row = (a: string, b: string) => `<tr><td>${a}</td><td style="text-align:right"><b>${b}</b></td></tr>`;
    const months = Object.entries(byMonth).sort().map(([m, v]) => row(m, `${v.n} orders · ${gbp(v.p)}`)).join("");
    const prods = Object.entries(byProduct).sort((a, b) => b[1].p - a[1].p).map(([n, v]) => row(esc(n), `${v.n} sold · ${gbp(v.p)}`)).join("");

    res.type("html").send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font:16px system-ui;margin:16px;max-width:640px"><h2>ONJJEM sales since launch</h2>
<table style="width:100%;border-collapse:collapse" cellpadding="6">
${row("Paid orders", String(orders))}
${row("Total taken (incl. shipping)", gbp(gross))}
${row("Shipping charged", gbp(shipping))}
${row("Average order", gbp(aov))}
${row("Refunds", gbp(refunds))}
${row("Stripe fees", gbp(fees))}
${row(`Print costs (${pr.orders} print orders)`, gbp(pr.costPence))}
${row("Profit before ads", gbp(profit))}
${row("Average margin", margin + "%")}
</table>${pr.note ? `<p style="color:#a33">Print costs: ${esc(pr.note)}</p>` : ""}
<h3>By month</h3><table style="width:100%" cellpadding="6">${months || row("No sales yet", "")}</table>
<h3>By product</h3><table style="width:100%" cellpadding="6">${prods || row("No sales yet", "")}</table>
<p style="color:#666">Ad spend isn't in Stripe: take it off the profit above using your TikTok and Meta ad accounts.</p></body>`);
  } catch (e: any) {
    res.status(500).send("Report failed: " + esc(e?.message ?? "unknown"));
  }
});

export default router;
