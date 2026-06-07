import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "./logger";

const PRODUCTS = [
  {
    name: "Dog ID Tag",
    description:
      "Personalised metal dog tag with your dog's photo and name. Premium stainless steel, laser-engraved, available in small, medium, and large sizes.",
    unitAmountGBP: 1299,
    metadata: {
      prodigi_sku: "GLOBAL-IDTAG",
      prodigi_product_type: "dog_tag",
    },
  },
  {
    name: "Photo Mug",
    description:
      "11 oz ceramic. Morning coffee with your best friend. Vibrant wrap-around dog portrait on ceramic.",
    unitAmountGBP: 1799,
    metadata: {
      prodigi_sku: "H-MUG-W",
      prodigi_product_type: "mug",
    },
  },
  {
    name: "Wooden Coasters",
    description:
      "4 cork-backed wooden coasters. Coffee tastes better with their face. Gloss finish, high-gloss surface on a protective cork underside.",
    unitAmountGBP: 2499,
    metadata: {
      prodigi_sku: "H-COAST-4PK",
      prodigi_product_type: "coaster",
    },
  },
  {
    name: "Jigsaw Puzzle — 30 pieces",
    description:
      "30 pieces. Your dog's face as a toddler-friendly puzzle! Full-colour, high-gloss finish. Supplied in a presentation tin.",
    unitAmountGBP: 1999,
    metadata: {
      prodigi_sku: "JIGSAW-PUZZLE-30",
      prodigi_product_type: "jigsaw",
    },
  },
  {
    name: "Jigsaw Puzzle — 110 pieces",
    description:
      "110 pieces. A fun afternoon challenge. Full-colour dog portrait puzzle with high-gloss finish. Supplied in a presentation tin.",
    unitAmountGBP: 2299,
    metadata: {
      prodigi_sku: "JIGSAW-PUZZLE-110",
      prodigi_product_type: "jigsaw",
    },
  },
  {
    name: "Jigsaw Puzzle — 252 pieces",
    description:
      "252 pieces. The classic dog lover's challenge. Full-colour puzzle from your dog's photo. Supplied in premium presentation tin.",
    unitAmountGBP: 2899,
    metadata: {
      prodigi_sku: "JIGSAW-PUZZLE-252",
      prodigi_product_type: "jigsaw",
    },
  },
  {
    name: "Jigsaw Puzzle — 500 pieces",
    description:
      "500 pieces. A proper challenge for puzzle fans. Full-colour high-gloss dog portrait. Supplied in a premium presentation tin.",
    unitAmountGBP: 3299,
    metadata: {
      prodigi_sku: "JIGSAW-PUZZLE-500",
      prodigi_product_type: "jigsaw",
    },
  },
  {
    name: "Jigsaw Puzzle — 1000 pieces",
    description:
      "1000 pieces. The ultimate dog portrait puzzle. Full-colour high-gloss finish. Supplied in a large premium presentation tin.",
    unitAmountGBP: 3999,
    metadata: {
      prodigi_sku: "JIGSAW-PUZZLE-1000",
      prodigi_product_type: "jigsaw",
    },
  },
  {
    name: "Classic Framed Print",
    description:
      "A4 white satin-laminated picture frame. Classic portrait, ready to gift. 5 paper types, 8 frame colours, 3 glazing options.",
    unitAmountGBP: 4499,
    metadata: {
      prodigi_sku: "GLOBAL-CFP-A4",
      prodigi_product_type: "framed_print",
    },
  },
  {
    name: "Stretched Canvas",
    description:
      "Premium hand-stretched canvas. 38mm deep, 400gsm artist-grade canvas. European kiln-dried knotless pine stretcher bars. 8x10 inch.",
    unitAmountGBP: 4999,
    metadata: {
      prodigi_sku: "GLOBAL-CAN-8x10",
      prodigi_product_type: "canvas",
    },
  },
  {
    name: "Eco Canvas",
    description:
      "Sustainable satin canvas. 38mm deep, 330gsm satin finish. Made from recycled plastic bottles. Built-in hanging hardware. 12x12 inch.",
    unitAmountGBP: 3999,
    metadata: {
      prodigi_sku: "ECO-CAN-12x12",
      prodigi_product_type: "eco_canvas",
    },
  },
  {
    name: "Custom Playing Cards",
    description:
      "52-card deck (plus two jokers) printed with your dog's photo. 300gsm UV-coated card stock, supplied in a white presentation box. Perfect gift.",
    unitAmountGBP: 1999,
    metadata: {
      prodigi_sku: "PLAY-CARD",
      prodigi_product_type: "playing_cards",
    },
  },
  {
    name: "Custom Temporary Tattoo",
    description:
      "4x6\" custom temporary tattoo with your dog's face. Lasts up to one week, easy to apply and remove. Perfect for festivals, parties, and events.",
    unitAmountGBP: 1499,
    metadata: {
      prodigi_sku: "GLOBAL-TATT-L",
      prodigi_product_type: "tattoo",
    },
  },
  {
    name: "Tough Phone Case",
    description:
      "Dual-layer tough case with your dog's photo. Impact-resistant outer with flexible silicone inner. Gloss finish. Available for iPhone 11–16 and Google Pixel 7–9.",
    unitAmountGBP: 2499,
    metadata: {
      prodigi_sku: "GLOBAL-TECH-TCB-CS-G",
      prodigi_product_type: "phone_case",
    },
  },
  {
    name: "Canvas Cushion",
    description:
      "Handmade faux-canvas throw cushion. Zippered polyester cover, full-bleed dye sublimation print. Available in square or oblong shapes.",
    unitAmountGBP: 3299,
    metadata: {
      prodigi_sku: "GLOBAL-CUSH-16X16-CAN",
      prodigi_product_type: "cushion",
    },
  },
];

export async function seedShopProductsIfNeeded(): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();
    const existing = await stripe.products.list({ active: true, limit: 100 });
    const existingByName = new Map(existing.data.map((p) => [p.name, p]));
    const targetNames = new Set(PRODUCTS.map((p) => p.name));

    for (const p of PRODUCTS) {
      const existingProduct = existingByName.get(p.name);
      if (existingProduct) {
        await stripe.products.update(existingProduct.id, {
          description: p.description,
          metadata: p.metadata,
        });
        logger.info({ name: p.name }, "Updated Stripe product metadata");
      } else {
        const product = await stripe.products.create({
          name: p.name,
          description: p.description,
          metadata: p.metadata,
        });

        await stripe.prices.create({
          product: product.id,
          unit_amount: p.unitAmountGBP,
          currency: "gbp",
        });

        logger.info(
          { name: p.name, productId: product.id },
          "Seeded Stripe product"
        );
      }
    }

    for (const [name, product] of existingByName) {
      if (!targetNames.has(name)) {
        await stripe.products.update(product.id, { active: false });
        logger.info({ name, productId: product.id }, "Deactivated old Stripe product");
      }
    }

    logger.info("onJJem merch catalog synced successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed shop products — shop may show empty");
  }
}
