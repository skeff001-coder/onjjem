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
import { getUncachableRevenueCatClient } from "./revenueCatClient.js";

const PROJECT_NAME = "ONJJEM Photo Restoration";

const APP_STORE_APP_NAME = "ONJJEM iOS";
const APP_STORE_BUNDLE_ID = "com.onjjem.photorestoration";
const PLAY_STORE_APP_NAME = "ONJJEM Android";
const PLAY_STORE_PACKAGE_NAME = "com.onjjem.photorestoration";

const ENTITLEMENT_IDENTIFIER = "pro";
const ENTITLEMENT_DISPLAY_NAME = "ONJJEM Pro";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

type ProductPlan = {
  key: "monthly" | "annual" | "perPhoto";
  productIdentifier: string;
  playStoreIdentifier: string;
  displayName: string;
  userFacingTitle: string;
  type: "subscription" | "consumable";
  duration?: "P1W" | "P1M" | "P2M" | "P3M" | "P6M" | "P1Y";
  packageIdentifier: string;
  packageDisplayName: string;
  prices: { amount_micros: number; currency: string }[];
  grantsEntitlement: boolean;
};

const PLANS: ProductPlan[] = [
  {
    key: "monthly",
    productIdentifier: "onjjem_pro_monthly",
    playStoreIdentifier: "onjjem_pro_monthly:monthly",
    displayName: "ONJJEM Pro Monthly",
    userFacingTitle: "ONJJEM Pro Monthly",
    type: "subscription",
    duration: "P1M",
    packageIdentifier: "$rc_monthly",
    packageDisplayName: "Monthly",
    prices: [{ amount_micros: 11_990_000, currency: "GBP" }],
    grantsEntitlement: true,
  },
  {
    key: "annual",
    productIdentifier: "onjjem_pro_annual",
    playStoreIdentifier: "onjjem_pro_annual:annual",
    displayName: "ONJJEM Pro Annual",
    userFacingTitle: "ONJJEM Pro Annual",
    type: "subscription",
    duration: "P1Y",
    packageIdentifier: "$rc_annual",
    packageDisplayName: "Annual",
    prices: [{ amount_micros: 24_990_000, currency: "GBP" }],
    grantsEntitlement: true,
  },
  {
    key: "perPhoto",
    productIdentifier: "onjjem_one_photo",
    playStoreIdentifier: "onjjem_one_photo",
    displayName: "ONJJEM One Photo",
    userFacingTitle: "Enhance One Photo",
    type: "consumable",
    packageIdentifier: "one_photo",
    packageDisplayName: "One Photo",
    prices: [{ amount_micros: 1_490_000, currency: "GBP" }],
    grantsEntitlement: false,
  },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ───────────────────────────────────────────────────────────
  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 50 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({
      client,
      body: { name: PROJECT_NAME },
    });
    if (error) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // ── Apps ──────────────────────────────────────────────────────────────
  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) {
    throw new Error("No apps found in project");
  }

  let testStoreApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!testStoreApp) throw new Error("No test_store app found in project");
  console.log("Test Store app:", testStoreApp.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: {
        name: APP_STORE_APP_NAME,
        type: "app_store",
        app_store: { bundle_id: APP_STORE_BUNDLE_ID },
      },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: {
        name: PLAY_STORE_APP_NAME,
        type: "play_store",
        play_store: { package_name: PLAY_STORE_PACKAGE_NAME },
      },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app:", playStoreApp.id);
  }

  // ── Products ──────────────────────────────────────────────────────────
  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (
    plan: ProductPlan,
    targetApp: App,
    label: string,
    storeIdentifier: string,
    isTestStore: boolean,
  ): Promise<Product> => {
    const existing = existingProducts.items?.find(
      (p) => p.store_identifier === storeIdentifier && p.app_id === targetApp.id,
    );
    if (existing) {
      console.log(`  ${label} product exists:`, existing.id);
      return existing;
    }

    const body: CreateProductData["body"] = {
      store_identifier: storeIdentifier,
      app_id: targetApp.id,
      type: plan.type as any,
      display_name: plan.displayName,
    };
    if (isTestStore) {
      if (plan.type === "subscription" && plan.duration) {
        body.subscription = { duration: plan.duration };
      }
      body.title = plan.userFacingTitle;
    }

    const { data: created, error } = await createProduct({
      client,
      path: { project_id: project.id },
      body,
    });
    if (error) {
      console.error(`  ${label} product create error:`, JSON.stringify(error));
      throw new Error(`Failed to create ${label} product for ${plan.key}`);
    }
    console.log(`  Created ${label} product:`, created.id);
    return created;
  };

  const productMap: Record<
    ProductPlan["key"],
    { testStore: Product; appStore: Product; playStore: Product }
  > = {} as any;

  for (const plan of PLANS) {
    console.log(`\nSeeding product: ${plan.key} (${plan.productIdentifier})`);
    const testProd = await ensureProduct(plan, testStoreApp, "Test Store", plan.productIdentifier, true);
    const iosProd = await ensureProduct(plan, appStoreApp, "App Store", plan.productIdentifier, false);
    const androidProd = await ensureProduct(plan, playStoreApp, "Play Store", plan.playStoreIdentifier, false);
    productMap[plan.key] = { testStore: testProd, appStore: iosProd, playStore: androidProd };

    // Add test-store price
    const { error: priceError } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProd.id },
      body: { prices: plan.prices },
    });
    if (priceError) {
      if (
        priceError &&
        typeof priceError === "object" &&
        "type" in priceError &&
        (priceError as any).type === "resource_already_exists"
      ) {
        console.log("  Test store prices already exist");
      } else {
        console.error("  Price error:", JSON.stringify(priceError));
        throw new Error(`Failed to add test store prices for ${plan.key}`);
      }
    } else {
      console.log("  Added test store price:", JSON.stringify(plan.prices));
    }
  }

  // ── Entitlement ───────────────────────────────────────────────────────
  let entitlement: Entitlement | undefined;
  const { data: existingEntitlements, error: listEntError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listEntError) throw new Error("Failed to list entitlements");

  const existingEnt = existingEntitlements.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEnt) {
    console.log("\nEntitlement exists:", existingEnt.id);
    entitlement = existingEnt;
  } else {
    const { data: newEnt, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    console.log("\nCreated entitlement:", newEnt.id);
    entitlement = newEnt;
  }

  const entitlementProductIds: string[] = [];
  for (const plan of PLANS) {
    if (!plan.grantsEntitlement) continue;
    const ids = productMap[plan.key];
    entitlementProductIds.push(ids.testStore.id, ids.appStore.id, ids.playStore.id);
  }
  if (entitlementProductIds.length > 0) {
    const { error: attachErr } = await attachProductsToEntitlement({
      client,
      path: { project_id: project.id, entitlement_id: entitlement.id },
      body: { product_ids: entitlementProductIds },
    });
    if (attachErr) {
      if ((attachErr as any).type === "unprocessable_entity_error") {
        console.log("Products already attached to entitlement");
      } else {
        console.error("Attach entitlement error:", JSON.stringify(attachErr));
        throw new Error("Failed to attach products to entitlement");
      }
    } else {
      console.log("Attached subscription products to entitlement");
    }
  }

  // ── Offering ──────────────────────────────────────────────────────────
  let offering: Offering | undefined;
  const { data: existingOfferings, error: listOffError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOffError) throw new Error("Failed to list offerings");

  const existingOff = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOff) {
    console.log("Offering exists:", existingOff.id);
    offering = existingOff;
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
    if (error) throw new Error("Failed to set offering current");
    console.log("Set offering as current");
  }

  // ── Packages ──────────────────────────────────────────────────────────
  const { data: existingPackages, error: listPkgError } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPkgError) throw new Error("Failed to list packages");

  for (const plan of PLANS) {
    let pkg: Package | undefined = existingPackages.items?.find(
      (p) => p.lookup_key === plan.packageIdentifier,
    );
    if (pkg) {
      console.log(`Package ${plan.packageIdentifier} exists:`, pkg.id);
    } else {
      const { data: newPkg, error } = await createPackages({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: plan.packageIdentifier, display_name: plan.packageDisplayName },
      });
      if (error) {
        console.error("Create package error:", JSON.stringify(error));
        throw new Error(`Failed to create package ${plan.packageIdentifier}`);
      }
      console.log(`Created package ${plan.packageIdentifier}:`, newPkg.id);
      pkg = newPkg;
    }

    const ids = productMap[plan.key];
    const { error: attachErr } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: ids.testStore.id, eligibility_criteria: "all" },
          { product_id: ids.appStore.id, eligibility_criteria: "all" },
          { product_id: ids.playStore.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (attachErr) {
      if (
        (attachErr as any).type === "unprocessable_entity_error" &&
        (attachErr as any).message?.includes("Cannot attach product")
      ) {
        console.log(`  Skipped attach for ${plan.packageIdentifier} (already linked)`);
      } else {
        console.error("Attach package error:", JSON.stringify(attachErr));
        throw new Error(`Failed to attach products to package ${plan.packageIdentifier}`);
      }
    } else {
      console.log(`  Attached products to ${plan.packageIdentifier}`);
    }
  }

  // ── API Keys ──────────────────────────────────────────────────────────
  const { data: testKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: testStoreApp.id },
  });
  const { data: iosKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: appStoreApp.id },
  });
  const { data: androidKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: playStoreApp.id },
  });

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", testStoreApp.id);
  console.log("App Store App ID:", appStoreApp.id);
  console.log("Play Store App ID:", playStoreApp.id);
  console.log("Entitlement:", ENTITLEMENT_IDENTIFIER);
  console.log("Offering:", OFFERING_IDENTIFIER);
  console.log("Packages:", PLANS.map((p) => p.packageIdentifier).join(", "));
  console.log("Products:", PLANS.map((p) => p.productIdentifier).join(", "));
  console.log("--- ENV VARS to set ---");
  console.log("EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=" + (testKeys?.items[0]?.key ?? "N/A"));
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=" + (iosKeys?.items[0]?.key ?? "N/A"));
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=" + (androidKeys?.items[0]?.key ?? "N/A"));
  console.log("REVENUECAT_PROJECT_ID=" + project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID=" + testStoreApp.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID=" + appStoreApp.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID=" + playStoreApp.id);
  console.log("====================\n");
}

seedRevenueCat().catch((err) => {
  console.error(err);
  process.exit(1);
});
