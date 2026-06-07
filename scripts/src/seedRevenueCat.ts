import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "Global Canine Encyclopedia";

const APP_STORE_APP_NAME = "Global Canine Encyclopedia iOS";
const APP_STORE_BUNDLE_ID = "com.onjjem.canineencyclopedia";
const PLAY_STORE_APP_NAME = "Global Canine Encyclopedia Android";
const PLAY_STORE_PACKAGE_NAME = "com.onjjem.canineencyclopedia";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "onJJem Unlocks";

const TIERS = [
  {
    productId: "lineage_report",
    displayName: "Ancient Lineage Report",
    entitlementId: "lineage",
    entitlementDisplayName: "Ancient Lineage Report",
    packageId: "lineage_package",
    packageDisplayName: "Unlock Ancient Lineage",
    prices: [
      { amount_micros: 590000, currency: "GBP" },
      { amount_micros: 790000, currency: "USD" },
      { amount_micros: 590000, currency: "EUR" },
    ],
  },
  {
    productId: "grooming_masterclass",
    displayName: "Masterclass Grooming",
    entitlementId: "grooming",
    entitlementDisplayName: "Masterclass Grooming",
    packageId: "grooming_package",
    packageDisplayName: "Unlock Masterclass Grooming",
    prices: [
      { amount_micros: 990000, currency: "GBP" },
      { amount_micros: 1290000, currency: "USD" },
      { amount_micros: 990000, currency: "EUR" },
    ],
  },
  {
    productId: "complete_blueprint",
    displayName: "The Complete Breed Blueprint",
    entitlementId: "blueprint",
    entitlementDisplayName: "Complete Breed Blueprint",
    packageId: "blueprint_package",
    packageDisplayName: "Complete Breed Blueprint",
    prices: [
      { amount_micros: 1490000, currency: "GBP" },
      { amount_micros: 1990000, currency: "USD" },
      { amount_micros: 1490000, currency: "EUR" },
    ],
  },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function ensureProduct(
  client: any,
  project: Project,
  targetApp: App,
  identifier: string,
  displayName: string,
  isTestStore: boolean,
  existingProducts: { items?: Product[] },
): Promise<Product> {
  const existing = existingProducts.items?.find(
    (p) => p.store_identifier === identifier && p.app_id === targetApp.id,
  );
  if (existing) {
    console.log(`  Product "${identifier}" already exists: ${existing.id}`);
    return existing;
  }

  const body: CreateProductData["body"] = {
    store_identifier: identifier,
    app_id: targetApp.id,
    type: "non_consumable",
    display_name: displayName,
  };

  if (isTestStore) {
    body.title = displayName;
  }

  const { data, error } = await createProduct({
    client,
    path: { project_id: project.id },
    body,
  });
  if (error) throw new Error(`Failed to create product ${identifier}: ${JSON.stringify(error)}`);
  console.log(`  Created product "${identifier}": ${data.id}`);
  return data;
}

async function ensureEntitlement(
  client: any,
  project: Project,
  identifier: string,
  displayName: string,
): Promise<Entitlement> {
  const { data: list, error } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (error) throw new Error("Failed to list entitlements");

  const existing = list.items?.find((e) => e.lookup_key === identifier);
  if (existing) {
    console.log(`  Entitlement "${identifier}" already exists: ${existing.id}`);
    return existing;
  }

  const { data, error: createErr } = await createEntitlement({
    client,
    path: { project_id: project.id },
    body: { lookup_key: identifier, display_name: displayName },
  });
  if (createErr) throw new Error(`Failed to create entitlement ${identifier}`);
  console.log(`  Created entitlement "${identifier}": ${data.id}`);
  return data;
}

async function ensurePackage(
  client: any,
  project: Project,
  offering: Offering,
  identifier: string,
  displayName: string,
): Promise<Package> {
  const { data: list, error } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 100 },
  });
  if (error) throw new Error("Failed to list packages");

  const existing = list.items?.find((p) => p.lookup_key === identifier);
  if (existing) {
    console.log(`  Package "${identifier}" already exists: ${existing.id}`);
    return existing;
  }

  const { data, error: createErr } = await createPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    body: { lookup_key: identifier, display_name: displayName },
  });
  if (createErr) throw new Error(`Failed to create package ${identifier}`);
  console.log(`  Created package "${identifier}": ${data.id}`);
  return data;
}

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // --- Project ---
  const { data: projects } = await listProjects({ client, query: { limit: 20 } });
  let project: Project =
    projects?.items?.find((p) => p.name === PROJECT_NAME) ??
    (await createProject({ client, body: { name: PROJECT_NAME } })).data!;
  console.log("Project:", project.id);

  // --- Apps ---
  const { data: appsData } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  const apps = appsData?.items ?? [];

  let testApp = apps.find((a) => a.type === "test_store");
  if (!testApp) throw new Error("No test store app found");

  let appStoreApp =
    apps.find((a) => a.type === "app_store") ??
    (
      await createApp({
        client,
        path: { project_id: project.id },
        body: {
          name: APP_STORE_APP_NAME,
          type: "app_store",
          app_store: { bundle_id: APP_STORE_BUNDLE_ID },
        },
      })
    ).data!;

  let playStoreApp =
    apps.find((a) => a.type === "play_store") ??
    (
      await createApp({
        client,
        path: { project_id: project.id },
        body: {
          name: PLAY_STORE_APP_NAME,
          type: "play_store",
          play_store: { package_name: PLAY_STORE_PACKAGE_NAME },
        },
      })
    ).data!;

  console.log("Apps:", testApp.id, appStoreApp.id, playStoreApp.id);

  // --- Existing products list ---
  const { data: existingProducts } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });

  // --- Offering ---
  const { data: offeringsList } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  let offering: Offering = offeringsList?.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER)!;
  if (!offering) {
    const { data } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    offering = data!;
    console.log("Created offering:", offering.id);
  } else {
    console.log("Offering exists:", offering.id);
  }

  if (!offering.is_current) {
    await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
  }

  // --- 3 tiers ---
  for (const tier of TIERS) {
    console.log(`\n--- ${tier.displayName} ---`);

    const testProduct = await ensureProduct(client, project, testApp, tier.productId, tier.displayName, true, existingProducts ?? { items: [] });
    const iosProduct = await ensureProduct(client, project, appStoreApp, tier.productId, tier.displayName, false, existingProducts ?? { items: [] });
    const androidProduct = await ensureProduct(client, project, playStoreApp, tier.productId, tier.displayName, false, existingProducts ?? { items: [] });

    // Add test store prices
    const { error: priceErr } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: tier.prices },
    });
    if (priceErr && (priceErr as any)?.type !== "resource_already_exists") {
      console.warn("  Price warning:", JSON.stringify(priceErr));
    } else {
      console.log("  Prices set");
    }

    // Entitlement
    const entitlement = await ensureEntitlement(client, project, tier.entitlementId, tier.entitlementDisplayName);

    const { error: attachErr } = await attachProductsToEntitlement({
      client,
      path: { project_id: project.id, entitlement_id: entitlement.id },
      body: { product_ids: [testProduct.id, iosProduct.id, androidProduct.id] },
    });
    if (attachErr && (attachErr as any)?.type !== "unprocessable_entity_error") {
      throw new Error(`Failed to attach products to entitlement: ${JSON.stringify(attachErr)}`);
    }
    console.log("  Products attached to entitlement");

    // Package
    const pkg = await ensurePackage(client, project, offering, tier.packageId, tier.packageDisplayName);

    const { error: pkgErr } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: testProduct.id, eligibility_criteria: "all" },
          { product_id: iosProduct.id, eligibility_criteria: "all" },
          { product_id: androidProduct.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (pkgErr && !(pkgErr as any)?.message?.includes("Cannot attach product")) {
      throw new Error(`Failed to attach products to package: ${JSON.stringify(pkgErr)}`);
    }
    console.log("  Products attached to package");
  }

  // --- Summary ---
  const { data: testKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: testApp.id } });
  const { data: iosKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appStoreApp.id } });
  const { data: androidKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: playStoreApp.id } });

  console.log("\n====================");
  console.log("RevenueCat 3-tier setup complete!");
  console.log("Project ID:", project.id);
  console.log("Public API Keys:");
  console.log("  Test Store:", testKeys?.items.map((i) => i.key).join(", "));
  console.log("  App Store:", iosKeys?.items.map((i) => i.key).join(", "));
  console.log("  Play Store:", androidKeys?.items.map((i) => i.key).join(", "));
  console.log("Entitlements: lineage | grooming | blueprint");
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
