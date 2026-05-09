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

const PROJECT_NAME = "ONJJEM SNAP LAB";

const PRODUCT_IDENTIFIER = "onjjem_pro_monthly";
const PLAY_STORE_PRODUCT_IDENTIFIER = "onjjem_pro_monthly:monthly";

const PRODUCT_DISPLAY_NAME = "ONJJEM Pro Monthly";
const PRODUCT_USER_FACING_TITLE = "ONJJEM Pro";
const PRODUCT_DURATION = "P1M";

const APP_STORE_APP_NAME = "ONJJEM SNAP LAB iOS";
const APP_STORE_BUNDLE_ID = "com.onjjem.snaplab";
const PLAY_STORE_APP_NAME = "ONJJEM SNAP LAB Android";
const PLAY_STORE_PACKAGE_NAME = "com.onjjem.snaplab";

const ENTITLEMENT_IDENTIFIER = "pro";
const ENTITLEMENT_DISPLAY_NAME = "Pro Access";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

const PACKAGE_IDENTIFIER = "$rc_monthly";
const PACKAGE_DISPLAY_NAME = "Monthly Pro";

const PRODUCT_PRICES = [
  { amount_micros: 4990000, currency: "USD" }, // $4.99
  { amount_micros: 4490000, currency: "EUR" }, // €4.49
  { amount_micros: 3990000, currency: "GBP" }, // £3.99
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });

  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);

  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error: createProjectError } = await createProject({
      client,
      body: { name: PROJECT_NAME },
    });
    if (createProjectError) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });

  if (listAppsError || !apps || apps.items.length === 0) {
    throw new Error("No apps found");
  }

  let app: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!app) throw new Error("No test store app found");
  else console.log("Test store app found:", app.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app found:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app found:", playStoreApp.id);
  }

  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });

  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (targetApp: App, label: string, identifier: string, isTestStore: boolean): Promise<Product> => {
    const existing = existingProducts.items?.find((p) => p.store_identifier === identifier && p.app_id === targetApp.id);
    if (existing) { console.log(label + " product exists:", existing.id); return existing; }

    const body: CreateProductData["body"] = {
      store_identifier: identifier,
      app_id: targetApp.id,
      type: "subscription",
      display_name: PRODUCT_DISPLAY_NAME,
    };
    if (isTestStore) {
      body.subscription = { duration: PRODUCT_DURATION };
      body.title = PRODUCT_USER_FACING_TITLE;
    }

    const { data: created, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error("Failed to create " + label + " product");
    console.log("Created " + label + " product:", created.id);
    return created;
  };

  const testStoreProduct = await ensureProduct(app, "Test Store", PRODUCT_IDENTIFIER, true);
  const appStoreProduct = await ensureProduct(appStoreApp, "App Store", PRODUCT_IDENTIFIER, false);
  const playStoreProduct = await ensureProduct(playStoreApp, "Play Store", PLAY_STORE_PRODUCT_IDENTIFIER, false);

  console.log("Adding test store prices...");
  const { error: priceError } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: project.id, product_id: testStoreProduct.id },
    body: { prices: PRODUCT_PRICES },
  });

  if (priceError) {
    if (typeof priceError === "object" && "type" in priceError && priceError["type"] === "resource_already_exists") {
      console.log("Prices already exist");
    } else {
      throw new Error("Failed to add test store prices");
    }
  } else {
    console.log("Added test store prices: $4.99/mo");
  }

  let entitlement: Entitlement | undefined;
  const { data: existingEntitlements, error: listEntitlementsError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listEntitlementsError) throw new Error("Failed to list entitlements");

  const existingEntitlement = existingEntitlements.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEntitlement) {
    console.log("Entitlement exists:", existingEntitlement.id);
    entitlement = existingEntitlement;
  } else {
    const { data: newEnt, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    console.log("Created entitlement:", newEnt.id);
    entitlement = newEnt;
  }

  const { error: attachEntError } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: [testStoreProduct.id, appStoreProduct.id, playStoreProduct.id] },
  });
  if (attachEntError && attachEntError.type !== "unprocessable_entity_error") {
    throw new Error("Failed to attach products to entitlement");
  } else {
    console.log("Products attached to entitlement");
  }

  let offering: Offering | undefined;
  const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOfferingsError) throw new Error("Failed to list offerings");

  const existingOffering = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOffering) {
    console.log("Offering exists:", existingOffering.id);
    offering = existingOffering;
  } else {
    const { data: newOff, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    console.log("Created offering:", newOff.id);
    offering = newOff;
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  let pkg: Package | undefined;
  const { data: existingPackages, error: listPkgError } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPkgError) throw new Error("Failed to list packages");

  const existingPkg = existingPackages.items?.find((p) => p.lookup_key === PACKAGE_IDENTIFIER);
  if (existingPkg) {
    console.log("Package exists:", existingPkg.id);
    pkg = existingPkg;
  } else {
    const { data: newPkg, error } = await createPackages({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { lookup_key: PACKAGE_IDENTIFIER, display_name: PACKAGE_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create package");
    console.log("Created package:", newPkg.id);
    pkg = newPkg;
  }

  const { error: attachPkgError } = await attachProductsToPackage({
    client,
    path: { project_id: project.id, package_id: pkg.id },
    body: {
      products: [
        { product_id: testStoreProduct.id, eligibility_criteria: "all" },
        { product_id: appStoreProduct.id, eligibility_criteria: "all" },
        { product_id: playStoreProduct.id, eligibility_criteria: "all" },
      ],
    },
  });

  if (attachPkgError && !(attachPkgError.type === "unprocessable_entity_error" && attachPkgError.message?.includes("Cannot attach product"))) {
    throw new Error("Failed to attach products to package");
  } else {
    console.log("Products attached to package");
  }

  const { data: testKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: app.id } });
  const { data: iosKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appStoreApp.id } });
  const { data: androidKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: playStoreApp.id } });

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", app.id);
  console.log("App Store App ID:", appStoreApp.id);
  console.log("Play Store App ID:", playStoreApp.id);
  console.log("Entitlement Identifier:", ENTITLEMENT_IDENTIFIER);
  console.log("Public API Keys - Test Store:", testKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("Public API Keys - App Store:", iosKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("Public API Keys - Play Store:", androidKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
