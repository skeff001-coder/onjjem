---
name: Shop Navigation — onjjem.com vs Shopify
description: Why onjjem-website.html shop links must point to /shop, not shop.onjjem.com
---

## Rule
All "Shop" / "Gift Shop" links in `documents/onjjem-website.html` must point to `/shop` (the ONJJEM-hosted shop page with product images), NOT to `https://shop.onjjem.com` (the raw Shopify storefront).

`shop.onjjem.com` is Shopify and has no product photos — it's a bare catalogue. Customers should land on `/shop` first (our beautiful page) and only go to Shopify when they click "Order".

**Why:** The Shopify store has products but no images configured. Our `/shop` page (onjjem-shop.html) is the customer-facing shop with imagery, descriptions, and pricing. Linking directly to Shopify bypasses all of that.

**How to apply:** If you ever update CTA buttons, nav links, or footer links in `onjjem-website.html`, verify none point to `shop.onjjem.com` — they should all be `/shop`.
