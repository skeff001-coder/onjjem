import { getUncachableStripeClient } from "./stripeClient";

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Seeding ONJJEM Living Memory products in Stripe...");

  const plans: Array<{
    name: string;
    description: string;
    plan: string;
    amount: number;
    currency: string;
    interval?: "month" | "year";
  }> = [
    {
      name: "Living Memory – Single Video",
      description: "One AI-animated Living Memory video · MP4 · yours to keep forever",
      plan: "single",
      amount: 599, // £5.99
      currency: "gbp",
    },
    {
      name: "Living Memory – Monthly",
      description: "Unlimited Living Memory videos · cancel anytime",
      plan: "monthly",
      amount: 1799, // £17.99
      currency: "gbp",
      interval: "month",
    },
    {
      name: "Living Memory – Annual",
      description: "Unlimited Living Memory videos for a full year · best value",
      plan: "annual",
      amount: 2999, // £29.99
      currency: "gbp",
      interval: "year",
    },
  ];

  for (const p of plans) {
    // Check if already exists
    const existing = await stripe.products.search({
      query: `metadata['plan']:'${p.plan}' AND metadata['app']:'onjjem_living_memory'`,
    });

    if (existing.data.length > 0) {
      console.log(`✓ ${p.name} already exists (${existing.data[0].id})`);
      continue;
    }

    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: { app: "onjjem_living_memory", plan: p.plan },
    });

    const priceParams: Parameters<typeof stripe.prices.create>[0] = {
      product: product.id,
      unit_amount: p.amount,
      currency: p.currency,
      metadata: { plan: p.plan },
    };
    if (p.interval) {
      priceParams.recurring = { interval: p.interval };
    }

    const price = await stripe.prices.create(priceParams);
    console.log(`✓ Created: ${p.name} → ${price.id} (£${p.amount / 100}${p.interval ? "/" + p.interval : " one-off"})`);
  }

  console.log("\n✅ Done. Webhooks will sync products to your database automatically.");
}

seedProducts().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
