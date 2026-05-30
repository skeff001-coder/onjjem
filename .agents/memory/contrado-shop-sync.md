---
name: Contrado shop fulfilment + website↔Shopify sync
description: How onjjem.com/shop sells physical goods — Contrado POD via Shopify app; only synced products can actually sell
---

## Setup
- Physical-goods supplier is **Contrado** (UK print-on-demand). Fulfilment runs through Contrado's official **Shopify app**: products designed in Contrado sync to Shopify (manual draft, or "Auto-Publish"), and paid Shopify orders auto-forward to Contrado, which prints + ships white-labelled. Contrado integrates **only** with Shopify — no other sales channel auto-fulfils.
- Store: `onjjem.myshopify.com` (custom domain `shop.onjjem.com`, which does not resolve from the Repl sandbox). Read the live catalogue via `https://onjjem.myshopify.com/products.json` — this is the source of truth for handles + prices. The Replit `shopify-store` connector is NOT linked to this Repl (`listConnections('shopify-store')` returns 401), so Admin API product creation from here is not available.

## Rule / constraint
- A website product (`documents/onjjem-shop.html`, ~130 SKUs via `openProdModal`) can only do "Buy Now → pay → auto-fulfil" if it exists in Shopify (synced from Contrado). Bespoke items (`openJubileeModal`: murals per-m², commissions, curtains) are intentionally email-enquiry only and must stay that way (custom quote, no fixed price).
- The website's `SHOPIFY_PRODUCTS` SKU→handle map had stale/wrong handles (e.g. it mapped `heritage-photo-cushion-40x40cm` but the real handle is `square-cushion`; `heritage-photo-calendar` vs real `photo-calendar`) → broken Buy Now links. Always verify handles against products.json before wiring buttons.
- **Price source of truth = the website** (user confirmed). Shopify prices currently differ (e.g. silk cushion £84.99 site vs £119.99 Shopify); Shopify checkout charges the Shopify price, so the user must align Contrado/Shopify prices to the website price or customers are mischarged.

**Why:** user is non-technical and believed the whole ~130-item catalogue was already sellable; only the handful synced into Shopify actually are. Do not promise automatic payment/fulfilment for unsynced products.

**How to apply:** before wiring shop buttons, pull `onjjem.myshopify.com/products.json`, match products by name/price, point links at the real handles, keep bespoke items as enquiry, and surface any price mismatches for the user to fix in Contrado/Shopify.
