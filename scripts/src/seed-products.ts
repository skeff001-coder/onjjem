import { getUncachableStripeClient } from "./stripeClient";

const PRODUCTS = [
  {
    name: "Photo Restoration",
    description:
      "Cinema-Grade AI photo restoration — one photo at full HD quality. Sharpen, colourize, or restore any old or blurry photograph.",
    metadata: { category: "digital", sku: "photo-restoration-hd" },
    prices: [{ amount: 199, currency: "gbp", label: "£1.99 per photo" }],
  },
  {
    name: "Classic Canvas Print (30×20cm)",
    description:
      "Your restored photograph printed on premium artist canvas, hand-stretched over a solid wood frame. Ready to hang. 30×20cm.",
    metadata: {
      category: "canvas",
      size: "30x20cm",
      sku: "canvas-classic-30x20",
    },
    prices: [
      { amount: 2999, currency: "gbp", label: "£29.99" },
    ],
  },
  {
    name: "Large Canvas Print (60×40cm)",
    description:
      "Statement-size restored photo on gallery-grade canvas. Hand-stretched on a solid wood frame. 60×40cm.",
    metadata: {
      category: "canvas",
      size: "60x40cm",
      sku: "canvas-large-60x40",
    },
    prices: [{ amount: 5999, currency: "gbp", label: "£59.99" }],
  },
  {
    name: "Extra Large Canvas Print (90×60cm)",
    description:
      "Museum-quality extra large canvas print of your restored image. 90×60cm — perfect as a centrepiece.",
    metadata: {
      category: "canvas",
      size: "90x60cm",
      sku: "canvas-xl-90x60",
    },
    prices: [{ amount: 8999, currency: "gbp", label: "£89.99" }],
  },
  {
    name: "Heritage Jigsaw — 252 Pieces",
    description:
      "Your restored family photo as a premium 252-piece jigsaw puzzle. Perfect for children and quick gifting.",
    metadata: {
      category: "jigsaw",
      pieces: "252",
      sku: "jigsaw-252",
    },
    prices: [{ amount: 2499, currency: "gbp", label: "£24.99" }],
  },
  {
    name: "Heritage Jigsaw — 500 Pieces",
    description:
      "Your restored family photo as a premium 500-piece jigsaw. A beautiful keepsake for the whole family.",
    metadata: {
      category: "jigsaw",
      pieces: "500",
      sku: "jigsaw-500",
    },
    prices: [{ amount: 3499, currency: "gbp", label: "£34.99" }],
  },
  {
    name: "Heritage Jigsaw — 1000 Pieces",
    description:
      "The heirloom jigsaw — your restored photograph as a 1000-piece premium puzzle. A truly cherished gift.",
    metadata: {
      category: "jigsaw",
      pieces: "1000",
      sku: "jigsaw-1000",
    },
    prices: [{ amount: 4999, currency: "gbp", label: "£49.99" }],
  },
  {
    name: "Personalised Cushion",
    description:
      "Your restored photograph printed on a plump, high-quality 45×45cm cushion with a concealed zip.",
    metadata: { category: "textile", sku: "cushion-45x45" },
    prices: [{ amount: 3499, currency: "gbp", label: "£34.99" }],
  },
  {
    name: "Personalised Blanket",
    description:
      "Luxurious fleece blanket (120×150cm) printed with your restored family photograph. Super-soft, machine washable.",
    metadata: { category: "textile", sku: "blanket-fleece" },
    prices: [{ amount: 4999, currency: "gbp", label: "£49.99" }],
  },
  {
    name: "Personalised Mug",
    description:
      "Dishwasher-safe ceramic mug with your restored photograph. 11oz, full-colour print that lasts.",
    metadata: { category: "gift", sku: "mug-11oz" },
    prices: [{ amount: 1499, currency: "gbp", label: "£14.99" }],
  },
  {
    name: "Personalised Keyring",
    description:
      "Premium metal keyring with a printed photo charm — a beautiful everyday reminder of a special memory.",
    metadata: { category: "gift", sku: "keyring-metal" },
    prices: [{ amount: 999, currency: "gbp", label: "£9.99" }],
  },
  {
    name: "Acrylic Memory Block",
    description:
      "Your restored photograph embedded in a luxury 10×10cm acrylic block — striking, modern, freestanding.",
    metadata: { category: "gift", sku: "acrylic-block-10x10" },
    prices: [{ amount: 3999, currency: "gbp", label: "£39.99" }],
  },
];

async function createProducts(): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();
    console.log("Creating ONJJEM products in Stripe…\n");

    for (const p of PRODUCTS) {
      const existing = await stripe.products.search({
        query: `name:'${p.name}' AND active:'true'`,
      });

      if (existing.data.length > 0) {
        console.log(`  ✓ Already exists: ${p.name}`);
        continue;
      }

      const product = await stripe.products.create({
        name: p.name,
        description: p.description,
        metadata: p.metadata,
      });

      for (const price of p.prices) {
        await stripe.prices.create({
          product: product.id,
          unit_amount: price.amount,
          currency: price.currency,
        });
      }

      console.log(`  + Created: ${p.name}  (${p.prices.map((x) => x.label).join(", ")})`);
    }

    console.log("\n✅  All products ready. Webhooks will sync to database.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error:", msg);
    process.exit(1);
  }
}

createProducts();
